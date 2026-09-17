---
version: v0.1.1
name: Onesimus Mesh Design System — Apple HIG Baseline
updated: 2026-08-26
node: ALIENBEN
supersedes: v0.1.0
normative-examples:
  - http://192.168.0.80:9097/samples.html              (dark, pinned — Apple HIG SF Pro)
  - http://192.168.0.80:9097/samples-light.html        (light, pinned — Apple HIG SF Pro)
  - http://192.168.0.80:9097/stitch-baseline-light.html (light, Stitch — Inter/Tailwind, baseline for modification)
  - http://192.168.0.80:9097/stitch-baseline-dark.html  (dark, Stitch — Inter/Tailwind)
  - http://192.168.0.80:9097/stitch-baseline-mobile.html (mobile, bento)
served-at: http://192.168.0.80:9097/DESIGN.md
---

# 🎨 Onesimus Design System — Apple HIG Baseline

> **Goal:** every app and tool UI on `D:\Onesimus` and `D:\OSM-KKSE` is now one product — one Apple HIG design system.
> **Baseline:** Apple HIG (macOS + iOS 26) + Apple.com marketing language. **One accent per screen.**
> **How to adopt:** copy the pinned `:root` block from `samples.html` (dark) or `samples-light.html` (light). Build only with those variables. The samples are the reference. If a sample and this doc disagree, the sample wins — fix this doc.
**For whom:** every agent or developer building any UI on the Onesimus mesh — ALIENBEN, KKSE, and future nodes.

## 🧱 Structure — Two Layers Only

| Layer | Token | Light | Dark | Used for |
|---|---|---|---|---|
| Page background | `--background` | `#f5f5f7` | `#010102` | body |
| Surface | `--surface` | `#ffffff` | `#1c1c1e` | window, cards |
| Raised surface | `--surface-raised` | `#ffffff` | `#2c2c2e` | popovers, sticky glass |

Rule: content sits on surfaces. The background holds nothing interactive. Both modes share one structure (this replaces the old dark/light body split).

## 🎨 Color Tokens

**System palette — always adaptive pairs, never hard-code one mode.**

| Token | Light | Dark |
|---|---|---|
| red | `#ff3b30` | `#ff453a` |
| orange | `#ff9500` | `#ff9f0a` |
| yellow | `#ffcc02` | `#ffd60a` |
| green / success | `#34c759` | `#30d158` |
| mint | `#00c7be` | `#32d74b` |
| teal | `#5ac8fa` | `#64d2ff` |
| **blue / tint** | `#007aff` | `#0a84ff` |
| indigo | `#5856d6` | `#5e5ce6` |
| purple | `#af52de` | `#bf5af2` |
| pink | `#ff2d55` | `#ff375f` |
| brown | `#a2845e` | `#ac8e68` |
| gray ladder | `#8e8e93` `#aeaeb2` `#c7c7cc` `#d1d1d6` `#e5e5ea` `#f2f2f7` | `#8e8e93` `#636366` `#48484a` `#3a3a3c` `#2c2c2e` `#1c1c1e` |

**Text & lines**

| Token | Light | Dark |
|---|---|---|
| `--label` (and icon glyphs) | `#000000` | `#ffffff` |
| `--secondary` | `#3c3c43` (60%) | `#ebebf5` (60%) |
| `--tertiary` | `#98989d` | `#6e6e73` |
| `--separator` | `rgba(60,60,67,0.12)` | `rgba(84,84,88,0.65)` |
| `--hairline` | `rgba(60,60,67,0.12)` | `rgba(255,255,255,0.08)` |
| `--hairline-strong` | `rgba(60,60,67,0.18)` | `rgba(255,255,255,0.12)` |

**Accent roles — this fixes the three-blues drift. Never swap these roles.**

| Role | Token | Light | Dark | Where |
|---|---|---|---|---|
| Interactive tint (links, active tabs, selection) | `--tint` | `#007aff` | `#0a84ff` | anywhere |
| Primary CTA fill (max ONE per screen) | `--cta` | `#0066cc` | `#0a84ff` | Done/Save only |
| CTA tint wash | `--cta-tint` | `rgba(0,102,204,0.08)` | `rgba(10,132,255,0.15)` | selected cards, tinted glass |

## 🫧 Liquid Glass (iOS 26 / macOS 26) — Stitch white (no grey)

