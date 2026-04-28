# Design Principles

> **shikaq のデザインは Apple 純正アプリに全振り。「Apple が資格学習アプリを作ったらこうなる」が唯一のゴール。**
> 対象: shikaq-app（Expo / React Native）。shikaq-site（marketing）は別ルール。

## 核となる哲学（Apple HIG Foundations）

- **Clarity** — コンテンツ（問題文・選択肢）が主役。装飾的な影・グラデーション・枠線を排除
- **Deference** — UI は引き算。ナビゲーションは半透明素材でコンテンツに道を譲る
- **Depth** — 階層を Z 軸で表現。Liquid Glass / BlurView で層を分離
- **Less but better**（Dieter Rams → Jony Ive） — 1画面1情報。問題画面に表示するのは「問題文 / 選択肢 / 残り問題数」のみ
- 参照: https://developer.apple.com/design/human-interface-guidelines/foundations

## タイポグラフィ

- **SF Pro Display / Text** を使用（日本語は Hiragino Sans / ヒラギノ角ゴ を自動フォールバック）
- **Dynamic Type 必須対応**。アクセシビリティサイズ 200% 以上まで崩れない設計
- テキストスタイル:
  - Title 2（22pt）: 問題番号・セクション見出し
  - Body（17pt）: 問題文本体
  - Callout（16pt）: 選択肢
  - Footnote（13pt）: 解説
  - Caption 1（12pt）: 補足
- **SF Pro Display は 20pt 以上 / SF Pro Text は 19pt 以下** の原則を守る
- 参照: https://developer.apple.com/design/human-interface-guidelines/typography

## アイコン

- **SF Symbols のみ使用**（Lucide は使わない）
- TextStyle に sym サイズを同期（アイコンと隣接テキストの光学的な重さを揃える）
- 代表例:
  - `checkmark.circle.fill` — 正解 / 完了
  - `questionmark.circle` — 問題
  - `star.fill` — 難易度
  - `flame.fill` — ストリーク
- 参照: https://developer.apple.com/design/human-interface-guidelines/sf-symbols

## カラー

- **セマンティックカラーを優先**。`label` / `secondaryLabel` / `systemBackground` / `secondarySystemBackground` / `systemFill`
- 固定値（`#000000` 等）で直接色指定しない。ダークモード自動切り替えが保証されるため
- フィードバック: `systemGreen`（正解）/ `systemRed`（不正解）
- アクセント: `tintColor` を1色だけ定義。資格ごとのカテゴリカラーは `tinted glass` として背景に滲ませる（Apple Music 方式）
- コントラスト基準: 通常 4.5:1、大テキスト 3:1（ライト/ダーク両モードで検証必須）
- 参照: https://developer.apple.com/design/human-interface-guidelines/color

## モーション

- **Spring アニメーションを基本**（Ease-in/out は使わない）
  - Expo: `react-native-reanimated` の `withSpring({ damping: 20, stiffness: 300 })`
- **Reduced Motion 対応必須**
  - `useReducedMotion()`（Reanimated 3+）でフェードに切替
- **ハプティクス 3種のみ**（使いすぎ禁止）:
  - 選択タップ: `selection`（軽）
  - 正解: `notification.success`
  - 不正解: `notification.warning`（**`notification.error` は使わない** — 心理的安全性確保のため、Duolingo 系の「ペナルティ感」を回避）
- 参照: https://developer.apple.com/design/human-interface-guidelines/motion

## 素材（Liquid Glass / BlurView）

- **iOS 26+**: `expo-glass-effect` の `GlassView` を使う（`isLiquidGlassAvailable()` で分岐）
- **iOS 25 以下 / Android / Web**: `expo-blur` の `BlurView` で近似
- **Glass-on-Glass 厳禁**: ガラス要素の重ね置きは可読性を壊す
- 適用対象: Tab Bar / Navigation Bar / Toolbar / Sheet / Popover（**chrome only**）
- **絶対避ける場所**: 問題文・解説の背景（NN/g 報告で **15% time-on-task regression**、可読性が壊れる）
- 参照: https://developer.apple.com/videos/play/wwdc2025/219/ / https://docs.expo.dev/versions/latest/sdk/glass-effect/ / https://www.nngroup.com/articles/liquid-glass/

## ナビゲーション

- **iPad 横持ち**: 3カラム SplitView（資格 → コース/セクション → 問題/レッスン）
- **iPad 縦持ち / スマホ**: サイドバーがタブバーに変換されるレスポンシブ挙動
- **タブバー**: スクロール連動で自動ミニマイズ（iOS 26 の `tabBarMinimizeBehavior` 相当を Reanimated で実装）
- **キーボードショートカット**（iPad 外付けキーボード対応）:
  - ⌘→ / ⌘← : 問題送り
  - 1〜4 : 選択肢選択
  - ↑↓ : フォーカス移動
- **ポインタ対応**: 選択肢は hover で軽い lift + highlight（`Pressable` の `hovered` state）
- 参照: https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados

## 画面 × 純正アプリ マッピング

