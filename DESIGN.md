# DESIGN.md — Archify chart design system

**For whom:** any agent or person drawing an Archify chart, and Commander Ben.
**Author:** Benji (read-only consultant). **Date:** 2026-09-21. **Version:** 0.1.1.
**Token source:** `archify/renderers/shared/system-tokens.mjs` v1.2.0.

**Bottom line:** This file is the law for how an Archify chart looks. It names
every colour, size and element, and it says what each one is for. Read it before
you draw. The audit of how far we are from it lives in `docs/design-audit.md`.

## 🎯 Goal

State the design system so a chart can be drawn correctly without asking anyone.

## 🖼️ 1. Visual theme and atmosphere

Archify draws **engineering diagrams, not posters**. The mood is a quiet
instrument panel: dark by default, calm surfaces, one bright thing at a time.

- **Calm ground, loud signal.** Surfaces are near-neutral. Colour is spent on
  wires, node kinds and warnings, never on decoration.
- **Flat, not glossy.** Depth comes from surface lightness, never from shadow.
- **Dense but never cramped.** Every shape keeps its stated clearance.
- **Apple HIG is the parent system.** Card width, gutters and type sizes are
  HIG-derived and already shipped. Do not invent a new ramp.

## 🎨 2. Colour palette and roles — the preset catalog

Every value is a token. **Never write a raw hex in a renderer.**

### A preset is a design trial

Archify offers a chart several looks. **Each one is a trial at answering how an
Archify chart should look.** Apple HIG is trial one, chosen by the Commander on
2026-09-17. It is the reference until a later trial beats it.

**A trial that changes nothing is not a trial.** A preset must differ from the
default, or it is only a name.

### There are two looks, wearing six names

The schema offers six names. Only two of them draw differently.

| Name | Has its own styling | Differs from default | Specs using it | Ruling |
|---|---|---|---|---|
| `classic` | **No block at all.** | It *is* the default | 1 + every undeclared chart | **Keep. Document it as the default.** |
| `signal-flow` | Yes | **0 tokens** | 8 | **Alias. Delete the duplicate block.** |
| `blueprint` | Yes | **0 tokens** | 2 | **Alias. Delete the duplicate block.** |
| `editorial` | Yes | **0 tokens** | **0** | **Delete outright. Nothing uses it.** |
| **`apple-hig`** | Yes | **13 tokens** | 8 | **Trial one. The reference.** |
| `classic-original` | Yes | 34 tokens | 1 | Keep. The original look. |

`[Certain]` — verified by parsing all twelve theme blocks, diffing every token
set against default, and counting `visual_preset` across every spec file.

**`classic` is the default and has no styling of its own.** `cli.mjs:64` reads
`meta.visual_preset || 'classic'`, so every chart that names no preset is
stamped `classic`. No rule matches that name, so it falls through to the plain
theme block. It works by accident, not by design.

**Deleting a name would break charts.** Eight specs ask for `signal-flow` and two
for `blueprint`. So the duplicate styling goes, and the name stays pointing at
the default. Only `editorial` can be removed whole, because nothing asks for it.

### The catalog, per element, per preset

**Apple HIG is the reference.** Where a preset differs from it, that difference
is listed. Dark values shown; light follows in the next table.

| Element | Token | **apple-hig** | default and its three twins | classic-original |
|---|---|---|---|---|
| Page | `--bg` | **`#000000`** | `#010102` | `#020617`. |
| Frame | `--region-fill` | **`#2c2c2e`** | `#2c2c2e` | *absent*. |
| Card | `--mask` | **`#1c1c1e`** | `#2c2c2e` | `#0f172a`. |
| Node kind fill | `--<kind>-fill` | **`var(--mask)`** | `rgba(255,255,255,0.04)` | tinted per kind. |
| Lane | `--lane-fill` | **`rgba(28,28,30,0.65)`** | `rgba(44,44,46,0.65)` | `rgba(15,23,42,0.22)`. |
| Title text | `--text` | `#f2f2f7` | `#f2f2f7` | `#ffffff`. |
| Muted text | `--text-muted` | `#aeaeb2` | `#aeaeb2` | `#94a3b8`. |
| Plain wire | `--arrow` | `#8e8e93` | `#8e8e93` | `#64748b`. |
| Main wire | `--arrow-emphasis` | `#0a84ff` | `#0a84ff` | `#34d399`. |
| Guarded wire | `--security-stroke` | `#ff453a` | `#ff453a` | `#fb7185`. |

