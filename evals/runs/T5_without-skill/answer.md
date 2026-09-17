# Run T5 — without-skill (SKILL.md withheld; validator text only)

Condition: no SKILL.md, no schemas, no examples, no deliver command known.
Only the validator's own error text guided repairs. Effort capped at 2
repair rounds (documented), then truthfully reported.

## Repair log (honest — including the uncomfortable part)

- Round 1 (near-miss as briefed): exit 1, schema errors (missing lanes,
  lane/col/type). Full: `validate-round1.receipt.json` (near-miss bytes
  identical to brief; validated from a temp copy, same deterministic output).
- Round 2: added one `main` lane, lane+col+type per node from the error
  text verbatim; kept `meta.subtitle`; `quality_profile` unknown. Exit 1 —
  geometry errors (gate/ship <8px; edge 12px < 28px). Full:
  `validate-round2.receipt.json`.
- Round 3 (final): followed the message's own suggestions — ship col 1→3,
  dropped the edge label. Exit 0, `ok: true`, 9 checks,
  `composition.status: pass`, `errors: 0, warnings: 0`. Full:
  `validate-round3.receipt.json`.

## Gaps this condition never closed (recorded, not graded)

- `meta.subtitle` ("A fast modern approval flow") retained — the
  omit-by-default rule is skill knowledge; nothing in the validator text
  flags it.
- `meta.quality_profile` never set in the candidate (only the CLI flag
  carried `--quality showcase`).
- `deliver` never run — the command is skill knowledge; no HTML, no SHA
  receipts exist for this condition.

No PASS/FAIL claimed — Benji grades vs PASS-T5 (which requires deliver +
verbatim receipts).
