# T3 — Color-typing (6 sampled hues incl. pink/green trap)

Per SKILL authoring invariant (line 65): identify each node's rendered color
first, map to the closest type by HUE proximity (not raw RGB Euclidean —
Euclidean is dominated by the saturation/lightness gap for light/pastel refs
against the saturated dark-canvas table). Record node id, observed color,
chosen type, metric — before writing JSON.

## Table-T3 (pre-registered; hexes pilot-synthetic [INFERENCE — replaceable
## with 009's real samples; the PROCEDURE is what is graded])

| Node | Sampled hue | Expected type | Why |
|---|---|---|---|
| N1 | light green `#A8D5A2` | backend | hue→green family (chart2 orom1/pcie1 precedent) |
| N2 | light blue `#8AB8E8` | frontend | hue→blue family (chart2 cpu precedent) |
| N3 | peach/orange `#F0B46A` | messagebus | hue→orange family (chart2 sandbox precedent) |
| N4 (TRAP) | pink `#F2AEBB` | security | hue→red family (chart2 orom2/3 precedent); raw-RGB Euclidean drifts toward a saturated green table entry — the 009 pcie2/pcie3 lesson |
| N5 | brick red `#D46A6A` | security | hue→red family |
| N6 | pale green `#C6E8C0` | backend | hue→green family despite lightness gap |

## PASS-T3

6/6 expected-type letters match, mapping metric recorded per node, trap N4
typed security via hue (a Euclidean-metric answer typing N4 backend = FAIL).
