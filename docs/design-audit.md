# Archify Design Audit

**For whom:** Commander Ben, and any worker seat ruling on a visual fault.
**Author:** Benji (read-only consultant). **Date:** 2026-09-17.
**Version:** 0.2.0 — draft. The law is `DESIGN.md`; the picture version is `design.html`.

**Bottom line:** Archify draws **18 elements**. **4 carry a name.** **7 have no check watching them.** Of the 12 rules below, **6 pass**. Every element was found in a real chart and photographed, so each row can be judged by eye, not by my description of it.

## ⚖️ How a verdict is decided

Two rules, both added after the Commander challenged E1 on 2026-09-17.

1. **A clause that cannot come out false is not a clause.** E1 was
   marked passing because its only written rule was that a frame wraps
   its members. A frame is built from its members, so it wraps them by
   construction and can never fail. The rule it could not fail was the
   only rule written down.
2. **A verdict is inherited.** A part cannot pass while the thing it
   serves fails. E3 has the right colour and backs a title that stacks
   into an unreadable pile, so E3 is not passing.

## 🎯 Goal

Name every element, give it one rule, and show what it looks like now.

## 🏛️ Where good comes from

| Tier | Source | Can you check it? |
|---|---|---|
| T1 | A published outside standard. | Yes. Someone else agreed it. |
| T2 | A floor this programme enforces. | Yes. It is in our code. |
| T3 | Our best chart, measured. | Yes. A witness, not an authority. |
| T4 | Benji's judgement. | **No.** Taste. Cheap to overrule. |

T1 rows are written from memory, offline, and stay UNVERIFIED until fetched.

## ✅ The element checklist

| # | Element | Name | Named? | Owned by | Verdict |
|---|---|---|---|---|---|
| E1 | Frame | `structural-frame` | Yes. | A7, A9, A14, P1, P2. | **FAIL** |
| E2 | Frame title | `structural-frame-label` | Yes. | A2. | **FAIL** |
| E3 | Frame title backing | `structural-frame-label-mask` | Yes. | P3. | **GAP** |
| E4 | Lane box | `c-lane` | No. | A3. | **PASS** |
| E5 | Lane header | `lane-header-mask` | No. | E5. | **MEASURED** |
| E6 | Node card | `node-card-mask` | No. | A2, A8, P1. | **PASS** |
| E7 | Node stripe | `node-accent-bar` | No. | E7. | **MEASURED** |
| E8 | Security group | `security-group` | No. | P1. | **UNUSED** |
| E9 | Grid | `grid` | No. | E9. | **MEASURED** |
| E10 | Edge label backing | `edge-label-mask` | No. | E10. | **MEASURED** |
| E11 | Edge label text | `segment-label` | Yes. | A3, A4, A15. | **FAIL** |
| E12 | Message label backing | `message-label-mask` | No. | E12. | **MEASURED** |
| E13 | Activation bar | `activation-bar` | No. | E13. | **MEASURED** |
| E14 | Node sublabel | `node-sublabel` | No. | A3, A15. | **GAP** |
| E15 | Plain wire | `a-default` | No. | A9, A11, A12. | **PASS** |
| E16 | Strong wire | `a-emphasis` | No. | A9, A11, A12. | **PASS** |
| E17 | Dashed wire | `a-dashed` | No. | E17 tells it from E15. | **MEASURED** |
| E18 | Arrowhead | `m-default and three twins` | No. | A5, A10, A12. | **PASS** |

### Each element in full

**E1 Frame** — `structural-frame`

- **Good (T2).** Four clauses: wraps its members, never crosses another frame, is at least half filled, leaves its title rail clear.
- **Ours.** Wraps its members (passes by construction). <b>4 of 15 frame pairs cross</b>, counting only pairs where neither is fully inside the other. <b>Fill 29.6% to 48.1%.</b> The hand-placed chart einvoice-order-flow-v3 is worse: <b>6 of 15 crossing</b>, fill 42.5% to 59.2% — so crossing is not caused by automatic placement. Three clauses of four fail, and no check watches any of the three.
- **Drawn at.** render-architecture.mjs:1033
- **Owned by.** A7, A9, A14, P1, P2
- **Seen in.** Architecture, Workflow, Sequence, Dataflow
- **Verdict: FAIL.**

**E2 Frame title** — `structural-frame-label`

- **Good (T4).** One title per frame, placed clear of the frame's own cards.
- **Ours.** Stacks into a pile when cards are auto-placed. Visible in the sheet.
- **Drawn at.** render-architecture.mjs:1038
- **Owned by.** A2
- **Seen in.** Architecture
- **Verdict: FAIL.**

