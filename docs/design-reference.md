# Archify Design Reference — every element, named, with its rule and its owner

**For whom:** Commander Ben, and any worker seat ruling on a visual fault.
**Author:** Benji (read-only consultant). **Date:** 2026-09-16.
**Version:** 0.1.0 — draft. Nothing here is agreed until the review below closes.

**Bottom line:** Archify draws **eighteen kinds of element**. Four of them have a
name. Nineteen checks exist and they cover eleven elements, which leaves **seven
elements that nothing measures**. Four faults the Commander found by eye this
month all sit in that unowned group. This page names every element, states one
rule for it, and says which check owns it.

## 🎯 Goal

Name every element, so a visual fault can be judged against a written rule
instead of being re-argued from a screenshot.

## 🏛️ Where "good" comes from

Every rule carries a tier. The tier is the honest answer to "says who".

| Tier | Source | Can you check it? |
|---|---|---|
| **T1** | A published outside standard. | Yes. Someone else agreed the number. |
| **T2** | A floor this programme already enforces. | Yes. It is in our code today. |
| **T3** | Our best chart, measured. | Yes. It is a witness, not an authority. |
| **T4** | Benji's judgement. | **No.** It is taste. Cheap to overrule. |

**T3 is `einvoice-order-flow-v3`.** Both the Commander and Benji called it clean
by eye. Where no standard covers a question, that chart is the evidence.

**T1 rows are written from memory, offline, and marked UNVERIFIED.** Nobody has
fetched the source documents yet.

## 🔢 The nineteen checks we already own

These exist and run today. This page ties every element to one of them.

| Check | Name | Judges |
|---|---|---|
| A1 | HEADER_TRANSIT | The header band. |
| A2 | TEXT_CONTAINMENT | Node title inside its card. |
| A3 | LABEL_COLLISION | Edge label overlapping a shape. |
| A4 | LABEL_ORPHAN | Edge label drifting off its own wire. |
| A5 | ARROWHEAD_DOCK | Where a head lands. |
| A6 | INK_OCCUPANCY | How much of the page holds drawing. |
| A7 | CONTAINMENT | Frame holding its members. |
| A8 | LAYOUT_SPREAD | How cards are spread. |
| A9 | ROUTE_TO_FRAME_CLEARANCE | Wire against frame edge. |
| A10 | ARROWHEAD_DOCKING | Head seating on its target. |
| A11 | EDGE_CONSERVATION | Every wire drawn once. |
| A12 | ARROWHEAD_DIRECTION | Head pointing the way of travel. |
| A13 | MARGIN_BALANCE | Left page gap against right. |
| A14 | INTERNAL_BALANCE | Gaps inside a frame. |
| A15 | LABEL_CLEARANCE | Edge label standing clear of shapes. |
| O1a | READABILITY_FLOORS | Text big enough to read. |
| P1 | SURFACE_SEPARATION | Touching surfaces telling apart. |
| P2 | STRUCTURE_WITHOUT_BORDER | Far surfaces telling apart. |
| P3 | DECLARED_VS_DELIVERED | Painted colour matching the token. |

`[Certain]` — verified by reading the roster at `scripts/geometry-assert.mjs:1401`.

## ⚠️ P2 settles the border question, and not the way I said

Yesterday I told the Commander that boxes having no border is a fault. **P2 shows
it is a deliberate principle.**

P2 samples colour in the far bands, at least ten pixels from an edge, and
**ignores the hairline on purpose**. It then demands that the surfaces alone tell
the shapes apart.

`[Certain]` — verified by reading `scripts/colour-assert.mjs:378-379`.

So the house rule is: **structure must read even with no border at all.** A
border is allowed as decoration. It may never be the thing carrying the meaning.

That does not block the Commander's rule. Adding a border is additive and P2 goes
on passing. But the rule has to be written as *"a border may be added for
separation"*, never as *"a border is required"*, or it contradicts a check we
already enforce.

## 📇 The full element list

Eighteen kinds. The name column is what each one **should** be called. Bold means
the name exists today; plain means Benji is proposing it.

### Surfaces

