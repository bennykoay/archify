# GRADING.md — archify skill eval pilot (grader: Benji, blind)

Runner (Benjamin) ran both conditions and filed evidence only. Grader compares
each run answer against the pre-registered table in the task brief — never
against the runner's commentary.

## Per-task rubric

| Task | Check | PASS line (from brief) |
|---|---|---|
| T1 transcription | topology exact-match: 10 components (ids+labels), 6 boundaries (kind+label+wraps), 3 connections (from/to/variant) | brief §Table-T1, all rows match; no extra/missing elements |
| T2 specification | 13 boxes + 2 joiners all present with exact labels; type dataflow-first justified, workflow fallback stated if joiners won't compose; hue-sampling procedure stated, no type-from-semantics | brief §Table-T2 + type line |
| T3 color-typing | 6/6 type letters match pre-registered column; trap node (N4 pink) typed by hue→security, not Euclidean→backend | brief §Table-T3 expected-type column |
| T4 type selection | 3/3 letters match; trap scenario (S2 flanking layout) = architecture despite process subject | brief §Table-T4 expected-type column |
| T5 procedure | final `validate --quality showcase --json` reports 9 artifact checks, 0 errors, 0 warnings; `deliver` exit 0 with SHA receipts; receipts pasted verbatim | brief §PASS-T5 |
| T6 preset discipline | prompt A (no style request) omits `meta.visual_preset`; prompt B (explicit apple-hig request) sets `"apple-hig"` | brief §PASS-T6 |

## Scoring per task

- **PASS**: every PASS-line element met.
- **FAIL**: any PASS-line element missed, or a guess presented as fact (no OPEN marker).
- **OPEN**: incomplete but every gap marked OPEN with what is unknown — credited, never penalized. A silent invention = FAIL, not OPEN.

Guesses penalized; honest OPENs credited (per objective).

## Skill verdict (pilot thresholds — Commander may reset)

- **SHIP**: with-skill ≥5/6 PASS and zero tasks where with-skill FAILs while without-skill PASSes.
- **REVISE**: with-skill 3–4 PASS; attach failing tables.
- **REREJECT (REJECT)**: with-skill ≤2 PASS, or any with-skill FAIL / without-skill PASS regression.

## Score sheet (Benji fills — runner left blank)

| Task | with-skill | without-skill | notes |
|---|---|---|---|
| T1 | ___ | ___ | |
| T2 | ___ | ___ | |
| T3 | ___ | ___ | |
| T4 | ___ | ___ | |
| T5 | ___ | ___ | |
| T6 | ___ | ___ | |
| Total | __/6 | __/6 | |

Verdict: ___ (SHIP / REVISE / REJECT). Thresholds used: ___ (pilot / Commander-reset ___).
Grader signature: ___ Date: ___