Light theme, where the presets agree except on the page:

| Element | Token | apple-hig | default twins | classic-original |
|---|---|---|---|---|
| Page | `--bg` | `#f2f2f7` | `#f5f5f7` | `#f8fafc`. |
| Card | `--mask` | `#ffffff` | `#ffffff` | `#ffffff`. |
| Title text | `--text` | `#000000` | `#000000` | `#0f172a`. |
| Main wire | `--arrow-emphasis` | `#007aff` | `#007aff` | `#059669`. |

### Why apple-hig is the reference

It is the only preset that keeps **three separate surface tiers**.

| | Page | Frame | Card | Three tiers? |
|---|---|---|---|---|
| **apple-hig** | `#000000` | `#2c2c2e` | `#1c1c1e` | **Yes.** |
| default and twins | `#010102` | `#2c2c2e` | `#2c2c2e` | **No. Frame and card are the same.** |

In the default preset a card does not read as a thing sitting on a group,
because it is painted the same colour as the group.

Its second move is the node-kind fills. Apple HIG sets every kind fill to
`var(--mask)`, so a card is its true surface. The other presets wash 4% white
over it, which drifts the delivered colour away from the declared token. That
drift was measured and fixed in SEE-008, **for apple-hig only**.

### Node kinds

Each kind owns a stroke. These are the same in apple-hig and the default twins.

| Kind | Stroke |
|---|---|
| Frontend | `#0a84ff` |
| Backend | `#30d158` |
| Database | `#bf5af2` |
| Cloud | `#ffd60a` |
| Security | `#ff453a` |
| Message bus | `#ff9f0a` |
| External | `#8e8e93` |

**One token, one job.** A token used for two kinds of shape has no correct
value. This is broken by `--mask`, which fills both node cards and edge label
backings. See `docs/design-audit.md`, rule R2.

## 🔠 3. Typography rules

Four roles. Each has a size floor and a contrast floor, measured at 1440x900
against the pixels actually behind the text.

| Role | Size | Contrast | Used for |
|---|---|---|---|
| `primary` | 15px | 7.0 : 1 | Node titles |
| `boundary` | 13px | 4.5 : 1 | Frame titles |
| `context` | 11px | 4.5 : 1 | Node sublabels |
| `edge` | 11px | 4.5 : 1 | Wire labels |

- **These are floors, not targets.** Nothing may render below them.
- **Never shrink type to make words fit.** Grow the card instead. Shrinking is
  the last resort, and only once a card has hit its ceiling.
- Floors live in `archify/renderers/shared/desktop-readability.mjs`.

## 🧩 4. Element stylings

Archify draws eighteen elements. Each is listed with what it is and its rule.

### Surfaces

| # | Element | Rule |
|---|---|---|
| E1 | **Frame** | Four rules. See below. A frame is the hardest element in the system. |
| E2 | **Frame title** | One per frame. Sits on the rail above its members. Never stacked with a neighbour. |
| E3 | **Frame title backing** | Fills with `--region-fill`. Must leave its own title readable. |
| E4 | **Lane box** | A swimlane. May carry a dashed border. Must read without it. |
| E5 | **Lane header** | Names its lane. Must be distinct from the lane body. |
| E6 | **Node card** | 260 by 60 by default. Grows to fit its words. Fills with `--mask`. |
| E7 | **Node stripe** | A 4px bar on the card's left edge, coloured by node kind. |
| E8 | **Security group** | Marks a guarded cluster. Defined but not currently drawn. |
| E9 | **Grid** | An alignment aid. Must never be visible in a delivered chart. |

### E1 in full — a frame has four rules, not one

A frame is a claim that these things belong together. All four must hold.

1. **It wraps its members.** Padding 18px each side. This one passes today.
2. **It does not overlap another frame.** Two frames may nest, one fully inside
   the other. They may never partly cross. A crossing says two groups own the
   same card, which is not a thing.
3. **Its members fill it.** A frame more than half empty is not a group, it is a
   box with things loose in it. Aim for half or better.
4. **It leaves room for its own title.** The title rail above the members is
   34px. Nothing may be placed there.

**Three of the four fail today.** Measured on
`sys003-einvoice-structure.architecture-after.html`:

