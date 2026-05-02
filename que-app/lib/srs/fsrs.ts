import { FSRS, Rating, createEmptyCard } from 'ts-fsrs';
import { supabase } from '../supabase/client';
import type { AnswerRating, DailyQueue, ReviewStats, SrsQuestion } from '../../types/srs';

// FSRS-5 設定: 保持率 92%、短期スケジュール無効（日単位のみ）
// enable_short_term=false にすることで「今日中に再表示」を避け、Anki 的な焦燥感を排除する
const fsrs = new FSRS({ request_retention: 0.92, enable_short_term: false });

// ユーザーに見せない内部レーティングマッピング
// 'hard' は意図的に使わない（ユーザーが自己評価で迷う原因になるため）
const RATING_MAP = {
  again: Rating.Again,
  good: Rating.Good,
  easy: Rating.Easy,
} as const satisfies Record<AnswerRating, (typeof Rating)[keyof typeof Rating]>;

// 解答時間の閾値（ミリ秒）: これ以内なら easy、それ以上なら good
const EASY_THRESHOLD_MS = 5_000;

function mapAnswerRating(isCorrect: boolean, elapsedMs: number): AnswerRating {
  if (!isCorrect) return 'again';
  return elapsedMs <= EASY_THRESHOLD_MS ? 'easy' : 'good';
}

function rowToSrsQuestion(row: {
  id: string;
  lesson_id: string;
  question_text: string;
  choices: unknown;
  correct_choice_id: string | null;
  explanation: string | null;
  format: string;
}): SrsQuestion {
  return {
    id: row.id,
    lesson_id: row.lesson_id,
    question_text: row.question_text,
    choices: (row.choices as { id: string; text: string }[]) ?? [],
    correct_choice_id: row.correct_choice_id,
    explanation: row.explanation,
    format: row.format as SrsQuestion['format'],
  };
}

// getDailyQueue: 今日の復習キューを返す
// - recall: due_at <= now() の問題（最大 sizeRecall 件）
// - learn: まだ questions_review_state にエントリがない新規問題（最大 sizeLearn 件）
// - preferred_certification でフィルタ（未設定の場合はフィルタなし）
export async function getDailyQueue(
  userId: string,
  sizeRecall: number,
  sizeLearn: number
): Promise<DailyQueue> {
  const now = new Date().toISOString();

  // preferred_certification を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_certification')
    .eq('id', userId)
    .maybeSingle();

  const certSlug = profile?.preferred_certification ?? null;

  // 復習問題: due_at が現在以前のもの
  const reviewStateQuery = supabase
    .from('questions_review_state')
    .select('question_id')
    .eq('user_id', userId)
    .lte('due_at', now)
    .limit(sizeRecall);

  const { data: dueStates, error: dueError } = await reviewStateQuery;
  if (dueError !== null) {
    throw new Error(`getDailyQueue (due states) failed: ${dueError.message}`);
  }

  const dueQuestionIds = (dueStates ?? []).map((s) => s.question_id);

  // 復習問題の本文を取得
  let recallQuestions: SrsQuestion[] = [];
  if (dueQuestionIds.length > 0) {
    let q = supabase
      .from('questions')
      .select('id, lesson_id, question_text, choices, correct_choice_id, explanation, format')
      .eq('status', 'published')
      .in('id', dueQuestionIds);

    if (certSlug !== null) {
      q = q.eq('lessons.sections.courses.certifications.slug', certSlug);
    }

    const { data: recallData, error: recallError } = await q;
    if (recallError !== null) {
      throw new Error(`getDailyQueue (recall questions) failed: ${recallError.message}`);
    }
    recallQuestions = (recallData ?? []).map(rowToSrsQuestion);
  }

  // 既に review_state があるすべての question_id を取得（新規除外のため）
  const { data: allStates, error: allStatesError } = await supabase
    .from('questions_review_state')
    .select('question_id')
    .eq('user_id', userId);

  if (allStatesError !== null) {
    throw new Error(`getDailyQueue (all states) failed: ${allStatesError.message}`);
  }

  const seenIds = new Set((allStates ?? []).map((s) => s.question_id));

  // 新規問題: review_state にエントリがない published 問題
  let learnQuery = supabase
    .from('questions')
    .select('id, lesson_id, question_text, choices, correct_choice_id, explanation, format, order_index')
    .eq('status', 'published')
    .order('order_index')
    .limit(sizeLearn + seenIds.size); // seenIds 分を余分に取得してフィルタする

  if (certSlug !== null) {
    // lessons → sections → courses → certifications の結合は PostgREST では直接フィルタ困難なため
    // lesson_id 経由で事前に対象 lesson_id リストを取得してフィルタする
    const { data: certLessons, error: certLessonsError } = await supabase
      .from('lessons')
      .select('id, sections!inner(courses!inner(certifications!inner(slug)))')
      .eq('sections.courses.certifications.slug', certSlug)
      .eq('is_published', true);

    if (certLessonsError !== null) {
      throw new Error(`getDailyQueue (cert lessons) failed: ${certLessonsError.message}`);
    }

    const certLessonIds = (certLessons ?? []).map((l) => l.id);
    if (certLessonIds.length === 0) {
      return { recall: recallQuestions, learn: [] };
    }

    learnQuery = learnQuery.in('lesson_id', certLessonIds);
  }

  const { data: candidateData, error: candidateError } = await learnQuery;
  if (candidateError !== null) {
    throw new Error(`getDailyQueue (learn candidates) failed: ${candidateError.message}`);
  }

  const learnQuestions = (candidateData ?? [])
    .filter((row) => !seenIds.has(row.id))
    .slice(0, sizeLearn)
    .map(rowToSrsQuestion);

  return { recall: recallQuestions, learn: learnQuestions };
}

