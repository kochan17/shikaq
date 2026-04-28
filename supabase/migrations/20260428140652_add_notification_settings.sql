-- =====================================================================
-- Phase 2: 通知設定カラムを profiles に追加
-- =====================================================================
-- morning_notification_enabled : 朝 7:30 リマインダー (デフォルト ON)
-- evening_notification_enabled : 夜 22:00 Audio リマインダー (デフォルト OFF、opt-in)
-- =====================================================================

alter table public.profiles
  add column if not exists morning_notification_enabled boolean not null default true,
  add column if not exists evening_notification_enabled boolean not null default false;
