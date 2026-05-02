# Design System: Que

**Project:** Que — Japanese certification study app
**Stitch Project ID:** `16596896957741615778`
**Design System Asset ID:** `assets/17342615687936833569`
**Design Philosophy:** "If Apple made a certification study app." Calm, premium, content-first.

> 詳細は `/Users/kotaishida/projects/personal/que/.claude/rules/design-principles.md` を参照。このファイルは Stitch での生成・編集に特化した短縮版。

---

## 1. Visual Theme & Atmosphere

- **Vibe:** Apple News+ on iPadOS 26. Premium, calm, content-first. Spacious.
- **Mood:** スタバのテーブルに開いた厚い参考書の、静かで集中した空気。教育アプリ感／マーケ感を排除。
- **Hierarchy:** Z-axis depth via Liquid Glass chrome + opaque white content cards.

## 2. Color Palette & Roles

**Semantic system tokens (iOS-style):**

| Token | Hex | Role |
|---|---|---|
| label | #000000 / rgba(0,0,0,.85) | Primary text |
| secondaryLabel | rgba(60,60,67,.60) | Meta text, captions |
| systemGroupedBackground | `#F2F2F7` | Scene background |
| systemBackground | `#FFFFFF` | Cards, sheets |
| systemBlue (primary) | `#007AFF` | Primary accent, CTAs, links |
| systemGreen | `#34C759` | Correct / success |
| systemRed | `#FF3B30` | Wrong / error |
| systemOrange | `#FF9500` | Streak flame |
| hairline border | `#E5E5EA` @ 60% opacity | Card edges (no drop shadow) |

**Per-certification tinted glass accents** (used as subtle card backdrop only, never body text color):

| Certification | Tint Hex |
|---|---|
| ITパスポート | `#64D2FF` (soft teal) |
| 基本情報技術者 | `#5E5CE6` (indigo) |
| SPI | `#FFD60A` (amber) |
| 簿記2級 | `#FF375F` (rose) |

> 対象資格は可変（2026-04-25 時点で4種）。秘書検定・応用情報はスコープ外。

## 3. Typography Rules

- **Primary (native runtime):** SF Pro Display / SF Pro Text
- **Canvas fallback (Stitch):** Inter
- **Japanese fallback:** Hiragino Sans (ヒラギノ角ゴ)
- **Weights allowed:** Regular, Medium, Semibold. NEVER Bold/Black.
- **Scale (iOS Dynamic Type):**
  - Large Title 34pt semibold — screen titles
  - Title 2 22pt semibold — section headings
  - Headline 17pt semibold — card titles
  - Body 17pt regular — main text
  - Callout 16pt — choices
  - Footnote 13pt — meta, captions
  - Caption 1 12pt — supplementary

## 4. Component Stylings

- **Buttons:** Primary = pill (fully rounded), systemBlue fill, white 17pt semibold, 14pt vertical / 24pt horizontal padding. Secondary = glass/outline.
- **Cards:** Pure white `#FFFFFF`, 12pt radius, 1px hairline border `#E5E5EA` @ 60% opacity, NO drop shadow.
- **Tab Bar / Nav Bar / Sheets:** Liquid Glass — frosted translucent, floating on content. NEVER glass-on-glass.
- **Icons:** SF Symbols outlines only. Examples: `house.fill`, `book.fill`, `questionmark.circle`, `sparkles`, `flame.fill`, `play.fill`, `waveform.circle.fill`.
- **Streak capsule:** Small pill with `flame.fill` + count on tinted orange @ 12% opacity.
- **Activity Rings:** Apple Fitness 3-ring style, concentric. Sizes: ~130px (iPad), ~100px (iPhone). Blue = 問題数, Green = 正答率, Orange = 学習時間.

## 5. Layout Principles

- **iPad landscape:** 3-column NavigationSplitView (Sidebar 260px + Center flex + Detail 300px).
- **iPad portrait & iPhone:** Bottom tab bar navigation with Liquid Glass container.
- **Spacing:** 24pt between content blocks, 16pt between paired items, 20pt horizontal scene padding on phone.
- **Content-first:** Never crowd. Whitespace is the hero.
- **Tab bar:** 5 tabs — Home (house.fill) / Learn (book.fill) / Practice (questionmark.circle) / AI (sparkles) / Profile (person.crop.circle).

## 6. Screen → Apple Native Mapping

| Que screen | Apple native reference | Key pattern |
|---|---|---|
| Home / Today | Apple News+ (Today tab) | Full-bleed featured + density feed |
| Course library | Apple Books | Horizontal shelves + cover cards |
| Lesson list | Apple Podcasts | Episode cards + progress bars |
| Video player | Apple Music | Persistent mini-player |
| Question drill (focus) | Journal | Max whitespace, centered text |
| CBT mode | Reminders | Column kanban + completion anim |
| Summary / stats | Fitness | 3 concentric rings + streak |
| AI Q&A | Journal | Inline prompts + reverse-chron cards |
| Night audio quiz | Apple Music Now Playing | Artwork + waveform + play |
| Playground (FE) | Swift Playgrounds | Editor / result split |

## 7. Forbidden (anti-patterns)

- ❌ shadcn/ui / Tailwind utility look / Geist / Lucide-style visuals
- ❌ Duolingo mascots / heavy illustrations / cartoons
- ❌ Udemy-style dense sidebars / marketing clutter
- ❌ StudySapuri-style stiff corporate blue-white
- ❌ Decorative gradients, heavy drop shadows, gimmicky borders
- ❌ Emojis in UI chrome
- ❌ Photographs of people

## 8. Tone of Voice

- Polite Japanese, short verbs: 始める / 続ける / 確認する
- No exclamation marks. No cheerleading.
- Treat the user like a peer studying a premium textbook.

---

## Generated Screens (progress)

- ✅ **`designs/home-desktop-final.png`** — **採用: Home/Today デスクトップ画面**（Codex + image-2 生成、2026-04-25 確定）
- 📁 `designs/home-iphone.html` / `.png` — Stitch版 iPhone 15 Pro モック（参考保管）
- 📁 `designs/home-ipad.html` / `.png` — Stitch版 iPad landscape モック（参考保管）
- 📁 `designs/home-desktop.html` / `.png` — Stitch版 desktop モック（参考保管）
- ✅ `designs/learn-desktop-final.png` — コース一覧（Apple Books 方式、2026-04-25）
- ✅ `designs/practice-desktop-final.png` — 問題演習（Apple Journal 方式、2026-04-25）
- ✅ `designs/summary-desktop-final.png` — 学習サマリー（Apple Fitness 方式、2026-04-25）
- ✅ `designs/ai-qa-desktop-final.png` — AI Q&A（Apple Journal 方式、2026-04-25）
- ✅ `designs/audio-desktop-final.png` — 夜の音声解説クイズ（Apple Music Now Playing 方式、2026-04-25）
- ✅ `designs/playground-desktop-final.png` — Playground（Swift Playgrounds 方式、2026-04-25）
