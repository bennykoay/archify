# Run T5 — with-skill (SKILL §§ fast-authoring path + delivery)

Condition: SKILL.md repair/deliver procedure + one matching schema/example
read (workflow lanes shape, edge ids) consulted.

## Repair log

- Round 1 (near-miss as briefed): exit 1, `ok: false` —
  `workflow schema validation failed: / must have required property 'lanes',
  /nodes/N must have required property 'lane'/'col'/'type' …`
  Full: `validate-round1.receipt.json`.
- Fix applied (diagnosed subjects only): dropped invented `meta.subtitle`,
  set `meta.quality_profile: showcase`, added `lanes[]`, gave nodes
  lane+col+type, edges id+variant (shape from the matching example).
- Round 2: exit 1 — schema clean, geometry errors (gate/ship <8px in one
  lane; edge too short 12px < 28px; endpoint-side direction). Full:
  `validate-round2.receipt.json`.
- Fix: spread 3 lanes (intake/review/release), ship → release lane.
- Round 3: exit 0, `ok: true`, 9 checks, `composition.status: pass`,
  `summary: errors 0, warnings 0`. Full: `validate-round3.receipt.json`.

## Deliver receipt (verbatim core)

`deliver workflow candidate.json output.html --quality showcase --json` →
exit 0, `ok: true`, `checksPassed: 9, checkCount: 9`,
`compositionProfile: showcase, compositionStatus: pass, errors: 0,
warnings: 0`,
specification sha256 `b34b7c74…5567b5` (1372 bytes),
artifact sha256 `e25e8640…0579c` (699554 bytes).
Full: `deliver.receipt.json`. Artifact: `output.html` (same dir).
Candidate frozen after passing validation — never edited afterward.

No PASS/FAIL claimed — Benji grades vs PASS-T5.
