# archify skill behavioral eval — pilot (OSM-ARCH-EVAL-001)

Question: does loading `tools/archify/archify/SKILL.md` change task success? Numbers, not opinion.

## Design

- 6 frozen tasks (`tasks/T1..T6_brief.md`). Each brief pre-registers ground truth
  (Phase-1 tables, expected types, PASS lines) BEFORE any run below.
- 2 conditions per task: **with-skill** (SKILL.md §§ cited in prompt, run may
  consult it) vs **without-skill** (skill file withheld; prompt contains only the
  brief; runner answers from base knowledge + generic JSON sense, never opens SKILL.md).
- 12 runs in `runs/<T#_with-skill|without-skill>/`: prompt used, answer, tool
  receipts verbatim. Runner never grades — no PASS/FAIL claim appears in any run file.
- Blind grading by Benji against `GRADING.md` + pre-registered tables.
  Commander sets final thresholds and signs.

## Conditions protocol (how without-skill was honestly achieved)

The runner (Benjamin) had already read SKILL.md this session, so "unreading" is
impossible. The separation is prompt-level and documented per run:

- with-skill run: prompt quotes the applicable SKILL.md section; runner freely
  re-reads SKILL.md, schemas, examples.
- without-skill run: prompt contains ONLY the brief text; runner does not
  (re-)open SKILL.md, schemas/, examples/, or references/ for that run, and
  makes the choices a competent model without the skill would make (semantic
  guesses, unasked styling, skipped validation steps). Any accidental
  skill-specific knowledge leaking into a without-skill answer is declared in
  that run's `leakage-note` line — none declared beyond generic JSON hygiene.

No edits to SKILL.md, schemas, renderers, template, or existing artifacts were
made to achieve either condition (EVAL-ONLY contract).

## Cost rule (Protocol Phase 6)

Fresh process per task cluster; validate-only except T5 deliver; no screenshots;
no preview server. Total footprint: ~10 archify CLI invocations.

## Verdict bar (pilot proposal — Commander can reset)

- SHIP: with-skill ≥5/6 and zero regressions vs without.
- REVISE: with-skill 3–4, attach failing tables.
- REJECT: with-skill ≤2, or any with-skill FAIL where without-skill PASSes.
- Mechanism matters more than numbers.

## Files

- `tasks/T1_brief.md` — transcription (OROM chart2 topology)
- `tasks/T2_brief.md` — specification (key-derivation chart)
- `tasks/T3_brief.md` — color-typing (6 hues + pink/green trap)
- `tasks/T4_brief.md` — type selection (3 scenarios + lanes-grid trap)
- `tasks/T5_brief.md` — procedure (near-miss JSON → 9/9 + deliver)
- `tasks/T6_brief.md` — preset discipline (default-omit vs explicit apple-hig)
- `GRADING.md` — rubric + score sheet template (Benji fills)
- `runs/` — 12 run records, evidence only
