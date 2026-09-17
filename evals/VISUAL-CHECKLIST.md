# VISUAL-CHECKLIST.md — frozen per-crop checks (OSM-ARCH-SEE-001)

Applies to every crop emitted by `tools/archify/scripts/clip-zones.mjs`
(node-label, lane-header, boundary-header, edge-label, legend-chip) plus the
full-view (context only — never the verdict source).

## Checks (each Y/N + one-line evidence)

1. **TEXT**: all text in the crop fully legible — no cut, clipped, or
   overflowing glyphs. (Y/N + which string)
2. **KEEPOUT**: no route/line crosses through the zone's text, mask, or
   header strip. Nodes, labels, headers are all keep-out. (Y/N + what crosses what)
3. **MASK**: label pill/mask (rect.c-mask) intact, label readable against it. (Y/N)
4. **HEADER**: header strips clear of through-routes — a route may END at a
   node, never TRANSIT a header strip. (T5 case: the gate→ship "approved"
   route transits the "03 / Release" header strip — FLAG.) (Y/N)
5. **LEGEND** (legend-chip crops only): chip color/glyph matches the node
   kinds used in the diagram. (Y/N)

## Verdict per crop

- **PASS**: all applicable checks Y.
- **FLAG**: any check N, with the failing check number + evidence line.
- Impression verdicts ("looks good", "seems fine", "overall okay") are
  banned — a verdict without check-by-check Y/N is void.

## Judge protocol (frozen)

1. Judge role first: **mimo-v2.5 vision** (existing OSM vision path, zero new
   infra). Fallback: **Qwen-3B rig**. Record which judge ruled each crop.
2. The judge is shown ONLY the crop + the five checks above. It never sees
   the build prompt, the spec JSON, or the full-view before ruling (blind).
3. Verdicts are pasted verbatim into the run record / ledger row — runner
   never paraphrases, never grades.
4. A judge that cannot render a check-by-check verdict abstains (OPEN), and
   the fallback judge is called for that crop.
