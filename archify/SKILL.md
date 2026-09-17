---
name: archify
description: Create polished, validated architecture, workflow, sequence, data-flow, and lifecycle/state diagrams as explorable standalone HTML with inline SVG, dark/light themes, optional trace motion, and PNG/JPEG/WebP/SVG/WebM export. Accept plain-language requirements or pasted Mermaid flowchart, sequenceDiagram, and stateDiagram input; inspect repository evidence when the diagram must reflect real code. Use when the user asks to visualize system architecture, infrastructure, cloud/security/network topology, technical workflows, API call sequences, request lifecycles, data pipelines, ETL/ELT, data lineage, state machines, or to convert/beautify Mermaid.
license: MIT
metadata:
  version: "2.15"
  author: tt-a1i
  based_on: Cocoon-AI/architecture-diagram-generator (MIT, v1.0)
---

# Archify

Create a self-contained, interactive HTML diagram from a small typed JSON specification. Static output is the default; enable motion only when the user asks for a demo or presentation.

## Fast authoring path

Use this bounded path for ordinary generation. Do not read the optional Viewer Runtime reference unless the user asks about those features.

1. Choose `architecture`, `workflow`, `sequence`, `dataflow`, or `lifecycle` from the question.
2. Read one matching schema in `schemas/`, `schemas/common.schema.json`, and one matching JSON example in `examples/`. Read only those files. Fresh authorship means new stable IDs, domain wording, and layout; use the example for field shape, not facts. When real product identity matters, query `node bin/archify.mjs brands "<name>" --json`; read `references/brand-marks.md` only for an unknown brand with a user-provided URL.
3. Artifact first: the next tool action must write the candidate. Write the candidate before inspecting renderer internals. Do not plan exact coordinates in prose. Start with one clear main path, short side branches, sparse labels, and at most 12 primary nodes. Set `meta.quality_profile` to `"showcase"` unless the user explicitly requests a dense `standard` map. Start with automatic routes and labels. `via`, `channelX`, `channelY`, `labelAt` and `route` are **banned outright** — not "use sparingly". See Banned geometry below.
4. Validate after every candidate edit and immediately before handoff:

   ```bash
   node bin/archify.mjs validate <type> <candidate.json> --quality showcase --json
   ```

   A receipt with only 4 artifact checks is basic validation, never showcase acceptance. A showcase pass must report all 9 artifact checks with 0 composition errors and 0 warnings. If the candidate omits or misspells the exact `meta.quality_profile` field, fix it before geometry. A passing final validation freezes the candidate: never edit it afterward.
5. For a delivered HTML, `deliver` is the final acceptance command:

   ```bash
   node bin/archify.mjs deliver <type> <candidate.json> <output.html> --quality showcase --json
   ```

   A non-zero exit can never be described as success. If validation fails, change only the diagnosed `subject`, verify `evidence`, choose from `supportedFixes`, and rerun. Continue focused correction while the objective error count reaches a new minimum. If two consecutive rounds do not improve that best count, stop and report the unresolved diagnostics truthfully.

Do not read `renderers/shared/geometry.mjs`, renderer source, validator source, tests, or benchmarks before the first candidate. Inspect implementation only for an unsupported internal diagnostic or after two focused repairs fail.

Lifecycle note: phase columns `0..4` occupy the main rail; event/outcome columns `0..2` align beneath later phases. A recoverable state uses `type: "failure"` plus a real transition back to the active state.

## Banned geometry — the layout engine owns every coordinate

SYS-003 bans hand-authored geometry. `validate` and `deliver` throw a hard error
and exit non-zero. This is not a style preference; the spec will not render.

| Type | Collection | Banned keys |
|---|---|---|
| `architecture` | `components` | `pos` |
| `architecture` | `connections` | `via`, `channelX`, `channelY`, `labelAt`, `route` |
| `workflow` | `edges` | `via`, `channelX`, `channelY`, `labelAt`, `route` |
| `dataflow` | `flows` | `via`, `channelX`, `channelY`, `labelAt`, `route` |
| `lifecycle` | `transitions` | `via`, `channelX`, `channelY`, `labelAt`, `route` |

The error reads:

```
Authored geometry is banned (SYS-003): <type> <collection>[i] uses "<key>"
  — remove it; the layout engine computes it
```

**Never add a banned key to get past a failing render.** If the engine cannot
produce the shape, report it as a renderer gap. A hand-placed spec is not a
result; it is a spec that can never be rendered again.

Source of truth: `archify/renderers/shared/validator.mjs`, `BANNED_GEOMETRY`.

## Type router

