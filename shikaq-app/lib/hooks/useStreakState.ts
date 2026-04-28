import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface StreakStateData {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
}

const FALLBACK: StreakStateData = {
  currentStreak: 0,
  longestStreak: 0,
  freezeCount: 0,
};

export function useStreakState(userId: string | null): StreakStateData {
  const [state, setState] = useState<StreakStateData>(FALLBACK);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (userId === null) {
      setState(FALLBACK);
      return;
    }

    async function load(): Promise<void> {
      const { data } = await supabase
        .from('streak_state')
        .select('current_streak, longest_streak, freeze_count')
        .eq('user_id', userId)
        .maybeSingle();

      if (data !== null) {
        setState({
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          freezeCount: data.freeze_count,
        });
      }
    }

    void load();

    if (channelRef.current !== null) {
      return () => {
        if (channelRef.current !== null) {
          void supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    }

    const channelName = `streak_state:${userId}:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'streak_state',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            current_streak: number;
            longest_streak: number;
            freeze_count: number;
          };
          setState({
            currentStreak: row.current_streak,
            longestStreak: row.longest_streak,
            freezeCount: row.freeze_count,
          });
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
