import { supabase } from './client';

export interface CertificationWithCourses {
  id: string;
  slug: string;
  name: string;
  category: 'IT' | 'business';
  order_index: number;
  courses: {
    id: string;
    title: string;
    description: string | null;
    order_index: number;
  }[];
}

export async function fetchCertificationsWithCourses(): Promise<CertificationWithCourses[]> {
  const { data, error } = await supabase
    .from('certifications')
    .select(
      `
      id,
      slug,
      name,
      category,
      order_index,
      courses (
        id,
        title,
        description,
        order_index,
        is_published
      )
    `
    )
    .eq('is_published', true)
    .order('order_index');

  if (error !== null) {
    throw new Error(`fetchCertificationsWithCourses failed: ${error.message}`);
  }

  return (data ?? []).map((cert) => ({
    id: cert.id,
    slug: cert.slug,
    name: cert.name,
    category: cert.category,
    order_index: cert.order_index,
    courses: (cert.courses ?? [])
      .filter((c: { is_published: boolean }) => c.is_published)
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((c: { id: string; title: string; description: string | null; order_index: number }) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        order_index: c.order_index,
      })),
  }));
}

export interface PublishedQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  choices: { id: string; text: string }[];
  correct_choice_id: string | null;
  explanation: string | null;
  format: 'multiple_choice' | 'written' | 'cbt';
}

export async function fetchNextQuestion(): Promise<PublishedQuestion | null> {
  const { data, error } = await supabase
    .from('questions')
    .select('id, lesson_id, question_text, choices, correct_choice_id, explanation, format')
    .eq('status', 'published')
    .order('order_index')
    .limit(1);

  if (error !== null) {
    throw new Error(`fetchNextQuestion failed: ${error.message}`);
  }

  if (data === null || data.length === 0) return null;
  return data[0] as PublishedQuestion;
}

export interface CourseLessonNode {
  id: string;
  title: string;
  content_type: 'video' | 'text' | 'audio' | 'quiz';
  duration_seconds: number | null;
  order_index: number;
}

export interface AudioLesson {
  id: string;
  title: string;
  duration_seconds: number | null;
  audio_storage_path: string | null;
  audio_url: string | null;
}

export async function fetchAudioLessons(): Promise<AudioLesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, duration_seconds, audio_storage_path')
    .eq('is_published', true)
    .not('audio_storage_path', 'is', null)
    .order('order_index')
    .limit(50);

  if (error !== null) {
    throw new Error(`fetchAudioLessons failed: ${error.message}`);
  }

  return (data ?? []).map((l) => {
    const path = (l.audio_storage_path as string | null) ?? null;
    const audio_url =
      path === null
        ? null
        : supabase.storage.from('audio').getPublicUrl(path).data.publicUrl;
    return {
      id: l.id as string,
      title: l.title as string,
      duration_seconds: l.duration_seconds as number | null,
      audio_storage_path: path,
      audio_url,
    };
  });
}

export async function generateLessonAudio(lessonId: string): Promise<{
  url: string;
  duration_seconds: number;
}> {
  const { data, error } = await supabase.functions.invoke<{
    url: string;
    duration_seconds: number;
  }>('generate-audio', { body: { lessonId } });
  if (error !== null) throw new Error(`generateLessonAudio failed: ${error.message}`);
  if (data === null) throw new Error('generateLessonAudio: empty response');
  return data;
}

export interface PracticeProgress {
  total: number;
  answered: number;
  next: PublishedQuestion | null;
}

export async function fetchPracticeProgress(userId: string): Promise<PracticeProgress> {
  const [questionsRes, answeredRes] = await Promise.all([
    supabase
      .from('questions')
      .select('id, lesson_id, question_text, choices, correct_choice_id, explanation, format, order_index, created_at')
      .eq('status', 'published')
      .order('created_at')
      .order('order_index'),
    supabase.from('quiz_results').select('question_id').eq('user_id', userId),
  ]);

  if (questionsRes.error !== null) {
    throw new Error(`fetchPracticeProgress (questions) failed: ${questionsRes.error.message}`);
  }
  if (answeredRes.error !== null) {
    throw new Error(`fetchPracticeProgress (results) failed: ${answeredRes.error.message}`);
  }

  const all = (questionsRes.data ?? []) as (PublishedQuestion & { created_at: string; order_index: number })[];
  const answeredIds = new Set((answeredRes.data ?? []).map((r) => r.question_id));
  const next = all.find((q) => !answeredIds.has(q.id)) ?? null;

  return {
    total: all.length,
    answered: answeredIds.size,
    next: next === null
      ? null
      : {
          id: next.id,
          lesson_id: next.lesson_id,
          question_text: next.question_text,
          choices: next.choices,
          correct_choice_id: next.correct_choice_id,
          explanation: next.explanation,
          format: next.format,
        },
  };
}