| Type | Use for |
|---|---|
| `architecture` | Components, services, cloud/security boundaries, infrastructure |
| `workflow` | Processes, approval gates, tool calls, runbooks, CI/CD |
| `sequence` | API call chains, request lifecycles, async traces, returns |
| `dataflow` | Pipelines, ETL/ELT, lineage, governance, consumers |
| `lifecycle` | State/status transitions, retries, waiting and terminal states |

When ambiguous, run `node bin/archify.mjs guide "<scenario>" --json`. Scenario proof examples are structural references, not facts to copy.

**Layout grammar matters as much as subject matter.** `workflow` and `lifecycle` both require a top-level `lanes` array — a horizontal-band grid where a node's position is `lane` + `col`, not a free x/y. That grid gives limited position control: a shape needing specific left/right/flanking placement (not just a left-to-right or top-to-bottom sequence) can render rotated or flattened into stacked bands even when the topology is correct. `architecture` uses no lane grid, so it is still the right choice when a shape needs to be free of bands. **It does not give you manual placement.** `components[].pos` is banned (SYS-003); the layout engine owns every coordinate. If the engine cannot produce the shape you need, that is a renderer gap to report, never a spec to hand-place. Superseded evidence, kept for history — this was written when `pos` was still legal: reproducing an Apple Platform Security Guide boot-validation chain (a single vertical chain with two side-inputs flanking one step) as `workflow` rendered as two stacked horizontal lanes instead of the source's vertical-chain-with-side-boxes shape; re-authoring the same content as `architecture` with explicit `pos` matched the source shape exactly. Full trace: `docs/report/hig-baseline-reference-repro_OSM-ARCH-HIG-006_20260909_47804ee8.md`, `docs/report/archify-real-pipeline-content-test_OSM-ARCH-HIG-007_20260909_4629eb52.md`.

## Mermaid input

Read Mermaid for topology and meaning, then author fresh Archify JSON; do not mechanically render Mermaid styling.

- `flowchart` / `graph` → `workflow`, or `architecture` for a component map.
- `sequenceDiagram` → `sequence`; participants become semantic participants and arrows become messages.
- `stateDiagram` → `lifecycle`; states and transitions retain meaning, not Mermaid style.

## Authoring invariants

