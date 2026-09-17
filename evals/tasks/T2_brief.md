# T2 — Specification (key-derivation chart from text table, no PNG traced)

No reference PNG to trace. Facts below are the spec; runner confirms each
label back before writing. Type per SKILL §type table: dataflow first (key
lineage pipeline), workflow fallback if joiners don't compose; if ambiguous
run `node bin/archify.mjs guide "<scenario>" --json` (structural reference,
not facts).

## Table-T2 (pre-registered — 13 boxes + 2 joiners, exact texts)

Main chain left→right: "Hardware measurement of sepOS" (blue),
"Hardware measurement of LLB image4 manifest" (blue),
"LLB measurement of LocalPolicy" (green) → all into
"Lockable hardware registers" (blue) → "Crypto-hardware resident derived
key" (blue) → "Long term SKP system key" (green) → "+" joiner J1 →
"Key encryption key" (green) → "+" joiner J2 → "Volume encryption key"
(green) → "Volume data" (green).

Side inputs: "User password" (green) down into J1, "Hardware key 1" (blue)
up into J1, "xART key" (green) down into J2, "Hardware key 2" (blue) up
into J2.

Colors are hypotheses for Phase 1 to confirm by sampling the PNG hues and
mapping by hue proximity per the SKILL color procedure — do NOT pre-assign
node types from blue/green semantics at authoring time.

## PASS-T2

All 13 boxes + 2 "+" joiners present with exact labels; type dataflow-first
justified (workflow fallback stated if joiners won't compose); hue-sampling
procedure stated; no type-from-semantics; anything ambiguous marked OPEN.