| shikaq の画面 | 参照する純正アプリ | 転用する要素 |
|---|---|---|
| Home ダッシュボード | **Apple News+** | フルブリード Featured カード + 情報密度グラデーション |
| 資格選択 / コース一覧 | **Apple Books** | 横スクロールシェルフ + カバー主体のカード |
| セクション / レッスン一覧 | **Apple Podcasts** | エピソードカード + 進捗バー埋め込み + 状態バッジ |
| レッスンプレイヤー（動画） | **Apple Music** | ミニプレーヤー常駐 + スワイプアップで全画面 |
| 問題演習（集中） | **Journal** | 余白最大 + 問題文中央配置 + ツールバー最小 |
| CBT 方式 | **Reminders** | カンバン列 + 完了時のチェック→フェードアニメ |
| 学習サマリー・弱点 | **Fitness** | 3リング（問題数 / 正答率 / 時間）+ ストリーク |
| AI Q&A | **Journal** | プロンプト提案のインライン表示 + 逆時系列カード |
| 夜の音声解説クイズ | **Apple Music Now Playing** | アートワーク + 波形 + ロック画面再生 |
| Playground（基本情報） | **Swift Playgrounds** | 左エディタ / 右結果 / 実行ボタンのミニマル配置 |

## UX ルール（不変）

- スクリーンショット防止（Netflix方式のコンテンツ保護）
- 問題形式: 選択式 / 記述式 / CBT 方式
- 過去問 + Obsidian RAG によるコンテンツ生成
- 朝5問リマインド + 夜の音声解説クイズ
- iPad 横持ち・カフェで片手操作を判断基準に

## コピーライティング（日本語）

shikaq の日本語コピーは **アスピレーショナル形（願望・呼びかけ・提案）** で統一。断言形・押し付け形は禁止。

### OK 例
- 「今日の3問が届きました」（呼びかけ）
- 「もう少し続けてみよう」（提案）
- 「7日続いています」（事実陳述）
- 「合格に近づいています」（願望支持）

### NG 例
- ❌「私は毎日学ぶ人だ」（断言形 — Atomic Habits の identity 設計を直訳すると押し付けがましい）
- ❌「今日も Duo と勉強しよう！」（キャラ煽り）
- ❌「ストリークが消えそう！」（恐怖煽り）
- ❌「今すぐ学習しないと損する」（FOMO 煽り）

### Tone Map
- 「スタバで一緒に勉強しよう」的な仲間感
- 一人称: 使わない（「あなた」「shikaq」も最小限）
- 感嘆符: 1コピーに最大1個
- 絵文字: 使わない（Apple HIG の Deference）

## ストリーク・インセンティブ哲学（譲れないライン）

調査結果（Streak Society 批判 / Duolingo 62% 罪悪感 / Apple Fitness watchOS 11 Pause Rings）に基づく:

- **Mastery-anchored で計測**: ストリークは **正答数** で計測する。「レッスン起動回数」「アプリ open 回数」では計測しない（Goodhart's Law 罠回避）
- **継続中はストリークを大きく見せない**（Caption 1 / 12pt）。**終了時にだけ自己ベスト更新を称える**（Apple Fitness 流）
- **休息日 Pause を最初から無料提供**（watchOS 11 と同じ思想）
- **Streak Freeze は手動消費のみがデフォルト**。自動消費する場合は事後通知で透明化（「土曜は Streak Freeze で 7 日継続を保ちました」）
- **煽り通知禁止**: 「ストリークが消えそう！」「Duo が悲しんでいます」型の通知は絶対作らない
- **Calm Mode 切替を初期から構造的に持つ**: 試験 1 週間前にリング・通知・バッジ・遊び心アニメを全 off にできる

## してはいけないこと（アンチパターン）

- ❌ shadcn/ui / Tailwind / Geist / Lucide を shikaq-app に持ち込む（Apple純正から外れる）
- ❌ 装飾的な影・グラデーション・枠線
- ❌ Duolingo 風のキャラクター・イラスト主導デザイン
- ❌ Udemy 風の情報密度（サイドバー詰込み・多数のアクション同時表示）
- ❌ スタディサプリ風の「教育サービス感」（青×白の硬いトンマナ）
- ❌ 固定カラー値（`#000000` 等）直書き、セマンティックカラーを経由しない
- ❌ 時刻連動の背景色変化（Auto Light/Dark Mode と矛盾、System Appearance 尊重）
- ❌ 学習プロセスの公開 SNS シェア強要（学習結果のシェア = LinkedIn Cert Prep Badge は OK）
- ❌ 不正解時の `notification.error`（`notification.warning` を使う）
- ❌ 不正解時の shake / 揺れアニメ（Stripe 流の遊び心は OK だが、shikaq では揺らさない）
- ❌ 進捗バーの後退（Safe Failure Design）
- ❌ 匿名ソーシャルグループ・自動マッチング（招待制のみ）
- ❌ "200-300% 改善" 等の数値マーケコピー（景品表示法リスク、RCT の Cohen's d 0.5-0.9 が rigorous な数字）

## 倫理ルーブリック

新機能・新コピーを実装する前に、`humane-tech-rubric.md` の Four Promises 採点シートを通す:

- Cared For（アクセシビリティ）
- Present（HIG Deference、注意経済を尊重）
- Fulfilled（達成体験、Apple Fitness リング流）
- Connected（任意の学習コミュニティ、強制無し）

採点が3点以下のものは PR レビューで差し戻し or 設計再考。

## WWDC / HIG 主要参照

- [HIG Foundations](https://developer.apple.com/design/human-interface-guidelines/foundations)
- [Designing for iPadOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados)
- [WWDC25 Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
- [WWDC25 Elevate iPad app](https://developer.apple.com/videos/play/wwdc2025/208/)
- [WWDC23 Animate with springs](https://developer.apple.com/videos/play/wwdc2023/10158/)
- [WWDC18 Designing Fluid Interfaces](https://developer.apple.com/videos/play/wwdc2018/803/)
