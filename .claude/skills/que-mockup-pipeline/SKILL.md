---
name: shikaq-mockup-pipeline
description: shikaq の画面モックアップを Codex + image-2 で生成するパイプライン。「shikaq の画面モック作って」「shikaq の○○画面のカンプ」「shikaq の××画面を image-2 で」「Home と揃えて○○のモック」「shikaq のレスポンシブ版（iPad / iPhone）モック」「shikaq の LP のモック」「shikaq の追加画面のデザイン」など、shikaq プロダクトで画面モックアップ・デザインカンプ・UI ビジュアルを生成したいと示唆されたら必ず発動する。Codex sandbox の DNS 制約を回避する組み込み image_gen edit パスの選択、Home モック参照による一貫性担保、共通プリアンブル＋画面別プロンプトの分離、並列バッチ起動、`.stitch/DESIGN.md` の進捗更新まで一気通貫で扱う。Apple 全振りのデザイン哲学を保ったまま画面を追加するときも、まずこの skill を読み込むこと。
---

# shikaq Mockup Pipeline

shikaq の画面モックアップを Codex + image-2 で生成する一連の手順をまとめる。プロンプト準備 → 並列生成 → 進捗管理までをこの 1 ファイルでカバー。デザイン哲学そのものは `.claude/rules/design-principles.md`、デザイントークンは `.stitch/DESIGN.md` に分離している。本 skill は **生成パイプラインの運用** を扱う。

## 前提

- 対象: shikaq（資格学習サブスク、Apple 全振り）
- 生成手段: Codex CLI 経由で image-2 を呼ぶ。`codex:codex-rescue` subagent を介する
- 出力先: `.stitch/designs/<screen>-<form>-final.png`（form は `desktop` / `ipad` / `iphone`）
- 参照画像: 既存の Home モック（最初に確定したもの）を全画面の一貫性ベースに使う

## なぜこの skill が必要か

毎回手で 6〜10 画面分のプロンプト構造、Codex の起動経路、リトライ手順、DESIGN.md の更新を再構築するとブレる。Apple 全振りという哲学はぶれてはいけないが、生成パスは変わりうるので、知見は本ファイルに集約してアップデートする。

---

## 重要な前提知識（Codex の沼を避ける）

### Codex sandbox は OpenAI API への DNS をブロックする

Codex CLI を `codex exec` で起動した場合、その sandbox 内から `api.openai.com` への DNS が通らない。よって以下は **失敗する**:

- `client.images.edit(...)` の Python SDK 直叩き
- `gpt-image-2` 系 CLI で curl / 内蔵 fetch
- `imagegen` バンドル CLI（OpenAI API を叩くもの）

エラーは `APIConnectionError: nodename nor servname provided, or not known`。再試行しても抜けない。

### 通るのは Codex 組み込みの `image_gen edit` パス

**参照画像を Codex の conversation context にロードしてから image-2 の edit を呼ぶ**ルートは sandbox を経由せずに通る。本 skill では原則このパスを最初から指定する。

subagent への指示テンプレに必ず以下を入れる:

> Codex 組み込みの `image_gen` edit パスを使う（OpenAI API 直叩きは sandbox DNS でブロックされる。Home 参照画像を conversation context にロードして image-2 の edit として通すルートを使う）

---

## ワークフロー（標準）

### Step 1. プロンプトファイル `.stitch/prompts-screens.md` を整備する

構造は **共通プリアンブル + 画面別セクション** に分ける。粒度は **方向性ベース**（要素仕様ではなく、参照アプリ・トーン・含まれる最低限の要素のみ）。

```
# shikaq 画面生成プロンプト（image-2 用）

## 共通プリアンブル（全画面で先頭に置く）
shikaq という日本の資格学習 Web サービスの画面モックアップ。
デスクトップブラウザ（MacBook）で開いた画面の正面プロダクトショット。
（サービス概要・ペルソナ・哲学・トーン・出力フォーマット・左サイドバー仕様）

## 1. <画面名>
（共通プリアンブル）
この画面は「○○」。参照する Apple 純正アプリは **○○**。
含まれる最低限の要素: ...
```

**やってはいけないこと**:

- 要素レベルの細かい指定（位置・カラー値・座標・テキスト一字一句）。生成モデルの解釈余地を奪うとレイアウトが詰まる
- 全画面で重複した記述を本文に直書きする（プリアンブル化して使い回す）

### Step 2. プロンプトを Codex にレビューさせる

まとめて `codex:codex-rescue` に渡し、観点を指定して短いレビューを返してもらう。