export async function submitAnswer(args: {
  userId: string;
  questionId: string;
  selectedChoiceId: string;
  isCorrect: boolean;
}): Promise<void> {
  const { error } = await supabase.from('quiz_results').insert({
    user_id: args.userId,
    question_id: args.questionId,
    selected_choice_id: args.selectedChoiceId,
    is_correct: args.isCorrect,
  });
  if (error !== null) {
    throw new Error(`submitAnswer failed: ${error.message}`);
  }
}

export interface WeeklyStats {
  total_answered: number;
  correct_count: number;
  accuracy_pct: number;
  today_answered: number;
  estimated_minutes: number;
  daily_counts: number[];
  streak_days: number;
}

const ESTIMATED_SECONDS_PER_QUESTION = 90;

export async function fetchWeeklyStats(userId: string): Promise<WeeklyStats> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('quiz_results')
    .select('is_correct, answered_at')
    .eq('user_id', userId)
    .gte('answered_at', sevenDaysAgo.toISOString());

  if (error !== null) {
    throw new Error(`fetchWeeklyStats failed: ${error.message}`);
  }

  const rows = data ?? [];
  const total = rows.length;
  const correct = rows.filter((r) => r.is_correct).length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = rows.filter((r) => new Date(r.answered_at) >= todayStart).length;

  const dailyCounts: number[] = Array(7).fill(0);
  for (const r of rows) {
    const day = new Date(r.answered_at);
    day.setHours(0, 0, 0, 0);
    const idx = Math.floor((day.getTime() - sevenDaysAgo.getTime()) / (24 * 60 * 60 * 1000));
    if (idx >= 0 && idx < 7) {
      dailyCounts[idx] += 1;
    }
  }

  // 連続日数: 今日から遡って解答がある日が続く長さ
  let streak = 0;
  for (let i = 6; i >= 0; i -= 1) {
    if (dailyCounts[i] > 0) streak += 1;
    else if (i < 6) break;
  }

  return {
    total_answered: total,
    correct_count: correct,
    accuracy_pct: accuracy,
    today_answered: todayCount,
    estimated_minutes: Math.round((total * ESTIMATED_SECONDS_PER_QUESTION) / 60),
    daily_counts: dailyCounts,
    streak_days: streak,
  };
}

export interface WeakArea {
  lesson_id: string;
  title: string;
  attempts: number;
  correct: number;
  pct: number;
}

export async function fetchWeakAreas(userId: string, limit = 4): Promise<WeakArea[]> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('is_correct, questions!inner(lesson_id, lessons!inner(id, title))')
    .eq('user_id', userId);

  if (error !== null) {
    throw new Error(`fetchWeakAreas failed: ${error.message}`);
  }

  const map = new Map<string, { title: string; attempts: number; correct: number }>();
  for (const r of data ?? []) {
    // Supabase nested type は any 扱い
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lesson = (r as any).questions?.lessons;
    if (lesson === undefined || lesson === null) continue;
    const key = lesson.id as string;
    const cur = map.get(key) ?? { title: lesson.title as string, attempts: 0, correct: 0 };
    cur.attempts += 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((r as any).is_correct === true) cur.correct += 1;
    map.set(key, cur);
  }

  return [...map.entries()]
    .map(([lesson_id, v]) => ({
      lesson_id,
      title: v.title,
      attempts: v.attempts,
      correct: v.correct,
      pct: v.attempts === 0 ? 0 : Math.round((v.correct / v.attempts) * 100),
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, limit);
}

export interface BookmarkEntry {
  id: string;
  target_type: 'question' | 'lesson';
  target_id: string;
  created_at: string;
  preview: string | null;
}

export async function fetchBookmarks(userId: string): Promise<BookmarkEntry[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, target_type, target_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error !== null) {
    throw new Error(`fetchBookmarks failed: ${error.message}`);
  }

  // preview: target_type ごとに question_text or lesson title を引く
  const rows = (data ?? []) as Omit<BookmarkEntry, 'preview'>[];
  if (rows.length === 0) return [];

  const questionIds = rows.filter((r) => r.target_type === 'question').map((r) => r.target_id);
  const lessonIds = rows.filter((r) => r.target_type === 'lesson').map((r) => r.target_id);

  const [qRes, lRes] = await Promise.all([
    questionIds.length === 0
      ? Promise.resolve({ data: [] })
      : supabase.from('questions').select('id, question_text').in('id', questionIds),
    lessonIds.length === 0
      ? Promise.resolve({ data: [] })
      : supabase.from('lessons').select('id, title').in('id', lessonIds),
  ]);

  const qMap = new Map<string, string>();
  for (const q of qRes.data ?? []) qMap.set(q.id as string, q.question_text as string);
  const lMap = new Map<string, string>();
  for (const l of lRes.data ?? []) lMap.set(l.id as string, l.title as string);

  return rows.map((r) => ({
    ...r,
    preview:
      r.target_type === 'question' ? qMap.get(r.target_id) ?? null : lMap.get(r.target_id) ?? null,
  }));
}

