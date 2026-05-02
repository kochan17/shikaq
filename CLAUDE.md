@AGENTS.md

# Que — スマホ完結の資格学習サブスク

**「Apple が資格学習アプリを作ったらこうなる」** を唯一のデザイン基準にする、タブレット完結の資格学習サブスク。月額980円。

- デザイン原則: `.claude/rules/design-principles.md`（Apple HIG 全振り / Liquid Glass / SF Pro / 純正アプリ別マッピング / コピーガイドライン / ストリーク哲学 / 譲れないライン Tier 1+2）
- 倫理ルーブリック: `.claude/rules/humane-tech-rubric.md`（Center for Humane Tech の Four Promises 採点シート、PR レビュー時に通す）
- Phase 1 確定仕様: `.dev/quiet_streak_lite_v4.md`（実装着手時の North Star）
- 理論・事例 deep research: `incentive_ui_design/results/*.json`（20 ファイル、Duolingo / SDT / Apple Activity Rings 等）

## ターゲットユーザー

**メイン: 20代女性、キャリアアップ志向、スタバで参考書を広げるタイプ**
- **iPad / タブレット中心**、スマホ併用。PCはサブ（ブラウザ版で対応）
- 分厚い参考書に挫折 / Udemy に到達しない層を拾う
- 対抗軸は Udemy ではなく **「市販の分厚い参考書」**
- UI判断は「iPad横持ち・カフェで片手」を基準にする

## 対象資格（現時点で4種・可変）

- ITパスポート
- 基本情報技術者
- SPI
- 簿記2級

> **応用情報技術者はスコープ外**（試験制度廃止のため）。秘書検定もスコープ外（2026-04-25 除外、IT系と需要軸がズレるため）。
> 対象資格は固定ではなく、今後追加・入替の可能性あり。最小運用は IT パスポート + 基本情報の2種でも成立する。

## コンテンツ生成ソース

- 参考書は **Kindle で購入 → Obsidian vault に取り込み**
- 問題生成・解説生成は **Obsidian vault を参照元** として行う（RAG のコーパス）
- 著作権に配慮し、原文そのままではなく要約・再構成した問題を生成する

## 実技対応: In-App Playground

- **基本情報技術者の実技問題向け**にアプリ内プレイグラウンドを提供
- ユーザーは環境構築不要でアプリ内でコード実行・提出できる
- 想定言語: 基本情報の科目Bで扱われる擬似言語 / Python / SQL など（詳細は要件定義で確定）
- サンドボックス実行基盤が必要（候補: WebContainer / Pyodide / サーバーサイド実行 + Docker）

## Workspace Layout (monorepo)

```
que/
├── que-app/      # モバイルアプリ本体 (Expo SDK 55, NativeWind 4, Expo Router)
├── supabase/        # Supabase ローカル環境 (config.toml / migrations / seed.sql)
├── que-api/      # （オプション）Stripe webhook 等の薄い API。当面 Supabase Edge Functions で代替
├── que-site/     # ランディングページ (marketing、未着手)
├── .stitch/         # Stitch デザイン資産 (DESIGN.md / 画面 PNG)
├── .claude/rules/   # ドメイン固有ルール (design-principles.md / db-schema.md)
├── CLAUDE.md        # 本ファイル (workspace 共通)
└── AGENTS.md
```

## Tech Stack（2026-04-27 確定）

| Layer | Tech | 備考 |
|-------|------|---|
| App | Expo SDK 55, React Native 0.83, TypeScript 5 (strict) | New Architecture 必須 |
| App ルーティング | **Expo Router**（file-based） | SDK 55 で公式推奨 |
| Styling | NativeWind 4 + Tailwind CSS | semantic colors / `liquid-glass` |
| Icons | Material Symbols Outlined | Web=Google Fonts、native=expo-font 将来移行 |
| **DB + Auth + Storage + Vector** | **Supabase（ローカル：Docker 版）** | Postgres / GoTrue / Storage / pgvector / Studio 一括 |
| クライアント SDK | `@supabase/supabase-js` + `expo-secure-store` | RLS で API Key 漏洩耐性 |
| Server-side API | Supabase Edge Functions（Deno）or 将来 Hono on Cloudflare Workers | Stripe Webhook / Obsidian 取り込み |
| Payment | **Stripe**（月額 ¥980 サブスク） | Stripe Tax で消費税自動、3DS 自動 |
| 管理画面 | **Supabase Studio**（`http://localhost:54323`） | Directus 不要、Studio で完結 |
| Embedding | Cohere embed-v4 or OpenAI text-embedding-3-large | RAG 用 |
| 観測性 | **Sentry**（React Native） | アプリ側のエラー監視 |
| メール | **Inbucket（ローカル開発時の captured）** / 本番は SMTP 設定 or Resend 追加 | Supabase Auth が認証メールを送る |
| Playground | Pyodide / WebContainer | 基本情報の科目B 用 |

