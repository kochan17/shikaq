-- =====================================================================
-- que initial schema
-- =====================================================================
-- Auth は Supabase が管理する auth.users / auth.sessions / auth.identities を利用。
-- 全テーブル RLS 有効化。auth.uid() = user_id で自分のデータのみアクセス可能。
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- =====================================================================
-- profiles : auth.users と 1:1
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles update own"
  on public.profiles for update
  using (auth.uid() = id);

-- 新規 user 登録時に自動で profiles 行を作成
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- subscriptions : Stripe サブスク状態
-- =====================================================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  source text not null default 'stripe' check (source in ('stripe', 'apple_iap', 'google_iap')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.subscriptions (user_id);
alter table public.subscriptions enable row level security;

create policy "subscriptions select own"
  on public.subscriptions for select
  using (auth.uid() = user_id);
-- insert/update/delete は service_role 経由 (Edge Functions の Stripe webhook) のみ。

-- =====================================================================
-- certifications -> courses -> sections -> lessons
-- =====================================================================
create table public.certifications (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique check (slug in ('ip', 'fe', 'spi', 'boki')),
  name text not null,
  description text,
  category text not null check (category in ('IT', 'business')),
  is_published boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  certification_id uuid not null references public.certifications(id) on delete cascade,
  title text not null,
  description text,
  thumbnail_url text,
  is_published boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.courses (certification_id);

create table public.sections (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  is_published boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.sections (course_id);

create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid not null references public.sections(id) on delete cascade,
  title text not null,
  content_type text not null check (content_type in ('video', 'text', 'audio', 'quiz')),
  body text,
  audio_storage_path text,
  duration_seconds int,
  is_published boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.lessons (section_id);

alter table public.certifications enable row level security;
alter table public.courses enable row level security;
alter table public.sections enable row level security;
alter table public.lessons enable row level security;

create policy "cert public read published"
  on public.certifications for select
  using (is_published = true);

create policy "courses public read published"
  on public.courses for select
  using (is_published = true);

create policy "sections public read published"
  on public.sections for select
  using (is_published = true);

create policy "lessons public read published"
  on public.lessons for select
  using (is_published = true);

create policy "cert admin all" on public.certifications for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "courses admin all" on public.courses for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "sections admin all" on public.sections for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "lessons admin all" on public.lessons for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- =====================================================================
-- questions
-- =====================================================================
create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  format text not null check (format in ('multiple_choice', 'written', 'cbt')),
  question_text text not null,
  choices jsonb,
  correct_choice_id text,
  explanation text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.questions (lesson_id);
create index on public.questions (status);

alter table public.questions enable row level security;

create policy "questions public read published"
  on public.questions for select
  using (status = 'published');

create policy "questions admin all" on public.questions for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- =====================================================================
-- quiz_results
-- =====================================================================
create table public.quiz_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_choice_id text,
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);
create index on public.quiz_results (user_id, answered_at desc);
create index on public.quiz_results (question_id);

alter table public.quiz_results enable row level security;

create policy "quiz_results own all"
  on public.quiz_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================================
-- progress
-- =====================================================================
create table public.progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index on public.progress (user_id);

alter table public.progress enable row level security;

create policy "progress own all"
  on public.progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================================
-- bookmarks
-- =====================================================================
create table public.bookmarks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('question', 'lesson')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index on public.bookmarks (user_id);

alter table public.bookmarks enable row level security;

create policy "bookmarks own all"
  on public.bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================================
-- ai_qa_history
-- =====================================================================
create table public.ai_qa_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text,
  source_lesson_id uuid references public.lessons(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.ai_qa_history (user_id, created_at desc);

alter table public.ai_qa_history enable row level security;

create policy "ai_qa_history own all"
  on public.ai_qa_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================================
-- embeddings : pgvector RAG コーパス
-- =====================================================================
-- 1536 = OpenAI text-embedding-3-small (or 3-large の縮約)
-- 後で Cohere embed-v4 (1024) に切り替える場合は次元変更してマイグレーションを追加
create table public.embeddings (
  id uuid primary key default uuid_generate_v4(),
  source_type text not null check (source_type in ('lesson', 'note', 'question')),
  source_id uuid,
  certification_slug text references public.certifications(slug) on update cascade,
  content text not null,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- HNSW インデックスは 1,000 件以上投入後に作成:
--   create index on public.embeddings using hnsw (embedding vector_cosine_ops)
--     with (m = 16, ef_construction = 64);

alter table public.embeddings enable row level security;

create policy "embeddings public read"
  on public.embeddings for select
  using (true);

create policy "embeddings admin write"
  on public.embeddings for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
