# Run T2 — with-skill (SKILL.md type table + guide rule + color procedure)

Condition: SKILL.md §§ type-router/layout-grammar/invariants consulted.

## Answer (specification)

Type: **dataflow first** (pipelines/lineage per type table — multi-stage key
lineage with fan-in joins); **workflow fallback** if the "+" joiners won't
compose in dataflow. Guide run (receipt `guide.receipt.json`) returned
`system-overview/architecture` at `"confidence": "low"` with zero matched
signals — inconclusive, so per SKILL it stays structural reference only and
the type-table reasoning above governs; stated here explicitly.
Labels confirmed back: Table-T2's 13 boxes + 2 "+" joiners, exact texts as
briefed (J1 = User password + Hardware key 1 fan-in; J2 = xART key +
Hardware key 2 fan-in).
Colors: blue/green in the source treated as HYPOTHESIS ONLY — Phase 1 must
sample PNG hues and map by hue proximity before writing JSON; no
type-from-semantics at authoring time.
OPENs (honest): exact joiner semantics (additive mix vs KDF combine)
unknown from text; blue/green boundary meaning unconfirmed pending hue
sample; joiner rendering in dataflow unproven until first candidate validates.

## Receipts

`guide "key derivation pipeline…" --json` → exit 0, `ok: true`,
recommendation system-overview/architecture, confidence low. Full JSON:
`guide.receipt.json` (same dir). No JSON authored in this run (spec + type
pick is the graded artifact per brief).

Leakage-note: none (with-skill condition).
No PASS/FAIL claimed — Benji grades vs Table-T2 + type line.