**E3 Frame title backing** — `structural-frame-label-mask`

- **Good (T2).** Matches its frame, and leaves its own title readable.
- **Ours.** Colour is correct: var(--region-fill), dark 0.00, light 0.00, fixed in SEE-008. But it backs a title that stacks on its neighbours, so the element it serves does not work. A backing behind an unreadable label is not passing.
- **Drawn at.** render-architecture.mjs:1039
- **Owned by.** P3
- **Seen in.** Architecture
- **Verdict: GAP.**

**E4 Lane box** — `c-lane`

- **Good (T2).** Reads as a lane. May carry a border; may not depend on one.
- **Ours.** The only element in eighteen that has a border. Dashed, lane-stroke.
- **Drawn at.** template.html:5171
- **Owned by.** A3
- **Seen in.** Workflow, Sequence, Dataflow
- **Verdict: PASS.**
-
**E5 Lane header** — `lane-header-mask`
- **Good (T4).** Names its lane. Distinct from the lane body.
- **Ours.** Measured by E5 LANE_HEADER: loop-closed-full 6/6 named+distinct PASS
  (loop-open 6/6 PASS; loop-closed-pilot 4/6 matched — lane-4 header missing FAIL).
- **Drawn at.** render-workflow.mjs:682
- **Owned by.** E5
- **Seen in.** Sequence
- **Verdict: MEASURED (mixed: loop charts PASS except loop-closed-pilot lane-4 FAIL).**

**E6 Node card** — `node-card-mask`

- **Good (T2).** Stands apart from its frame. Colour distance of at least one.
- **Ours.** var(--mask). Dark card on a lighter frame. Passes P1.
- **Drawn at.** all five renderers
- **Owned by.** A2, A8, P1
- **Seen in.** Architecture, Workflow, Sequence, Dataflow, Lifecycle
- **Verdict: PASS.**

**E7 Node stripe** — `node-accent-bar`

- **Good (T4).** Carries the node's kind as colour. Never the only signal of kind.
- **Ours.** Measured by E7 NODE_STRIPE: sys003-einvoice-structure 12/12 PASS
  (4px, left edge, accent-kind == node kind); einvoice-order-flow-v3 12/12 PASS;
  loop-closed-full 0/9 barred FAIL; cache-miss sequence 0/7 FAIL; maka 0/12 FAIL.
- **Drawn at.** render-architecture.mjs:1080
- **Owned by.** E7
- **Seen in.** Architecture
- **Verdict: MEASURED (architecture PASS, other kinds FAIL — stripe ships in one renderer only).**

**E8 Security group** — `security-group`

- **Good (T4).** Marks a guarded cluster.
- **Ours.** Defined in the template but not drawn in any of the five sampled charts.
- **Drawn at.** template.html CSS
- **Owned by.** P1
- **Seen in.** none of the five sampled charts
- **Verdict: UNUSED.**

**E9 Grid** — `grid`

- **Good (T4).** Alignment aid. Should not be visible in a delivered chart.
- **Ours.** Measured by E9 GRID: every probed chart renders one painted
  `fill="url(#grid)"` rect (loop-closed-full 1346x1682.5, sequence 1345.99x1247.5,
  einvoice-structure 929.98x421.66) — the aid ships in delivery. FAIL everywhere probed.
- **Drawn at.** template.html CSS
- **Owned by.** E9
- **Seen in.** Architecture, Sequence
- **Verdict: MEASURED (FAIL — aid renders in delivery).**

**E10 Edge label backing** — `edge-label-mask`

- **Good (T4).** Tinted from the wire it belongs to. Carries a border in that colour.
- **Ours.** Measured by E10 EDGE_LABEL_BACKING: einvoice-structure 0/2 tinted FAIL
  (backing `rgb(255,255,255)` == card fill, border none vs wire `rgb(255,59,48)`);
  maka 0/3 FAIL; v3 0/2 FAIL. Flat card fill, no wire tie, no border.
- **Drawn at.** all five renderers
- **Owned by.** E10
- **Seen in.** Architecture, Workflow, Dataflow, Lifecycle
- **Verdict: MEASURED (FAIL — flat card fill, borderless).**

**E11 Edge label text** — `segment-label`

- **Good (T2).** Stands clear of every card and sublabel by 24px.
- **Ours.** Measured by three checks. Seventeen clearance failures still booked.
- **Drawn at.** all five renderers
- **Owned by.** A3, A4, A15
- **Seen in.** Architecture, Workflow, Dataflow, Lifecycle
- **Verdict: FAIL.**

**E12 Message label backing** — `message-label-mask`

