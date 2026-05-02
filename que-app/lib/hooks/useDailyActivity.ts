import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface DailyActivityState {
  recallCount: number;
  learnCount: number;
  recallGoal: number;
  learnGoal: number;
  completed: boolean;
  totalGoal: number;
  totalDone: number;
  progress: number;
}

const FALLBACK: DailyActivityState = {
  recallCount: 0,
  learnCount: 0,
  recallGoal: 7,
  learnGoal: 3,
  completed: false,
  totalGoal: 10,
  totalDone: 0,
  progress: 0,
};

function buildState(row: {
  recall_count: number;
  learn_count: number;
  recall_goal: number;
  learn_goal: number;
  completed: boolean | null;
}): DailyActivityState {
  const totalGoal = row.recall_goal + row.learn_goal;
  const totalDone = row.recall_count + row.learn_count;
  return {
    recallCount: row.recall_count,
    learnCount: row.learn_count,
    recallGoal: row.recall_goal,
    learnGoal: row.learn_goal,
    completed: row.completed ?? false,
    totalGoal,
    totalDone,
    progress: totalGoal === 0 ? 0 : Math.min(totalDone / totalGoal, 1),
  };
}

export function useDailyActivity(userId: string | null): DailyActivityState {
  const [state, setState] = useState<DailyActivityState>(FALLBACK);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (userId === null) {
      setState(FALLBACK);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    async function load(): Promise<void> {
      const { data } = await supabase
        .from('daily_activity')
        .select('recall_count, learn_count, recall_goal, learn_goal, completed')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (data !== null) {
        setState(buildState(data));
      }
    }

    void load();

    // Strict Mode 二重 mount で同名チャンネルに `on()` が重複適用されるのを避けるため
    // ユニーク suffix を付ける + channelRef ガードで多重作成を防ぐ
    if (channelRef.current !== null) {
      return () => {
        if (channelRef.current !== null) {
          void supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    }

    const channelName = `daily_activity:${userId}:${today}:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_activity',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            recall_count: number;
            learn_count: number;
            recall_goal: number;
            learn_goal: number;
            completed: boolean | null;
            date: string;
          };
          if (row.date === today) {
            setState(buildState(row));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current !== null) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  return state;
}
