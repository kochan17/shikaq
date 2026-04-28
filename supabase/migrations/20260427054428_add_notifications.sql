-- =====================================================================
-- notifications : 学習リマインダー / システム通知
-- =====================================================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('streak', 'reminder', 'system', 'subscription')),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications own all"
  on public.notifications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