- **Good (T4).** Same rule as E10, on a sequence message.
- **Ours.** Measured by E12 MESSAGE_LABEL_BACKING: cache-miss sequence 0/12
  tinted FAIL (backing `rgb(255,255,255)` == card fill, borderless on all 12).
- **Drawn at.** render-sequence.mjs:344
- **Owned by.** E12
- **Seen in.** none of the five sampled charts
- **Verdict: MEASURED (FAIL — flat card fill, borderless).**

**E13 Activation bar** — `activation-bar`

- **Good (T4).** Shows how long a participant is busy.
- **Ours.** Measured by E13 ACTIVATION_BAR: cache-miss sequence 6/6 PASS
  (10px wide, mask+fill pair at each station). Other charts carry no bars (NA).
- **Drawn at.** render-sequence.mjs:354
- **Owned by.** E13
- **Seen in.** Sequence, Lifecycle
- **Verdict: MEASURED (PASS where delivered).**

**E14 Node sublabel** — `node-sublabel`

- **Good (T2).** Fits inside its card with the title. Never overflows.
- **Ours.** A2 measures the title only, never the sublabel. Booked as OPEN-18.
- **Drawn at.** all five renderers
- **Owned by.** A3, A15
- **Seen in.** Workflow, Sequence, Dataflow, Lifecycle
- **Verdict: GAP.**

**E15 Plain wire** — `a-default`

- **Good (T2).** One colour, one head, head within thirty degrees of travel.
- **Ours.** Passes A12 on fresh renders since SEE-008.
- **Drawn at.** all five renderers
- **Owned by.** A9, A11, A12
- **Seen in.** Architecture, Workflow, Sequence, Dataflow, Lifecycle
- **Verdict: PASS.**

**E16 Strong wire** — `a-emphasis`

- **Good (T2).** As E15, with its own colour and matching head.
- **Ours.** arrow-emphasis with arrowhead-emphasis. Correctly paired.
- **Drawn at.** all five renderers
- **Owned by.** A9, A11, A12
- **Seen in.** Architecture, Workflow, Sequence, Dataflow, Lifecycle
- **Verdict: PASS.**

**E17 Dashed wire** — `a-dashed`

- **Good (T1).** Meaning never rests on one visual signal alone.
- **Ours.** Measured by E17 DASHED_WIRE: loop-closed-full 1/1 dashes-only FAIL
  (`rgb(142,142,147)` 1.4 same head); loop-open 2/2 FAIL; maka 2/2 PASS
  (dashed `rgb(124,58,237)` vs plain `rgb(148,163,184)`).
- **Drawn at.** all five renderers
- **Owned by.** E17 tells it from E15
- **Seen in.** Workflow, Sequence, Dataflow
- **Verdict: MEASURED (mixed: loop charts FAIL, maka PASS).**

**E18 Arrowhead** — `m-default and three twins`

- **Good (T4).** Matches its wire's colour and points the way of travel.
- **Ours.** All four pair correctly with their wire. A12 passes.
- **Drawn at.** template.html:5528
- **Owned by.** A5, A10, A12
- **Seen in.** Architecture, Workflow, Sequence, Dataflow, Lifecycle
- **Verdict: PASS.**

## 📐 The rules

| # | Rule | Tier | Verdict |
|---|---|---|---|
| R1 | Every element has a name | T4 | **FAIL** |
| R2 | One colour token does one job | T4 | **FAIL** |
| R3 | A backing that belongs to a line is tinted from that line | T4 | **FAIL** |
| R4 | A backing on a line must not erase the line | T4 | **FAIL** |
| R5 | A border may separate, but may never carry the meaning | T2 | **PASS** |
| R6 | Painted colour matches the declared token | T2 | **PASS** |
| R7 | Touching surfaces tell apart | T2 | **PASS** |
| R8 | The same element is drawn the same way everywhere | T4 | **FAIL** |
| R9 | Corner radius says what a shape is | T3 | **PASS** |
| R10 | A wire is told apart by more than one trick | T1 | **FAIL** |
| R11 | Every head points the way its wire travels | T2 | **PASS** |
| R12 | Text is big enough to read at desk size | T2 | **PASS** |

**R1 — Every element has a name**

- **Good (T4).** A rule cannot be written, and a check cannot be built, for a shape with no name.
- **Ours.** Four names out of eighteen.
- **Verdict: FAIL.**

**R2 — One colour token does one job**

- **Good (T4).** Two jobs on one token means no value can be correct.
- **Ours.** --mask fills E6 node cards and E10 edge label backings. SEE-008 booked the trap.
- **Verdict: FAIL.**

**R3 — A backing that belongs to a line is tinted from that line**

