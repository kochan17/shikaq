# MdxRenderer 手動確認サンプル

以下の Markdown を `MdxRenderer` の `markdown` prop に渡して確認する。

---

## 基本構文

```markdown
# 見出し H1 (32pt)

## 見出し H2 (24pt)

### 見出し H3 (20pt)

本文テキスト 17pt。**強調は font-weight 600**、*イタリック*、`インラインコード`。

リンクは [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/) をタップして外部ブラウザで開く。http/https のみ許可し、javascript: は無視される。

---

## リスト

- 箇条書き A
- 箇条書き B
  - ネスト
- 箇条書き C

1. 番号付き A
2. 番号付き B
3. 番号付き C

---

## 引用

> 通常の引用ブロック。左に 3px separator カラーの縦線、背景 secondarySystemBackground。

---

## コードブロック

```python
def greet(name: str) -> str:
    return f"Hello, {name}"
```

---

## 画像

![alt text](https://developer.apple.com/design/human-interface-guidelines/images/intro/overview/design-foundations-overview_2x.png)
```

---

## カスタム Callout

各 callout は `> [!variant]` の 1 行目でトリガーされ、後続の `> ` で始まる行が本文になる。

### ヒント (systemBlue)

```markdown
> [!hint]
> セキュリティ用語は語源で覚えると忘れにくいです。
> 例えば "encryption" は "in crypt（暗号の中に入れる）" が語源です。
```

期待: 青い左縦線、`info` アイコン、「ヒント」ラベル

---

### 警告 (systemOrange)

```markdown
> [!warning]
> 試験では用語の**正確な定義**が問われます。
> 似た言葉でも定義が異なる場合は要注意です。
```

期待: オレンジの左縦線、`warning` アイコン、「注意」ラベル

---

### 過去問 (資格別 tint / ExamCallout)

```markdown
> [!exam] 令和5年 春期 問15
> 次のうち、対称鍵暗号方式に該当するものはどれか。
```

`certificationKey="fe"` を渡すと `fe` カラー (#5E5CE6) でレンダリングされる。
省略時は systemBlue。`過去問 令和5年 春期 問15` のバッジが表示される。

---

## 複合パターン (混在)

```markdown
暗号化の基本について学びます。

> [!hint]
> AES は **対称鍵暗号**の代表例です。

### 問題

> [!exam] 令和4年 秋期 問12
> AES の鍵長として正しいものを選べ。

> [!warning]
> RSA と混同しやすいので注意。

次のセクションでは公開鍵暗号を扱います。
```

期待: hint → (markdown の `### 問題`) → exam callout → warning callout → (残り markdown) の順に表示される。

---

## 確認手順

1. `shikaq-app/App.tsx` (または任意のデバッグ画面) に以下を追加:

```tsx
import { MdxRenderer } from './components/MdxRenderer';
import { View } from 'react-native';
import { SAMPLE } from './components/MdxRenderer.test-manual'; // サンプル文字列を別定数化する場合

// または直接
<View style={{ flex: 1, padding: 16 }}>
  <MdxRenderer
    markdown={sampleMarkdown}
    certificationKey="fe"
  />
</View>
```

2. `npm run web` / Expo Go でレンダリング確認
3. iOS Simulator で SF Pro フォント・Callout レイアウトを確認