| # | Element | Name | Drawn at | Owned by |
|---|---|---|---|---|
| E1 | Frame | **`structural-frame`** | arch 1033 | A7, A9, A14, P1, P2 |
| E2 | Frame title | **`structural-frame-label`** | arch 1038 | A2 |
| E3 | Frame title backing | **`structural-frame-label-mask`** | arch 1039 | P3 |
| E4 | Lane box | `lane-box` | `.c-lane` 5171 | A3 |
| E5 | Lane header | `lane-header-mask` | workflow 682 | **nothing** |
| E6 | Node card | `node-card-mask` | 5 renderers | A2, A8, P1 |
| E7 | Node stripe | `node-accent-bar` | `.c-accent` | **nothing** |
| E8 | Security group | `security-group` | `.c-security-group` | P1 |
| E9 | Grid | `grid` | `.c-grid` | **nothing** |

### Labels

| # | Element | Name | Drawn at | Owned by |
|---|---|---|---|---|
| E10 | Edge label backing | `edge-label-mask` | 5 renderers | **nothing** |
| E11 | Edge label text | **`segment-label`** | 5 renderers | A3, A4, A15 |
| E12 | Message label backing | `message-label-mask` | sequence 344 | **nothing** |
| E13 | Activity bar | `activation-bar` | sequence 354 | **nothing** |
| E14 | Node sublabel | `node-sublabel` | 5 renderers | A3, A15 |

### Lines

| # | Element | Name | Drawn at | Owned by |
|---|---|---|---|---|
| E15 | Plain wire | `a-default` | 5 renderers | A9, A11, A12 |
| E16 | Strong wire | `a-emphasis` | 5 renderers | A9, A11, A12 |
| E17 | Dashed wire | `a-dashed` | 5 renderers | **nothing tells it from E15** |
| E18 | Arrowhead | `m-default` and three twins | template 5528 | A5, A10, A12 |

**Seven elements have no check at all.** E5, E7, E9, E10, E12, E13, and the
telling apart of E17.

`[Certain]` — verified by reading every `class="c-mask"` site in five renderers.

## 📏 The rules

### R1 — Every element has a name

- **Good (T4).** A rule cannot be written, and a check cannot be built, for a
  shape with no name.
- **Ours:** four names out of eighteen elements.
- **Verdict: FAIL.** This blocks every rule below it.

### R2 — One colour token does one job

- **Good (T4).** Two jobs on one token means no value can be correct.
- **Ours:** `--mask` fills E6 node cards **and** E10 edge label backings. SEE-008
  found this and wrote the trap down. The note reads *"`--mask` must stay
  card-equal"*. Match the frame and the cards break. Match the cards and the
  labels read wrong.
- **Verdict: FAIL.** This is the root cause. R3 and R4 are blocked behind it.

### R3 — A backing that belongs to a line is tinted from that line

- **Good (T4).** This is the Commander's rule, given 2026-09-16. A backing on a
  wire should be tinted from that wire. The eye then reads the two as one thing.
- **Ours:** E10 is flat `--mask`, identical to a node card, with no tie to its
  own wire.
- **No outside standard covers this.** It is taste, and the cheapest rule here to
  argue with.
- **Verdict: FAIL.**

### R4 — A backing on a line must not erase the line

- **Good (T4).** The wire stays continuous. The backing sits on it.
- **Ours:** the backing exists in order to erase it. The template says so at line
  5551. It describes the shape as a solid patch to hide the arrows underneath.
- **This is working as designed.** No check can catch a thing behaving as
  intended, which is why fifteen sessions never flagged it.
- **Verdict: FAIL by design.** Changing it is a decision, not a repair.

### R5 — A border may separate, but may never carry the meaning

- **Good (T2).** This is P2, already enforced.
- **Ours:** one element in eighteen has a border. It is E4, the lane box, with a
  dashed edge. The rest have `stroke: none`.
- **Verdict: PASS.** We depend on no border anywhere, which is what P2 asks.
- **Note:** the Commander's wish for visible edges is allowed under this rule.
  It is an addition, not a correction.

### R6 — Painted colour matches the declared token

- **Good (T2).** Colour distance of two or less. This is P3.
- **Ours:** passing since SEE-008 on fresh renders.
- **Verdict: PASS.**

### R7 — Touching surfaces tell apart

- **Good (T2).** Colour distance of at least one. This is P1.
- **Ours:** passing except four known nested same-fill rings.
- **Verdict: PASS with booked residuals.**

### R8 — The same element is drawn the same way everywhere

- **Good (T4).** Five drawings of one shape share one corner radius.
- **Ours, E10:** corner radius reads 3, 4, 4, 3, 3. Height comes from three
  different places.