- **When authoring a diagram to match a specific reference image or existing design, do not infer `type` from what the content semantically sounds like** (e.g., "security"-sounding content != `security` type). Identify each node's actual rendered color in the reference first, then map it to the closest entry in `DESIGN.md`'s hex table — by hue proximity, not raw RGB Euclidean distance, when the reference is a light/pastel palette being matched against `DESIGN.md`'s saturated dark-canvas colors (Euclidean distance is dominated by the saturation/lightness gap in that case, not the hue family a viewer actually perceives). Record the mapping — node id, observed color, chosen type, and the distance metric used — before writing the JSON, not after. Evidence: `docs/report/archify-color-fix-and-skill-patch_OSM-ARCH-HIG-009_20260910_ae72f7db.md`.
- One obvious main path; side branches leave the nearest main-path node. Remove low-value edges before adding routing controls.
- Omit `meta.visual_preset` by default so every diagram opens in `classic`, regardless of whether its resolved color mode is light or dark. Color mode and visual preset are independent: switching Light / Dark must preserve the current preset. Set `signal-flow`, `blueprint` (both aliases of the `classic` default since OSM-SEE-016), or `apple-hig` only when the user explicitly requests that visual style. `apple-hig` renders with the same documented Apple system-color ramp `classic`/`blueprint` already use (verified against Apple's system colors, not `DESIGN.md`'s hex table — see the note below), plus the real SF Pro/Inter system font via a `local()`-only `@font-face` (no Google Fonts dependency for this preset specifically). Evidence: `docs/report/archify-variantaccent-fix-and-apple-hig-preset_OSM-ARCH-HIG-011_*.md`.
- **`DESIGN.md`'s hex table is not a verified-accurate reference for the live presets.** The `classic`/`blueprint`/`apple-hig` presets already render genuine Apple system colors (systemBlue/Green/Red/Orange/Purple/Yellow/Gray, light+dark) hard-coded in `assets/template.html`; these were independently confirmed against Apple's documented system-color values during OSM-ARCH-HIG-011 and do not match `DESIGN.md`'s own table (first noticed OSM-ARCH-HIG-009, still open). When matching a node's authored color to a `type`, sample the live rendered preset, not `DESIGN.md`.
- Omit `meta.subtitle` by default. Never invent a subtitle that restates the title, nodes, or cards; include one short supporting line only when the user explicitly asks for it.
- Treat the standalone desktop viewer as a first-screen artifact by default, not a shallow strip. Generate one responsive artifact for laptops and external displays—never device-specific HTML or alternate topology. The viewer may adapt only the outer reading width from the live viewport height; it must preserve the authored SVG/viewBox, proportions, semantic geometry, and normal document flow. On a wide or tall desktop, use enough authored vertical rhythm that the diagram panel and its necessary conclusion cards occupy the screen as a balanced whole; runtime scaling cannot repair an over-compressed Y layout or an undersized explicit `meta.viewBox`. Before handoff, open the real HTML at 1440×900, 1600×1000, and 1920×1080; additionally check 2048×1320 whenever the composition is intended for a large desktop display. Require `document.documentElement.scrollWidth <= window.innerWidth` and `scrollHeight <= window.innerHeight` at every checked size, while visually checking that the diagram remains comfortably readable and vertically balanced at the largest checked viewport. Repair overflow by removing only genuinely redundant content or compacting spacing before shrinking nodes, labels, or the main panel. If the largest viewport still has a conspicuous empty lower band at the viewer's width cap, redistribute authored Y positions and increase the viewBox height proportionally; do not add filler copy or decorative cards. Never counterfeit a pass with `overflow: hidden`, clipped content, an internal diagram scroller, stretched SVG height, or smaller typography. Narrow/mobile layouts may scroll vertically when containment requires it.
- Omit `meta.legend` for the truthful `auto` default. When needed, use only `mode: auto|all|hidden` and renderer-supported `entries.<kind>.label|visible`; labels never change semantics.
- Match every reader-facing authored string to the language of the user's request, or the conversation's dominant language when the request is language-neutral. Apply it consistently to titles/subtitles, node/edge/boundary/lane/group text, guided-view labels/notes, legend label overrides, and card titles/items; use another language or bilingual copy only when the user asks.
- Preserve exact product names, code identifiers, commands, protocols, API paths, and environment names. They may remain English inside localized copy, but never justify leaving the surrounding explanatory prose in another language.
- Brand identity is optional and explicit. Put a canonical built-in ID in `brand` when the node names that real product. If no preset matches and the user supplied the official HTTP(S) URL, first run `node bin/archify.mjs brands capture "<url>" --json`, then author the returned digest-pinned `brand` object. Render and validate never perform an unpinned capture. Otherwise omit `brand`. Never infer a brand from a vague role such as "database", and never let a badge replace the semantic `type`, label, or relationship facts.
- For sequence diagrams, omit `meta.column_fit` for the stable `fixed` layout. Set it to `"spread"` when a wide viewBox would otherwise leave unused horizontal space or when meaningful participant labels do not fit the fixed boxes; do not shorten semantic labels before trying `spread`.
- Component types are `frontend`, `backend`, `database`, `cloud`, `security`, `messagebus`, and `external`; variants are `default`, `emphasis`, `security`, and `dashed`. A relationship's label color and line color are guaranteed to match in every preset by construction (`variantAccent()` in `renderers/shared/geometry.mjs` returns the text class tied to the same CSS variable as the line's `a-<variant>` class, fixed OSM-ARCH-HIG-011 — upstream issue #142) — authors do not need to manually verify this for edges/relationships. This guarantee is renderer-level and separate from the node-color-matching invariant above, which is about authoring a node's `type` to match its intended color, not about label/line consistency.
- Relationship labels are semantic data. When one collides, move the label, adjust the route or spacing, then shorten the wording while preserving meaning. Only delete a label when both endpoints fully imply the relationship and it contains no protocol, action, direction, synchronous/asynchronous behavior, or cross-boundary mechanism; explain why the deleted label is redundant. Never delete a meaningful label merely to pass `showcase`.
- Omit `meta.engineering_profile` by default. Region, cluster, and security boundary wording do not by themselves enable it. Enable `deployment-ownership` only when the user explicitly asks for a production deployment topology, ownership handoff, or fail-closed deployment review and the source facts are known. Once enabled, must not remove the engineering profile merely to pass validation; repair the facts or report the diagnostics truthfully.
- Spacing means clear gap, not center distance. For a relationship label, clear gap must exceed its measured mask width; use the label-preserving repair order before considering deletion.
- Automatic routes own their endpoint sides. A side is a direction contract: the first and final segment must leave/enter perpendicular to that side.
- Automatic Port Spread is a default renderer behavior for architecture, workflow, data-flow, and lifecycle. It skips single relationships and explicit `via`, `channelX`, `channelY`, `labelAt`, or non-`auto` routes. Near parallel ports use an outside bridge so automatic routing cannot create a sub-8px segment or sub-16px interior turn. Architecture separately keeps unobstructed facing automatic ports (`left`/`right` or `top`/`bottom`) on one shared axis when their offset is under 16px and both ports retain corner clearance. If exactly one endpoint was spread, only the unshared endpoint may move onto that axis; if both endpoints were spread, keep the outside bridge so competing ports remain distinct.
- Never accept an edge crossing an unrelated opaque node, an ambiguous shared corridor, or a relationship label masking another route.