export interface AIQAEntry {
  id: string;
  question: string;
  answer: string | null;
  source_lesson_id: string | null;
  created_at: string;
}

export async function fetchAIQAHistory(userId: string, limit = 20): Promise<AIQAEntry[]> {
  const { data, error } = await supabase
    .from('ai_qa_history')
    .select('id, question, answer, source_lesson_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error !== null) {
    throw new Error(`fetchAIQAHistory failed: ${error.message}`);
  }
  return (data ?? []) as AIQAEntry[];
}

export interface SubscriptionState {
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete' | null;
  current_period_end: string | null;
  source: string | null;
  is_premium: boolean;
}

export async function fetchSubscription(userId: string): Promise<SubscriptionState> {
  const { data } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, source')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const status = (data?.status ?? null) as SubscriptionState['status'];
  return {
    status,
    current_period_end: data?.current_period_end ?? null,
    source: data?.source ?? null,
    is_premium: status === 'active' || status === 'trialing',
  };
}

export interface InProgressLesson {
  lesson_id: string;
  title: string;
  cert_slug: string;
  cert_name: string;
  total_questions: number;
  answered: number;
  pct: number;
}

export async function fetchInProgressLessons(userId: string, limit = 3): Promise<InProgressLesson[]> {
  // 解答済み問題があるレッスンを取得（answered/total を計算）
  const { data: answered } = await supabase
    .from('quiz_results')
    .select('question_id, questions!inner(lesson_id, lessons!inner(id, title, sections!inner(courses!inner(certifications!inner(slug, name)))))')
    .eq('user_id', userId);

  if (answered === null || answered.length === 0) return [];

  // lesson_id ごとに集計
  interface LessonAcc {
    title: string;
    cert_slug: string;
    cert_name: string;
    answered: Set<string>;
  }
  const map = new Map<string, LessonAcc>();
  for (const r of answered) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lesson = (r as any).questions?.lessons;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cert = (r as any).questions?.lessons?.sections?.courses?.certifications;
    if (lesson === undefined || cert === undefined) continue;
    const key = lesson.id as string;
    const cur = map.get(key) ?? {
      title: lesson.title as string,
      cert_slug: cert.slug as string,
      cert_name: cert.name as string,
      answered: new Set<string>(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cur.answered.add((r as any).question_id);
    map.set(key, cur);
  }

  // total_questions を取得
  const lessonIds = [...map.keys()];
  if (lessonIds.length === 0) return [];
  const { data: counts } = await supabase
    .from('questions')
    .select('lesson_id, id')
    .in('lesson_id', lessonIds)
    .eq('status', 'published');

  const totals = new Map<string, number>();
  for (const q of counts ?? []) {
    const k = q.lesson_id as string;
    totals.set(k, (totals.get(k) ?? 0) + 1);
  }

  const results: InProgressLesson[] = [];
  for (const [lesson_id, v] of map) {
    const total = totals.get(lesson_id) ?? 0;
    if (total === 0) continue;
    const ansCount = v.answered.size;
    if (ansCount >= total) continue; // 完了済みは除外
    results.push({
      lesson_id,
      title: v.title,
      cert_slug: v.cert_slug,
      cert_name: v.cert_name,
      total_questions: total,
      answered: ansCount,
      pct: Math.round((ansCount / total) * 100),
    });
  }

  return results.sort((a, b) => b.pct - a.pct).slice(0, limit);
}

export async function fetchLastAnswered(userId: string): Promise<{
  lesson_title: string;
  cert_name: string;
} | null> {
  const { data } = await supabase
    .from('quiz_results')
    .select('answered_at, questions!inner(lessons!inner(title, sections!inner(courses!inner(certifications!inner(name)))))')
    .eq('user_id', userId)
    .order('answered_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data === null) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lesson = (data as any).questions?.lessons;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cert = lesson?.sections?.courses?.certifications;
  if (lesson === undefined || cert === undefined) return null;
  return { lesson_title: lesson.title as string, cert_name: cert.name as string };
}

export async function isBookmarked(
  userId: string,
  targetType: 'question' | 'lesson',
  targetId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle();
  return data !== null;
}

export async function toggleBookmark(
  userId: string,
  targetType: 'question' | 'lesson',
  targetId: string
): Promise<boolean> {
  const exists = await isBookmarked(userId, targetType, targetId);
  if (exists) {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);
    return false;
  }
  await supabase
    .from('bookmarks')
    .insert({ user_id: userId, target_type: targetType, target_id: targetId });
  return true;
}

export interface NotificationEntry {
  id: string;
  kind: 'streak' | 'reminder' | 'system' | 'subscription';
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export async function fetchNotifications(userId: string, limit = 20): Promise<NotificationEntry[]> {
  const { data } = await supabase
    .from('notifications')
    .select('id, kind, title, body, link, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as NotificationEntry[];
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
}

export interface SearchResult {
  type: 'lesson' | 'question';
  id: string;
  title: string;
  preview: string | null;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (query.trim() === '') return [];
  const term = `%${query.trim()}%`;
  const [lessonsRes, questionsRes] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, body')
      .eq('is_published', true)
      .or(`title.ilike.${term},body.ilike.${term}`)
      .limit(10),
    supabase
      .from('questions')
      .select('id, question_text, explanation')
      .eq('status', 'published')
      .or(`question_text.ilike.${term},explanation.ilike.${term}`)
      .limit(10),
  ]);

  const results: SearchResult[] = [];
  for (const l of lessonsRes.data ?? []) {
    results.push({
      type: 'lesson',
      id: l.id as string,
      title: l.title as string,
      preview: (l.body as string | null)?.slice(0, 120) ?? null,
    });
  }
  for (const q of questionsRes.data ?? []) {
    results.push({
      type: 'question',
      id: q.id as string,
      title: q.question_text as string,
      preview: (q.explanation as string | null)?.slice(0, 120) ?? null,
    });
  }
  return results;
}

export async function startBillingPortal(): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    'create-billing-portal',
    { body: {} }
  );
  if (error !== null) throw new Error(`startBillingPortal failed: ${error.message}`);
  if (data === null || typeof data.url !== 'string') throw new Error('startBillingPortal: missing url');
  return data.url;
}

