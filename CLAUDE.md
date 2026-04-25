@AGENTS.md

# shikaq — スマホ完結の資格学習サブスク

**「Apple が資格学習アプリを作ったらこうなる」** を唯一のデザイン基準にする、タブレット完結の資格学習サブスク。月額980円。

デザイン詳細は `.claude/rules/design-principles.md` を参照（Apple HIG 全振り / Liquid Glass / SF Pro / 純正アプリ別マッピング表付き）。

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
shikaq/
├── shikaq-app/      # モバイルアプリ本体 (Expo SDK 54)
├── shikaq-site/     # ランディングページ (marketing site)
├── .claude/rules/   # ドメイン固有ルール
├── CLAUDE.md        # 本ファイル (workspace 共通)
└── AGENTS.md
```

## Tech Stack

| Layer | Tech |
|-------|------|
| App (shikaq-app) | Expo SDK 54, React Native 0.81, Expo Router 6, TypeScript 5 (strict) |
| Site (shikaq-site) | 未定（Next.js 候補） |
| Styling | React Native StyleSheet, Lucide Icons |
| Backend API | Hono |
| DB / Auth | Supabase (PostgreSQL, Auth, RLS, pgvector) |
| Payment | Stripe |
| AI | pgvector + Embeddings による RAG Q&A（コーパス: Obsidian vault） |
| Playground | サンドボックス実行基盤（候補: Pyodide / WebContainer / Docker runner） |

## Quick Start (shikaq-app)

```bash
cd shikaq-app
npx expo start           # dev server
npx expo start --ios     # iOS シミュレータ
npx expo start --android # Android エミュレータ
npx expo start --web     # Web ブラウザ
```

## App Architecture (shikaq-app/)

```
app/                      # Expo Router (file-based routing)
├── (tabs)/               # タブナビゲーション (Home, Search, Learning, Profile)
├── (auth)/               # 認証画面 (login)
├── course/[id].tsx       # コース詳細
├── lesson/[id].tsx       # レッスンプレイヤー (タブレット split view 対応)
├── quiz/[id].tsx         # クイズ画面
└── _layout.tsx           # ルートレイアウト
components/ui/            # 共通UIコンポーネント
lib/supabase/             # Supabase クライアント (SecureStore)
constants/                # カラー定数・デザイントークン
types/                    # TypeScript 型定義
supabase/migrations/      # DB マイグレーション SQL
```

## Key Conventions

- フォント: SF Pro（日本語は Hiragino Sans フォールバック）— Inter/Geist/Noto は使わない
- アイコン: SF Symbols のみ（Lucide は使わない）
- カラー: セマンティックカラー（`label` / `systemBackground` 等）優先。固定値直書き禁止
- 認証トークンは `expo-secure-store` に保存
- タブレット対応: `useWindowDimensions` で `width >= 768` 判定
- DB スキーマ変更は `shikaq-app/supabase/migrations/` に SQL ファイル追加
- ドメイン固有ルールは `.claude/rules/` を参照
