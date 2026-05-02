# codex:codex-rescue 依頼文の骨格

新画面の image-2 生成を `codex:codex-rescue` subagent に依頼するときのテンプレート。`<...>` は埋める。

---

shikaq の「<画面名>」画面を image-2 で生成する。Home 画面 `/Users/kotaishida/projects/personal/shikaq/.stitch/designs/home-desktop-final.png` と揃ったデザイン言語・サイドバー・トーンで。

## やること

1. Codex CLI (`codex exec`) を起動
2. **Codex 組み込みの `image_gen` edit パスを使う**（OpenAI API 直叩きは sandbox DNS でブロックされる。Home 参照画像を conversation context にロードして image-2 の edit として通すルートを使う。`client.images.edit` 直叩きや `gpt-image-2` CLI は `APIConnectionError` で落ちる）
3. 以下のファイルを Codex に読ませる:
   - `/Users/kotaishida/projects/personal/shikaq/.stitch/prompts-screens.md` ← §共通プリアンブル と §<番号> <画面名> を使う
   - `/Users/kotaishida/projects/personal/shikaq/.stitch/designs/home-desktop-final.png` ← 参照画像
4. 「共通プリアンブル + §<番号>」を結合したプロンプトで生成
5. `/Users/kotaishida/projects/personal/shikaq/.stitch/designs/<screen-slug>-<form>-final.png` に保存
6. ファイル確認し、パスとサイズを報告

## 注意

- MacBook ブラウザ枠込み（または対象フォーム）、日本語 UI、オフホワイト背景、Home と同じ左サイドバー
- <画面固有の重要な制約 1-2 行>
- 追加の要素指定は勝手に足さない（プロンプトファイル記載の方向性ベースを尊重）

## 返す内容

- 保存先パスとサイズ
- 使った生成パス（どの方法が通ったか）
- 警告・エラーがあればそれも

---

## 失敗時のリトライ依頼テンプレ

前回 OpenAI API への DNS が通らず `APIConnectionError` で落ちた、別 agent が **Codex 組み込みの `image_gen` edit パス** で成功している、というコンテキストを最初に与えた上で、上のテンプレートを再投入する。同じ agent に SendMessage で続けるより、新規 agent を立てて成功手段を明示する方が速い。