| Frame | Size | Filled by members |
|---|---|---|
| Accounting | 1251 x 505 | 29.6% |
| Sales | 940 x 420 | 35.6% |
| BUM | 296 x 138 | 38.2% |
| CS Team | 618 x 251 | 40.2% |
| Client and Supplier | 336 x 332 | 42.0% |
| MD | 296 x 219 | 48.1% |

**Four of the fifteen frame pairs cross**, counting only pairs where neither
frame is fully inside the other. Nesting is legal and is not counted. Eleven
pairs overlap in total; seven of those are proper nesting.

**The hand-placed chart is worse, not better.** `einvoice-order-flow-v3`, the
chart both the Commander and Benji called clean by eye, crosses **six of fifteen**
and fills 42.5% to 59.2%.

`[Certain]` — measured by parsing every `structural-frame` rect from both
delivered files and testing each pair for full containment.

**So crossing is not caused by automatic placement.** A human placed every card
in the clean chart and it still crosses six ways. This is a frame fault in its
own right.

**Rule 1 passing is why this looked healthy.** A frame is built from the smallest
and largest edges of its own members, so it wraps them by construction and can
never fail rule 1. The rule it cannot fail was the only rule written down.

### Labels

| # | Element | Rule |
|---|---|---|
| E10 | **Edge label backing** | Tinted from its own wire, and bordered in that wire's colour. |
| E11 | **Edge label text** | Stands 24px clear of every card and every sublabel. |
| E12 | **Message label backing** | Same rule as E10, on a sequence message. |
| E13 | **Activation bar** | 10px wide. Shows how long a participant is busy. |
| E14 | **Node sublabel** | One supporting line under the title. Must fit inside the card. |

### Wires

| # | Element | Rule |
|---|---|---|
| E15 | **Plain wire** | `--arrow`, 1.5px. Head matches the line. |
| E16 | **Strong wire** | `--arrow-emphasis`, 1.8px. Head matches the line. |
| E17 | **Dashed wire** | Must differ from E15 by more than its dashes. |
| E18 | **Arrowhead** | 10 by 7. Points within 30 degrees of the way the wire travels. |

**Corner radius carries meaning.** A card takes 6. A label takes 3. Solid
against floating. **One radius per element, everywhere.**

## 📐 5. Layout principles

Every number here is a token. None of them is a guess.

| Value | Size | Why |
|---|---|---|
| Card | 260 x 60 | HIG six-column grid card width |
| Empty gutter | 40 | HIG pairing with a 260 card |
| Corridor | 16 | Room for a wire to pass |
| Through-route gutter | 56 | Empty gutter plus corridor |
| Frame padding | 18 each side | Shipped value |
| Frame title above members | 34 | Grouping rail |
| Frame title below frame top | 14 | Ownership rail, 34 to 14 is about 2.4 to 1 |
| Wire to frame edge | 16 | Target, above the 12 floor |
| Arrowhead tip to card | 8 | Target, above the 6 floor, or 5x stroke if larger |
| Label to any shape | 24 | Nearness floor |

- **A frame asks for its own room.** It never accepts leftovers.
- **Frames nest or separate. They never cross.**
- **A frame is at least half filled by its members.**
- **The page fits the drawing.** A page bigger than what it holds is a fault.
- **Left and right page margins match** to within 5% of the page width.

## 🪜 6. Depth and elevation

**There are no shadows.** Depth is surface lightness only, in three tiers:
page, then frame, then card.

- Touching surfaces must differ by a colour distance of at least 1.0.
- Surfaces apart from each other must still differ by at least 1.0, measured
  10px in from any edge, **ignoring the border**.
- **A border may separate. It may never be the thing carrying the meaning.**
  Take the border away and the chart must still read.

## ✅ 7. Do's and don'ts

**Do**

- Grow a card to fit its words.
- Give every backing the colour of what it belongs to.
- Keep one job per token.
- Draw one element with one helper, so it has one place to fix.
- Let a frame ask for its room before the cards are packed.

**Don't**

- **Don't shrink type to make words fit.** Grow the card.
- **Don't erase a wire to make room for its own label.** The label sits on the
  wire; it does not delete it.
- **Don't use one token for two kinds of shape.**
- **Don't make meaning rest on a single signal.** A dashed wire that differs
  from a plain wire only by its dashes is not distinct.
- **Don't rely on a border to separate surfaces.**
- **Don't write a rule an element cannot fail.** A clause that is true by
  construction is not a standard, it is decoration. Every rule here must be
  able to come out false.
