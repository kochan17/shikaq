-- =====================================================================
-- Phase 1 Gamification: FSRS-5 SRS / Daily Ring / Mastery / Streak / Calm Mode
-- =====================================================================
-- 変更対象:
--   1. profiles 拡張 (ALTER TABLE)
--   2. questions_review_state 新設 (FSRS-5 状態)
--   3. daily_activity 新設 (Daily Ring)
--   4. section_mastery 新設 (80% gate)
--   5. streak_state 新設
--   + RLS / index / trigger (Endowed Progress 15% プリ充填)
-- =====================================================================

-- =====================================================================
-- 1. profiles 拡張
-- =====================================================================
alter table public.profiles
  add column if not exists preferred_certification text
    check (preferred_certification in ('ip', 'fe', 'spi', 'boki')),
  add column if not exists calm_mode boolean not null default false,
  add column if not exists calm_mode_until date,
  add column if not exists paused_until date;

-- =====================================================================
-- 2. questions_review_state : FSRS-5 per-user per-question 状態
-- =====================================================================
create table public.questions_review_state (
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  stability   float not null default 0,
  difficulty  float not null default 0,
  due_at      timestamptz not null default now(),
  last_review_at timestamptz,
  reps        int not null default 0,
  lapses      int not null default 0,
  primary key (user_id, question_id)
);

-- Today 起動時に due_at でフィルタするクエリ用
create index questions_review_state_user_due
  on public.questions_review_state (user_id, due_at);

alter table public.questions_review_state enable row level security;

create policy "questions_review_state own all"
  on public.questions_review_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "questions_review_state admin all"
  on public.questions_review_state for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =====================================================================
-- 3. daily_activity : Daily Ring (Recall / Learn)
-- =====================================================================
create table public.daily_activity (
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  recall_count int not null default 0,
  learn_count  int not null default 0,
  recall_goal  int not null default 3,
  learn_goal   int not null default 7,
  -- (recall_count + learn_count) >= (recall_goal + learn_goal) で完了判定
  completed    boolean generated always as (
    (recall_count + learn_count) >= (recall_goal + learn_goal)
  ) stored,
  primary key (user_id, date)
);

alter table public.daily_activity enable row level security;

create policy "daily_activity own all"
  on public.daily_activity for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_activity admin all"
  on public.daily_activity for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =====================================================================
-- 4. section_mastery : 80% gate 用スコア
-- =====================================================================
create table public.section_mastery (
  user_id    uuid not null references auth.users(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  -- 0.0〜1.0 (1.0 = 100%)
  score      float not null default 0
    check (score >= 0 and score <= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, section_id)
);

alter table public.section_mastery enable row level security;

create policy "section_mastery own all"
  on public.section_mastery for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "section_mastery admin all"
  on public.section_mastery for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =====================================================================
-- 5. streak_state : ストリーク管理
-- =====================================================================
create table public.streak_state (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  -- Streak Freeze 残数
  freeze_count   int not null default 0,
  updated_at     timestamptz not null default now()
);

alter table public.streak_state enable row level security;

create policy "streak_state own all"
  on public.streak_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "streak_state admin all"
  on public.streak_state for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =====================================================================
-- Onboarding trigger: preferred_certification 初回設定時に
-- daily_activity を 15% プリ充填 (Endowed Progress)
-- =====================================================================
-- 計算式:
--   total_goal = recall_goal + learn_goal = 10 (デフォルト)
--   prefill    = ROUND(total_goal * 0.15) = 2
--   prefill は recall_count に全額充当 (learn_count = 0 で開始)
-- A/B 検証で 10% / 20% に切り替える場合はここの 0.15 を変更する
-- =====================================================================
create function public.handle_preferred_certification_set()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_goal  int;
  v_prefill     int;
begin
  -- preferred_certification が NULL → 非NULL に変わった時だけ実行
  if old.preferred_certification is not null or new.preferred_certification is null then
    return new;
  end if;

  v_total_goal := 3 + 7;  -- recall_goal + learn_goal のデフォルト
  v_prefill    := round(v_total_goal * 0.15);  -- = 2

  insert into public.daily_activity (
    user_id,
    date,
    recall_count,
    learn_count,
    recall_goal,
    learn_goal
  )
  values (
    new.id,
    current_date,
    v_prefill,  -- recall に全額充当
    0,
    3,
    7
  )
  on conflict (user_id, date) do nothing;

  return new;
end;
$$;

create trigger on_preferred_certification_set
  after update on public.profiles
  for each row
  execute function public.handle_preferred_certification_set();
