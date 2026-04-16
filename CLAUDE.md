@AGENTS.md

# shikaq — スマホ完結の資格学習サブスク

Udemy風UI + Apple的直感操作の資格学習サブスク。月額980円。
対象資格: ITパスポート / 基本情報技術者 / 応用情報技術者 / SPI

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
| AI (予定) | pgvector + Embeddings による RAG Q&A |

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

- フォント: Inter + Noto Sans JP (@expo-google-fonts)
- カラー: navy (#0f172a) + coral (#f43f5e) — `shikaq-app/constants/colors.ts`
- 認証トークンは `expo-secure-store` に保存
- タブレット対応: `useWindowDimensions` で `width >= 768` 判定
- DB スキーマ変更は `shikaq-app/supabase/migrations/` に SQL ファイル追加
- ドメイン固有ルールは `.claude/rules/` を参照