// recordAnswer: 解答を記録し、FSRS で次回スケジュールを計算して upsert する
// isCorrect と elapsedMs から内部で rating を決定するため、ユーザーに FSRS の概念を見せない
export async function recordAnswer(params: {
  userId: string;
  questionId: string;
  selectedChoiceId: string;
  isCorrect: boolean;
  elapsedMs: number;
}): Promise<void> {
  const { userId, questionId, selectedChoiceId, isCorrect, elapsedMs } = params;

  const rating = mapAnswerRating(isCorrect, elapsedMs);
  const fsrsRating = RATING_MAP[rating];

  // 既存の review_state を取得
  const { data: existing, error: fetchError } = await supabase
    .from('questions_review_state')
    .select('stability, difficulty, due_at, last_review_at, reps, lapses')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (fetchError !== null) {
    throw new Error(`recordAnswer (fetch state) failed: ${fetchError.message}`);
  }

  const now = new Date();

  // FSRS カードを復元または新規作成
  const card = existing !== null
    ? {
        ...createEmptyCard(new Date(existing.due_at)),
        stability: existing.stability,
        difficulty: existing.difficulty,
        reps: existing.reps,
        lapses: existing.lapses,
        last_review: existing.last_review_at !== null ? new Date(existing.last_review_at) : undefined,
        // state は reps から推測: reps=0 → New(0)、それ以外 → Review(2)
        state: existing.reps === 0 ? 0 : 2,
      }
    : createEmptyCard(now);

  const scheduled = fsrs.repeat(card, now);
  const next = scheduled[fsrsRating].card;

  // questions_review_state を upsert
  const { error: upsertError } = await supabase
    .from('questions_review_state')
    .upsert(
      {
        user_id: userId,
        question_id: questionId,
        stability: next.stability,
        difficulty: next.difficulty,
        due_at: next.due.toISOString(),
        last_review_at: now.toISOString(),
        reps: next.reps,
        lapses: next.lapses,
      },
      { onConflict: 'user_id,question_id' }
    );

  if (upsertError !== null) {
    throw new Error(`recordAnswer (upsert state) failed: ${upsertError.message}`);
  }

  // quiz_results に解答ログを insert
  const { error: logError } = await supabase.from('quiz_results').insert({
    user_id: userId,
    question_id: questionId,
    selected_choice_id: selectedChoiceId,
    is_correct: isCorrect,
  });

  if (logError !== null) {
    throw new Error(`recordAnswer (insert quiz_results) failed: ${logError.message}`);
  }
}

// getReviewStats: Summary 画面向けの軽量集計
export async function getReviewStats(userId: string): Promise<ReviewStats> {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const { data, error } = await supabase
    .from('questions_review_state')
    .select('due_at')
    .eq('user_id', userId);

  if (error !== null) {
    throw new Error(`getReviewStats failed: ${error.message}`);
  }

  const rows = data ?? [];
  const nowMs = now.getTime();
  const todayEndMs = todayEnd.getTime();
  const tomorrowEndMs = tomorrowEnd.getTime();

  let dueToday = 0;
  let dueTomorrow = 0;

  for (const row of rows) {
    const dueMs = new Date(row.due_at).getTime();
    if (dueMs <= nowMs) {
      dueToday += 1;
    } else if (dueMs <= todayEndMs) {
      dueToday += 1;
    } else if (dueMs <= tomorrowEndMs) {
      dueTomorrow += 1;
    }
  }

  return {
    dueToday,
    dueTomorrow,
    total: rows.length,
  };
}

export { mapAnswerRating };