## Supabase ローカル環境

開発時は Docker 上のローカル Supabase で完結。

```bash
# Supabase CLI インストール (Mac/Homebrew)
brew install supabase/tap/supabase

# 初回のみ
supabase init

# 起動
supabase start    # Postgres / Auth / Storage / Studio / Inbucket すべて起動
supabase status   # URL と各種キーを確認

# 主要 URL
# API:    http://localhost:54321
# Studio: http://localhost:54323
# Inbucket (メール捕獲): http://localhost:54324

# マイグレーション
supabase migration new <name>          # 新規 SQL 作成
supabase db reset                      # migrations を流し直す
supabase db push                       # 本番 Cloud に流す（将来）
```

**Docker Desktop の起動が前提**。停止は `supabase stop`。

## Quick Start

```bash
# 全部一発起動 (Supabase / Edge Functions / Stripe listen / Expo Web)
./scripts/dev.sh

# 全部停止 (Supabase Docker コンテナも含む)
./scripts/stop.sh
```

`./scripts/dev.sh` は Ctrl+C で foreground のサービス（Edge Functions / Stripe listen / Expo）を停止します。Supabase コンテナはそのまま残るので、完全停止したい時は `./scripts/stop.sh`。

各サービスのログは `.dev/edge.log` / `.dev/stripe.log` / `.dev/expo.log` に出ます（`tail -f` で確認）。

### 個別に動かしたい場合

```bash
# 1. Supabase ローカル (Docker Desktop 必須)
supabase start

# 2. Edge Functions runtime (DeepSeek / Stripe / ElevenLabs / etc.)
supabase functions serve --env-file supabase/functions/.env

# 3. Stripe webhook 転送 (テストモード)
~/.local/bin/stripe listen --api-key $STRIPE_SECRET_KEY \
  --forward-to localhost:54321/functions/v1/stripe-webhook

# 4. Expo Web dev server
cd que-app && npm run web
```

開発時は `que-app/.env` の `EXPO_PUBLIC_DEV_BYPASS_AUTH=true` で Supabase Auth をスキップして画面確認可能。実 Auth を試すときは false に。本番は削除。

## コンテンツ運用フロー（アプリ内 Admin LMS）

Que は **アプリ内に運営者向け admin ページを持つシンプルな LMS** として構築する。Obsidian や外部 CMS は使わず、すべてアプリ内から編集する。

```
運営者（profiles.role = 'admin' のユーザー）がアプリにログイン
   ↓
Sidebar に表示される [Admin] メニューから:
  - 資格管理 (certifications)
  - コース管理 (courses → sections → lessons の階層)
  - レッスン編集 (Markdown 本文 / 動画 URL / 音声ファイル紐付け)
  - 問題管理 (questions, status: draft → published)
  - ユーザー管理 (profiles, subscriptions, role 切替)
   ↓
公開フラグ (is_published / status='published') を on にすると、
学習者向けの Today / Learn / Practice 画面に反映される
```

問題作成は AI 支援も検討:
- admin の問題編集画面で「AI で draft 生成」ボタン → DeepSeek 等で生成 → 運営者が校閲 → published
- 著作権配慮：参考書の原文は使わない。運営者が自分の言葉で書いた本文・問題のみを公開する。

`embeddings` テーブルは将来の RAG（公開記事を踏まえた AI Q&A）拡張用に残してあるが、現フェーズでは未使用。

