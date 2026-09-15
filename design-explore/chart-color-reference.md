# Chart Color Reference — Node → Source Color → Archify Type

**Session:** OSM-ARCH-HIG-009 | **Date:** 2026-09-10

Every color below was sampled directly from the source PNGs this session with Python/Pillow at named (x,y) coordinates, at multiple points per node where obstruction or robustness was a concern — none copied from a prior session's summary or a peer's claim without independent re-sampling. Type mapping uses the archify `DESIGN.md` hex table (`frontend #22D3EE`, `backend #34D399`, `database #A78BFA`, `cloud #FBBF24`, `security #FB7185`, `messagebus #FB923C`, `external #94A3B8`), matched by **HSV hue distance**, not raw RGB Euclidean distance — the source PNGs are a light/pastel palette (saturation 0.09–0.30) being matched against `DESIGN.md`'s saturated dark-canvas colors (saturation ~0.7–0.9), so Euclidean RGB distance is dominated by the saturation/lightness gap rather than the hue family a viewer actually perceives. Both metrics are shown; the chosen type follows hue distance.

## Chart 1 — Boot Validation Chain (`chart1-boot-architecture.json`)

| Node | Source RGB (hex) | Nearest by hue | hue Δ | Nearest by Euclidean | Chosen type | Confidence |
|---|---|---|---|---|---|---|
| `bootrom` | (182,226,250) `#B6E2FA` | frontend (13.2°) | 13.2° | database (88.3) | **frontend** | Close call — external is 13.8° (near-tie); flagged, see note below |
| `llbfw` | same | frontend | 13.2° | database | **frontend** | same note applies |
| `llbpolicy` | same | frontend | 13.2° | database | **frontend** | same note applies |
| `llbiboot` | same | frontend | 13.2° | database | **frontend** | same note applies |
| `ibootvalidate` | same | frontend | 13.2° | database | **frontend** | same note applies |
| `macos` | same | frontend | 13.2° | database | **frontend** | same note applies |
| `se_signed` | (211,232,212) `#D3E8D4` | backend (35.3°) | 35.3° | external (97.5) | **backend** | Clear — backend is the best hue match by a wide margin over every other candidate |
| `se_fetch` | same | backend | 35.3° | external | **backend** | same |

**Note on the light-blue → `frontend` call:** frontend (#22D3EE, hue diff 13.2°) and external (#94A3B8, hue diff 13.8°) are within 0.6° of each other — essentially a tie by hue, while Euclidean distance actually favors `database` (#A78BFA) most of all, purely because the source color is very pale and desaturated. None of archify's 7 types is a real match for a pale sky-blue; `frontend` is the closest defensible pick, not a confident one. Recorded here plainly rather than presented as certain.

## Chart 2 — OROM Sandboxing (`chart2-orom-architecture.json`)

| Node | Source RGB (hex) | Nearest by hue | hue Δ | Nearest by Euclidean | Chosen type | Confidence |
|---|---|---|---|---|---|---|
| `orom1` | (211,232,212) `#D3E8D4` | backend (35.3°) | 35.3° | external (97.5) | **backend** | Clear |
| `orom2` | (250,194,185) `#FAC2B9` | security (17.0°) | 17.0° | security (96.3) | **security** | Clear — see obstruction note below |
| `orom3` | (250,194,185) `#FAC2B9` | security (17.0°) | 17.0° | security (96.3) | **security** | Clear — see obstruction note below |
| `sandbox` | (254,213,178) `#FED5B2` | messagebus (0.6°) | 0.6° | security (109.7) | **messagebus** | Very clear — near-exact hue match |
| `uefi_nonsandboxed` | (211,232,212) `#D3E8D4` | backend (35.3°) | 35.3° | external | **backend** | Clear — already correct before this session, unchanged |
| `uefi_core` | (211,232,212) `#D3E8D4` | backend (35.3°) | 35.3° | external | **backend** | Clear — already correct before this session, unchanged |
| `cpu` | (182,226,250) `#B6E2FA` | frontend (13.2°) | 13.2° | database | **frontend** | Same close-call note as chart 1's light-blue nodes — no real match exists, frontend is the closest available, not confident |
| `pcie1` | (211,232,212) `#D3E8D4` | backend (35.3°) | 35.3° | external | **backend** | Clear |
| `pcie2` | (250,194,185) `#FAC2B9` | security (17.0°) | 17.0° | security | **security** | Clear |
| `pcie3` | (250,194,185) `#FAC2B9` | security (17.0°) | 17.0° | security | **security** | Clear — **see correction note below, this differs from the peer session's original claim** |

### OROM2 / OROM3 obstruction — resolved, not left open

The peer session flagged these as possibly unconfirmable because the screenshot's own caption tooltip physically covers the upper portion of both boxes. Sampling this session found a clean, fully unobstructed strip below the caption (y=136–144, spanning nearly the full box width at 6 different x positions per box) that reads a completely uniform `(250,194,185)` for both boxes, with zero variation across every sampled point. This is resolved with real evidence, not guessed — the obstruction covers only part of each box, and the visible remainder is unambiguous.

### PCIe correction — peer's original claim was wrong for `pcie3`

The dispatching session's message stated "`pcie1`/`pcie3` are green ... `pcie2` is pink/rose." Independent re-sampling this session (4 x-positions per box, 2 y-positions each, 24 total samples) found `pcie1 = (211,232,212)` green, but **both `pcie2` and `pcie3` = `(250,194,185)` pink** — not just `pcie2`. This also matches this session's own prior OSM-ARCH-HIG-006 visual observation of the same screenshot (PCIe card 1 green, cards 2 and 3 both pink), and the semantic pattern already established for the OROM row (card 1 ↔ storage driver ↔ allowed ↔ green; cards 2 and 3 ↔ network/secure-boot drivers ↔ blocked ↔ pink). The peer's claim was not used; this session's own sampled data was.

## Verdict status

Every mapping above is presented as sampled evidence and a documented type choice — **not a self-declared "verified" pass**. Per the dispatching session's amendment, the rendered-output pixel comparison (Task 4) is produced as a data table in the closure report, and the pass/fail verdict on that data is left for independent check by the peer session or Commander, not asserted here.
