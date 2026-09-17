# CALIBRATION.md — judge catch-rate ledger (OSM-ARCH-SEE-001)

A judge that never meets a violation proves nothing. Every judge run books a
row here against a SEEDED defect it must catch.

Columns: cycle / judge / seeded defect / caught Y-N / miss note.

## Seed registry

- **Seed #1**: T5 header-crossing render — the gate→ship "approved" route
  transits the "03 / Release" lane-header strip row
  (`tools/archify/evals/seeing/T5/lane-03-release.png`,
  `edge-gate-ship.png`). Expected: FLAG citing check 4 (HEADER). On record:
  the source chart validated 9/9 0 err/warn — composition checks do not see
  route-through-header-text, which is why this pipeline exists.
- **Amendment 2026-09-10 (prove-out)**: mimo-v2.5 PASSed both Seed #1 crops
  verbatim — no FLAG materialized. The lane crop is genuinely clean at text
  level; the edge crop's mask is genuinely intact per the verdict. The
  strip-band transit (route crossing the Release strip ROW right of the
  header text) is real at full-view level but unframeable by text-anchored
  zone boxes. Seed premise as literally specified (FLAG on these crops) is
  therefore DISPUTED — pending Benji blind cross-check, and fix candidate
  (full-width strip-band zones) is Commander/Benji's call, not the runner's.

## Ledger

| cycle | judge | seeded defect | caught | miss note |
|---|---|---|---|---|
| human-baseline | Benji (full-view 8/10, then cropped) | Seed #1 | Y (cropped; N on full-view) | Full-view 8/10 MISS on record — zoomed crops are what catch it |
| SEE-001-proveout | mimo-v2.5 (`omp -p --model mimo-v2.5`, blind: crop + checks only) | Seed #1 | N | Verbatim verdicts in `seeing/T5/judge-mimo-seed1.txt` (lane crop PASS) and `judge-mimo-seed1-edge.txt` (edge crop PASS). Text-level crops clean; band-level transit outside zone framing. See amendment above. |
| SEE-002-retest | mimo-v2.5 (`omp -p --model mimo-v2.5`, blind: strip crop + checks only) | Seed #1 (strip-band retest) | Y | FLAG citing Check 4 (HEADER): strip-03-release crop shows the gate→ship "approved" route transiting the Release strip row. Verbatim verdict in `seeing/T5-strip-retest/judge-mimo-seed1-strip.txt`. |

## Standing acquisition procedure (visual-check red fallback)

When `archify visual-check` is red — transport death (no screenshots) or a
content FAIL — pixels stay acquirable with zero dependence on visual-check's
Chrome path, so 'no pixels, no PASS' remains satisfiable:

1. `node tools/archify/scripts/clip-zones.mjs <delivered.html> <out-dir>`
   (proven port pattern: --remote-debugging-port 19341-19345, HTTP
   /json/version poll, Browser.close shutdown) emits zone crops +
   full-view.png + manifest; judge crops per VISUAL-CHECKLIST.md and book the
   ledger row as usual.
2. Commander-crops: any Commander-supplied crop of the same artifact judges
   identically (crop + five checks only, blind).

Status note (SEE-003, 2026-09-11): visual-check transport ported to the
clip-zones pattern and proved out on T5_with-skill/output.html (4
screenshots, structured receipt; exit 1 is a content FAIL, not transport
death). Standing failure tally UPDATED, not extended: the 'failed 6th
consecutive time (same Chrome pipe-exit, zero screenshots)' line in the
OSM-ARCH-FLOW-004b CHANGE_LOG entry (2026-09-11) is SUPERSEDED — the pipe-exit
cause is removed by this port; this section is the standing note.

## SEE-004 ruler calibration (OSM-ARCH-SEE-004, 2026-09-12)

Layer-1 ruler `tools/archify/scripts/geometry-assert.mjs` over the O3 corpus
(N=24: 8 assertions x 2 positives — one just-over, one clearly-over — + 8 clean
negatives). Fixtures are mutations on %TEMP% copies of the v2/v3 delivered HTML
(tracked files untouched); ruler run at --viewport 1440x900. A6 rows score the
container-occupancy leg (overall A6 stays FAIL via the global ink/viewBox leg).

| # | fixture | target | predicted | actual | catch | false-pos | mutation |
|---|---|---|---|---|---|---|---|
| 1 | see004-A1-neg.html | A1 | PASS | PASS | - | 0 | edge0+edge1 verticals x88->x40 (clear of header text bboxes) |
| 2 | see004-A1-posJ.html | A1 | FAIL | FAIL | 1 | - | edge0 x88->x52 (1px inside header band edge), edge1 parked at x40 |
| 3 | see004-A1-posC.html | A1 | FAIL | FAIL | 1 | - | edge0 x88->x100 (deep inside 02+03 headers), edge1 baseline |
| 4 | see004-A2-neg.html | A2 | PASS | PASS | - | 0 | titles shortened + all 12 cards grown +-12 (t/b +18px) |
| 5 | see004-A2-posJ.html | A2 | FAIL | FAIL | 1 | - | match title font 9.7->9.0 (inset ~15.5, barely) |
| 6 | see004-A2-posC.html | A2 | FAIL | FAIL | 1 | - | match title font 9.7->11.0 (inset ~5, clearly) |
| 7 | see004-A3-neg.html | A3 | PASS | PASS | - | 0 | both edge labels moved to stroke/label-clear zones |
| 8 | see004-A3-posJ.html | A3 | FAIL | FAIL | 1 | - | mismatch grazes lane-0 bottom stroke (~0.5px), reject parked clear |
| 9 | see004-A3-posC.html | A3 | FAIL | FAIL | 1 | - | mismatch pushed 10px deeper into lane-0, reject baseline |
| 10 | see004-A4-neg.html | A4 | PASS | PASS | - | 0 | mismatch label parked below return start-tip (dist ~15.6, off-wire) |
| 11 | see004-A4-posJ.html | A4 | FAIL | FAIL | 1 | - | mismatch label y79->100 (dist ~26.9 CSS px, barely over 24) |
| 12 | see004-A4-posC.html | A4 | FAIL | FAIL | 1 | - | mismatch label y79->60 (dist ~80, clearly over) |
| 13 | see004-A5-neg.html | A5 | PASS | PASS | - | 0 | outlier markers 1.4->1.8 (all gaps ~15.6, uniform) |
| 14 | see004-A5-posJ.html | A5 | FAIL | FAIL | 1 | - | from uniform: key0 marker 1.8->1.55 (gap ~13.4, dev ~2.2) |
| 15 | see004-A5-posC.html | A5 | FAIL | FAIL | 1 | - | from uniform: key0 marker 1.8->1.2 (gap ~10.4, dev ~5.2) |
| 16 | see004-A6-neg.html | A6 | PASS-container | PASS-container | - | 0 | bum card w320->324 (leg 0.5079) |
| 17 | see004-A6-posJ.html | A6 | FAIL-container | FAIL-container | 1 | - | bum card w320->312 (leg 0.4891, barely) |
| 18 | see004-A6-posC.html | A6 | FAIL-container | FAIL-container | 1 | - | BUM frame h104->130 (leg 0.4013, clearly) |
| 19 | see004-A7-posJ.html | A7 | FAIL | FAIL | 1 | - | v2 viewBox h960->600 (page ~1.56 screens) |
| 20 | see004-A7-neg.html | A7 | PASS | PASS | - | 0 | v2 viewBox h960->240 (page ~0.94 screens) |
| 21 | see004-A7-posC.html | A7 | FAIL | FAIL | 1 | - | v2 viewBox h960->1248 (page ~2.66 screens) |
| 22 | see004-A8-neg.html | A8 | PASS | PASS | - | 0 | collect +380 (distinct 2, ratio ~0.82) |
| 23 | see004-A8-posJ.html | A8 | FAIL | FAIL | 1 | - | collect +86 (distinct 2, ratio ~0.49 barely) |
| 24 | see004-A8-posC.html | A8 | FAIL | FAIL | 1 | - | collect -10 (ratio 0.42 clearly) |

Catch-rate: 16/16 = 100.0%. False-positive-rate: 0/8 = 0.0%.
Dual-run: v2 (88bfed0b) A1-A7 FAIL + A8 NA + O1a FAIL; v3 (b06bd053) A1 PASS, A2/A3/A5 DATA, A4/A6/A7/A8 FAIL + O1a FAIL.

## SEE-004-FIX re-validation (OSM-ARCH-SEE-004-FIX, 2026-09-12)

Legacy `MIN_PROJECTED_NODE_TEXT_PX = 6` export deleted from
`archify/renderers/shared/desktop-readability.mjs`; every consumer repointed
to `MIN_PROJECTED_TEXT_PX_BY_DETAIL[detail]` (primary 15, context 11,
boundary 13, edge 11 — thresholds unchanged). `visual-check.test.mjs`
fixtures re-pinned: readable 12px context (PASS, floor 11), unreadable 6.44px
primary (FAIL, floor 15; passes legacy 6 — the flip). Ruler
`scripts/geometry-assert.mjs` untouched (43793 B).

Re-validation, ruler @1440x900: dual-run verdict-identical to SEE-004 (v2
88bfed0b A1-A7 FAIL + A8 NA + O1a FAIL; v3 b06bd053 A1 PASS, A2/A3/A5 DATA,
A4/A6/A7/A8 FAIL + O1a FAIL). Corpus N=24 fresh re-run via
%TEMP%/see004-runall.cjs: 24/24 match predicted — catch 16/16, FP 0/8
(A6 legs 0.5017/0.4891/0.4013 identical). No verdict flip. Visual-check
floor tests 7/7 green (2 residual fails are pre-existing Chrome-transport
env, identical pre/post).

## SEE-005 Layer-1 coverage: A1 pills + A9 + A10 (OSM-ARCH-SEE-005, 2026-09-12)

Ruler `tools/archify/scripts/geometry-assert.mjs` 43793 B -> 58587 B @1440x900.
O1 A1 extended: lane headers (bbox+4px samples) PLUS floating pills
`g[data-graph-role="structural-frame-label"]` (+ `rect[data-graph-role="structural-frame-label-mask"]`, group bbox includes mask) via polyline SEGMENT vs pill bbox = 0.
O2 A9 route-to-frame: part1 floor background segment-to-frame-edge >=12; part2 per-side spread <=6 (terminals exempt part1 only; middle docking crossings excluded both as entries).
O3 A10 arrowhead docking: tip OUTSIDE target UNION (card rect UNION `rect.c-accent`/`rect[data-accent-kind]`) at >=6; inside = FAIL. A5 stays (uniformity +-2 modal); A10 adds sign+magnitude.

### Old 24 carried (SEE-004 targets preserved with new ruler)
Method [Certain]: A2-A8/O1a/A1-lane code paths untouched (only added pill/accent collectors + new A9/A10 blocks); clean-vector identity pre/post new ruler on both available cleans (v2 88bfed0b A2-A8/O1a identical; v3 1fabce6f A2-A8/O1a identical); 3/3 A1 regression re-runs with new ruler (v2 pills 0) PASS/FAIL/FAIL hold. Pinned b06bd053 file superseded by FLOW-007 (1fabce6f) — cannot re-run pinned with new ruler; cached old-ruler JSON booked as reference.

| # | fixture | target | predicted | actual | catch | false-pos | mutation |
|---|---|---|---|---|---|---|---|
| 1 | see004-A1-neg.html | A1 | PASS | PASS | - | 0 | edge0+edge1 verticals x88->x40 (v2; new-ruler re-run PASS, pills 0) |
| 2 | see004-A1-posJ.html | A1 | FAIL | FAIL | 1 | - | edge0 x88->x52 (1px inside), edge1 x40 (re-run FAIL) |
| 3 | see004-A1-posC.html | A1 | FAIL | FAIL | 1 | - | edge0 x88->x100 (deep), edge1 baseline (re-run FAIL) |
| 4 | see004-A2-neg.html | A2 | PASS | PASS | - | 0 | titles shortened + all 12 cards grown +-12 (t/b +18px) [SEE-004 verbatim; preserved] |
| 5 | see004-A2-posJ.html | A2 | FAIL | FAIL | 1 | - | match title font 9.7->9.0 (inset ~15.5) [preserved] |
| 6 | see004-A2-posC.html | A2 | FAIL | FAIL | 1 | - | match title font 9.7->11.0 (inset ~5) [preserved] |
| 7 | see004-A3-neg.html | A3 | PASS | PASS | - | 0 | both edge labels moved to stroke/label-clear zones [preserved] |
| 8 | see004-A3-posJ.html | A3 | FAIL | FAIL | 1 | - | mismatch grazes lane-0 bottom stroke (~0.5px) [preserved] |
| 9 | see004-A3-posC.html | A3 | FAIL | FAIL | 1 | - | mismatch pushed 10px deeper into lane-0 [preserved] |
| 10 | see004-A4-neg.html | A4 | PASS | PASS | - | 0 | mismatch label parked below return start-tip (dist ~15.6, off-wire) [preserved] |
| 11 | see004-A4-posJ.html | A4 | FAIL | FAIL | 1 | - | mismatch label y79->100 (dist ~26.9, barely over 24) [preserved] |
| 12 | see004-A4-posC.html | A4 | FAIL | FAIL | 1 | - | mismatch label y79->60 (dist ~80, clearly over) [preserved] |
| 13 | see004-A5-neg.html | A5 | PASS | PASS | - | 0 | outlier markers 1.4->1.8 (all gaps ~15.6, uniform) [preserved] |
| 14 | see004-A5-posJ.html | A5 | FAIL | FAIL | 1 | - | key0 marker 1.8->1.55 (gap ~13.4, dev ~2.2) [preserved] |
| 15 | see004-A5-posC.html | A5 | FAIL | FAIL | 1 | - | key0 marker 1.8->1.2 (gap ~10.4, dev ~5.2) [preserved] |
| 16 | see004-A6-neg.html | A6 | PASS-container | PASS-container | - | 0 | bum card w320->324 (leg 0.5079) [preserved] |
| 17 | see004-A6-posJ.html | A6 | FAIL-container | FAIL-container | 1 | - | bum card w320->312 (leg 0.4891) [preserved] |
| 18 | see004-A6-posC.html | A6 | FAIL-container | FAIL-container | 1 | - | BUM frame h104->130 (leg 0.4013) [preserved] |
| 19 | see004-A7-posJ.html | A7 | FAIL | FAIL | 1 | - | v2 viewBox h960->600 (page ~1.56 screens) [preserved] |
| 20 | see004-A7-neg.html | A7 | PASS | PASS | - | 0 | v2 viewBox h960->240 (page ~0.94 screens) [preserved] |
| 21 | see004-A7-posC.html | A7 | FAIL | FAIL | 1 | - | v2 viewBox h960->1248 (page ~2.66 screens) [preserved] |
| 22 | see004-A8-neg.html | A8 | PASS | PASS | - | 0 | collect +380 (distinct 2, ratio ~0.82) [preserved] |
| 23 | see004-A8-posJ.html | A8 | FAIL | FAIL | 1 | - | collect +86 (distinct 2, ratio ~0.49 barely) [preserved] |
| 24 | see004-A8-posC.html | A8 | FAIL | FAIL | 1 | - | collect -10 (ratio 0.42 clearly) [preserved] |