- **Good (T4).** A backing on a wire is tinted from that wire, so the eye reads the two as one.
- **Ours.** E10 is flat --mask with no tie to its wire. Four variants mocked; V1 recommended.
- **Verdict: FAIL.**

**R4 — A backing on a line must not erase the line**

- **Good (T4).** The wire stays continuous. The backing sits on it.
- **Ours.** The backing exists to erase it. template.html:5551 says so.
- **Verdict: FAIL.**

**R5 — A border may separate, but may never carry the meaning**

- **Good (T2).** P2 samples ten pixels from any edge and ignores the hairline on purpose.
- **Ours.** One element in eighteen has a border. We depend on none.
- **Verdict: PASS.**

**R6 — Painted colour matches the declared token**

- **Good (T2).** Colour distance of two or less. P3.
- **Ours.** Passing since SEE-008 on fresh renders.
- **Verdict: PASS.**

**R7 — Touching surfaces tell apart**

- **Good (T2).** Colour distance of at least one. P1.
- **Ours.** Passing except four known nested same-fill rings.
- **Verdict: PASS.**

**R8 — The same element is drawn the same way everywhere**

- **Good (T4).** Five drawings of one shape share one corner radius and one height source.
- **Ours.** E10 radius 3,4,4,3,3. E6 radius 6,6,7,6,6. Lifecycle is the odd one.
- **Verdict: FAIL.**

**R9 — Corner radius says what a shape is**

- **Good (T3).** Cards get a bigger radius than labels. Solid against floating.
- **Ours.** Cards 6 or 7, labels 3 or 4. The habit exists but is unwritten.
- **Verdict: PASS.**

**R10 — A wire is told apart by more than one trick**

- **Good (T1).** Meaning never rests on a single visual signal.
- **Ours.** E17 and E15 share one colour and one head shape.
- **Verdict: FAIL.**

**R11 — Every head points the way its wire travels**

- **Good (T2).** Within thirty degrees of the last real piece of route. A12.
- **Ours.** Passing on fresh renders since SEE-008.
- **Verdict: PASS.**

**R12 — Text is big enough to read at desk size**

- **Good (T2).** The readability floors. O1a.
- **Ours.** Passing. Card text fit repaired in SEE-013.
- **Verdict: PASS.**

## 🗺️ Which chart kind draws which element

| Element | Architecture | Workflow | Sequence | Dataflow | Lifecycle |
|---|---|---|---|---|---|
| E1 Frame | Yes. | Yes. | Yes. | Yes. | No. |
| E2 Frame title | Yes. | No. | No. | No. | No. |
| E3 Frame title backing | Yes. | No. | No. | No. | No. |
| E4 Lane box | No. | Yes. | Yes. | Yes. | No. |
| E5 Lane header | No. | No. | Yes. | No. | No. |
| E6 Node card | Yes. | Yes. | Yes. | Yes. | Yes. |
| E7 Node stripe | Yes. | No. | No. | No. | No. |
| E8 Security group | No. | No. | No. | No. | No. |
| E9 Grid | Yes. | No. | Yes. | No. | No. |
| E10 Edge label backing | Yes. | Yes. | No. | Yes. | Yes. |
| E11 Edge label text | Yes. | Yes. | No. | Yes. | Yes. |
| E12 Message label backing | No. | No. | No. | No. | No. |
| E13 Activation bar | No. | No. | Yes. | No. | Yes. |
| E14 Node sublabel | No. | Yes. | Yes. | Yes. | Yes. |
| E15 Plain wire | Yes. | Yes. | Yes. | Yes. | Yes. |
| E16 Strong wire | Yes. | Yes. | Yes. | Yes. | Yes. |
| E17 Dashed wire | No. | Yes. | Yes. | Yes. | No. |
| E18 Arrowhead | Yes. | Yes. | Yes. | Yes. | Yes. |

Found by asking each chart's own drawing for the shape, in a browser.

## 🧭 What to fix, in order

1. R1. Name the fourteen unnamed elements. Everything else waits on this.
2. R2. Split --mask into a card token and a label token. R3 and R4 are blocked behind it.
3. R3 and R4 together. Tint the edge backing and stop erasing the wire.
4. R8. One drawing helper per element, so a box has one place to fix.
5. R10. Make the dashed wire differ by more than dashes.
6. Build checks for the elements nothing measures. E10 first.
7. Rule on E8 and E9. Both are defined and neither is drawn. Keep or remove.

## ⚠️ What this page is not

It does not cover where shapes are **placed**. Empty pages, stacked labels
and crowding are placement faults, and placement is the work in SEE-015.

**It is a draft.** T1 rows need their sources fetched. T4 rows are one
person's opinion until the Commander rules on them.
