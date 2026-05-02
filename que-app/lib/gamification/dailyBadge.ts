import { supabase } from '../supabase/client';

export interface DayBadge {
  date: string;
  completed: boolean;
  isToday: boolean;
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=日曜
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 月曜起点
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export async function fetchWeeklyDailyBadges(userId: string): Promise<DayBadge[]> {
  const weekStart = getWeekStart();
  const today = getToday();
  const weekDates = buildWeekDates(weekStart);

  const { data } = await supabase
    .from('daily_activity')
    .select('date, completed')
    .eq('user_id', userId)
    .gte('date', weekStart);

  const completedByDate = new Map<string, boolean>();
  if (data !== null) {
    for (const row of data) {
      completedByDate.set(row.date, row.completed ?? false);
    }
  }

  return weekDates.map((date) => ({
    date,
    completed: completedByDate.get(date) ?? false,
    isToday: date === today,
  }));
}
