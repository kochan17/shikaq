# Humane Tech Rubric

> Center for Humane Technology の **Four Promises** を Que の設計判断に組み込むための採点シート。
> 出典: https://www.buildinghumanetech.com/ / https://www.humanetech.com/

新機能・新コピー・新通知・新インセンティブを実装する前に、このルーブリックを通す。
合計 16 点満点、**13 点未満は PR レビューで差し戻し** or 設計再考。

---

## Promise 1: Cared For（気にかけられている）

> ユーザーは自分の限界・状態・状況を尊重されていると感じるか。

| 項目 | 0 点 | 2 点 | 4 点 |
|---|---|---|---|
| アクセシビリティ | Reduced Motion / Dynamic Type / VoiceOver 全部未対応 | 一部対応 | 全部対応 + Calm Mode 切替可 |
| 失敗の安全性 | 不正解で「ペナルティ」演出 | 不正解で淡々と次へ | Safe Failure Design 完全実装（進捗後退無し / 揺れ無し / `notification.warning`） |

---

## Promise 2: Present（今、ここに）

> ユーザーは「もっと使え」「離れるな」と圧迫されないか。HIG Deference を体現できているか。

| 項目 | 0 点 | 2 点 | 4 点 |
|---|---|---|---|
| 通知の質 | 1 日 3 通以上 / 煽り型 / 罪悪感型 | 1 日 1〜2 通 / 中立コピー | 1 日 1 通 / 招待制 / Calm Mode で完全 off 可 |
| バッジ・実績の押し付け | プッシュ通知でバッジ告知 / モーダル占有 | 取得時のみ静かに表示 | プル型（Awards タブ開かない限り見えない） |
| Liquid Glass の使用 | 問題文・解説の背後に適用 | コンテンツ周辺に適用 | Chrome only（Tab Bar / Nav / Toolbar / Sheet のみ） |

---

## Promise 3: Fulfilled（充たされている）

> 短期的な engagement ではなく、長期的な達成感を提供できるか。

| 項目 | 0 点 | 2 点 | 4 点 |
|---|---|---|---|
| 指標の honesty | レッスン起動回数 / アプリ open 数で計測 | 学習時間で計測 | **Mastery-anchored**（正答数 / 習熟度）で計測 |
| 報酬の構造 | Black Hat（Scarcity / Loss）中心 | Black Hat 補助 + White Hat 主軸 | White Hat 中心（Epic Meaning / Accomplishment / Empowerment）+ Black Hat ほぼ無し |

---

## Promise 4: Connected（つながっている）

> ソーシャルは強制でなく、自分から望んだ繋がりだけが提供されるか。

| 項目 | 0 点 | 2 点 | 4 点 |
|---|---|---|---|
| ソーシャル設計 | 匿名グループ自動マッチング / 公開 SNS バイラル設計 | opt-in リーダーボード | 招待制のみ（1〜3 人）/ Apple Activity Sharing 流の覗き見 |
| シェア機能 | 学習プロセス強制シェア | 控えめなシェアボタン | 結果（合格バッジ）のみシェア / 学習プロセスは LINE / プライベート前提 |

---

## 採点運用

- 各 Promise の合計 4 点満点 × 4 = **16 点満点**
- 13〜16 点: 採用 OK
- 10〜12 点: PR レビューで議論、要改善
- 9 点以下: 設計再考、ボツ候補

## 例外運用（Tier 2 違反）

`design-principles.md` Tier 2 ルール（リング数段階 / 通知数 / 招待制 / Phase 1 計測 1 つ等）を破る時は、本ルーブリックを満点近くで通したエビデンスをコミットメッセージか PR description に残す。

## 参考

- [Center for Humane Technology - Four Promises](https://www.buildinghumanetech.com/)
- [Building Humane Technology Course](https://www.humanetech.com/course)
- [Tristan Harris - Time Well Spent (origin)](https://www.humanetech.com/the-cht-perspective)
- [FTC/ICPEN/GPEN Dark Patterns Sweep 2024 (76% finding)](https://www.ftc.gov/news-events/news/press-releases/2024/07/ftc-icpen-gpen-announce-results-review-use-dark-patterns-affecting-subscription-services-privacy)