- `regular`: `backdrop-filter: blur(20px) saturate(160%)`. Bg: `rgba(255,255,255,0.88)` light / `rgba(28,28,30,0.88)` dark — **white glass, not grey** (was 0.72, now 0.88 to avoid grey mix on #f5f5f7). Floating chrome only: titlebar 52px, tab bar 49px, sidebars, alerts. No traffic lights.
- `clear`: `blur(12px) saturate(180%)`. Bg: `rgba(255,255,255,0.18)` light / `rgba(0,0,0,0.35)` dark — **18% white, not 8%** (was invisible on white). Rich media only. Media bright? Keep `rgba(0,0,0,0.35)` dim layer behind clear.
- Never inside the content layer. No glass cards. Lifted glass gets an `inset 0 1px rgba(255,255,255,0.18)` highlight and a soft shadow. Plain cards stay flat with hairlines. Window `overflow:visible` (not hidden) to avoid sticky clip.

## ✍️ Typography

Inter primary (Tailwind) + SF Pro fallback (`-apple-system` → Inter +0.02 line-height). SF Mono for code. Vision-readable: eyebrows and hex use secondary, not tertiary.

| Role | Spec |
|---|---|
| Display / h1 | 28px / 600 / −0.6px (marketing hero: 56px / 600) |
| Headline / h2 | 20px / 600 |
| Body | 14–16px / 400 / −0.05px, max 65ch |
| Caption / eyebrow | 12px / 600 uppercase +0.6px letter-spacing, color secondary (was 11px tertiary — vision fix) |
| Mono | SF Mono 11px / 500 secondary for hex (was 10px tertiary) |

## 🔣 Icons — SF Symbols Semantics

**Locked: 24px, weight 600 (semibold). Color: `--label` — blackest on light, whitest on dark. Center glyphs optically.** In dense 13px rows, step weight down one level. Interactive icons need ≥44px hit targets and alt text. Map: scissors `✂`, duplicate `⧉`, copy `⎘`, check `✓`, close `✕`, trash `🗑`, add `+`, search `🔍`.

## 📐 Spacing · Radius · Layout

- 8px base grid: `xs 8 · sm 12 · md 16 · lg 24 · xl 32 · section 96`.
- Radius: inputs/buttons `8` · cards `12` · panels `16` · **primary CTA = pill `9999`** · swatch `12`.
- Breakpoints (ABEN fleet): `393` iPhone → window `12px` margin `12px` radius `wrap 16px` `swatches 2col` → `1920` container max 1200 → `2560` container max 1400. (was `margin 0 radius 0` — fixed side no spacing)
- Window chrome: `52px` titlebar (`` glass regular `relative`, not sticky) + `49px` tab bar (`relative`, `All` 11px 700 tint + 8% CTA-tint pill + 2px underline). **No traffic lights.**

## 🧩 Components

- **Button primary:** pill, `--cta` fill, white text, `padding 8px 14px+`. **Glass button:**  glass regular + hairline-strong border. **Thin button:** `--surface-raised` + hairline.
- **Card:** `--surface`, r12, hairline, `padding 16px`. Light mode adds shadow `0 1px 4px rgba(0,0,0,0.06)`. Dark mode: no drop shadows. Featured cards: `--cta-tint` wash + `rgba(--cta,0.15)` border.
- **Pill/badge:** r9999, 12px; status = success/danger/warning tokens only.
- **Table/list rows:** hairline separators, `--label` name + `--secondary` meta, mono for IDs/schedules.

## ✅ Do / ❌ Don't

- DO: adapt every color by mode. One `--cta` per screen. Glass only on floating chrome. Imagery carries drama; chrome recedes.
- DON'T: hard-code one mode's hex. No glass in content cards. No second accent hue. No `--tertiary` on glass. Never skip the 35% dim over bright media.

## 📦 Adoption Contract (all apps/tools, both roots)

1. SSOT = this file. It lives at `D:\Onesimus\docs\design.md` and is served at `/DESIGN.md`.
2. Copy the pinned `:root` block from the matching sample page. Verbatim. No local re-invention. No third accent. No other icon size.
3. Build new surfaces from the recipes above. Deviating? Bump the version here first.
4. Extras like charts or terminals may add new *tokens*. Never raw literals.

**Version history:** v0.1.1 (2026-08-26). Stitch baselines (Inter/Tailwind  glass, 12px 600 secondary, 393 12px margin, Stitch desktop/mobile). v0.1.0 (2026-08-26). Unified mesh-wide from task-dashboard v0.1.8. Fixes: accent-role split; icon spec (was 22/24/13px, now 24px/600); undefined `--accent-light`; mode-split page surfaces; stale banners. Supersedes: `tools/task-dashboard/DESIGN.md`, `ledger/inbox/DESIGN.md`, `docs/old/DESIGN.md`.