レビュー観点（テンプレート）:

1. Apple 哲学を伝える情報が十分か
2. 粒度は適切か（方向性として機能、過剰スペックでないか）
3. Home モックと**同じプロダクトに見える**一貫性（左サイドバー / 情報密度 / 余白の取り方 / 活字の雰囲気）を担保できそうか
4. 各画面の参照 Apple 純正アプリは画面の性質と噛み合うか
5. 過剰指定 / 不足
6. 日本語 UI 文言の自然さ

返却は **画面ごとに `Verdict: OK / tweak / rewrite` + 1-3 行の delta 提案** が扱いやすい。

### Step 3. 指摘を反映してから生成に入る

指摘で多いのは「要素過剰」。この場合は **追加するのではなく削る** 方向で直す。Apple 純正アプリの引き算が崩れるのを防ぐ。

### Step 4. バッチ並列で `codex:codex-rescue` を起動する

3 画面ずつ並列が安定。ネットワーク揺らぎや一時的失敗を吸収しやすい。

各 subagent への指示に **必ず以下を含める**:

- 対象画面名 + プロンプトファイル内のセクション番号
- Home 参照画像のフルパス（`/.../home-desktop-final.png`）
- **Codex 組み込みの `image_gen edit` パスを使う**（DNS 制約の説明込み）
- 出力先のフルパス（`/.../<screen>-desktop-final.png`）
- 「追加の要素指定を勝手に足さない」（プロンプト粒度を守る）
- 返してほしい内容: 保存先パス、サイズ、使った生成パス、警告 / エラー

サンプル骨格は `references/subagent-prompt.md` 参照。

### Step 5. 失敗したらリトライ

`APIConnectionError` 系で失敗した subagent には、**「他 agent が成功したのは Codex 組み込み `image_gen` edit パス」と明示**してから新規 agent を立てる。同じ sandbox 設定でも別ルートが通る。SendMessage で同じ agent に再依頼するより、新規 agent + 成功手段の明示の方が速い。

### Step 6. 全画面が揃ったら DESIGN.md を更新

`.stitch/DESIGN.md` の「Generated Screens (progress)」を最新化。`🔲` を `✅ <path> — <方式>（<日付>）` に置き換える。

### Step 7. ユーザーに 7 画面（または対象画面）を Read で見せる

並べて見せると **左サイドバー / 情報密度 / トーン / アートワーク** の一貫性が一目で確認できる。気になる点があれば該当画面だけ再生成。

---

## 画面 × Apple 純正アプリ マッピング（再掲・抜粋）

詳細は `.claude/rules/design-principles.md` 参照。

| shikaq の画面 | 参照する純正アプリ |
|---|---|
| Home / Today | Apple News+ |
| コース一覧 | Apple Books |
| 問題演習 | Apple Journal |
| 学習サマリー | Apple Fitness |
| AI Q&A | Apple Journal |
| 夜の音声解説 | Apple Music Now Playing |
| Playground | Swift Playgrounds |

新画面を追加するときも、対応する Apple 純正アプリを 1 つ決めてから書き始めると軸がぶれない。

---

## アンチパターン

- ❌ プロンプトに要素レベルの位置・カラー値・テキスト一字一句を書き込む（解釈余地を奪う）
- ❌ Codex sandbox から `api.openai.com` を直接叩く前提で構成する（DNS で落ちる）
- ❌ Home 以外を参照画像にする（一貫性の起点が崩れる）
- ❌ 並列起動を 1 枚ずつに分解する（時間が線形に伸びる、揺らぎ吸収が効かない）
- ❌ 失敗時に同じパスで延々リトライする（成功した別 agent の手段を引き継ぐ）

---

## 関連ファイル

- `.claude/rules/design-principles.md` — Apple HIG 全振りのデザイン哲学
- `.stitch/DESIGN.md` — カラー / タイポ / コンポーネント規則と Generated Screens 進捗
- `.stitch/prompts-screens.md` — 画面別 image-2 プロンプト
- `.stitch/designs/home-desktop-final.png` — 全画面の一貫性ベースになる参照画像
- `references/subagent-prompt.md` — codex:codex-rescue に渡す依頼文の骨格

---

## 状態管理

新画面の追加・既存画面の差し替えがあった場合は、本 skill と `.stitch/DESIGN.md` の両方を更新する。本 skill のレシピが古くなったら、Codex の挙動が変わった可能性が高いので、まず通った経路を本ファイルに反映してから次の生成に入る。
