export const DESKTOP_READABILITY_VIEWPORT = Object.freeze({ width: 1440, height: 900 });
export const DESKTOP_READER_MIN_WIDTH = 960;
export const DESKTOP_READER_HORIZONTAL_CHROME = 30;
export const DESKTOP_READER_DIAGRAM_WIDTH = DESKTOP_READER_MIN_WIDTH - DESKTOP_READER_HORIZONTAL_CHROME;
// O1a per-detail floors (SEE-004): projected CSS px at the smallest declared
// viewport (1440x900) + WCAG contrast vs SAMPLED backdrop pixels (live
// getComputedStyle/elementFromPoint in the ruler) — never design tokens.
export const MIN_PROJECTED_TEXT_PX_BY_DETAIL = Object.freeze({
  primary: 15,
  context: 11,
  boundary: 13,
  edge: 11,
});
export const MIN_CONTRAST_BY_DETAIL = Object.freeze({
  primary: 7,
  context: 4.5,
  boundary: 4.5,
  edge: 4.5,
});
export function minimumProjectedPxForDetail(detail) {
  return Object.prototype.hasOwnProperty.call(MIN_PROJECTED_TEXT_PX_BY_DETAIL, detail)
    ? MIN_PROJECTED_TEXT_PX_BY_DETAIL[detail]
    : null;
}
export function minimumContrastForDetail(detail) {
  return Object.prototype.hasOwnProperty.call(MIN_CONTRAST_BY_DETAIL, detail)
    ? MIN_CONTRAST_BY_DETAIL[detail]
    : 4.5;
}
function relativeLuminanceFromRgb(r, g, b) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function contrastRatioFromRgb(a, b) {
  const l1 = relativeLuminanceFromRgb(a[0], a[1], a[2]);
  const l2 = relativeLuminanceFromRgb(b[0], b[1], b[2]);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

export function projectedNodeTextPx(sourceFontPx, viewBoxWidth, diagramWidth = DESKTOP_READER_DIAGRAM_WIDTH) {
  if (![sourceFontPx, viewBoxWidth, diagramWidth].every(Number.isFinite) || viewBoxWidth <= 0 || diagramWidth <= 0) {
    return Number.NaN;
  }
  return sourceFontPx * Math.min(1, diagramWidth / viewBoxWidth);
}

export function minimumReadableSourceTextPx(
  viewBoxWidth,
  diagramWidth = DESKTOP_READER_DIAGRAM_WIDTH,
  minimumProjectedPx,
) {
  if (![viewBoxWidth, diagramWidth, minimumProjectedPx].every(Number.isFinite)
    || viewBoxWidth <= 0
    || diagramWidth <= 0
    || minimumProjectedPx <= 0) {
    return Number.NaN;
  }
  return minimumProjectedPx / Math.min(1, diagramWidth / viewBoxWidth);
}