- **Don't hand-place cards to make a chart look right.** A chart that only works
  when a human positions every card is not generated.
- Don't write a raw hex, size or gap in a renderer. Use a token.

## 📱 8. Responsive behaviour

A chart must hold up in **two themes and two sizes**. All four are tested.

| | |
|---|---|
| Themes | dark and light |
| Reference size | 1440 x 900 |
| Large size | 2048 x 1320 |
| Reader minimum | 960 wide, 930 of it diagram |

- Type floors are measured **as projected at the reader minimum**, not as
  authored. A 15px title in a wide chart can land under the floor once scaled.
- Both themes carry the same three-tier surface order. Light inverts the
  lightness, never the order.

## 🤖 9. Agent prompt guide

Paste this when asking an agent to draw or fix an Archify chart.

```
Follow DESIGN.md at the archify root.

Surfaces, three tiers, dark: page #010102, frame #2c2c2e, card #2c2c2e.
Light: page #f2f2f7, frame #f5f5f7, card #ffffff.
Wires: plain #8e8e93, main #0a84ff, guarded #ff453a.
Type floors at 1440x900: title 15px at 7:1, frame title 13px at 4.5:1,
sublabel and wire label 11px at 4.5:1.
Card 260x60, gutter 40, corridor 16, frame padding 18, label clearance 24.
Card radius 6, label radius 3.

Never shrink type to fit — grow the card.
Never erase a wire to seat its own label.
One token, one job.
A border may separate; it may never carry the meaning.
Never hand-place cards.
```

## 🔬 10. Conformance — which check enforces which clause

This is the part most design systems cannot offer. **Twenty-one checks already
run against every chart** (18 geometry, 3 colour). A clause with a check is
enforced. A clause without one is only a wish.

| Clause | Enforced by |
|---|---|
| Frame holds its members | A7. |
| Frames do not cross each other | A16. |
| A frame is at least half filled | A17, container frames only. |
| A frame title is not stacked on a neighbour | **Nothing.** |
| Wire keeps clear of a frame edge | A9. |
| Gaps inside a frame are balanced | A14. |
| Page margins match left to right | A13. |
| Page is filled by its drawing | A6. |
| Node title fits its card | A2. |
| Label stands clear of every shape | A15. |
| Label does not overlap a shape | A3. |
| Label stays on its own wire | A4. |
| Head points the way of travel | A12. |
| Head seats on its target | A5, A10. |
| Every wire drawn once | A11. |
| Type floors hold | O1a. |
| Touching surfaces separate | P1. |
| Surfaces separate without a border | P2. |
| Painted colour matches its token | P3. |

**One frame clause above still has no check:** a frame title stacked on a
neighbour. A16 FRAME_CROSSING and A17 FRAME_FILL were written 2026-09-17 in archify commit 3e132e9 and first ran 2026-09-20; they now close the other two.

A17 judges container frames only. Lanes, exception-lanes and stages are
routing corridors — you pass through them, you do not fill them — and they
measured 6-18% fill against a floor borrowed from A6's container leg. That
borrowing was the defect, not the charts. Corridor-kind frames now answer NA.
On container charts A17 still discriminates: einvoice-order-flow-v3 reports
frame "MD" at 42.5% fill against the 50% floor, and A16 on the same chart
reports "Sales" crossing "Accounting" at 7348.21px2.

**Seven elements have no check at all:** E5, E7, E9, E10, E12, E13, and telling
E17 from E15. Those clauses are wishes until someone builds the check.

**The audit was measured on an older ruler.** `docs/design-audit.md` was measured on a 16-check ruler while today's ruler emits 18 assertions (A1-A17 + O1a), so every FAIL/PASS/GAP tally in the audit predates A16 and A17.

That audit reports 15 FAIL / 2 GAP / 11 PASS, which omits 2 UNUSED (E8 security-group, E9 grid) — 30 items, 28 accounted.

## 📚 Companion files

| File | What it is |
|---|---|
| `docs/design-audit.md` | How far today's charts are from this law |
| `docs/design.html` | The audit with every element photographed |
| `docs/preview.html` | This system rendered, light |
| `docs/preview-dark.html` | This system rendered, dark |

**This is a draft.** Clauses drawn from outside standards are unverified until
someone fetches the source. Clauses that are one person's taste are marked in
the audit and need the Commander's ruling.