Read `references/authoring-contract.md` only when you need field enums, spacing math, geometry repair rules, repository evidence, or mode-specific placement.

## Where to save

SSOT is `D:\Onesimus\docs\folder-standard.md`. This section points at it and
never restates it. Five folders under `tools\archify\`:

| Folder | Holds | Written by |
|---|---|---|
| `code\` | the program | code sessions only |
| `specs\` | chart definitions, the input | promote step |
| `standards\` | what "good" means: DESIGN.md, GRADING.md, checklists | promote step |
| `sessions\<SESSION-ID>\` | everything one session produced | **the running session** |
| `published\` | current output the Commander opens | promote step |

**The multi-agent rule.** During a session you may write to exactly one place:
`sessions\<YOUR-OWN-SESSION-ID>\`. Everything else is reached by a promote step
after the session closes, run once, by one owner. Several agents and models run
at once. Two writing the same folder is a silent collision with no error and no
way to tell afterwards who was right. The session ID is the lock.

**Frozen after close.** A session folder is never edited once the session ends.
`published\` is current. `sessions\` is history.

**Banned folder names**, permanently: `explore`, `seeing`, `experiments`, `misc`,
`tmp`, `new`, `work`, `stuff`, `v2`, `final`, `old`, `backup`. Each is a tag that
tags nothing.

**Banned outright: any path outside `D:\Onesimus\`.** The Windows temp folder is
not a folder. It is a place work goes to be deleted. A session does not close
until its bytes are in the repository.

## Verify by looking — a hard gate

A render that exits 0 is not a result. A check that passed on a picture nobody
opened is not a check.

Before you report any visual claim:

1. Render to bytes and name the path inside the repository.
2. Capture the image.
3. **Open it and read it with your own eyes.**
4. Describe what you see in plain words. "Ugly" is an acceptable and honest
   answer. So is "the titles overlap".

Never rule on a visual claim from source code alone. Code says the render
succeeded; only the picture says whether it is right. Both faults found in
OSM-SEE-015 — stacked frame titles and crossing frames — were invisible in the
code and obvious in the image.

## Delivery

Use `validate` during repair and `deliver` once for final acceptance. Delivery freezes the exact specification bytes into a private same-directory snapshot, renders and checks that snapshot, atomically commits the HTML, and reports SHA-256 plus byte counts for both specification and artifact.

After delivery, collect bounded desktop evidence without modifying or rerendering the trusted HTML:

```bash
node bin/archify.mjs visual-check <output.html> --json
```

`visual-check` measures containment at 1440×900, 1600×1000, 1920×1080, and 2048×1320; captures light/dark screenshots at the smallest and largest sizes; and writes a relative-path contact sheet plus JSON sidecars beside the artifact. Its automated receipt always reports `visualReview: "pending"`: screenshots are evidence for inspection, never an automatic polish claim. Exit 0 means containment and captures passed, 1 means overflow or capture failure, and 2 means Chrome/Chromium was unavailable and the receipt is `skipped`. The command never changes the delivered HTML.

Add `--open` only when the user wants an immediate local preview. For an active desktop authoring loop, the optional command is:

```bash
node bin/archify.mjs preview <type> <input>.json <output>.html --quality showcase
```

Never start preview by default. Read `references/delivery-contract.md` when using preview, repository evidence, export receipts, visual review, or post-commit opening.

## Optional viewer capabilities

Generated HTML already contains theme switching, pan/zoom, search, focus, relationship tracing, semantic views, presentation, and truthful exports. These are reader capabilities, not extra authoring work. `meta.animation: "trace"` is opt-in; `meta.views` is optional and should contain at most five curated chapters.

Read `references/viewer-runtime.md` only when the user explicitly asks for Share Cards, Route/Reach cards, motion, guided stories, deep links, presentation, search/focus, or another Viewer Runtime feature.

## Setup and fallback

No install is required inside the skill package. Verify with:

```bash
node bin/archify.mjs doctor
node bin/archify.mjs demo <output-directory>
```

When shell access is unavailable, hand-place architecture SVG into `assets/template.html`, use CSS semantic classes rather than inline colors, and follow the visual review contract in `references/delivery-contract.md`.

## Output

Return the checked HTML path, diagram type, validation summary, specification/artifact receipt, and truthful visual-review status. Do not claim success for a non-zero command or claim visual inspection you did not perform.