- **Ours, E6:** corner radius reads 6, 6, 7, 6, 6. The odd one is lifecycle.

  `[Certain]` — verified by reading lines 1055, 409, 484, 371, 734, 1077 and 459.
- **Verdict: FAIL.** There is no single place to fix a box.

### R9 — Corner radius says what a shape is

- **Good (T3).** The best chart gives cards a bigger radius than labels. Solid
  against floating.
- **Ours:** cards 6 or 7, labels 3 or 4. The habit exists but is unwritten, so it
  drifts, which is R8.
- **Verdict: PASS, unwritten.**

### R10 — A wire is told apart by more than one trick

- **Good (T1, UNVERIFIED).** Meaning is never carried by a single visual signal
  alone. Source is the web accessibility guidelines, on use of colour.
- **Ours:** E17 dashed and E15 plain share one colour and one head shape. The
  dashes are the only difference.
- **Verdict: FAIL.**

### R11 — Every head points the way its wire travels

- **Good (T2).** Within thirty degrees of the last real piece of route. A12.
- **Ours:** passing on fresh renders since SEE-008.
- **Verdict: PASS.**

### R12 — Text is big enough to read at desk size

- **Good (T2).** The readability floors. O1a.
- **Ours:** passing, and card text fit was repaired in SEE-013.
- **Verdict: PASS.**

## 📊 The count

| | |
|---|---|
| Elements | **18** |
| Elements with a name today | **4** |
| Elements no check measures | **7** |
| Rules judged | **12** |
| Pass | **6.** R5, R6, R7, R9, R11, R12 |
| Fail | **6.** R1, R2, R3, R4, R8, R10 |

**Every passing rule was won by hand, one session each.** Nothing here passed by
design.

## 🧭 What to fix, in order

1. **R1. Name the fourteen unnamed elements.** Nothing else can be written or
   checked until this lands. It is the cheapest item and it blocks the rest.
2. **R2. Split `--mask` into a card token and a label token.** R3 and R4 are
   blocked behind it.
3. **R3 and R4 together. Tint the edge backing from its wire and stop erasing
   the wire.** Agree these first. They are taste, not standard.
4. **R8. One drawing helper for each element**, so a box has one place to fix.
5. **R10. Make the dashed wire differ by more than dashes.**
6. **Build checks for the seven unowned elements.** E10 first. It carries three
   of the faults the Commander found this month.

## 🔗 The wire and its label are already linked

Every wire carries `data-edge-id`, and so does the label group that belongs to
it. The shared helper writes both.

`[Certain]` — verified by reading `archify/renderers/shared/cli.mjs:213`.

So R3 costs no new data. Tinting a label from its wire is a lookup that already
exists, not a change to how charts are built.

**One exception. Sequence charts draw their messages differently**, and the wire
was not found as a plain path with a colour class there.

`[Likely]` — checked four example files; the sequence one did not match.

So R3 is one stylesheet rule for four chart kinds. Sequence needs its own look.

## 🧾 What needs review before this becomes version 1.0

**The Commander decides these. They are taste and nobody else can settle them.**

| Item | The decision |
|---|---|
| R3 | Pick a look from the four mocked variants. Benji recommends V1. |
| R4 | Should a label stop erasing the wire beneath it? This changes every chart. |
| R1 | Approve the fourteen proposed names, or rename them. |
| R2 | Approve splitting `--mask` into a card token and a label token. |
| R8 | One corner radius for each element. Which value wins. |
| R9 | Confirm the meaning: a bigger radius means solid, a smaller one means floating. |

**Benjamin verifies these. They are facts and Benji must not certify his own.**

| Item | The check |
|---|---|
| T1 rows | Fetch the accessibility guidelines. Confirm or correct both numbers. |
| Element count | Recount the eighteen elements without reading Benji's list first. |
| Unowned seven | Confirm each of the seven really has no check, by population. |
| P3 | Predict and then test: does tinting the label break P3? |
| Sequence | Confirm whether sequence wires carry a colour class. |

## ⚠️ What this page is not

It does not cover **where shapes are placed**. Empty pages, stacked labels and
crowding are placement faults. Placement is the open work in SEE-015.

**It is a draft.** The T1 rows need their sources fetched. The T4 rows are one
person's opinion until the Commander rules on them.