## App Architecture (que-app/)

Expo Router (file-based) 構成。エントリは `expo-router/entry`、AuthProvider は `app/_layout.tsx`。

```
app/
├── _layout.tsx              # ルート (AuthProvider + Sentry + Web font)
├── login.tsx                # /login (未認証)
└── (app)/                   # 認証必須グループ
    ├── _layout.tsx          # auth ガード + Sidebar (タブレット時)
    ├── index.tsx            # / (Today)
    ├── learn.tsx / practice.tsx / summary.tsx / ai-qa.tsx
    ├── audio.tsx / playground.tsx / bookmarks.tsx
    ├── admin.tsx / profile.tsx / search.tsx / notifications.tsx
components/
├── AuthProvider.tsx         # Supabase Auth セッション state
├── Sidebar.tsx              # 左カラム (260px)
├── TodayContent.tsx / RightDetail.tsx / MobileToday.tsx
├── MaterialIcon.tsx / BrandIcon.tsx (Google/Apple SVG)
├── ActivityRings.tsx / GoalRing.tsx
└── screens/                 # 各画面の実装 (route ファイルは薄いラッパー)
lib/
├── supabase/                # client / auth / queries
└── navigation.ts            # screenToPath / pathToScreen マップ
```

## Key Conventions

- **デザイン**: `.claude/rules/design-principles.md` 参照（Apple HIG 全振り、引き算）
- **アイコン**: Material Symbols のみ。`<MaterialIcon name="..." fill />` 経由で呼ぶ。Lucide / Phosphor 等は禁止
- **カラー**: tailwind.config.js のセマンティックトークン（`label` / `systemBackground` / `systemBlue` / `fe` / `itPassport` 等）を使う。固定 hex 直書き禁止
- **フォント**: Inter（Web の Material Symbols と一緒に Google Fonts ロード）+ Hiragino Sans フォールバック。native は SF Pro 自動
- **Liquid Glass**: `liquid-glass` クラスで `backdrop-filter: blur(26px)`。Web のみ動作、native では半透明白で代替。**chrome only**（Tab Bar / Nav / Toolbar / Sheet）、問題文・解説の背後では絶対使わない（NN/g 報告で 15% time-on-task regression）
- **ハプティクス**: 不正解時は `notification.warning` を使う（`notification.error` は禁止、心理的安全性確保）
- **コピー（日本語）**: アスピレーショナル形のみ。断言形（`私は __ だ`）・煽り（「ストリークが消えそう！」）・FOMO 禁止
- **ストリーク**: Mastery-anchored で計測（正答数）、レッスン起動回数では計測しない
- **タブレット判定**: `useWindowDimensions` で `width >= 768`
- **認証セッション**: Supabase Auth が JWT を `expo-secure-store` (native) / `localStorage` (web) に保存
- **DB マイグレーション**: `supabase migration new <name>` で `supabase/migrations/<timestamp>_<name>.sql` 作成。`supabase db reset` で適用
- **DB 型**: `supabase gen types typescript --local > que-app/types/database.ts` で自動生成
- **API 通信**: 基本は `@supabase/supabase-js` でクライアントから直接。RLS で守る。Stripe Webhook 等のサーバ処理は Supabase Edge Functions
- **RLS**: 全テーブルで RLS 有効化が必須
- **決済**: Stripe Billing でサブスクリプション管理。日本のインボイス対応は Stripe Tax 自動。Webhook は Edge Functions で受ける
- **iOS App Store**: 当面は Apple IAP（Small Business Program 15%）想定。日本 MSCA の外部リンク誘導は要観察
- **エラー監視**: Sentry（React Native）
- **メール**: 開発中は Inbucket（`http://localhost:54324`）で受信。本番は Supabase の SMTP 設定で外部送信サービスを指定
- **Apple Sign In**: iOS 実装は `expo-apple-authentication`（`AppleAuthenticationButton` 使用が審査要件）、Web は Supabase OAuth flow（`signInWithOAuth({ provider: 'apple' })`）。ロジックは `lib/auth/appleSignIn.ts` に集約
- **ドメイン固有ルール**: `.claude/rules/` 参照
