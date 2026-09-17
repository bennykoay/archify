# T4 — Type selection (architecture vs workflow vs dataflow, lanes-grid trap)

Per SKILL §type table + layout grammar (lines 41–53): architecture =
components/boundaries/infra (free x/y); workflow = left-to-right processes
with lanes+col grid; dataflow = pipelines/lineage. Layout grammar beats
subject matter: a shape needing specific flanking placement renders
flattened in the lanes grid → prefer architecture when the diagram must
match a specific reference layout (line 53).

## Table-T4 (pre-registered)

| Scenario | Expected type | Why |
|---|---|---|
| S1: card-payment pipeline — ingest → authorize → settle → notify, with lineage + consumers | dataflow | pipeline/lineage subject, no fixed layout |
| S2 (TRAP): deploy-approval flow that must match a reference side-by-side canary-vs-stable flank layout | architecture | specific flanking placement → lanes grid would flatten it; layout grammar overrules process subject |
| S3: employee-onboarding approvals with gates and tool calls, plain left-to-right | workflow | processes/gates/runbook, lanes+col grid fits |

## PASS-T4

3/3 expected-type letters match (S1 dataflow, S2 architecture, S3
workflow); S2 justification cites the lanes-grid/flanking rule, not subject
matter. S2 = workflow with no layout justification = FAIL (the trap).