export async function generateQuestionDraft(args: {
  lessonId: string;
  lessonTitle: string;
  lessonBody: string;
}): Promise<{ id: string }> {
  const { data, error } = await supabase.functions.invoke<{ id: string }>(
    'ai-question-draft',
    { body: args }
  );
  if (error !== null) throw new Error(`generateQuestionDraft failed: ${error.message}`);
  if (data === null) throw new Error('generateQuestionDraft: empty response');
  return data;
}

export async function resetPassword(email: string, redirectTo?: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error !== null) throw new Error(error.message);
}

export async function startCheckout(): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    'create-checkout-session',
    { body: {} }
  );
  if (error !== null) {
    throw new Error(`startCheckout failed: ${error.message}`);
  }
  if (data === null || typeof data.url !== 'string') {
    throw new Error('startCheckout: missing url');
  }
  return data.url;
}

export async function updateProfile(
  userId: string,
  patch: Partial<{
    preferred_certification: string;
    calm_mode: boolean;
    calm_mode_until: string | null;
    paused_until: string | null;
    morning_notification_enabled: boolean;
    evening_notification_enabled: boolean;
    display_name: string;
  }>
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error !== null) throw error;
}

export async function askAI(userId: string, question: string): Promise<AIQAEntry> {
  // Supabase Edge Function `ai-qa` 経由で DeepSeek を呼ぶ。JWT は自動付与。
  const { data: invokeData, error: invokeError } = await supabase.functions.invoke<{
    answer: string;
  }>('ai-qa', { body: { question } });

  if (invokeError !== null) {
    throw new Error(`askAI invoke failed: ${invokeError.message}`);
  }

  const answer = invokeData?.answer ?? '(no answer)';

  const { data, error } = await supabase
    .from('ai_qa_history')
    .insert({ user_id: userId, question, answer })
    .select('id, question, answer, source_lesson_id, created_at')
    .single();

  if (error !== null) throw new Error(`askAI insert failed: ${error.message}`);
  return data as AIQAEntry;
}
