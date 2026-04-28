-- =====================================================================
-- Phase 2: Audio Ring 追加
-- daily_activity に audio_count / audio_goal カラムを追加し、
-- completed の計算式を recall + learn + audio に更新する
-- =====================================================================

-- 1. completed 列は generated always なので先に DROP してから再追加する
alter table public.daily_activity drop column if exists completed;

-- 2. audio カラム追加
alter table public.daily_activity
  add column if not exists audio_count int not null default 0,
  add column if not exists audio_goal  int not null default 1;

-- 3. completed を再追加 (recall + learn + audio で判定)
alter table public.daily_activity
  add column completed boolean generated always as (
    (recall_count + learn_count) >= (recall_goal + learn_goal)
    and audio_count >= audio_goal
  ) stored;

-- =====================================================================
-- 4. audio_count をインクリメントする RPC
--    useAudioActivity.ts から呼ぶ。存在しない行は INSERT。
-- =====================================================================
create or replace function public.increment_audio_count(
  p_user_id uuid,
  p_date    date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.daily_activity (user_id, date, audio_count, audio_goal)
  values (p_user_id, p_date, 1, 1)
  on conflict (user_id, date) do update
    set audio_count = public.daily_activity.audio_count + 1;
end;
$$;

grant execute on function public.increment_audio_count(uuid, date) to authenticated;
