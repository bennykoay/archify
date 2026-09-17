# T6 — Preset discipline (default-omit vs explicit apple-hig)

Per SKILL authoring invariant (line 67): omit `meta.visual_preset` by
default (opens in `classic`); set `signal-flow`, `blueprint`, `editorial`,
or `apple-hig` ONLY when the user explicitly requests that visual style.

## Inputs (pre-registered)

- Prompt A: "Diagram the checkout pipeline as archify dataflow." (no style
  words anywhere.)
- Prompt B: "Diagram the checkout pipeline as archify dataflow, apple-hig
  style please." (explicit request.)

## PASS-T6

Prompt A answer omits `meta.visual_preset` entirely (no preset field, no
`classic` written in — `classic` is the opening default, not an authored
value). Prompt B answer sets `"visual_preset": "apple-hig"`. A = preset
present, or B = preset missing/wrong, = FAIL.
