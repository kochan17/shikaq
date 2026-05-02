import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface AudioActivityState {
  audioCount: number;
  audioGoal: number;
  progress: number;
  completed: boolean;
}

const FALLBACK: AudioActivityState = {
  audioCount: 0,
  audioGoal: 1,
  progress: 0,
  completed: false,
};

function buildState(row: {
  audio_count: number;
  audio_goal: number;
}): AudioActivityState {
  const { audio_count, audio_goal } = row;
  const progress = audio_goal === 0 ? 0 : Math.min(audio_count / audio_goal, 1);
  return {
    audioCount: audio_count,
    audioGoal: audio_goal,
    progress,
    completed: audio_count >= audio_goal,
  };
}

export function useAudioActivity(userId: string | null): AudioActivityState {
  const [state, setState] = useState<AudioActivityState>(FALLBACK);
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
        .select('audio_count, audio_goal')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (data !== null) {
        setState(buildState(data as { audio_count: number; audio_goal: number }));
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

    const channelName = `audio_activity:${userId}:${today}:${Math.random().toString(36).slice(2, 10)}`;
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
            audio_count: number;
            audio_goal: number;
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

// 音声コンテンツを1本聴き終えた時に呼ぶ
export async function recordAudioCompleted(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.rpc('increment_audio_count', {
    p_user_id: userId,
    p_date: today,
  });

  if (error !== null) {
    // RPC が未定義の場合は upsert で代替
    await supabase.from('daily_activity').upsert(
      {
        user_id: userId,
        date: today,
        audio_count: 1,
      },
      { onConflict: 'user_id,date', ignoreDuplicates: false }
    );
  }
}
