# T5 — Procedure (near-miss JSON → 9/9 0 err/warn + deliver + verbatim receipts)

## Input JSON (pre-registered near-miss — 3 defects, listed sealed below)

```json
{
  "schema_version": 1,
  "diagram_type": "workflow",
  "meta": { "title": "Deploy approvals", "subtitle": "A fast modern approval flow" },
  "nodes": [
    { "id": "req", "label": "Request" },
    { "id": "gate", "label": "Approve" },
    { "id": "ship", "label": "Ship" }
  ],
  "edges": [
    { "from": "req", "to": "gate" },
    { "from": "gate", "to": "ship" }
  ]
}
```

Sealed defect list (grader only — runner discovers by running validation):
D1: `meta.quality_profile` missing (must be `"showcase"` before geometry work).
D2: `meta.subtitle` invented restatement of the title (omit-by-default rule).
D3: `workflow` has no top-level `lanes` array (required lanes+col grid).

## Runner instructions

Validate after every edit, deliver once for acceptance:

```bash
node bin/archify.mjs validate workflow <candidate.json> --quality showcase --json
node bin/archify.mjs deliver workflow <candidate.json> <output.html> --quality showcase --json
```

A non-zero exit is never success. Repair only the diagnosed subject per
round; if two consecutive rounds don't improve the error count, stop and
report diagnostics truthfully.

## PASS-T5

Final `validate --quality showcase --json` reports all 9 artifact checks
with 0 errors and 0 warnings; `deliver` exits 0 with SHA-256 receipts;
receipts pasted verbatim; no success claimed for any non-zero command.
