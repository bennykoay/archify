// Single-line node text fitting, shared by every renderer.
//
// Node text (`label`, `sublabel`, `tag`) renders as one <text> element with
// text-anchor="middle" and is never wrapped. Left unmeasured, an over-long
// value silently spills across its neighbours while validation still reports
// a clean receipt — the failure mode this module exists to close.
//
// Two halves, always used together:
//   - fittedNodeFontSize shrinks the text toward a legible minimum at render
//     time, so ordinary overruns simply get smaller instead of overlapping.
//   - minimumNodeTextWidth reports the width the text still needs once it has
//     shrunk as far as it may, so validation can reject what shrinking cannot
//     save.
//
// The geometry constants below are shared; the per-field `preferred` and
// `minimum` font sizes are not, because renderers set node text at different
// sizes (architecture sublabels are 9px, the rest are 7px).

import { textUnits } from './utils.mjs';

// widthFactor: px of advance width per text unit, per px of font size.
// horizontalPadding: total px reserved inside the box so text never touches
// the border.
export const nodeTextFit = {
  widthFactor: 0.6,
  horizontalPadding: 8,
};

// Largest font size at or below `preferred` that fits `text` inside `width`,
// floored at `minimum` — below that the text is no longer legible and the
// caller should be reporting a problem instead.
export function fittedNodeFontSize(text, width, preferred, minimum) {
  const units = Math.max(1, textUnits(text));
  const available = Math.max(1, width - nodeTextFit.horizontalPadding);
  const fitted = Math.min(preferred, available / (units * nodeTextFit.widthFactor));
  return Math.max(minimum, Math.floor(fitted * 10) / 10);
}

// Width `text` occupies at its legible minimum. Compare against
// `width - nodeTextFit.horizontalPadding` to decide whether shrink-to-fit can
// rescue it.
export function minimumNodeTextWidth(text, minimum) {
  return textUnits(text) * minimum * nodeTextFit.widthFactor;
}

// Available text width inside a box of `width`.
export function availableNodeTextWidth(width) {
  return width - nodeTextFit.horizontalPadding;
}
// Card-fit (OSM-SEE-013): width a node wants at its preferred sizes.
// Sizing uses minimumNodeTextWidth(text, preferred) + padding per field, so a
// card grown to this width renders every field at preferred with no shrink;
// fittedNodeFontSize then only shrinks when the card has hit its ceiling
// (shrink is the last resort, not the first). Floor = startWidth (the pinned
// default or author-explicit width — cards never shrink below what geometry
// or the author set); ceiling is caller-supplied (lane/token bound — cards
// never run away). Returns startWidth exactly when nothing wants more, so
// unaffected renderers stay byte-identical.
export function fittedNodeCardWidth(fields, startWidth, ceiling) {
  let need = 0;
  for (const { text, preferred } of fields) {
    if (text == null || text === '') continue;
    need = Math.max(need, minimumNodeTextWidth(text, preferred) + nodeTextFit.horizontalPadding);
  }
  const floor = Math.max(1, startWidth);
  const cap = Math.max(floor, ceiling);
  return Math.min(cap, Math.max(floor, Math.ceil(need)));
}