### New 12 (SEE-005, new ruler 58587 B @1440x900, v3 1fabce6f seeds unless noted)
| # | fixture | target | predicted | actual | catch | false-pos | mutation |
|---|---|---|---|---|---|---|---|
| 25 | see005-A1-neg.html | A1 | PASS | PASS | - | 0 | v3 pills moved clear (masks y75->5, y165->95, y255->185/100; texts y92->22, y182->112, y272->202/117; Client y255->100 gap y100-121 clear) — 0/0 transits |
| 26 | see005-A1-posJ.html | A1 | FAIL | FAIL | 1 | - | from neg: edge7 top y90->25 (1px inside Accounting pill y5-26) just-over — Accounting 7 @886.96,185.54 |
| 27 | see005-A1-posC.html | A1 | FAIL | FAIL | 1 | - | from neg: edge7 top y90->15 (deep inside Accounting pill) clearly-over — Accounting 7 @884.06,184.55 |
| 28 | see005-A9-neg1.html | A9 | PASS | PASS | - | 0 | v3 Sales-only (delete frame rects id1-5, keep Sales id0 + all 6 pills) — floor 136.88, spread 2.01 |
| 29 | see005-A9-neg2.html | A9 | PASS | PASS | - | 0 | from neg1: edge8 x765->764 (1px, still PASS) — floor 135.87, spread 2.01 |
| 30 | see005-A9-posFloorJ.html | A9 | FAIL | FAIL | 1 | - | from neg1: edge8 x765->640 (11px from Sales right 629, 1 under floor) — floor 11.07 <12, spread 2.01 PASS (floor breach) |
| 31 | see005-A9-posFloorC.html | A9 | FAIL | FAIL | 1 | - | from neg1: edge8 x765->631 (2px, clearly) — floor 2.01 <12 (floor breach) |
| 32 | see005-A9-posUniJ.html | A9 | FAIL | FAIL | 1 | - | from neg1: edge0 middle x33->38 (Sales left 7.05, spread 7.04 >6, floor 136.88 PASS equal floor) — uniformity breach just-over |
| 33 | see005-A9-posUniC.html | A9 | FAIL | FAIL | 1 | - | from neg1: edge0 middle x33->46 (Sales left 9.06, spread 9.06 >6, floor 136.88 PASS) — uniformity breach clearly-over |
| 34 | see005-A10-neg.html | A10 | PASS | PASS | - | 0 | v3 clean: edge7 tip L765100->L76598 (2px out, gap 12.26, still PASS) — worst 8.54 |
| 35 | see005-A10-posJ.html | A10 | FAIL | FAIL | 1 | - | v3 clean: edge0 end L55 220->L62 220 (7 right, tip 3.22px outside left/accent grazing <6) — request>match grazing accent bar |
| 36 | see005-A10-posC.html | A10 | FAIL | FAIL | 1 | - | v3 clean: edge7 tip L765100->L765120 (20 inside, tip INSIDE gap0) — signoff>precheck well inside card |

Catch-rate: old 16/16 = 100.0% (preserved); new 8/8 = 100.0% (A1-pill 2/2, A9 4/4, A10 2/2); overall 24/24 = 100.0%. False-positive-rate: old 0/8 = 0.0%; new 0/4 = 0.0% (A1 0/1, A9 0/2, A10 0/1); overall 0/12 = 0.0%.
Dual-run (new ruler @1440x900, available pair): v2 88bfed0b A1 FAIL (lanes 3, pills 0) A2-A7 FAIL A8 NA A9 FAIL (floor 4/spread 6) A10 PASS O1a FAIL; current v3 1fabce6f A1 FAIL (lanes 0, pills 3: CS Team 11, Accounting 7 +1) A2/A3/A5 DATA A4 PASS A6 FAIL A7 FAIL A8 PASS A9 FAIL (floor 2/spread 5) A10 PASS (worst 8.54) O1a PASS. Pinned v3 b06bd053 file superseded (FLOW-007 spec 92f0e6cb->6d9a1e64, html b06bd053 718729 B -> 1fabce6f 718491 B) — new-ruler re-run impossible; why-not: pinned predates floating pills (no pill markup to transit), current 1fabce6f flips old-PASS->new-FAIL proving selector.
Regression guard: see004-A1-neg/posJ/posC re-run with new ruler (same-dir temp, v2 pills 0) PASS/FAIL/FAIL unchanged.

## OPEN (SEE-005 carried forward, zero work)
- (1) v3 A2/A3/A5 DATA without captured values.
- (2) A6-global zero corpus coverage.
- (3) 2 visual-check transport fails vs skipped≠passed doctrine.
- (4) report-hash MATCH self-certification limits.
- (5) card item-10 echo — do NOT define item 10, Benji defines it.
> Superseded by ## OPEN (SEE-011 consolidated) at the end of this file — the only list. This block is history.

## SYS-001 system-defaults re-run (OSM-SYS-001, 2026-09-12)

New ruler 62437 B @1440x900 (58587 + populations O3 + bounded readiness).
Thresholds UNCHANGED (all A1-A10+O1a floors/spreads identical); verdicts move
only via renderer token defaults (O1) and NA-on-empty (O3).
Clean bases (fresh renders, specs UNMODIFIED): v2 workflow
`design-explore/einvoice-order-flow.workflow.json` -> sha 090a53cc (715874 B):
A1-A7 FAIL, A8 NA, A9 FAIL, A10 PASS, O1a FAIL. v3 architecture
`design-explore/einvoice-order-flow-v3.architecture.json` (spec 6d9a1e64,
UNMODIFIED) -> sha f832abb9 (719233 B): A1 FAIL (pills 4), A2/A3/A5 DATA,
A4 PASS, A6 FAIL (container leg MD 0.425 + global 0.3618), A7 FAIL, A8 PASS,
A9 FAIL (floorFails 2, spreadFails 6: worst floor 7.05 BUM, worst spread 154.48
Accounting), A10 PASS (worst 8.54), O1a PASS. Every fixture below carries its
assertion population N (N=0 -> NA, never PASS).

### Carried 21 (SEE-004, v2 090a53cc seeds; A6 redesigned — see notes)
| # | fixture | target | predicted | actual | catch | false-pos | mutation |
|---|---|---|---|---|---|---|---|
| 1 | see004-A1-neg.html | A1 | PASS | PASS | - | 0 | edge0+edge1 verticals x88->x40 in d AND points (clear of header bboxes) |
| 2 | see004-A1-posJ.html | A1 | FAIL | FAIL | 1 | - | from neg: edge0 x40->x52 (page x126.54, 1px inside 02 header band edge) |
| 3 | see004-A1-posC.html | A1 | FAIL | FAIL | 1 | - | from neg: edge0 x40->x100 (page x199.96, deep inside 02 header) |
| 4 | see004-A2-neg.html | A2 | PASS | PASS | - | 0 | all 12 titles to 8 chars + all 24 card rects grown (x-=12 w+=24, y-=18 h+=36; worst precheck 40.36) |
| 5 | see004-A2-posJ.html | A2 | FAIL | FAIL | 1 | - | match title font 9.7->9.0 (verified in markup; worst element precheck 12.82 — clean already had 10 violations, just-over confounded, verdict catch holds) |
| 6 | see004-A2-posC.html | A2 | FAIL | FAIL | 1 | - | match title font 9.7->11.0 (worst match inset 2.27, clearly) |
| 7 | see004-A3-neg.html | A3 | PASS | PASS | - | 0 | both edge labels to right-margin clear zones (x-center 740; 0 collisions) |
| 8 | see004-A3-posJ.html | A3 | FAIL | FAIL | 1 | - | from neg: mismatch back over lane-0, bottom edge grazes (rect y142.5) |
| 9 | see004-A3-posC.html | A3 | FAIL | FAIL | 1 | - | from neg: mismatch 10px deeper (rect y152.5) |
| 10 | see004-A4-neg.html | A4 | PASS | PASS | - | 0 | mismatch parked below return start-tip, off-wire (rect (-20,370), worst reject 19.9) |
| 11 | see004-A4-posJ.html | A4 | FAIL | FAIL | 1 | - | from clean: mismatch rect y79->100 (dist 27.06, barely over 24) |
| 12 | see004-A4-posC.html | A4 | FAIL | FAIL | 1 | - | from clean: mismatch rect y79->60 (dist 81.98, clearly over) |
| 13 | see004-A5-neg.html | A5 | PASS | PASS | - | 0 | outlier keys 9-12 stroke-width 1.4->1.8 (all gaps within 2px of modal 16) |
| 14 | see004-A5-posJ.html | A5 | FAIL | FAIL | 1 | - | from uniform: key0 sw 1.8->1.55 (gap 13.43, dev 2.57, barely) |
| 15 | see004-A5-posC.html | A5 | FAIL | FAIL | 1 | - | from uniform: key0 sw 1.8->1.2 (gap 10.4, dev 5.6, clearly) |
| 16 | see004-A6-neg.html | A6 | PASS-container | PASS-container (verdict FAIL via global leg, per convention) | - | 0 | md_signoff card w104->644: lane-4 leg 0.5031, just over (attr-exact) |
| 17 | see004-A6-posJ.html | A6 | FAIL-container | FAIL-container | 1 | - | md card w104->620: lane-4 leg 0.4844, just under (attr-exact) |
| 18 | see004-A6-posC.html | A6 | FAIL-container | FAIL-container | 1 | - | lane-4 frame h104->130 (verbatim action): leg 0.065, clearly under (attr-exact; base already far under, same action as SEE-004) |
| 19 | see004-A7-posJ.html | A7 | FAIL | FAIL | 1 | - | v2 viewBox h960->600 (page 1.56 screens) |
| 20 | see004-A7-neg.html | A7 | PASS | PASS | - | 0 | v2 viewBox h960->240 (page 0.94 screens) |
| 21 | see004-A7-posC.html | A7 | FAIL | FAIL | 1 | - | v2 viewBox h960->1248 (page 2.66 screens) |

### New 15 (SEE-004 A8 redesigned + SEE-005 on f832abb9 + synthetic A9)
| # | fixture | target | predicted | actual | catch | false-pos | mutation |
|---|---|---|---|---|---|---|---|
| 22 | see004-A8-neg.html | A8 | PASS | PASS | - | 0 | v3: collect node +40x (distinct 3, ratio 0.69; collect-shift replaces drifted x-coords) |
| 23 | see004-A8-posJ.html | A8 | FAIL | FAIL | 1 | - | v3 viewBox 924x560->924x790 (ratio 0.49, barely; distinct 3 holds) |
| 24 | see004-A8-posC.html | A8 | FAIL | FAIL | 1 | - | v3 viewBox ->924x922 (ratio 0.42, clearly) |
| 25 | see005-A1-neg.html | A1 | PASS | PASS | - | 0 | v3: all 6 pills to y530/547 (below every route; 0 transits, pills 6) |
| 26 | see005-A1-posJ.html | A1 | FAIL | FAIL | 1 | - | from neg: c08 top channel y90->531 (1px inside Accounting neg-pill 530-551) |
| 27 | see005-A1-posC.html | A1 | FAIL | FAIL | 1 | - | from neg: c08 channel y90->545 (deep inside Accounting neg-pill) |
| 28 | see005-A9-neg1.html | A9 | PASS | PASS | - | 0 | SYNTHETIC minimal (1 frame + 4 side runs at 15px): floor 15, spread 0 |
| 29 | see005-A9-neg2.html | A9 | PASS | PASS | - | 0 | synthetic: top run 1px shift (floor 15, spread 1), still PASS |
| 30 | see005-A9-posFloorJ.html | A9 | FAIL | FAIL | 1 | - | synthetic: top run to 11px from frame (spread 4 holds) |
| 31 | see005-A9-posFloorC.html | A9 | FAIL | FAIL | 1 | - | synthetic: top run to 2px (floor breach; spread 13 also breaches, booked) |
| 32 | see005-A9-posUniJ.html | A9 | FAIL | FAIL | 1 | - | synthetic: left run to 22px offset + corner reroutes (spread exactly 7, floor intact) |
| 33 | see005-A9-posUniC.html | A9 | FAIL | FAIL | 1 | - | synthetic: left run to 30px offset + corner reroutes (spread exactly 15) |
| 34 | see005-A10-neg.html | A10 | PASS | PASS | - | 0 | v3: c08 end (765,100)->(765,98), 2px out (worst 12.2-class, still PASS) |
| 35 | see005-A10-posJ.html | A10 | FAIL | FAIL | 1 | - | v3: c01 end (55,220)->(62,220) (tip 3.14px outside, grazing <6) |
| 36 | see005-A10-posC.html | A10 | FAIL | FAIL | 1 | - | v3: c08 end (765,100)->(765,120) (tip INSIDE, gap 0) |

