# DB Schema Overview

全テーブルに RLS ポリシー適用済み。admin ロールは全操作可能。

## テーブル構成

- **profiles** — ユーザー (role: 'user' | 'admin')
- **subscriptions** — Stripe サブスク状態
- **certifications** → **courses** → **sections** → **lessons** — コンテンツ階層
- **questions** — クイズ問題 (choices: jsonb, 3形式: 選択/記述/CBT)
- **quiz_results** — 解答履歴
- **progress** — レッスン完了トラッキング

## 参照

詳細は `supabase/migrations/001_initial_schema.sql` を参照。
スキーマ変更時は新しいマイグレーションファイルを追加すること。
