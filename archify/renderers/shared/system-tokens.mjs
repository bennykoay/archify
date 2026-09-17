// system-tokens.mjs — OSM-SYS-001 O1: ONE versioned token source for archify chart geometry.
// Version: 1.2.0 (2026-09-14, session OSM-SEE-007, node ALIENBEN).
// Amendment C (OSM-SYS-004): renderer TARGETS live here (never floors).
// clearance.routeToFrame 12 -> 16; arrowhead.tipToNode 6 -> max(8, 5 * strokeWidth)
// (base 8 in tipToNode; rule text in tipToNodeRule; implementation renderTipTarget
// in layout-engine.mjs). Ruler floors stay in scripts/geometry-assert.mjs (12 / 6).
// Rule: every spacing/type/surface number that drives chart geometry lives HERE.
// Renderers import these values (never re-declare literals); template.html
// derives its surface values from the :root block mirrored from SURFACE
// (gate-verified by tools/archify/scripts/visual-lint-gate.mjs — never hand-sync).
// Commander-approved seeds (HIG paired values); renderer DEFAULTS, never spec fields:
//   card 260 = HIG six-column grid card width.
//   gutter.empty 40 = HIG 260pt->40pt pairing with card width.
//   gutter.routeThrough 56 = 40 + 16 corridor (through-routes keep a corridor).
//   frameLabel.above 34 = proximity/grouping rail above member top.
//   frameLabel.below 14 = ownership rail below frame top (34:14 ~= 2.4:1).
//   clearance.routeToFrame 16 = renderer target above the A9 floor 12 (aim 16 so delivered clears 12 with margin).
//   arrowhead.tipToNode 8 + tipToNodeRule max(8, 5 * strokeWidth) = renderer target above the A10 floor 6 (implementation: renderTipTarget in layout-engine.mjs).
//   type.context 11 + type.boundary 13 = HIG Caption 2 (pinned, already rendered).
// NEVER edit thresholds here: readability floors live in desktop-readability.mjs
// (SEE-004 contract) and ruler assertion thresholds live in geometry-assert.mjs.
// This file only PINS the same numbers as defaults, never adjusts them.

export const SYSTEM_TOKENS_VERSION = '1.2.0';

export const SYSTEM_TOKENS = Object.freeze({
  version: SYSTEM_TOKENS_VERSION,
  card: Object.freeze({ width: 260, height: 60 }),
  gutter: Object.freeze({
    empty: 40,
    corridor: 16,
    routeThrough: 56, // empty + corridor; informational (== 40 + 16)
  }),
  frameLabel: Object.freeze({
    above: 34, // member-top to pill-top rail
    below: 14, // frame-top to pill-top inset; ownership ratio 34:14 ~= 2.4:1
  }),
  clearance: Object.freeze({ routeToFrame: 16 }),
  arrowhead: Object.freeze({ tipToNode: 8, tipToNodeRule: 'max(8, 5 * strokeWidth)' }),
  type: Object.freeze({
    primary: 15,
    context: 11,
    boundary: 13,
    edge: 11,
  }),
  surface: Object.freeze({
    dark: '#1c1c1e',
    light: '#f5f5f7',
    tint: '#f2f2f7',
    // OSM-SEE-007: frame surface owns its line (acceptance 2). Hexes are
    // HIG-derived values already shipped (light = sys-surface-light ramp;
    // dark = generic-dark panel / toolbar-menu-bg); no invented ramp.
    regionLight: '#f5f5f7',
    regionDark: '#2c2c2e',
  }),
});

// CSS :root block mirrored into archify/assets/template.html (single literal
// home for surface values; the 10 per-preset theme blocks reference these via
// var()). The gate script asserts byte-equality of each value, so edit HERE
// and re-mirror — never hand-edit the template block.
export function systemTokensCss() {
  const t = SYSTEM_TOKENS;
  return [
    '/* OSM-SYS-001 system tokens v' + t.version + ' — mirrored from renderers/shared/system-tokens.mjs; do not hand-edit */',
    ':root {',
    '  --sys-card-width: ' + t.card.width + 'px;',
    '  --sys-gutter-empty: ' + t.gutter.empty + 'px;',
    '  --sys-gutter-route-through: ' + t.gutter.routeThrough + 'px;',
    '  --sys-frame-label-above: ' + t.frameLabel.above + 'px;',
    '  --sys-frame-label-below: ' + t.frameLabel.below + 'px;',
    '  --sys-clearance-route-to-frame: ' + t.clearance.routeToFrame + 'px;',
    '  --sys-arrowhead-tip-to-node: ' + t.arrowhead.tipToNode + 'px;',
    '  --sys-type-context: ' + t.type.context + 'px;',
    '  --sys-type-boundary: ' + t.type.boundary + 'px;',
    '  --sys-surface-dark: ' + t.surface.dark + ';',
    '  --sys-surface-light: ' + t.surface.light + ';',
    '  --sys-surface-tint: ' + t.surface.tint + ';',
    '  --sys-surface-region-light: ' + t.surface.regionLight + ';',
    '  --sys-surface-region-dark: ' + t.surface.regionDark + ';',
    '}',
  ].join('\n');
}
