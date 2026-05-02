# Que E2E Tests

Playwright を使った E2E テスト。`que-app` とは依存を分離した独立パッケージ。

## 前提

- Node.js 20+
- que-app の dev サーバーが `http://localhost:8081` で起動していること

## セットアップ（初回のみ）

```bash
cd e2e
npm install
npx playwright install chromium
```

## ローカル実行

```bash
# 1. 別ターミナルで Expo web を起動
cd que-app
EXPO_PUBLIC_DEV_BYPASS_AUTH=true npm run web

# 2. テスト実行
cd e2e
npm test                          # 全テスト（headless）
npm run test:ui                   # Playwright UI モード
npm run test:headed               # ブラウザを表示して実行
npm test -- auth.spec.ts          # 個別 spec のみ
npm test -- --grep "ログイン"      # テスト名でフィルタ
npm run report                    # 最後の HTML レポートを開く
```

## テスト一覧

| ファイル | 対象 | 状態 |
|---|---|---|
| `auth.spec.ts` | `/login` — タイトル表示・入力フィールド・エラー文言 | 有効 |
| `onboarding.spec.ts` | `/onboarding` — 資格選択・preview 遷移・result 遷移 | 有効 |
| `legal.spec.ts` | `/legal/*` — 各ページ 200 + H1 | `test.skip`（#50 完了後に有効化） |
| `today.spec.ts` | `/` — Today 画面・Sidebar・ActivityRings | `test.skip`（bypass auth 設定後に有効化） |

## Today 系テストを有効化する手順

1. `que-app/.env` に `EXPO_PUBLIC_DEV_BYPASS_AUTH=true` を設定
2. `today.spec.ts` の `test.skip(` を `test(` に変更

## 環境変数

| 変数 | 既定値 | 説明 |
|---|---|---|
| `QUE_BASE_URL` | `http://localhost:8081` | テスト対象の URL（CI で上書き） |
| `CI` | — | 設定されると retries=2 が有効になる |
