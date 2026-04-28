# DB Schema Overview

**DB**: Supabase ローカル（Docker 版 Postgres + pgvector）
**マイグレーション置き場**: `supabase/migrations/`
**認可**: 全テーブルで **RLS 有効**。`auth.uid()` で自分のデータのみアクセス可。admin ロールは bypass。

## Auth スキーマ（Supabase が生成・管理）

`auth.users` / `auth.identities` / `auth.sessions` を Supabase が自動生成。アプリのテーブルは `public` スキーマに置き、`auth.users.id` を外部キーで参照する。

## アプリドメイン（`public` スキーマ）

- **profiles** — `auth.users.id` を主キーで参照、追加情報 (display_name, avatar_url, role: 'user' | 'admin')
  - サインアップ時に Trigger で自動作成
- **subscriptions** — Stripe サブスク状態
  - status: 'active' / 'past_due' / 'canceled' / 'trialing' / 'incomplete'
  - current_period_end, stripe_customer_id, stripe_subscription_id
  - source: 'stripe' / 'apple_iap' / 'google_iap'
- **certifications** → **courses** → **sections** → **lessons** — コンテンツ階層
  - 4 資格（ip / fe / spi / boki）
  - lessons.content_type: 'video' / 'text' / 'audio' / 'quiz'
- **questions** — クイズ問題
  - choices: jsonb（`[{"id":"a","text":"..."}]`）
  - format: 'multiple_choice' / 'written' / 'cbt'
  - status: 'draft' / 'published'（AI 生成 → 校閲 → 公開）
- **quiz_results** — 解答履歴 (user_id, question_id, selected_choice_id, is_correct, answered_at)
- **progress** — レッスン完了トラッキング (user_id, lesson_id, completed_at)
- **bookmarks** — ブックマーク (user_id, target_type: 'question' / 'lesson', target_id, created_at)
- **ai_qa_history** — AI Q&A 履歴 (user_id, question, answer, source_lesson_id, created_at)
- **embeddings** — pgvector 用
  - source_id, source_type: 'lesson' / 'note', content, embedding vector(1536)
  - HNSW インデックス（1,000 件以上投入後に作成）

## RLS パターン（標準）

```sql
-- 自分のデータのみ select / insert / update / delete
create policy "own data"
  on public.<table>
  for all
  using (auth.uid() = user_id);

-- 公開コンテンツ (certifications/courses/sections/lessons/questions) は全員 select 可
create policy "public read published"
  on public.lessons
  for select
  using (is_published = true);

-- admin は全操作可
create policy "admin all"
  on public.<table>
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

## 参照

詳細は `supabase/migrations/<timestamp>_initial.sql` を参照。
スキーマ変更時は新しいマイグレーション (`supabase migration new <name>`) を追加すること。
