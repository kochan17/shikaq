import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

export interface DayActivity {
  date: string;
  answeredCount: number;
  correctCount: number;
  completionRate: number;
}

export interface WeakSection {
  sectionId: string;
  sectionTitle: string;
  lessonId: string;
  attempts: number;
  correctCount: number;
  accuracyPct: number;
}

export interface TrendMetric {
  label: string;
  currentValue: number;
  previousValue: number;
  unit: string;
  delta: number;
  isPositive: boolean;
}

export interface SummaryData {
  last7Days: DayActivity[];
  weakSections: WeakSection[];
  trends: TrendMetric[];
  todayAnswered: number;
  todayGoal: number;
  todayProgress: number;
  currentStreak: number;
  longestStreak: number;
}

const FALLBACK: SummaryData = {
  last7Days: [],
  weakSections: [],
  trends: [],
  todayAnswered: 0,
  todayGoal: 10,
  todayProgress: 0,
  currentStreak: 0,
  longestStreak: 0,
};

const ESTIMATED_SECONDS_PER_QUESTION = 90;

function buildDateRange(daysBack: number): string[] {
  const dates: string[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function useSummaryData(userId: string | null): {
  data: SummaryData;
  loading: boolean;
} {
  const [data, setData] = useState<SummaryData>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId === null) {
      setLoading(false);
      return;
    }

    void load(userId).then(setData).finally(() => setLoading(false));
  }, [userId]);

  return { data, loading };
}

async function load(userId: string): Promise<SummaryData> {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [quizRes, activityRes, streakRes] = await Promise.all([
    supabase
      .from('quiz_results')
      .select('is_correct, answered_at, question_id, questions!inner(lesson_id, lessons!inner(id, title, sections!inner(id, title)))')
      .eq('user_id', userId)
      .gte('answered_at', fourteenDaysAgo.toISOString()),
    supabase
      .from('daily_activity')
      .select('date, recall_count, learn_count, recall_goal, learn_goal')
      .eq('user_id', userId)
      .gte('date', buildDateRange(7)[0]),
    supabase
      .from('streak_state')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  type QuizRow = {
    is_correct: boolean;
    answered_at: string;
    question_id: string;
    questions: {
      lesson_id: string;
      lessons: { id: string; title: string; sections: { id: string; title: string } };
    };
  };
  const allRows = (quizRes.data ?? []) as unknown as QuizRow[];

  const today = new Date().toISOString().slice(0, 10);
  const dates7 = buildDateRange(7);
  const dates14 = buildDateRange(14);

  // Build per-day answered/correct maps (last 14 days)
  const dayMap = new Map<string, { answered: number; correct: number }>();
  for (const date of dates14) {
    dayMap.set(date, { answered: 0, correct: 0 });
  }

  for (const row of allRows) {
    const date = row.answered_at.slice(0, 10);
    const cur = dayMap.get(date);
    if (cur !== undefined) {
      cur.answered += 1;
      if (row.is_correct) cur.correct += 1;
    }
  }

  // daily_activity takes precedence for goal info
  const activityByDate = new Map<string, { goal: number }>();
  for (const a of activityRes.data ?? []) {
    activityByDate.set(a.date as string, {
      goal: ((a.recall_goal as number) + (a.learn_goal as number)),
    });
  }

  const last7Days: DayActivity[] = dates7.map((date) => {
    const day = dayMap.get(date) ?? { answered: 0, correct: 0 };
    const goal = activityByDate.get(date)?.goal ?? 10;
    return {
      date,
      answeredCount: day.answered,
      correctCount: day.correct,
      completionRate: goal === 0 ? 0 : Math.min(day.answered / goal, 1),
    };
  });

  const todayDay = dayMap.get(today) ?? { answered: 0, correct: 0 };
  const todayGoal = activityByDate.get(today)?.goal ?? 10;

  // Weak sections from quiz_results (section-level aggregation)
  const sectionMap = new Map<
    string,
    { sectionTitle: string; lessonId: string; attempts: number; correct: number }
  >();

  for (const row of allRows) {
    const section = row.questions?.lessons?.sections;
    const lesson = row.questions?.lessons;
    if (section === undefined || section === null) continue;
    const key = section.id;
    const cur = sectionMap.get(key) ?? {
      sectionTitle: section.title,
      lessonId: lesson.id,
      attempts: 0,
      correct: 0,
    };
    cur.attempts += 1;
    if (row.is_correct) cur.correct += 1;
    sectionMap.set(key, cur);
  }

  const weakSections: WeakSection[] = [...sectionMap.entries()]
    .map(([sectionId, v]) => ({
      sectionId,
      sectionTitle: v.sectionTitle,
      lessonId: v.lessonId,
      attempts: v.attempts,
      correctCount: v.correct,
      accuracyPct: v.attempts === 0 ? 0 : Math.round((v.correct / v.attempts) * 100),
    }))
    .filter((s) => s.attempts >= 3)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)
    .slice(0, 3);

  // Trends: compare last 7 days vs previous 7 days
  const curr7 = dates7;
  const prev7 = dates14.slice(0, 7);

  function sumDays(dates: string[]): { answered: number; correct: number } {
    return dates.reduce(
      (acc, d) => {
        const day = dayMap.get(d) ?? { answered: 0, correct: 0 };
        return { answered: acc.answered + day.answered, correct: acc.correct + day.correct };
      },
      { answered: 0, correct: 0 }
    );
  }

  const currSum = sumDays(curr7);
  const prevSum = sumDays(prev7);

  const currAccuracy =
    currSum.answered === 0 ? 0 : Math.round((currSum.correct / currSum.answered) * 100);
  const prevAccuracy =
    prevSum.answered === 0 ? 0 : Math.round((prevSum.correct / prevSum.answered) * 100);

  const currMinutes = Math.round((currSum.answered * ESTIMATED_SECONDS_PER_QUESTION) / 60);
  const prevMinutes = Math.round((prevSum.answered * ESTIMATED_SECONDS_PER_QUESTION) / 60);

  const trends: TrendMetric[] = [
    {
      label: '正答率',
      currentValue: currAccuracy,
      previousValue: prevAccuracy,
      unit: '%',
      delta: currAccuracy - prevAccuracy,
      isPositive: currAccuracy >= prevAccuracy,
    },
    {
      label: '問題数',
      currentValue: currSum.answered,
      previousValue: prevSum.answered,
      unit: '問',
      delta: currSum.answered - prevSum.answered,
      isPositive: currSum.answered >= prevSum.answered,
    },
    {
      label: '学習時間',
      currentValue: currMinutes,
      previousValue: prevMinutes,
      unit: '分',
      delta: currMinutes - prevMinutes,
      isPositive: currMinutes >= prevMinutes,
    },
  ];

  return {
    last7Days,
    weakSections,
    trends,
    todayAnswered: todayDay.answered,
    todayGoal,
    todayProgress: todayGoal === 0 ? 0 : Math.min(todayDay.answered / todayGoal, 1),
    currentStreak: streakRes.data?.current_streak ?? 0,
    longestStreak: streakRes.data?.longest_streak ?? 0,
  };
}