Catch-rate: 24/24 = 100.0% (A1 4/4, A2 2/2, A3 2/2, A4 2/2, A5 2/2, A6-container 2/2, A7 2/2, A8 2/2, A9 4/4, A10 2/2). False-verdict-rate: 0/12 = 0.0% (A6 rows score the container leg per SEE-004 convention: 0.5031 PASS / 0.4844 FAIL / 0.065 FAIL attr-exact; overall verdicts stay FAIL via the global leg).
Re-pins (method changed, never rubber-stamped): A6 v2 (no 320-card in current spec — lane-4/md_signoff equivalents, same just/clearly pattern); A8 v3 (collect-shift coords drifted with the spec — viewBox-ratio method, same 0.49/0.42 bands); A9 (no passing single-frame config exists on token geometry — synthetic minimal fixtures with exact 11/2/7/15px constructions; corner theorem: adjacent runs' corner approaches pin every side minimum, so spread breaches must reroute corners too); A2-posJ (worst-element precheck, not match — just-over confounded by 10 pre-existing violations, verdict catch holds).
Predictions audit: A9 did NOT flip FAIL->PASS on v3 (stock 2/5 -> tokens 2/6) — booked as prediction FAILURE per protocol (tokens proven delivered: routes byte-identical, frames moved; failing edges c13/c08/c04/c12 are explicitly-authored vias the renderer honors verbatim). A6 WORSENED as predicted (container min 0.5185->0.425; global 0.3618 unchanged) — honest cost, OPEN. Vacuity: eleven NA with N=0 (separate fixture, fixture+JSON in report).

## SYS-003 ELK adopt re-run BOOKED (OSM-SYS-003, 2026-09-13)
Corpus re-run REQUIRED (engine change: ELK 0.12.0 via npm, UNMODIFIED, wrapper `layout-engine.mjs`, MODEL_ORDER+NODES_AND_EDGES, PORT 11, margins for backward twins, pill-aware titles, actual-tip A10, A11 conservation). NOT run now (time, 7 todos open, file report first); BOOKED here, OPEN.
Re-pins declared with reasons (method changed, never rubber-stamped):
- e-invoice `sys003-einvoice-structure.architecture.json` (SHA `1e80f9cc`, 12/13/6, zero geometry): ELK layout changed positions/routes (MODEL_ORDER pins Request leftmost x79, was x386 mid-canvas; PORT 11 docks; margins reroute c12/c13 twins via local gaps, spread 6->2, A4 77->46px; pill-aware lifts titles, A1 FAIL->PASS; actual-tip A10, worstGap 6.33 PASS). Goldens need updating (old authored `via`/`channelX`/`fromSide`/`toSide` removed, machine routes differ byte-wise, frames refit pad 30->18). Reason: engine adopt + wrapper tuning, zero hand geometry.
- org `sys003-org-structure.architecture.json` (SHA `3e06265a`, 8/7/0, zero geometry, zero new layout code): NEW O3 proof, no prior goldens, need baselining (A1/A9/A10/A11/O1a/A8 PASS, A6 FAIL predicted, A7 FAIL overflow 43px at 1920, extra row for IC sink leftmost, book OPEN). Reason: new spec, no goldens yet.
- all architecture (engine change affects all: `layout-engine.mjs` shared by architecture/workflow/lifecycle/dataflow, ENGINE_OPTIONS changed (MODEL_ORDER, PORT 11, spacing 16 targets, margins, pill-aware? No, pill-aware is architecture renderer only (titles), not shared? Actually pill-aware is architecture render-architecture.mjs (titles), not shared. Engine (ELK options) affects all (positions/routes changed, goldens need re-pinning). Reason: thin interface swap touches ONE module, behaviour changes all outputs.
Predictions audit SYS-003: (1) A1/A9/A10/A11 via engine options alone — PARTIAL (A1 PASS, A10 PASS, A11 PASS, A9 FAIL floor4 spread2, overlapping frames cover gaps, floor 0 crossings unavoidable via ELK flat (no frame model), spread 30/8; ceiling probe pad 30->0 gives no gain, frames not lever; book OPEN, elkjs PARTIAL, choice NOT reopened since 3/4 PASS, no hand lines). (2) A6 likely FAIL — CONFIRMED (e-invoice A6 FAIL, org A6 FAIL, book). (3) N3 may have no gate — FALSE (A4 gates too-far, 24px, we FAIL 46.65px, N3 HAS gate, book OPEN, eye-only? No, A4 asserts too-far, self-wire collision opposite? Actually A4 FAIL is too-far (46px>24), which A4 DOES gate (too-far), so N3 HAS gate, we FAIL it, book OPEN).

## SYS-004 new-path corpus re-run (OSM-SYS-004, 2026-09-13)

Base: `tools/archify/design-explore/sys004-einvoice.html` (ELK structure path, sha `810bf09c`, 719776 B) for 33 legs; 6 A9 legs are synthetic minimal fixtures (same instrument as SYS-001 #28-33). Ruler `tools/archify/scripts/geometry-assert.mjs` 67347 B @1440x900 — UNCHANGED this session (floors 12 / 6 untouched; verified: geometry-assert.mjs not in the SYS-004 file list).

Design: 36 intent-ported SYS-001 legs + 3 NEW A11 legs (A11 never had corpus coverage) = 39 fixtures in `/tmp/sys004-corpus/` (builder `/tmp/sys004-corpus-build.mjs`, %TEMP% precedent per SEE-004). DATA legs (A2/A3/A5) scored on wouldBe per SEE-004/SYS-001 convention; A6 rows score the container leg (overall stays FAIL via the global leg, same convention). O1a has no legs (covered by visual-check floor tests per SEE-004-FIX precedent).

Re-designs with reasons (method changed, never rubber-stamped):
- A1 lane-legs -> second pill family (route#0 vs MD pill; neg2/posJ2/posC2): ELK architecture output has no lane headers, so lane-band transit is unmeasurable on this path. Counts preserved (2 neg + 4 pos).
- A9 #28-33: synthetic minimal HTML (1 frame 100,100,400,300 + 4 straight runs + 1 dummy node outside the frame for fast readiness): no passing single-frame config exists on delivered geometry, same reason as SYS-001. Constructions: neg1 runs at 15px all sides; neg2 left run at 16px; posFloorJ top run at 11px; posFloorC top run at 2px; posUniJ left run at 22px (spread 7); posUniC left run at 30px (spread 15).
- A6 legs: single-container (delete frames 0,1,3,4,5, keep BUM 296x138=40848) + bum-card (c-backend rect) edits: the ruler reports only minOccupancy, so the minimum itself must move. neg x719 w282 h74 (intersection 20868 -> 0.5109); posJ w274 h74 (20276 -> 0.4964); posC base card (0.3819, clearly under). Mask-vs-card trap documented: node groups carry mask + card rects with identical x/y/w/h; edits MUST name class c-backend (first attempt hit the mask and measured base numbers — caught by grading).
- A4 legs: stub-12 (reject, key12) mask+text shifts: neg +46y, posJ +30y (26.02, barely over 24), posC -30y (67.29).
- A2-neg: all 12 card rects (c-backend, exact per-card tags) y-=20 h60->100: worst inset is TOP (8.26), so horizontal growth cannot work; font-shrink plateaued (15->8 only reached 13.26). Final worst 22.02, violations 0.
- A8 legs: viewBox-width ratio method (neg w1400 ratio 0.77; posJ w2125 ratio ~0.49; posC w2600 ratio 0.41).
- A11 legs (NEW, first coverage): neg swaps paths #0/#1 (count still 13); posJ deletes path #10 (12 vs 13); posC deletes #10+#9 (11 vs 13). A11 compares rendered path count to svg data-spec-edge-count.
- A10 legs on edge#0 (request>match, base worst 6.33): neg end L390->L386 (own gap 9.08; worst stays 6.33 via seven sibling edges at identical PORT geometry); posJ L390->L395 (gap 1.33 grazing); posC L390->L410 (tip INSIDE, gap 0).

Result: catch-rate 26/26 = 100.0% (A1 4/4, A2 2/2, A3 2/2, A4 2/2, A5 2/2, A6-container 2/2, A7 2/2, A8 2/2, A9 4/4, A10 2/2, A11 2/2). False-positive-rate 0/13 = 0.0%. The SEE-005 figures (24/24, 0/12, old layout path) are RETIRED.

| # | fixture | target | predicted | actual | hit | mutation |
|---|---|---|---|---|---|---|
| 1 | sys004-A1-neg1.html | A1 | PASS | PASS | catch | route#2 run y218->y250, clear of pills |
| 2 | sys004-A1-neg2.html | A1 | PASS | PASS | catch | route#0 run y162->y140, clear of MD pill |
| 3 | sys004-A1-posJ1.html | A1 | FAIL | FAIL | catch | route#2 run y218->y17, 1px inside Sales pill |
| 4 | sys004-A1-posJ2.html | A1 | FAIL | FAIL | catch | route#0 run y162->y105, 1px inside MD pill |
| 5 | sys004-A1-posC1.html | A1 | FAIL | FAIL | catch | route#2 run y218->y29, deep inside Sales pill |
| 6 | sys004-A1-posC2.html | A1 | FAIL | FAIL | catch | route#0 run y162->y117, deep inside MD pill |
| 7 | sys004-A2-neg.html | A2 | PASS | PASS | catch | all 12 card rects y-=20 h60->100 (insets +20 all sides) |
| 8 | sys004-A2-posJ.html | A2 | FAIL | FAIL | catch | Collect title font 15->16 (barely) |
| 9 | sys004-A2-posC.html | A2 | FAIL | FAIL | catch | Collect title font 15->19 (clearly) |
| 10 | sys004-A3-neg.html | A3 | PASS | PASS | catch | both stub labels to bottom clear zone |
| 11 | sys004-A3-posJ.html | A3 | FAIL | FAIL | catch | stub-11 mask x317->278.5 (1.5px over stroke) |
| 12 | sys004-A3-posC.html | A3 | FAIL | FAIL | catch | stub-11 mask x317->287.5 (10.5px over stroke) |
| 13 | sys004-A4-neg.html | A4 | PASS | PASS | catch | stub-12 +46y toward wire |
| 14 | sys004-A4-posJ.html | A4 | FAIL | FAIL | catch | stub-12 +30y (barely over) |
| 15 | sys004-A4-posC.html | A4 | FAIL | FAIL | catch | stub-12 -30y (clearly) |
| 16 | sys004-A5-neg.html | A5 | PASS | PASS | catch | route paths 9-12 strokes 1.5->1.8 (uniform) |
| 17 | sys004-A5-posJ.html | A5 | FAIL | FAIL | catch | edge#0 end +2.5 (gap ~17.1, dev ~2.1) |
| 18 | sys004-A5-posC.html | A5 | FAIL | FAIL | catch | edge#0 end +6 (gap ~18.6, dev ~3.6) |
| 19 | sys004-A6-neg.html | A6 | PASS-container | PASS-container | catch | keep BUM only + card x719 w282 h74 (inter 20868 -> 0.5109) |
| 20 | sys004-A6-posJ.html | A6 | FAIL-container | FAIL-container | catch | keep BUM only + card w274 h74 (inter 20276 -> 0.4964) |
| 21 | sys004-A6-posC.html | A6 | FAIL-container | FAIL-container | catch | keep BUM only, base card (0.3819 clearly) |
| 22 | sys004-A7-neg.html | A7 | PASS | PASS | catch | viewBox h613->500 |
| 23 | sys004-A7-posJ.html | A7 | FAIL | FAIL | catch | viewBox h613->950 |
| 24 | sys004-A7-posC.html | A7 | FAIL | FAIL | catch | viewBox h613->1500 |
| 25 | sys004-A8-neg.html | A8 | PASS | PASS | catch | viewBox w1352->1400 |
| 26 | sys004-A8-posJ.html | A8 | FAIL | FAIL | catch | viewBox w1352->2210 |
| 27 | sys004-A8-posC.html | A8 | FAIL | FAIL | catch | viewBox w1352->2600 |
| 28 | sys004-A9-neg1.html | A9 | PASS | PASS | catch | 4 runs at 15px (floor 15, spread 0) |
| 29 | sys004-A9-neg2.html | A9 | PASS | PASS | catch | left run at 16px (floor 15, spread 1) |
| 30 | sys004-A9-posFloorJ.html | A9 | FAIL | FAIL | catch | top run at 11px (floor breach; spread 4) |
| 31 | sys004-A9-posFloorC.html | A9 | FAIL | FAIL | catch | top run at 2px (floor + spread 13) |
| 32 | sys004-A9-posUniJ.html | A9 | FAIL | FAIL | catch | left run at 22px (spread 7; floor intact) |
| 33 | sys004-A9-posUniC.html | A9 | FAIL | FAIL | catch | left run at 30px (spread 15) |
| 34 | sys004-A10-neg.html | A10 | PASS | PASS | catch | edge#0 end L390->L386 (gap ~10.3) |
| 35 | sys004-A10-posJ.html | A10 | FAIL | FAIL | catch | edge#0 end L390->L395 (gap ~1.3, grazing) |
| 36 | sys004-A10-posC.html | A10 | FAIL | FAIL | catch | edge#0 end L390->L410 (tip INSIDE) |
| 37 | sys004-A11-neg.html | A11 | PASS | PASS | catch | swap paths #0/#1 (count still 13) |
| 38 | sys004-A11-posJ.html | A11 | FAIL | FAIL | catch | delete path #10 (12 vs 13) |
| 39 | sys004-A11-posC.html | A11 | FAIL | FAIL | catch | delete paths #10+#9 (11 vs 13) |

Re-pins: NONE. No golden overwritten this session: new files sys004-* throughout (design-explore sys004-einvoice.html / sys004-org.html, sys004-ruler-*.json, sys004-*.visual-check.*); r01-r04, /tmp/r07.json, /tmp/sys003-r07.html byte-untouched. Org first goldens below (no priors, nothing to re-pin).

### Org first goldens (sys003-org-structure.architecture.json, SHA 3e06265a)

Artifact `tools/archify/design-explore/sys004-org.html` sha `22a5e9cc` (705895 B, = D:/tmp/sys003-org.html byte count, deterministic re-render). Ruler @1440x900: A1 PASS (pop 7, vacuous — no lanes/pills), A2 DATA, A3 NA (pop 0), A4 NA (pop 0), A5 DATA, A6 FAIL (global 0.1832), A7 FAIL (overflowY both viewports, 1050 vs 900), A8 PASS, A9 PASS (no frames, vacuous), A10 PASS (worst 12.24 ceo>vp_eng), A11 PASS (7==7), O1a PASS. PNGs: sys004-org.visual-check.{1440x900,2048x1320}.{dark,light}.png + receipt JSON on disk. Matches the SYS-003 booked prediction row-for-row (6 PASS incl. A1/A8/A9/A10/A11/O1a; A6+A7 FAIL/OPEN).


## SEE-006 Layer-2 colour gate: P1/P2/P3 (OSM-SEE-006, 2026-09-13)

Gate `tools/archify/scripts/colour-assert.mjs` (colour science + P1/P2/P3, populations, N=0 NA) over pixels from `tools/archify/archify/renderers/shared/png-pixels.mjs` (sole pngjs importer; reader npm pngjs 7.0.0 UNMODIFIED, MIT). Floors: P1/P2 CIEDE2000 >= 1.0 (JND); P3 drift <= 2.0 (reproduction tolerance). Contrast reported diagnostic-only (WCAG 2.2 SC 1.4.11 context), never a verdict. Rects via `tools/archify/design-explore/see006/see006-probe.mjs` (CDP getBoundingClientRect, DSF=1) on `design-explore/sys004-einvoice.html` (sha `810bf09c`, byte-untouched — SYS-004 PNGs reused, receipt `sys004-einvoice.visual-check.json`).

### Four runs (e-invoice, both themes, both sizes)
| run | P1 pop/fails | P2 pop/fails | P3 pop/fails | page margin / svg-gap |
|---|---|---|---|---|
| 1440x900 light | FAIL 16/16 | FAIL 18/18 | FAIL 19/19 | #f2f2f7 / #ffffff |
| 1440x900 dark | FAIL 16/4 | FAIL 18/6 | FAIL 19/12 | #000000 / #1c1c1e |
| 2048x1320 light | FAIL 17/17 | FAIL 18/18 | FAIL 19/19 | #f2f2f7 / #ffffff |
| 2048x1320 dark | FAIL 17/5 | FAIL 18/6 | FAIL 19/12 | #000000 / #1c1c1e |
Light: canvas/lane/card all #ffffff (dE 0.00 every pair) — region frames are `fill: transparent` (`.c-region` rule in the delivered HTML), so only the hairline stroke distinguishes lanes. Dark: page/lane pairs dE 0.00 (wash over identical base); lane/card PASS dE 2.52-3.77 (cards #242426); P3 page+lanes dE 0 (pipeline exact), cards dE 2.52 (preset lighten, not the dark token). P3 light: canvas 3.64 + cards 2.25 vs tokens (no white token exists). Excluded thin-sample pairs: 2/1 (named in report).

Predictions audit: (1) P1 FAILS light — CONFIRMED (dE 0.00, stronger than predicted). (2) P2 FAILS light — CONFIRMED. (3) dark PASSES both — FAILED (page/lane dE 0.00 both sizes; premise wrong: dark canvas IS #1c1c1e, not far from lanes; lane/card half passes as predicted). 1 of 3 wrong — no stop. Instrument vindicated by P3-dark-page dE 0 + margin checks.

### Calibration set (synthetic 480x360 PNGs, `design-explore/see006/calib/`, builder `see006-calib.mjs` self-checks predicted==actual or exits 1)
Palette (searched): NEG #080808/#161616 dE 3.02; POSJ #080808/#0c0c0c dE 0.66; POSC #c8c8c8; P3 roles P #8c8c8c L #dcdcdc C #3c3c3c; driftJ #858585 dE 2.50; driftC #767676 dE 8.29.
| # | fixture | target | predicted | actual | catch | false-pos | construction |
|---|---|---|---|---|---|---|---|
| C1 | see006-C1.png | P1 | PASS | PASS | - | 0 | NEG pair, no border |
| C2 | see006-C2.png | P1 | FAIL | FAIL | 1 | - | POSJ pair (dE 0.66, just under 1.0) |
| C3 | see006-C3.png | P1 | FAIL | FAIL | 1 | - | POSC identical pair |
| C4 | see006-C4.png | P2 | PASS | PASS | - | 0 | NEG pair + 2px contrasting border |
| C5 | see006-C5.png | P2 | FAIL | FAIL | 1 | - | POSJ pair + border (border must not save it) |
| C6 | see006-C6.png | P2 | FAIL | FAIL | 1 | - | POSC identical + border |
| C7 | see006-C7.png | P3 | PASS | PASS | - | 0 | token-exact roles, pairwise distinct |
| C8 | see006-C8.png | P3 | FAIL | FAIL | 1 | - | page drift dE 2.50 (just over 2.0) |
| C9 | see006-C9.png | P3 | FAIL | FAIL | 1 | - | page drift dE 8.29 (clearly over) |
| C10 | see006-C10.png | ALL | NA | NA/NA/NA | - | - | flat #808080, zero surfaces |

Catch-rate: 6/6 = 100.0% (P1 2/2, P2 2/2, P3 2/2). False-alarm-rate: 0/3 = 0.0%. Emptiness: C10 P1/P2/P3 all NA (N=0 each). Selftest: Sharma 2005 pair1 2.0425 reproduced to 1e-3 + 6 more checks, all pass.

## SEE-007 Layer-2 surfaces connected (OSM-SEE-007, 2026-09-14)

Tokens `archify/renderers/shared/system-tokens.mjs` v1.1.0 -> v1.2.0: `surface.regionLight '#f5f5f7'` (light-ramp alias, own line per acceptance 2) + `surface.regionDark '#2c2c2e'` (generic-dark panel ramp). Mirrored to template `:root` (same literal home; gate-confirmed, never hand-synced). Theme blocks: `+--region-fill` x10 (5 light -> `var(--sys-surface-region-light)`, 5 dark -> `var(--sys-surface-region-dark)`). Rules: `.c-region` fill `transparent` -> `var(--region-fill)`; base `svg` += `background: var(--bg-surface-primary, var(--bg))` (the picture's page reader). Palette-only: floors untouched (P1/P2 1.0, P3 2.0; ruler 12/6), geometry untouched (fresh-HTML body sha8 `e2ba6e0e` == sys004 body sha8; probe rects identical both viewports).

Fault-1 adjudication (evidence over dispatch text): dispatch "no reader" is verbatim FALSE — `bg-surface-primary` hits 14 = 10 declarations + 4 chrome readers (`.header`, `.guided-views`, `.diagram-container`, `.cards .card`) — but substantively TRUE for the picture: no SVG/canvas rule read it, and the `.diagram-container` reader is overridden by the later `.diagram-container { background: var(--panel) }` (live computed: container white vs body `#f2f2f7`). Ruled KEEP (chrome readers legitimate) + picture reader added (svg background). Faults 2-3 confirmed verbatim (`.c-region { fill: transparent; ... }` line; `.c-lane` reads `--lane-fill` on the undrawn class; zero `region-fill` hits pre-fix). `.c-lane` vs `.c-region` ruled BOTH SURVIVE: different diagram jobs (`render-workflow`/`render-dataflow`/`render-sequence` emit `c-lane` stages/lanes/segments; `render-architecture` emits `c-region` boundaries) — the bug was the good colour living only on `c-lane`, fixed by giving `c-region` its own token, not by merging classes.

SEE-006 P3 question answered YES: P3 flagged the light page — row `{"surface":"page","n":387,"sampled":"#ffffff","declared":"#f2f2f7","de00":3.64,"verdict":"FAIL"}` (`see006/run-1440x900-light.json`). No page-coverage hole; the hole was the mirror gate (byte-equality green while pixels unreached) plus the missing frame token. Closed: P3 roles page/frame/card (`--role-frame`, `--role-lane` legacy alias; labels `lane:`->`frame:`, `page/lane:`->`page/frame:`, `lane/card:`->`frame/card:`); mirror gate section 6 readership (each `--sys-surface-*` read via `var()` outside `:root`; each of `--bg-surface-primary`/`--region-fill`/`--lane-fill` keeps a non-declaration reader). Demo with the REAL gate binary: fixture template with `.c-region` reverted to transparent -> `VISUAL LINT FAIL — 1 checks failed: theme surface --region-fill has a picture reader` (48/49); real files -> `VISUAL LINT PASS — 49/49 checks (tokens v1.2.0)`.

### Four fresh runs (see007/see007-einvoice.html, style-swapped, body-identical; PNGs fresh, SEE-006 PNGs before-only)
Roles light page `#f2f2f7` / frame `#f5f5f7` / card `#ffffff`; dark page `#1c1c1e` / frame `#2c2c2e` / card `#1c1c1e` (dark-card 2.52 drift kept, OPEN).
| run | P1 pop/fails | P2 pop/fails | P3 pop/fails | svg-gap / margin |
|---|---|---|---|---|
| 1440x900 light | FAIL 16/4 | PASS 18/18 | PASS 19/19 | `#f2f2f7` / `#f2f2f7` |
| 1440x900 dark | FAIL 16/4 | PASS 18/18 | FAIL 19/12 | `#1c1c1e` / `#000000` |
| 2048x1320 light | FAIL 17/4 | PASS 18/18 | PASS 19/19 | `#f2f2f7` / `#f2f2f7` |
| 2048x1320 dark | FAIL 17/5 | PASS 18/18 | FAIL 19/12 | `#1c1c1e` / `#000000` |
Before -> after: light P2 0/18 -> 18/18, P3 0/19 -> 19/19 (all dE 0.00); dark P2 12/18 -> 18/18, P3 frames dE 0.00 vs the new `#2c2c2e` token; P1 fails collapse 16-17 -> 4-5, every residual explained, none a palette failure: 4x nested same-fill rings (`page/frame:CS Team|BUM|MD|Client & Supplier`, parent fill sampled as the page side — pre-documented SEE-006 instrument note, fills identical by design) + 1x dark-2048 shadow-touch (`frame/card:request #262628 vs #242426` dE 0.63, drop-shadow blend inside the 2..8px near band; the far-band same pair PASSES 2.53). P1-page/frame far equivalents all PASS (light 1.63, dark 5.04); frame/card touch PASS light 2.25 x12.

Predictions audit: (1) frame off zero via transparent removal — CONFIRMED (light `#ffffff`->`#f5f5f7`, dark `#1c1c1e`->`#2c2c2e`, P3 frame rows dE 0.00; no stop). (2) owned light values fail the P1 floor — FAILED honestly (tint vs light dE 1.63 clears 1.0; P2 page/frame 6/6 PASS both sizes; no new page colour proposed, none needed). (3) P2 passes with a real frame fill — CONFIRMED (light 18/18 FAIL->PASS, dark 12/18->18/18).

Re-pins declared with reasons (method/vocabulary changed, never rubber-stamped): (a) P3/P1/P2 role labels `lane:`->`frame:` etc. (SEE-006 misnamed frames after workflow vocabulary; verdict-safe — calib re-run 10/10 green, content-identical grades). (b) light card role `#f5f5f7`->`#ffffff` (true mask/panel fill; SEE-006 booked "no white token exists" — the white IS `--panel`, now declared). (c) frame roles are NEW tokens (`regionLight #f5f5f7`, `regionDark #2c2c2e`; dark-card declared stays `#1c1c1e` so the 2.52 drift signal is preserved, not goal-posted). Floors UNMOVED everywhere. Shape re-pins: NONE.

Shape-gate regression (no-regress): ruler @1440x900 on the fresh file -> `A1:PASS A2:DATA A3:DATA A4:FAIL A5:DATA A6:FAIL A7:PASS A8:PASS A9:FAIL A10:PASS A11:PASS O1a:FAIL`, verdict-identical to `sys004-ruler-einvoice.json`. Probe rects identical both viewports (6 frames, 12 cards). Lint gate 49/49 (was 36/36; +13 readership/mirror checks). Calib 10/10 re-run green. sys004/* files byte-untouched (fresh files live under `design-explore/see007/`).

## OPEN (SEE-006 carried forward, zero work)
- (1) A9 floor-zero, still unexplained. SYS-004 report records worstFloor 0 on frame MD (quote: "Measured floor: worst 0px ... Four frames breach: Sales 8.25, CS Team 8.25, MD 0, Client and Supplier 0. BUM clears at 35.08." — `docs/report/amendment-c_OSM-SYS-004_20260913_59925f65.md` Results; producer `tools/archify/scripts/geometry-assert.mjs` via `tools/archify/sys004-ruler-einvoice.json`, worstFloorFrame MD, worstSpread 30.25 Accounting). Side-level attribution for the zero lives in that JSON's per-frame rows. STOP.
- (2) Frame-model gap (engine no frame model, Benji-ruled).
- (3) A2/A3/A5 DATA w/o values.
- (4) A6-global zero coverage.
- (5) Three transport failures one item.
- (6) Hash self-cert limits.
- (7) eli21 quoted-tag defect (SYS-004 brace-neutering used, declared).
> Superseded by ## OPEN (SEE-011 consolidated) at the end of this file — the only list. This block is history.

## SEE-008 Dark label-box + arrowhead direction + drift close (OSM-SEE-008, 2026-09-14)

O1 label box: `archify/assets/template.html` mask rule `rect[data-graph-role="structural-frame-label-mask"] { fill: var(--bg); }` -> `{ fill: var(--region-fill); }`. The frame surface comes from the token file (`--region-fill` reads `var(--sys-surface-region-dark/light)`, tokens v1.2.0 UNCHANGED, mirror block untouched, gate 49/49). Mask-vs-frame distance (new P3-labelbox rows): dark dE 11.31 -> 0.00, light dE 1.63 -> 0.00. Light page/frame far pair keeps dE 1.63 (P2 rows byte-identical old vs new); no light value touched. Prediction 1 CONFIRMED (fresh dark PNG: black boxes gone; zoom crops show labels on bare frame).

O2 A12 ARROWHEAD_DIRECTION in `scripts/geometry-assert.mjs` (page-side rows + verdict, roster line now A1..A12+O1a, tool string `+ SEE-008 A12`). Rule: head end-tangent vs the last composition leg long enough to mount a head (>=15 SVG units = markerWidth 10 at the standard 1.5 stroke, template marker defs; shorter finals are dock pads). Slack 30deg = 2.5x the max observed good deviation 12.1deg (old-v3 reject Q-easing, live). Population rule holds (N=0 -> NA). Drawing site named: marker defs in template `<defs>` (`orient="auto"` throughout); `marker-end` attached per edge by `render-architecture.mjs` renderConnection (dataflow/lifecycle/sequence/workflow twins alike); the wrong-way heads came from the ROUTED end-hook (layout-engine same-row-feedback bottom/bottom + 14px terminals), not from the marker. Fix at that source: same-row feedback now enters the target facing side (5-point route: stub, below-deck run, corridor riser, 20px final; corridor guard 56px falls back to old shape; different-row branch untouched). c12/c13 finals 14px-up -> 20px-horizontal; heads UP -> LEFT along the row. Stub end ruled: c12 start `M531,203` short down-stub keeps no head (heads live only at marker-end by SVG convention) — explained, kept by design, booked.

A12 calibration: old picture (see007) FAIL 2x90deg (`match>request` off 322px piece, `md_signoff>costing` likewise) — prediction 2 CONFIRMED; sys004-einvoice (same body) FAIL 2, second witness; sys004-org (treeless 7 edges) PASS 7, no false alarm; fresh picture (see008) PASS 13/13 worst 0deg. v3-old file FAILs 3 (incl `signoff>precheck` off 140px) — OBSERVED but ungraded: superseded pre-PORT-11 artifact (current A10 already FAILs it 13/13 inside); re-render routes its loops via the untouched globalMarginY branch, out of scope. Quote-entry 16px hook passes (side-entry, +1px margin noted as watch). Colour calib re-run 10/10 green (fixtures carry no pills; P3-labelbox adds rows only where pills exist).

P3-labelbox in `scripts/colour-assert.mjs`: per pill 3px interior ring (avoids text), declared = frame role. Dark labelbox dE 11.31 (sampled `#000000`, apple-hig `--bg`) -> 0.00 (`#2c2c2e`); light 1.63 -> 0.00. P3 population 19 -> 25; dark verdict FAIL 12 -> PASS 25/25 all four runs.

O3 drift: cause named — apple-hig-dark hand-written kind washes (`rgba(255,255,255,0.04)`, security 8% red) over the opaque `--mask #1c1c1e` deliver `#242426` against declared `#1c1c1e` (exact math gives `#252527`; 1 tick is Chromium compositing). Prediction 3 CONFIRMED (wash skipped the token file). Fix at source: the 7 washes -> `var(--mask)` (apple-hig-dark only; every other preset and all light values byte-untouched). Dark cards now `#1c1c1e` dE 0.00 x12 both sizes; P1 2048-dark shadow-touch residual (`frame/card:request` 0.63) gone with the wash (5 -> 4 fails, explained).

### Four fresh runs (see008/see008-einvoice.html sha `cd6d0e3c`, 720715 B; body differs from see007 ONLY in the two loop routes + style block)
Roles unchanged (light page `#f2f2f7` / frame `#f5f5f7` / card `#ffffff`; dark page `#1c1c1e` / frame `#2c2c2e` / card `#1c1c1e`). Floors UNMOVED everywhere (P1/P2 1.0, P3 2.0, ruler 12/6, A9 spread 6, A4 24).
| run | P1 pop/fails | P2 pop/fails | P3 pop/fails | svg-gap / margin |
|---|---|---|---|---|
| 1440x900 light | FAIL 16/4 | PASS 18/18 | PASS 25/25 | `#f2f2f7` / `#f2f2f7` |
| 1440x900 dark | FAIL 16/4 | PASS 18/18 | PASS 25/25 | `#1c1c1e` / `#000000` |
| 2048x1320 light | FAIL 17/4 | PASS 18/18 | PASS 25/25 | `#f2f2f7` / `#f2f2f7` |
| 2048x1320 dark | FAIL 17/4 | PASS 18/18 | PASS 25/25 | `#1c1c1e` / `#000000` |
Before -> after: dark P3 12 fails -> 0 (cards 2.52 -> 0.00, labelbox 11.31 -> 0.00); light labelbox 1.63 -> 0.00; P1 residuals otherwise identical (4 nested same-fill rings + dark-2048 CS/Client 0.32 pair-touch, pre-documented classes). Fresh PNGs: `see008-einvoice.visual-check.{1440x900,2048x1320}.{dark,light}.png` + receipt JSON + contact sheet, all under `tools/archify/design-explore/see008/` (15 files: HTML, 4 PNG, receipt, contact sheet, 2 probes, 4 runs, 2 rulers).

Shape-gate regression @1440x900: `A1:PASS A2:DATA A3:DATA A4:PASS A5:DATA A6:FAIL A7:PASS A8:PASS A9:FAIL A10:PASS A11:PASS A12:PASS O1a:FAIL` vs old `... A4:FAIL ... (no A12) ...`. Deltas: A4 FAIL->PASS (retry label now 9.51px off-wire on the corridor run; improvement, same floor); A12 new (FAIL->PASS across the fix); everything else verdict-identical, A9 detail bit-identical except CS Team spread 0.65->0.55 (improvement). @2048x1320 (first baseline for this file): same verdict set except O1a PASS (px floors clear at larger scale) and A9 headline MD floor 0 (same booked zero family; Sales 8.25 at 1440). No backsliding anywhere (FAIL set shrank 4 -> 3).

Re-pins declared with reasons: floors NONE (unmoved). Role labels NONE (P3 `labelbox:` rows are additive; calib 10/10). Geometry: c12/c13 routes changed (the fix; no golden overwritten — fresh files live under `design-explore/see008/`, sys004/see006/see007 byte-untouched). Instruments extended additively (A12 block+roster, P3-labelbox block); tool string carries `+ SEE-008 A12`.
Evidence move (OSM-SEE-009, 2026-09-14): the two SEE-008 files left in `temp/` moved to lasting homes under `tools/archify/design-explore/see008/` — `see008-a12-old.json` (old-picture A12 FAIL record, 21975 B, parses, verdicts `A1:PASS A2:DATA A3:DATA A4:FAIL A5:DATA A6:FAIL A7:PASS A8:PASS A9:FAIL A10:PASS A11:PASS A12:FAIL O1a:FAIL`) and `see008-new-retry.png` (50550 B, byte-identical across the move). `temp/` no longer holds them. The filed SEE-008 report is NOT re-issued; this note is the forwarding record.


## OPEN (SEE-008 carried forward, zero work)
- (1) A9 floor-zero, still unexplained. SYS-004 report records worstFloor 0 on frame MD (quote: "Measured floor: worst 0px ... Four frames breach: Sales 8.25, CS Team 8.25, MD 0, Client and Supplier 0. BUM clears at 35.08." — `docs/report/amendment-c_OSM-SYS-004_20260913_59925f65.md` Results; producer `tools/archify/scripts/geometry-assert.mjs` via `tools/archify/sys004-ruler-einvoice.json`, worstFloorFrame MD, worstSpread 30.25 Accounting). Side-level attribution for the zero lives in that JSON's per-frame rows. STOP.
- (2) Frame-model gap (engine no frame model, Benji-ruled; now visible as stacked Sales/Accounting/CS-Team labels top-left of both fresh PNGs).
- (3) A2/A3/A5 DATA w/o values.
- (4) A6-global zero coverage.
- (5) Three transport failures one item.
- (6) Hash self-cert limits.
- (7) eli21 quoted-tag defect (brace-neutering used, declared).
- (8) Quote-entry 16px hook watch (A12 passes with 1px margin; side-entry, reads fine; re-check if its route ever re-lays).
- (9) Edge-label c-mask pills (retry/reject label boxes read frame-mismatched in dark: `--mask #1c1c1e` on `#2c2c2e` frame) — observed, not in scope (O1 named only the frame-label box; `--mask` must stay card-equal).
- (10) Different-row feedback still bottom-enters via the globalMarginY branch (untouched); A12 will flag any turned short hook there in a future session.
> Superseded by ## OPEN (SEE-011 consolidated) at the end of this file — the only list. This block is history.

## SEE-009 Margin balance + ruler sees sublabels/cards + repeated-point route judged (OSM-SEE-009, 2026-09-14)

O1 A13 MARGIN_BALANCE in `scripts/geometry-assert.mjs` (rendered content union page-side reusing n.card/frame boxes, verdict block, roster now A1..A13+O1a, tool string `+ SEE-009 A13/A3-feed`). Rule: rendered |left gap - right gap| <= 5% of viewport width (CSS px at declared viewport; top/bottom reported only). Magnitude = 3x the A4 24px CSS-px nearness floor at the 1440 reference viewport (24/1440 ~= 1.7%); page-share form so the bound travels without retuning. Population rule holds (N=0 -> NA). A8 untouched (0.50 floor byte-identical). Prediction 1 FALSIFIED: watchdog is exactly centred — @1440x900 left 121.78px vs right 121.78px (diff 0, tol 72, page 1440); @2048x1320 left 406.23 vs right 406.22 (diff 0.01, tol 102.4). A8-style SVG-unit margins agree (lanes x40 w640 in 720 viewBox = 40/40). The check itself fires elsewhere: A13 FAIL on aben-kkse-agent-flow (left 108.19 vs right 352.91, diff 244.72), chart1-boot-workflow (296.33 vs 482.34, diff 186.01), einvoice-order-flow (108.18 vs 352.91, diff 244.73) — all also A7 overflowY FAIL; charts untouched, booked as watch (left-packed placement vs centred template; root cause in layout/template, out of scope). 17 PASS, 2 NA (ref-chart-1/2, no population).

O2 A3 feed: `node-sublabel` + `node-card` join the collision list (old list: node-title + lane-header + boundary-label; new list adds the two). Sublabel boxes were collected page-side all along (`n.sub`) but never checked — `sublabel`/`data-node-sublabel` grep over geometry-assert.mjs returns zero hits both (exit 1), so nothing read them. Corpus re-run @1440x900, 23 charts (incl the mid-session watchdog v2), charts unedited: 3 NEW hits, all old damage now visible — einvoice-order-flow-v3 edge 11 `mismatch retry cap 2` vs node-card:request; sys002-spike r01+r02 edge 12 `reject` vs node-card:md_signoff. No new sublabel hits corpus-wide (subs never geometrically collide). Watchdog A3 unchanged (same 4 boundary/lane hits). Prediction 2 CONFIRMED. Full old/new lists in `tools/archify/design-explore/see009/see009-corpus-a3-a13.json`.

Repeated words ruled ALLOWED, one place: node sub `claimed + logged` (line 5705, y627, t-muted node context) vs edge-10 wire label (line 5756, y652, t-arrow-emphasis) are 25px apart in different layers answering different questions (what the node asserts vs what the wire carries) — consistent wording, not error; the fed ruler examined the pair live and reports no overlap. A text-equality rule would need a semantic layer the geometry ruler has no precedent for and would flag legitimate consistency; rewording the chart would invent domain wording with no follow-up channel. Geometric harm of this class is now covered by exactly one mechanism: the A3 sublabel feed (this session). No chart edit, no new check.

O3 A12 vs the repeated-point route: JUDGED, not skipped. Edge 10 legs 21/0/51px pick the 51px last leg, head 0deg off it; A12 PASS 13/13 both before and after. Prediction 3 FALSIFIED — the zero leg sits mid-route where the last-leg rule never looks; no A12 hole, no A12 change. The point itself fixed at source: watchdog lines 5585+5586 deduped (`625,641;625,662;625,662;625,713` -> `625,641;625,662;625,713` and the identical edge-11 twin `625,765;625,786;625,786;625,837` -> `625,765;625,786;625,837`), artifact sha `6587cb69` -> `dea52271`, verdict sets identical pre/post (A12 still judges both: 0deg/51px). v2 line 5595 carries the same twin — booked, untouched (appeared mid-session, outside dispatch).

### Fresh runs (see009/watchdog-local-cloud-flow, sha `dea52271`, post-fix)
Final verdicts both sizes: `A1:FAIL A2:FAIL A3:FAIL A4:FAIL A5:FAIL A6:FAIL A7:FAIL A8:NA A9:FAIL A10:FAIL A11:PASS A12:PASS A13:PASS O1a:FAIL` (pre/post chart-fix identical; A13 new). Fresh PNGs: `see009-watchdog.{1440x900,2048x1320}.{light,dark}.png` + run JSONs `see009-watchdog-{1440x900,2048x1320}.json` + corpus record `see009-corpus-a3-a13.json`, all under `tools/archify/design-explore/see009/` (7 files).

Re-pins declared with reasons: floors NONE (unmoved — A8 0.50, A9 12/6, A4 24, colour P1/P2/P3 untouched). Role labels NONE. Geometry: watchdog routes c10/c11 deduped (the fix; v2 + all other charts byte-untouched). Instruments extended additively (A13 block+roster, A3 list +2 members, threshold text names them, floor still 0); tool string carries `+ SEE-009 A13/A3-feed`.

## OPEN (SEE-009 carried forward, zero work)
- (1) A9 floor-zero, still unexplained. SYS-004 report records worstFloor 0 on frame MD (quote: "Measured floor: worst 0px ... Four frames breach: Sales 8.25, CS Team 8.25, MD 0, Client and Supplier 0. BUM clears at 35.08." — `docs/report/amendment-c_OSM-SYS-004_20260913_59925f65.md` Results; producer `tools/archify/scripts/geometry-assert.mjs` via `tools/archify/sys004-ruler-einvoice.json`, worstFloorFrame MD, worstSpread 30.25 Accounting). Side-level attribution for the zero lives in that JSON's per-frame rows. STOP.
- (2) Frame-model gap (engine no frame model, Benji-ruled; stacked Sales/Accounting/CS-Team labels top-left of see008 PNGs; watchdog fresh PNGs show the same in-lane left-hug — likely what read as page-level shove).
- (3) A2/A3/A5 DATA w/o values.
- (4) A6-global zero coverage.
- (5) Four transport failures one item (SEE-008 amendment late + 3 prior; this session: 2 transient CDP port clashes self-healed on serial retry, plus headless --screenshot write-lag of one command).
- (6) Hash self-cert limits.
- (7) eli21 quoted-tag defect (brace-neutering used, declared).
- (8) A13-FAIL trio watch (aben 244.72, chart1-boot-workflow 186.01, einvoice-order-flow 244.73 @1440): left-packed placement or genuine shove — root cause in layout/template, charts untouched.
- (9) A3 new-hit trio booked as old damage (v3 edge-11 vs request card; r01/r02 edge-12 vs md_signoff card): chart-geometry fixes out of scope.
- (10) Watchdog v2 (appeared mid-session 15:44, 18 edges, same repeated-point twin at line 5595, A3 FAIL 5, A13 PASS diff 0): outside dispatch, untouched.
> Superseded by ## OPEN (SEE-011 consolidated) at the end of this file — the only list. This block is history.

## SEE-010 Internal balance + label clearance + pair moved apart (OSM-SEE-010, 2026-09-14)

O1 A14 INTERNAL_BALANCE in `scripts/geometry-assert.mjs` (page-side rows from boundaryRects line-316 frames + card boxes, verdict block, roster now A1..A15+O1a, tool string `+ SEE-010 A14/A15`). Rule: per held frame |left gap - right gap| (inner edge to nearest held card, card-centre membership same test as A6) <= 10% of the frame's own width. Magnitude = 2x the A13 5% page-share: frame imbalance and page imbalance are independent errors that can stack in the same direction. Share-of-width form so the bound travels without retuning. Cardinals recorded by name (A9 p1who/p2who habit: leftWho/rightWho/topWho/bottomWho); top/bottom reported only. Population rule holds (frame holding no cards -> NA, never PASS). Prediction 1 CONFIRMED: watchdog FAILs 7/7 on first run — worst lane-5 left 1007.62px (verify_proof) vs right 16.82px (verify_proof), diff 990.80 > tol 119.64 @1440x900; @2048x1320 worst lane-5 diff 1023.19 > 123.55. Sanity anchor: sys004-einvoice architecture frames read 0.00% share (engine centres cards), so the 10% line separates lane-packing from centred frames instead of flagging everything.

O2 A15 LABEL_CLEARANCE in `scripts/geometry-assert.mjs` (page-side rows over the A3 list: node cards + node sublabels, the SEE-009 feed members; verdict block; roster). Rule: every edge label >= 24px box-gap from every node card and every node sublabel. Floor = the A4 nearness floor of 24px (A4 threshold block, pre-SEE-010 line 982): labels live in a 24px world — a label that must ride within 24px of its own wire must keep 24px from everything it does not belong to. A3 asks overlap, A15 asks distance; two checks, one list, by design. Shortest-gap producer named on each leg (cardGap/cardWho, subGap/subWho, minGap/minKind/minWho). Population rule holds (no edge labels -> NA). Prediction 2 CONFIRMED: first run FAILs 3 — key 3 `failover if local down` 1.87px vs card:local_engine, key 10 `claimed + logged` card leg 1.87px vs card:act_remedy with sub leg 24.04px vs sub act_remedy:`claimed + logged` (the repeated pair, both legs quoted), key 11 `proof in 15 min or page` 1.87px vs card:verify_proof. Prediction 3 CONFIRMED: A15 FAILs on 12 architecture charts where A3 reads DATA (never asserted) — e.g. v3 key-11 gap 0.00 vs card:request (the SEE-009 overlap, now measured as touching), sys002 key-12 gap 0.00 vs card:md_signoff; lone A15 PASS is sys003-einvoice-r01.

O3 fix + corpus + re-runs: the repeated pair moved apart, words kept — watchdog edge-10 label slid +13 SVG y down its own vertical wire (rect y 642->655, text y 652->665): key-10 card leg 1.87->26.17px, sub leg 24.04->48.34px, both >= 24; A4 unchanged class (centroid still on-wire, mask still covers wire, verdict FAIL before and after); second-order effect booked — the move also cleared a genuine A3 stroke overlap (edge-10 vs boundary-stroke:lane-4), so watchdog A3 reads FAIL 4 hits -> FAIL 3 hits, remaining three quoted (key-3 vs lane-2 stroke, key-9 vs lane-header, key-11 vs lane-5 stroke). Corpus re-run @1440x900, 23 charts, charts otherwise unedited: A14 FAILs only the 5 lane-workflow charts (aben 2, chart1-boot-workflow 1, einvoice-order-flow 6, watchdog 7, v2 8 lanes) — all lane-packing, old damage; architecture PASS (incl sys004 0.00% shares), NA on chart1-boot-arch pair / sys004-org / ref pair (no held cards). A15 FAILs 17 charts incl the 12 DATA-chart finds above — all old damage now measured; v2 key-15 `claimed + logged` 1.87px vs card:act_remedy is the same repeated-pair class on the untouched twin, booked old damage. NA demonstrated both checks on ref-chart-1 (`no frame holds a card` / `no edge labels to examine`). Post-fix full verdicts identical both sizes (`A1:FAIL A2:FAIL A3:FAIL A4:FAIL A5:FAIL A6:FAIL A7:FAIL A8:NA A9:FAIL A10:FAIL A11:PASS A12:PASS A13:PASS A14:FAIL A15:FAIL O1a:FAIL`, complete true). Fresh PNGs (post-fix watchdog): `see010-watchdog.{1440x900,2048x1320}.{light,dark}.png` + run JSONs `see010-watchdog-{1440x900,2048x1320}.json` + corpus record `see010-corpus-a14-a15.json` + method evidence (probe, raw, pre-edit recon, staged runs, runner cmd), all under `tools/archify/design-explore/see010/` (37 files).

Re-pins declared with reasons: floors NONE (unmoved — A13 5%, A4 24, A9 12/6, A8 0.50, A2 16, colour P1/P2/P3 untouched). Role labels NONE. Geometry: watchdog edge-10 label +13 SVG y (the fix; v2 + all other charts byte-untouched). Instruments extended additively (A14/A15 page-side blocks + return fields + verdict blocks + roster + tool string; pre-edit bytes preserved — reverse-patched probe diff shows minus-lines only on the roster and tool-string lines). Tool string carries `+ SEE-010 A14/A15`.

## OPEN (SEE-010 carried forward, zero work)
- (1) A9 floor-zero, still unexplained. SYS-004 report records worstFloor 0 on frame MD (quote: "Measured floor: worst 0px ... Four frames breach: Sales 8.25, CS Team 8.25, MD 0, Client and Supplier 0. BUM clears at 35.08." — `docs/report/amendment-c_OSM-SYS-004_20260913_59925f65.md` Results; producer `tools/archify/scripts/geometry-assert.mjs` via `tools/archify/sys004-ruler-einvoice.json`, worstFloorFrame MD, worstSpread 30.25 Accounting). Side-level attribution for the zero lives in that JSON's per-frame rows. STOP.
- (2) Frame-model gap (engine no frame model, Benji-ruled; stacked Sales/Accounting/CS-Team labels top-left of see008 PNGs; watchdog fresh PNGs show the same in-lane left-hug — A14 now measures its consequence: lane-0/1 left gaps 3.74px).
- (3) A2/A3/A5 DATA w/o values.
- (4) A6-global zero coverage.
- (5) Five transport failures one item (SEE-009 itemised 4; this session: zero — 26 ruler runs + 4 screenshots, all exit 0 first try).
- (6) Hash self-cert limits.
- (7) eli21 quoted-tag defect (brace-neutering used, declared).
- (8) A13-FAIL trio watch (carried: aben 244.72, chart1-boot-workflow 186.01, einvoice-order-flow 244.73 @1440).
- (9) A3 new-hit trio booked as old damage (carried: v3 edge-11 vs request card; r01/r02 edge-12 vs md_signoff card) — A15 now measures the same faults as gaps (0.00/0.00).
- (10) Watchdog v2 (outside dispatch, untouched; A14 FAIL 8 lanes, A15 FAIL 4 incl key-15 repeated-pair class 1.87px).
- (11) A14 lane-pack watch: every workflow chart FAILs (lanes pack cards to one side by design); A14 measures the consequence honestly — whether left-packed lanes are damage is a per-hit ruling question, not a floor question.
- (12) A15 residual watch: watchdog keys 3/11 (1.87/1.87px), v3 key-12 (18.19px), and the 0.00-touch pair (v3 key-11, sys002 key-12) — chart-geometry fixes out of scope.
> Superseded by ## OPEN (SEE-011 consolidated) below — the only list. This block is history.

## OPEN (SEE-011 consolidated, 2026-09-15) — the only list

Supersedes the five carried-forward blocks (SEE-005, SEE-006, SEE-008, SEE-009, SEE-010), which remain above as history and point here. Benji stops carrying a copy. Each item: number, raising session, one line.

- (1) [FRAME-MODEL] Engine has no frame model (Benji-ruled). Raised SYS-003/004, carried SEE-005 through SEE-010. OPEN — SEE-012 tried the Model: nested compounds render 13 crossings vs flat 0 and fail the renderer gate 18x on e-invoice (3 charts unemittable); reverted, flat restored byte-exact.
- (2) [TRANSPORT] Failure tally, one item. Raised SEE-005 (3), SEE-009 (4: 2 transient CDP port clashes self-healed on serial retry + headless --screenshot write-lag of one command + SEE-008 amendment late), SEE-010 (5: zero new). SEE-011 adds 0: 46 rulers + 46 probes + 92 screenshots + 92 colour runs, all exit 0 first try. OPEN.
- (3) [HASH] Report-hash MATCH self-certification limits. Raised SEE-005. OPEN.
- (4) [ELI21] Quoted-tag defect (brace-neutering used, declared). Raised SEE-006. OPEN.
- (5) [ITEM-10] Card item-10 echo — do NOT define item 10, Benji defines it. Raised SEE-005. OPEN.
- (6) [HOOK] Quote-entry 16px hook watch (A12 passes with 1px margin; side-entry, reads fine; re-check if its route ever re-lays). Raised SEE-008. OPEN.
- (7) [C-MASK] Edge-label c-mask pills (retry/reject label boxes read frame-mismatched in dark: `--mask #1c1c1e` on `#2c2c2e` frame). Raised SEE-008. OPEN.
- (8) [BOTTOM-ENTRY] Different-row feedback still bottom-enters via the globalMarginY branch (untouched). Raised SEE-008. OPEN.
- (9) [A13-TRIO] A13-FAIL trio watch (aben 244.72, chart1-boot-workflow 186.01, einvoice-order-flow 244.73 @1440). Raised SEE-009. OPEN — SEE-011 reproduces all three FAIL @1440x900.
- (10) [A3-TRIO] A3 new-hit trio booked as old damage (v3 edge-11 vs request card; r01/r02 edge-12 vs md_signoff card). Raised SEE-009. OPEN.
- (11) [A14-PACK] A14 lane-pack watch: every workflow chart FAILs (lanes pack cards to one side by design); whether left-packed lanes are damage is a per-hit ruling question, not a floor question. Raised SEE-010. OPEN — SEE-011: all 5 workflow charts FAIL A14 @1440x900.
- (12) [A15-RESID] A15 residual watch: watchdog keys 3/11 (1.87/1.87px), v3 key-12 (18.19px), and the 0.00-touch pair (v3 key-11, sys002 key-12). Raised SEE-010. OPEN — SEE-011 reproduces 17 A15 FAILs @1440x900 (12 architecture), worst gaps tabled in the report.
- (13) [A9-ZERO] A9 floor-zero attribution. Raised SYS-004, carried SEE-005 through SEE-010. CLOSED by SEE-011: MD frame right side 0px (recorded producer edge key 2) and left side 0px (producer 2); Client and Supplier frame right side 0px (producer 4); bit-identical on sys004/see007/see008-einvoice. Wider lane-zero family tabled in the report. Evidence: `tools/archify/design-explore/see011/ruler-*-1440x900.json` A9 allFrames rows.
- (14) [A2A3A5-VALUES] A2/A3/A5 DATA without captured values. Raised SEE-005. CLOSED as a values question by SEE-011: values ARE captured on every architecture chart (populations, worst insets/spreads, violations, modals, outliers — e.g. sys004-einvoice A2: 12 nodes, 12 violations, worst inset 8.26; A5: 13 tips, modal 15, 0 outliers). Promoting the verdict on architecture charts is a Commander design call, not a measurement gap.
- (15) [A6-COVERAGE] A6-global zero coverage. Raised SEE-005. CLOSED as a coverage question by SEE-011: all 23 charts measured (42 FAIL + 4 NA on the empty ref charts, 0 PASS); both legs tabled per chart (best container leg 0.425 v3, best global leg 0.3618 v3, both below the 0.50 floor). The occupancy FAILs themselves are recorded faults; acting on them is the Commander's call in a later session.
- (16) [V2] Watchdog v2 outside-dispatch note. Raised SEE-009. CLOSED as a coverage question by SEE-011: v2 has a full row in the census table; its file is byte-untouched (no chart writes this session — see build-nothing proof in the SEE-011 ledger).
- (17) [NESTED-REVERT] Nested-frame layout reverted (OSM-SEE-012, 2026-09-15). OPEN as a direction question: frames-as-compounds with the line-66 padding pack the Accounting chain at 42px gaps (routes 20px vs the 24px gate floor), cut 13 proper crossings (flat 0), and route the c12/c13 feedback margins through unrelated cards (edge-through-node x6). Any retry needs a Commander-scoped session, not a silent re-attempt. Evidence: `tools/archify/design-explore/see012/` (gate-failure capture, flat/nested renders, 4 ruler JSONs) + filed report.
- (18) [CARD-FIT] Workflow cards grow from text (OSM-SEE-013, 2026-09-15). OPEN as follow-up scope: lifecycle/dataflow/sequence/architecture still shrink-first; author-explicit widths never grown (SYS-001 spec-wins); ceiling min(260 HIG card, lane cap). Evidence: `tools/archify/evals/seeing/SEE-013/index.html` + filed report.

## SEE-011 ledger (OSM-SEE-011, 2026-09-15)

Full-census run: 23 charts (19 top-level deliverables + see007 + see008 + sys002 r01/r02, org chart sys004-org included as a row) x geometry 16 (A1-A15+O1a) at 2 sizes (1440x900, 2048x1320) + colour 3 (P1/P2/P3) at 2 themes x 2 sizes + lint gate global. 46 ruler JSONs + 46 probe JSONs + 92 PNGs + 92 colour JSONs + 1 lint JSON, all under `tools/archify/design-explore/see011/`. Census table (46 rows, NA and DATA counted separately, never folded into PASS): `tools/archify/design-explore/see011/see011-census-table.md` and the filed report.

Re-pins: NONE. No golden overwritten, no threshold moved, no chart fixed, no colour changed. New files live under `design-explore/see011/` only; CALIBRATION gains this ledger + the consolidated block; root CHANGE_LOG gains one line.

Build-nothing proof [Certain]: every instrument opens charts read-only (geometry/probe/screenshot read bytes via CDP or file read; verified: no write call to any chart path). Witness shas from fresh run JSONs match the latest published values — sys004-einvoice `810bf09c`, sys004-org `22a5e9cc`, see008-einvoice `cd6d0e3c`, watchdog `13e8fd24` (SEE-010 postmove). No check crashed (276/276 Chrome-backed runs + 92 CPU runs exit 0), so the crash-repair exception was not used.

Count note [Certain]: the dispatch says twenty-five charts plus the org chart. On disk, top-level `design-explore/*.html` is exactly 25 files — but 6 are ~1.9KB `.visual-check.html` contact-sheet sidecars, not charts — and sys004-org.html is already among the 25. Real census N = 19 top-level deliverables + see007 + see008 + sys002 r01/r02 = 23 including org. Excluded: 6 receipt stubs + 8 experiment fixtures (presetdiff 3, variantaccent-check 5 — preset probes, never in any corpus run). The table names every file run, so prediction 1's reach check is satisfiable row by row.

Predictions audit: (1) FAILs outside the two attention charts — CONFIRMED (e.g. cnc, chart2-orom pair, sys002 pair, sys003 r01/r03, aben, einvoice-order-flow: FAILs across A1/A4/A6/A9/A10/A15; reach proven per-row by artifact sha8 + populations in the JSONs). (2) NA across large parts — CONFIRMED (ref-chart-1/2 all-NA 16/16; A11 NA 34/46 rows; colour NA on chart1-boot pair, refs, sys004-org). (3) A9 zero answerable from existing output — CONFIRMED (quoted from A9 allFrames p1who/p2who, no new measurement).

O2 answers (plain words, from run data): DATA-12 — A15 GATES (asserted true both kinds): 17 A15 FAILs @1440x900, 12 on architecture (DATA-kind) charts, each a gated failure with the worst gap named (table in report); zero known faults sit behind a reporting-only door. A9 zero — MD frame, right side 0px produced by edge key 2 and left side 0px produced by edge key 2 (p2 side: right 0 producer 2, left 0 producer 2, bottom 0.68 producer 12:mid); Client and Supplier frame right side 0px produced by edge key 4. A6 — 0 PASS corpus-wide (42 FAIL + 4 NA); both legs fail everywhere measured. A2/A5 — values captured on all architecture charts (table in report); only the verdict promotion is missing, which is a design call.

## SEE-012 nested frames tried, gated out, reverted (OSM-SEE-012, 2026-09-15)

O1: boundaries became real compound ELK nodes (`frame0..5`, members 3/2/1/1/4/1) carrying the line-66 padding `[top=52,left=18,bottom=32,right=18]` from ENGINE_OPTIONS (not hardcoded); line-40 INCLUDE_CHILDREN governed real compounds; flat kept behind ARCHIFY_LAYOUT=flat / nested=false (buildFlatElkGraph, pre-change body verbatim). O2: e-invoice nested renders ZERO files — renderer layout validation fails 18x (3x Accounting routes 20px vs 24px floor: ELK 42px gaps minus 2x11px PORT; 6x edge-through-node on c12/c13 margin routes; proper-crossing pairs); org nested renders svg-identical to flat (no boundaries, same graph). O3 verdict WORSE → reverted: engine file restored, post-revert render sha8 `cd6d0e3c` == see008 (deterministic behavior identical), grep shows zero SEE-012 remnants. Crossings: e-invoice flat 0 / nested 13; org 0 / 0. Improved cells 0; worsened: 3 e-invoice-family charts go from graded rows to unemittable (6 census rows) + 13 introduced crossings. Drawing code untouched (refusal reported as its own item per O1: frames undrawable as clean pictures, not NaN geometry).

Re-pins: NONE. No threshold moved, no chart touched (all 23 census bytes identical), no colour changed. New files under `design-explore/see012/` only: flat-einvoice.html (= see008, sha8 `cd6d0e3c`), nested-org.html (svg == sys004-org), nested-gate-failures.txt (18 failures), 4 ruler JSONs (flat-einvoice verdicts == see008 rows; nested-org == sys004-org rows, all exit 0). Fresh PNGs: none — nested emitted nothing to shoot; flat/nested-org pixels proven identical to existing see011 PNGs via svg-identity; CLI screenshot vector struck out 3x (fallback booked in report).

Predictions audit: (1) A6 improves, no sweep — UNTESTABLE via ruler (no nested emission); engine-level points the other way (Accounting gaps 42px vs flat 51px+, occupancy would worsen). (2) Something passing fails — CONFIRMED STRONGLY (3 whole charts graded → unemittable; new path demonstrably ran: request pos [79,132] → [107,479], 13 crossings, nested deterministic re-run identical). (3) A9/A10/A12 move — CONFIRMED at engine level (crossings 0 → 13); ruler-level untestable.

Line rulings: line-66 padding — REACHED frames during the attempt (measured on frame nodes), then reverted with the code; KEEP (documents the renderer frame formula; removal would be a new change beyond the revert). Line-40 hierarchyHandling — GOVERNED real compounds during the attempt (frame-relative sections confirmed: same-frame edges frame-relative, cross-frame root-relative, exactly as revive()/sameFrame anticipated); KEEP (harmless on flat, load-bearing for any retry). Double-wrap guard (one component, two boundaries) throws loudly, proven on synthetic spec.

## SEE-013 card-fit: cards grow from text (OSM-SEE-013, 2026-09-15)

O1: workflow `measureNode` sizes implicit cards via new `fittedNodeCardWidth` (`archify/renderers/shared/text-fit.mjs`) built on `minimumNodeTextWidth` at preferred sizes; shrink is the last resort (only at ceiling). Old line: `const width = node.width || layout.nodeW;`. New lines: `const startWidth = node.width || layout.nodeW;` + `const ceiling = node.width || Math.max(startWidth, Math.min(SYSTEM_TOKENS.card.width, laneRoom, neighbourRoom, siblingRoom));` + `const width = fittedNodeCardWidth([...label/sublabel/tag at preferred...], startWidth, ceiling);` (full diff in `archify/renderers/workflow/render-workflow.mjs`). Floor = start width (pinned `layout.nodeW 92` lane-kind geometry; author-explicit widths win per SYS-001 spec-wins and are never grown). Ceiling = room from lane (`2*min(cx-laneX, laneRight-cx)`) + overlapping cross-lane neighbours (8px gate separation, vertical-band overlap test) + same-lane siblings (28px edge floor + 8px separation), at most 260 = `SYSTEM_TOKENS.card.width` v1.2.0 HIG six-column card; at least the start width. Growth never moves edges/columns, never narrows a same-lane span below the edge floor, never touches an overlapping card. Shrink counts: gallery set 23/27 before -> 12/27 after (watchdog 10->4 of 12, v2 13->8 of 15); full workflow corpus 43/87 -> 26/87. Readability floors bind (no floor moved). `layout-engine.mjs` untouched (diff 0 bytes).

O2: gallery at ONE path `tools/archify/evals/seeing/SEE-013/index.html` (NOT docs/gallery/): 9 sections, 18 iframes, 16 before/after files, all 18 links resolve on disk, no placeholders. Every touched chart shown: 2 changed (watchdog 6/12 cards 92->95-114, v2 5/15 cards 92->95-114; Cond-close 92->109, sublabel 6.6->8px) + 6 byte-identical no-change pairs (svg equal, sha8 match both sides). Cond-close close-up with old/new rect+font quotes. Same theme+size both sides (viewBox 720x1024 / 720x1148 identical per pair). Per-chart one-liners on the page. Open-check: browser-daemon screenshot vector failed (shared browser daemon unavailable, transcript-logged); fallback file-proof: 18/18 linked files exist, index parses, after sha8s quoted on page match disk (da8b4fc5, c75e291a), no unresolved placeholders.

O3: full census 8/8 rows @1440x900 verdict-identical, DELTAS: none — zero regressions. O1a watch: worst-context px 6.3->6.6 (watchdog), 6.3->6.5 (v2), still FAIL — floors bind, improvement without a flip. A15 watch: worst gap 1.87 unchanged on both charts (failover-vs-local_engine card leg); the 17 A15 failures were NOT fixed per dispatch. A2: threshold `title inset>=16 all sides` (`scripts/geometry-assert.mjs:1002`) measures titles only — booked as coverage gap, untouched. NA/DATA never folded into pass.

Re-pins: NONE. No threshold moved, no new check, no colour changed, no chart spec touched. New files: `design-explore/see013/after/` (8 renders), `design-explore/see013/ruler-after-*-1440x900.json` (8 rulers, all exit 0), `evals/seeing/SEE-013/` (16 pair files + index), `design-explore/see013/xcover/` (base/withfit/final fault logs — cross-cover proof). Out-of-scope held: no A2 extension, no A15 fixes, no nested retry, no layout-engine touch. Heartbeats: one line per render (8+1), per ruler (8), per cross-cover probe (6+1). Cross-cover: agent-tool-call with-fit faults == baseline faults line-for-line (5 pre-existing, incl external-reply direction/through-node, denied overlap/clearance; only stack-line numbers differ) — the earlier extra too-short fault is gone under the sibling cap. 5 authored-geometry specs + 1 lifecycle spec refuse byte-identically before/after.

Predictions audit: (1) some charts wider/longer — CONFIRMED (watchdog pair cards +2..+22px, svg changed; other 6 byte-identical by design — only the workflow renderer changed). (2) A2 will not notice — CONFIRMED (watchdog A2 FAIL before and after; it reads titles, not sublabels). (3) shrink count drops sharply — CONFIRMED (23->12 set, 43->27 corpus).

## SEE-014 page-fit: the page already fits, the labels moved (OSM-SEE-014, 2026-09-15)

Pre-flight [Certain] (`git log --oneline`, `git ls-files design-explore/ | wc -l`): `design-explore/` committed as `d34b2cfa79c03a0b1543433fe3790f0653044b51` — 791 files — before any other step. No chart can be lost again.

O1 count (before picture, per-chart table in `tools/archify/evals/seeing/SEE-014/index.html` §0): page = svg viewBox in the delivered html; drawing = union of rendered rects; hand/auto = `meta.viewBox` present/absent in the author spec. 9 of 16 authored specs hand-write the page (aben [880,700], chart1-boot pair [960,620], chart1-boot-workflow [900,480], chart2-orom pair [820,780], v3 [924,560], einvoice-order-flow [880,960]); 7 auto-fit (cnc-bus, loop trio, watchdog pair — all render at exactly their auto size: 950x438, 720x900/776/900, 720x1024/1148); 2 engine specs have no author geometry on disk (sys003 pair, structure-only since SYS-003); 2 ref charts are static SVGs with no spec. Empty share (rect-union basis): worst hand chart1-boot-workflow 58.3%, aben 37.3%, einvoice-order-flow 38.1%; engine charts ~10-15% (ruler global-ink basis: v3 ink 0.3618, sys004 0.2259, r01 0.1925 — the ink basis counts painted area, not the rect union, so the two bases differ by construction). Prediction-1 verdict (pre-code): MIXED — suspect 2 carries ~half the corpus, suspect 3 territory confirmed on the other half; both suspects live.

O1 fit: NO renderer change shipped. Candidate 1 (workflow auto-width from widest node edge) reverted: the drawing's widest rect is a 120px edge label at x=564.8, not a card — fitting to it would shrink every lane chart and clip col-5 cards (proven on watchdog-after.html: drawX 2.5–685.2 vs lanes 40–680). Candidate 2 (architecture legend-probe reorder: `let width = Math.ceil(maxX + layout.margin)` → `Math.ceil(Math.max(maxX + layout.margin, legendNeed))`) reverted after proof it is algebraically identical to the existing minWidth branch (wide-legend probe renders 381x271 on both paths; sys003 re-render 1352x613 → 1352x613 byte-identical viewBox). Hand-written slack (chart1-boot-workflow 900x480 vs auto 720x404; aben 880x700 vs auto 720x652) kept as author decisions per spec-wins — NOT resized. Margin stated: 40px HIG empty gutter (`archify/renderers/shared/system-tokens.mjs` v1.2.0 line 30: `empty: 40`, `gutter.empty 40 = HIG 260pt->40pt pairing with card width` lines 12-13). A13 still passing where it passed: 20/23 PASS @1440; the 3 FAILs (aben 244.72, chart1-boot-workflow 186.01, einvoice-order-flow 244.73 — all > tol 72) are lane-layout imbalance, untouched. Out-of-scope held: chart1-boot-workflow toolbar noted, not re-rendered; `layout-engine.mjs` untouched; no new checks/thresholds/colours; no A2 extension.

O2 regression cause [Certain] (quoted lines + `git log --all` + mtimes): the 2026-09-13 00:53→22:09 window has NO commits in `tools/archify` (3 total: clone + a9a7379 2026-08-27 + d34b2cf 2026-09-15) — the change rode the uncommitted working tree (`render-architecture.mjs` mtime 2026-09-13 22:09). Old (`git show a9a7379:...render-architecture.mjs:72`): `boundaryLabelClearance: 4,`. New (working tree line 89): `boundaryLabelClearance: SYSTEM_TOKENS.frameLabel.above, // 34: proximity/grouping rail (was 4)`. Plus the engine path (same file lines 62-72): structure-only specs laid out by `layoutArchitectureStructure` behind the thin interface — v3 carries `pos` (hand-placed, three clean columns: Sales (35,45), Accounting (615,45), MD (341,45), fs 13.0) while sys004 is engine-placed (Sales (65,16), Accounting (65,44), CS Team (65,72) stacked in the 65px column, fs 18.9). Reversal note: the 4→34 rail reverts independently (loses the SYS-003 proximity grouping); the engine path does not revert (it owns all geometry since SYS-003, and hand `pos` is now banned by `validator.mjs:63`). Trade call is the Commander's — no fix applied.

O3 census: 46/46 rows stand on FRESH see011 rulers (mtimes 2026-09-15 10:07–10:11, after the last code writes: workflow renderer 2026-09-15 18:21 prior day is SEE-013's booked change; geometry-assert 2026-09-14 23:06; architecture renderer 2026-09-13 22:09). No re-run needed: zero renderer bytes changed this session (working-tree renderer diff since d34b2cf is SEE-013's card-fit, already booked in the SEE-013 ledger). Verdicts identical to the SEE-011 table (A6: 42 FAIL + 4 NA, 0 PASS; A13: 20 PASS + 3 FAIL + 4 NA counting per-size rows — 46 rows, NA/DATA never folded into PASS). SEE-013 deltas: none beyond SEE-013's own 8-row card-fit scope. Stop rule: nothing changed, nothing to revert — clean no-op pass.

Gallery [Certain] (6/6 PNGs exist on disk + open-check): `tools/archify/evals/seeing/SEE-014/index.html` — 4 sections, 6 per-chart captures @1440x900 light (each chart on its own, never the wrapper) + per-chart one-liners + old/new quotes. Reused see011 PNGs (proven pixel captures of the current bytes: sys004 sha8 `810bf09c` matches the ruler artifact) after the shared browser daemon + Chrome `--screenshot` vectors both struck out (transcript-logged). Heartbeats: one line per chart measured (21 rect-union) + per ruler row (23 A6 + 23 A13 @1440, quoted in the report).

Re-pins: NONE. No threshold moved, no new check, no colour changed, no chart spec touched, no renderer bytes changed (both candidates reverted; `design-explore/see014/` trial renders removed). New files: `evals/seeing/SEE-014/` (index + 6 PNGs) only.

Predictions audit: (1) most charts hand-written — MIXED (9/16 hand, 7/16 auto + 2 engine + 2 static; both suspects live, neither wrong). (2) A6 improves sharply, no sweep — VIOLATED by design (no page resized; A6 stands 0 PASS — the violation is the finding: the empty bands the eye sees are rect-union slack the ink ratio already prices in, and the hand slack is author-owned). (3) something passing fails — VACUOUS (no change shipped; A13 holds 20/23 PASS).

## OPEN (SEE-014 carried forward, 2026-09-15) — the only list

Supersedes the SEE-011 block, which remains above as history and points here. Each item: number, raising session, one line.

- (1) [FRAME-MODEL] Engine has no frame model (Benji-ruled). Raised SYS-003/004, carried SEE-005 through SEE-013. OPEN — SEE-012 tried the Model: nested compounds render 13 crossings vs flat 0 and fail the renderer gate 18x on e-invoice (3 charts unemittable); reverted, flat restored byte-exact.
- (2) [TRANSPORT] Failure tally, one item. Raised SEE-005 (3), SEE-009 (4), SEE-010 (5: zero new). SEE-011 adds 0: 46 rulers + 46 probes + 92 screenshots + 92 colour runs, all exit 0 first try. SEE-014 adds 3 (shared browser daemon unavailable + Chrome headless --screenshot silent no-write + clip-zones CDP timeout; fallback: reused see011 PNGs with sha8 proof). OPEN.
- (3) [HASH] Report-hash MATCH self-certification limits. Raised SEE-005. OPEN.
- (4) [ELI21] Quoted-tag defect (brace-neutering used, declared). Raised SEE-006. OPEN.
- (5) [ITEM-10] Card item-10 echo — do NOT define item 10, Benji defines it. Raised SEE-005. OPEN.
- (6) [HOOK] Quote-entry 16px hook watch (A12 passes with 1px margin; side-entry, reads fine; re-check if its route ever re-lays). Raised SEE-008. OPEN.
- (7) [C-MASK] Edge-label c-mask pills (retry/reject label boxes read frame-mismatched in dark: `--mask #1c1c1e` on `#2c2c2e` frame). Raised SEE-008. OPEN.
- (8) [BOTTOM-ENTRY] Different-row feedback still bottom-enters via the globalMarginY branch (untouched). Raised SEE-008. OPEN.
- (9) [A13-TRIO] A13-FAIL trio watch (aben 244.72, chart1-boot-workflow 186.01, einvoice-order-flow 244.73 @1440). Raised SEE-009. OPEN — SEE-011 reproduces all three FAIL @1440x900; SEE-014 reproduces (same three, untouched).
- (10) [A3-TRIO] A3 new-hit trio booked as old damage (v3 edge-11 vs request card; r01/r02 edge-12 vs md_signoff card). Raised SEE-009. OPEN.
- (11) [A14-PACK] A14 lane-pack watch: every workflow chart FAILs (lanes pack cards to one side by design); whether left-packed lanes are damage is a per-hit ruling question, not a floor question. Raised SEE-010. OPEN — SEE-011: all 5 workflow charts FAIL A14 @1440x900.
- (12) [A15-RESID] A15 residual watch: watchdog keys 3/11 (1.87/1.87px), v3 key-12 (18.19px), and the 0.00-touch pair (v3 key-11, sys002 key-12). Raised SEE-010. OPEN — SEE-011 reproduces 17 A15 FAILs @1440x900 (12 architecture), worst gaps tabled in the report.
- (13) [A9-ZERO] CLOSED by SEE-011 (stays closed; SEE-014 changes nothing).
- (14) [A2A3A5-VALUES] CLOSED as a values question by SEE-011 (stays closed; SEE-014 changes nothing).
- (15) [A6-COVERAGE] CLOSED as a coverage question by SEE-011 (stays closed as coverage; SEE-014 prices the hand slack: chart1-boot-workflow 58.3% rect-union empty is author-owned, not auto-fit waste).
- (16) [V2] CLOSED as a coverage question by SEE-011 (stays closed; SEE-014 changes nothing).
- (17) [NESTED-REVERT] Nested-frame layout reverted (OSM-SEE-012, 2026-09-15). OPEN as a direction question (unchanged by SEE-014).
- (18) [CARD-FIT] Workflow cards grow from text (OSM-SEE-013, 2026-09-15). OPEN as follow-up scope (unchanged by SEE-014).
- (19) [PAGEFIT-NOOP] Page-fit needs author decisions, not renderer math (OSM-SEE-014, 2026-09-15). OPEN as a Commander call: 3 hand charts hold real slack (chart1-boot-workflow 900x480 vs auto 720x404; aben 880x700 vs auto 720x652; einvoice-order-flow 880x960 vs auto 720x900) that only a spec edit (or a Commander fit-to-drawing directive overriding spec-wins) can remove; auto-fit paths already hold the 40px margin. Evidence: `tools/archify/evals/seeing/SEE-014/index.html` §0 + filed report.
- (20) [LABEL-RAIL] Frame-label rail 4→34 + engine placement trade (OSM-SEE-014, 2026-09-15). OPEN as a Commander trade call: reverting the rail to 4 restores v3-style columns but loses the SYS-003 proximity grouping; the engine path cannot revert (owns all geometry; hand pos banned). Evidence: gallery §1 old/new quotes + filed report.
- (21) [BOUNDARY-BOTTOM] boundaryExtraBottom: 20 restored after drop (OSM-SEE-015, 2026-09-17). OPEN as lint-guard follow-up: visual-lint-gate stale-literal guard now FAILs on the restored line itself (48/49); guard needs a restore-aware update or the line needs allow-listing — Commander call, not this session (zero fixes per dispatch). Evidence: ## SEE-015 below + filed report.

## SEE-014-FIX delta (OSM-SEE-014-FIX, 2026-09-16)

Tag rescue/see014-arch-wiring → a160e10 (2026-09-13 21:59:21 +0800) placed before checkout. One-file restore: archify/renderers/architecture/render-architecture.mjs 1088 → 1159 lines, rail 34 at L88, engine path L67-72, diff-vs-a9a7379 non-empty (107+/36-), byte-exact vs WIP. Template preserved (md5 ebbe9a62 unchanged, live blob ≠ WIP blob, zero writes). SEE-013 card-fit intact. Filed-report fixes: A13 20/23 → 18 PASS + 3 FAIL (aben 244.72, chart1-boot-workflow 186.01, einvoice-order-flow 244.73) + 2 NA (ref pair) @1440; line-89 → a160e10 L88 + L67-72 (filed-time live was a9a7379 1088 lines). Spec hunt: no sys004 author spec at top level; twin is sys003-einvoice-structure (SHA 1e80f9cc, zero pos/viewBox, showcase). One showcase re-render → 12 containment errors, zero bytes. Verdict STACKED stated before any other change (masks 65,16/44/72 fs 18.9 vs v3 three columns fs 13.0; both PNGs vision-read). No tuning after. layout-engine.mjs, gallery, A2, slacks, thresholds, colours untouched.

## SEE-015 boundary-bottom restore + position-free render + full checks (OSM-SEE-015, 2026-09-17)

O2a BEFORE [Certain] (live file, one-line fix not yet applied). Hand-placed `design-explore/einvoice-order-flow-v3.architecture.json`: render REFUSED, exit 1 — `assertNoAuthoredGeometry` (shared/validator.mjs:51-76) throws `Authored geometry is banned (SYS-003)` naming 12 `pos` keys + `via`/`labelAt` bypasses (verbatim first line: `architecture components[0] (id: "request") uses "pos" — remove it; the layout engine owns all geometry.`). Position-free `design-explore/sys003-einvoice-structure.architecture.json` (12 comps, 13 conns, 6 boundaries, 0 pos, no layout key, quality showcase): render FAILED exit 1 with exactly the 12 predicted boundary-label errors, verbatim: `Boundary label "Sales" extends outside its final frame` + `... extends outside the viewBox`, repeated for Sales / CS Team / BUM / MD / Accounting / Client & Supplier (external). Root cause [Certain]: dropping line `height: maxY - minY + topPad + layout.boundaryExtraBottom,` (render-architecture.mjs L150) with the field undefined — `number + undefined = NaN`, so every frame height is NaN and every pill fails both `rectContains` legs. Confirmed `boundaryExtraBottom` absent from the live L75-95 layout block and present in the pinned blob (`git -C tools/archify show a9a7379:...render-architecture.mjs:70`: `boundaryExtraBottom: 20,` under the 30/50-rule comment).

O1 in one plain sentence [Certain]: the engine ran, placed 12/12 cards + 13 routes, and its work was discarded downstream by NaN boundary geometry — NOT the L411 pos-checker, which pushes 0 errors over the patched arch (render exit 0 proves it).

O2b fix [Certain]: one line at L87 — `boundaryExtraBottom: 20, // restored-after-drop: pinned pre-SYS-003 value from a9a7379` — nothing else in the file touched by this session. Within-file evidence: `git -C tools/archify diff -- archify/renderers/architecture/render-architecture.mjs | grep boundaryExtraBottom` shows `-  boundaryExtraBottom: 20,` (pre-existing restored content vs HEAD) and `+  boundaryExtraBottom: 20, // restored-after-drop: ...` (this session's line). Honest scope note: repo-wide `git diff --stat` shows 64 files (pre-existing uncommitted tree: SEE-014-FIX rescue restore, loop visual-check sidecars, web-app example) — NOT this session's work; the two target specs are untouched (see O2d proof).

O2c AFTER render [Certain]: `node tools/archify/archify/bin/archify.mjs render architecture tools/archify/design-explore/sys003-einvoice-structure.architecture.json D:/tmp/see015/sys003-AFTER.html --quality showcase` → exit 0, `D:/tmp/see015/sys003-AFTER.html` 720715 B, sha8 `8b7768fa`, viewBox `0 0 1352 619`. Automatic-path proof (NOT hand-placed): `isStructureOnlyArchitecture` true, engine placed 12/12, output carries `data-spec-edge-count="13"`, 12 `data-node-id` cards, 13 route paths, 6 `structural-frame-label` pills. Pixels: `node tools/archify/scripts/clip-zones.mjs D:/tmp/see015/sys003-AFTER.html D:/tmp/see015/clip --viewport 1600x1000` → exit 0, 27 zones + full-view.png (128233 B). Read with own eyes: dark viewer, header "e-invoice order flow — from 6 facts to paid (v3 architecture)" with Apple HIG badge and Dark/Present/Export controls; one big rounded frame holding six nested region frames (Sales outermost, then Accounting, CS Team, BUM, MD, Client & Supplier external) with 12 dark cards in a 3-column x 4-row flow (Collect 6 facts → Name+UOM tally? → Confirm supplier price / Costing sheet → Risk tally pass? → Our Quotation / Customer PO → PO = latest Rev? → All 4 tally? + Submit e-invoice / D/O + proforma → Collect per terms), blue left-to-right arrows with two red retry loops, legend bottom-left, PATH/MAP/LENS + zoom bar bottom-center, two explainer cards below ("Facts card", "How to read this in 10 seconds"). Honest ugly verdict: the nested frame labels stack and overlap top-left (known FRAME-MODEL gap, OPEN item 1) — crooked but every cropped label read (node-request "Collect 6 facts / qty, UOM, price + terms" fully legible; boundary crop "Client & Supplier (external)" fully legible).

O2d einvoice AFTER [Certain]: same refusal, exit 1, byte-identical ban class (12 pos + via/labelAt) — the hand-placed path stays unrenderable under the SYS-003 ban, so no silent hand-placement bypass exists and the O2c chart is proven engine-drawn. No-spec-positions proof: `git -C tools/archify status --porcelain -- design-explore/sys003-einvoice-structure.architecture.json design-explore/einvoice-order-flow-v3.architecture.json` returns EMPTY; grep pos-count sys003 = 0, v3 = 12 (unchanged, meta.viewBox [924,560] unchanged, sys003 viewBox still none).

O3 geometry (ruler exit 0 both sizes, complete true; NA counted separately, never folded into PASS) [Certain]:
@1440x900 (`D:/tmp/see015/ruler-1440x900.json`): A1 PASS N=19 (lanes 0, pills 6, paths 13, 0 transits); A2 DATA N=12 (wouldBe FAIL, worst "Customer PO" inset 8.26); A3 DATA N=2 (wouldBe PASS, 0 collisions); A4 PASS N=2 (worst "mismatch retry cap 2" 9.51px); A5 DATA N=13 (wouldBe PASS, modal 15); A6 FAIL N=18 (Accounting occupancy 0.2928 < 0.50); A7 PASS N=31; A8 PASS N=16 (distinct-x 4, ratio 0.82); A9 FAIL N=19 (Sales floor 4.13 < 12); A10 PASS N=13 (worst gap 6.33 request>match); A11 PASS N=14 (rendered 13 == spec 13); A12 PASS N=13 (worst 0deg); A13 PASS N=18 (left 283.38 vs right 282.53, diff 0.85); A14 PASS N=6; A15 FAIL N=2 ("mismatch retry cap 2" crowds "match" 2.32px); O1a FAIL N=32 ("Collect 6 facts" 10.32px < 15px). Totals: PASS 9, FAIL 4, DATA 3, NA 0.
@2048x1320 (`D:/tmp/see015/ruler-2048x1320.json`): same except A2 DATA worst "Costing sheet" 14.57, A4 PASS worst 16.6px, A5 DATA modal 25, A9 FAIL Sales floor 7.19, A10 PASS worst 11.03, A13 diff 1.5, A15 FAIL 3.98px, O1a PASS N=32 (worst "Collect 6 facts" 15px). Totals: PASS 10, FAIL 3, DATA 3, NA 0.
O3 colour (probes via see006-probe.mjs with explicit Chrome path; roles light page #f2f2f7 / frame #f5f5f7 / card #ffffff, dark page #1c1c1e / frame #2c2c2e / card #1c1c1e) [Certain]: 1440x900 light P1 FAIL 18/4 (4 nested same-fill page/frame rings dE 0.00: CS Team, BUM, MD, Client & Supplier) P2 PASS 18/18 P3 PASS 25/25 (all dE 0.00); 1440x900 dark P1 FAIL 18/5 P2 PASS 18/18 (dE 5.04) P3 PASS 25/25; 2048x1320 light P1 FAIL 18/4 P2 PASS 18/18 P3 PASS 25/25 (page #f0f0f5 vs #f2f2f7 dE 0.42); 2048x1320 dark P1 FAIL 18/5 P2 PASS 18/18 P3 PASS 25/25 (page #1e1e21 vs #1c1c1e dE 0.96). Colour totals: PASS 8, FAIL 4, NA 0 (P1 residuals are the pre-documented nested same-fill class, SEE-007 — fixed NOTHING).
O3 lint [Certain]: `node tools/archify/scripts/visual-lint-gate.mjs` → `VISUAL LINT FAIL — 1 checks failed: X arch renderer: no stale boundaryExtraBottom: 20 — stale literal survives`, pass 48/49. The single FAIL trips ON the restored line itself (stale-literal guard predates the restore); booked as-is, zero fixes per dispatch. Visual-check receipt over the new render (`vc-probe-copy.visual-check.json`, 4 fresh PNGs): status fail via the asserted ruler gate (A6, A9, A15, O1a @1440 — same booked FAILs); containment fail @1440x900+1600x1000 (overflowY, scroll 1440x1009) / pass @1920x1080+2048x1320 (A2 cover + page slacks held, NOT chased); readability fail (min 7.57px); viewerChrome pass; captures pass.

Re-pins: NONE. No threshold moved, no check added, no colour changed, no spec touched, no renderer tuning beyond the one restored line. Heartbeats: 02:29:48, 02:33:18, 02:36:02, 02:37:00, 02:38:33, 02:38:41, 02:40:16 UTC.

## SEE-016 frames mean something + preset tidy (OSM-SEE-016, 2026-09-17)

O1 ruler [Certain]: `scripts/geometry-assert.mjs` gains A16 FRAME_CROSSING (pairwise separate|nested|crossing over already-collected boundaryRects, only crossing FAILs; nested = one fully inside the other edges included; <2 frames NA; both names + crossing area per failure) + A17 FRAME_FILL (member-card-covered / frame area per frame, floor 0.50 = the A6 container leg; empty frame NA for that frame; no held frame NA). Roster line now A1..A17+O1a. A7 untouched. Calibration: e-invoice A16 FAIL 4 crossings (Sales x Accounting 177012px2, Sales x Client 50495.55, CS Team x Client 33613.91, Accounting x Client 50495.55) + 7 nested (incl Sales x CS Team 75147.31, CS Team x Accounting 75147.31 — containment not damage); web-app A16 PASS 1 nested (sg-api inside AWS Region 99482.17); org A16 NA (0 frames); grid A16 NA (1 frame) + A17 FAIL 25.51%. E-invoice A17 FAIL thinnest Accounting 29.28% (12 kids), best MD 46.85%.

O2 before-fix-revert [Certain]: corpus = all 18 renderable *.architecture.json (design-explore + archify/examples + examples + docs/gallery/sources + docs/cases + experiments/mco-showcase + archify/test/fixtures/v1-baseline; benchmarks/results + schemas excluded); 4 render pre-fix (sys003-einvoice apple-hig 12/13/6, sys003-org apple-hig 8/7/0, web-app undeclared 10/9/2, repo-grid undeclared 9/8/1), 14 refuse under the SYS-003 authored-geometry ban (verbatim `Authored geometry is banned (SYS-003)`). Before table in `tools/archify/sessions/OSM-SEE-016/before-table.json`. Fix tried (frames ask room: sibling-wraps push-apart + nested-wraps containment, geometry only) then CLEANLY REVERTED per pre-committed stop rule: attempt made crossing WORSE (4 -> 5 crossings: new CS Team x MD 66008.7; Sales x Accounting 177012 -> 644704.97) and fill WORSE (Sales 35.06 -> 16.81%, Accounting 29.28 -> 21.62%) plus A7 PASS -> FAIL (1.83 screens) — revert is the PASS. Renderer diff of the attempt kept at `sessions/OSM-SEE-016/attempt/spread.diff`. OPEN-21 (stacked Sales/Accounting/CS-Team/Client titles) confirmed on both PNGs with own eyes; NOT fixed per dispatch.

O3 preset tidy [Certain]: live census (18 specs): editorial 0 users; signal-flow 4 (checkout base/head, mco both); blueprint 3 (production x2 incl fixture + gallery); apple-hig 3 (sys003 pair + v3); classic-original 0; classic explicit 0 + every undeclared chart stamped classic via cli.mjs:64. Token diff vs default: signal-flow/blueprint/editorial ALL 0 diffs dark, 0 light (signal-flow light omits 5 toolbar vars = falls back to default). Done: editorial block+schema-entry+all 60 template refs removed wholly (template 0 hits; all 5 schemas drop editorial; validators regenerated); signal-flow + blueprint theme blocks emptied to default-aliases (names resolve, zero tokens, no colour change); classic ruled DOCUMENTED-AS-DEFAULT (kept, no own block — it IS the :root fallback) + docs updated (authoring-contract, schemas README, SKILL.md). apple-hig + classic-original untouched. Byte-proof: all 4 charts geometry-identical post-O3 (cards/routes/frames equal); full-file sha differs ONLY by the preset layer (style/menu/preset-attr), e.g. grid before c365ba65 -> after 22b1fb67. Hash pairs in `sessions/OSM-SEE-016/hash-pairs.json`.

Predictions audit: (1) crossing down AND fill up — VIOLATED (both moved wrong; honest revert, stop rule holds). (2) all charts byte-identical post-O3 — REFINED (geometry identical all 4; full-file differs by preset layer only — the acceptance wording meant the preset layer, geometry is the invariant). (3) editorial zero users — CONFIRMED.

Re-pins: NONE. No threshold moved, no colour changed, no spec touched, no floor moved. Renderer file restored to the WIP-tree bytes + the one SEE-015 line (1160 lines). Heartbeats: 04:52:14 through 05:21:23 UTC (see report).

## OPEN (SEE-016 consolidated, 2026-09-17) — the only list

Supersedes the SEE-014 block, which remains above as history and points here. Each item: number, raising session, one line.

- (1) [FRAME-MODEL] Engine has no frame model (Benji-ruled). Raised SYS-003/004, carried SEE-005 through SEE-015. OPEN — SEE-016 spread attempt confirms from the renderer side: pushing sibling frames apart post-hoc grows crossings 4 -> 5 and thins fills; reverted per stop rule.
- (2) [TRANSPORT] Failure tally, one item. Raised SEE-005 (3), SEE-009 (4), SEE-010 (5: zero new). SEE-011 adds 0. SEE-014 adds 3. SEE-016 adds 0: 4 before-rulers + 1 re-run + 1 spread-ruler + 2 clips, all exit 0 first try. OPEN.
- (3) [HASH] Report-hash MATCH self-certification limits. Raised SEE-005. OPEN.
- (4) [ELI21] Quoted-tag defect (brace-neutering used, declared). Raised SEE-006. OPEN.
- (5) [ITEM-10] Card item-10 echo — do NOT define item 10, Benji defines it. Raised SEE-005. OPEN.
- (6) [HOOK] Quote-entry 16px hook watch (A12 passes with 1px margin; side-entry, reads fine; re-check if its route ever re-lays). Raised SEE-008. OPEN.
- (7) [C-MASK] Edge-label c-mask pills (retry/reject label boxes read frame-mismatched in dark: `--mask #1c1c1e` on `#2c2c2e` frame). Raised SEE-008. OPEN.
- (8) [BOTTOM-ENTRY] Different-row feedback still bottom-enters via the globalMarginY branch (untouched). Raised SEE-008. OPEN.
- (9) [A13-TRIO] A13-FAIL trio watch (aben 244.72, chart1-boot-workflow 186.01, einvoice-order-flow 244.73 @1440). Raised SEE-009. OPEN.
- (10) [A3-TRIO] A3 new-hit trio booked as old damage (v3 edge-11 vs request card; r01/r02 edge-12 vs md_signoff card). Raised SEE-009. OPEN.
- (11) [A14-PACK] A14 lane-pack watch: every workflow chart FAILs (lanes pack cards to one side by design); whether left-packed lanes are damage is a per-hit ruling question, not a floor question. Raised SEE-010. OPEN.
- (12) [A15-RESID] A15 residual watch: watchdog keys 3/11 (1.87/1.87px), v3 key-12 (18.19px), and the 0.00-touch pair (v3 key-11, sys002 key-12). Raised SEE-005. OPEN.
- (19) [PAGEFIT-NOOP] Page-fit needs author decisions, not renderer math (OSM-SEE-014, 2026-09-15). OPEN as a Commander call. Evidence: `tools/archify/evals/seeing/SEE-014/index.html` §0 + filed report.
- (20) [LABEL-RAIL] Frame-label rail 4→34 + engine placement trade (OSM-SEE-014, 2026-09-15). OPEN as a Commander trade call. Evidence: gallery §1 old/new quotes + filed report.
- (21) [BOUNDARY-BOTTOM] boundaryExtraBottom: 20 restored after drop (OSM-SEE-015, 2026-09-17). OPEN as lint-guard follow-up (48/49; guard trips on the restored line itself). Evidence: ## SEE-015 above + filed report.
- (22) [OPEN-21] Stacked frame titles persist (Sales/Accounting/CS-Team/Client pile top-left). Raised SEE-008 (frame-model gap), confirmed with own eyes on SEE-016 before + spread PNGs. OPEN — titles NOT fixed per dispatch.
- (23) [A16/A17] Frame-crossing + frame-fill watch: e-invoice A16 FAIL 4 crossings + A17 FAIL (thinnest Accounting 29.28%); web-app nested PASS; org/grid NA proofs. Raised OSM-SEE-016. OPEN.
- (24) [PRESET-TIDY] Preset tidy shipped (OSM-SEE-016, 2026-09-17). CLOSED as work: editorial removed wholly; signal-flow/blueprint alias default; classic documented-as-default; geometry identical all 4 charts. Watch: preset-tryon/animation/guide/viewer-chrome/webm tests still name editorial (untouched per no-suite dispatch) and will fail on the removed name — Commander call.
