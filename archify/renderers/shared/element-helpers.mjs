// element-helpers.mjs — OSM-CONS-113 ONE-HELPER: one draw helper per element.
// R8: a card takes 6, a label takes 3 — everywhere. Lifecycle rx 7/4 → 6/3.
// R1 NAME-14: every element carries its canonical data-element name.
// R2 SPLIT-MASK: cards keep --mask (c-mask); label backings own --label-mask (c-label-backing).
// R3/R4 V1: label backings tinted + bordered from their own wire via data-wire.
export const CARD_RX = 6;
export const LABEL_RX = 3;
export const CARD_MASK_CLASS = 'c-mask';
export const LABEL_BACKING_CLASS = 'c-label-backing';

// Canonical element names (DESIGN §4, E1-E18 + E9a/E16a aliases kept).
export const ELEMENT = Object.freeze({
  E1_FRAME: 'structural-frame',
  E2_FRAME_TITLE: 'structural-frame-label',
  E3_FRAME_TITLE_BACKING: 'structural-frame-label-mask',
  E4_LANE_BOX: 'lane-box',
  E5_LANE_HEADER: 'lane-header',
  E6_NODE_CARD: 'node-card',
  E7_NODE_STRIPE: 'node-accent-bar',
  E8_SECURITY_GROUP: 'security-group',
  E9_GRID: 'grid',
  E9A_READER_JOB: 'reader-job',
  E10_EDGE_LABEL_BACKING: 'edge-label-backing',
  E11_EDGE_LABEL_TEXT: 'edge-label-text',
  E11_ALIAS_SEGMENT_LABEL: 'segment-label',
  E12_MESSAGE_LABEL_BACKING: 'message-label-backing',
  E13_ACTIVATION_BAR: 'activation-bar',
  E14_NODE_SUBLABEL: 'node-sublabel',
  E15_PLAIN_WIRE: 'plain-wire',
  E16_STRONG_WIRE: 'strong-wire',
  E16A_FLOW_WIRE: 'flow-wire',
  E17_DASHED_WIRE: 'dashed-wire',
  E18_ARROWHEAD: 'arrowhead',
});

// Variant → wire class (mirrors arrowClassMap; sequence 'return' rides a-default).
export function wireClassForVariant(variant) {
  if (variant === 'emphasis') return 'a-emphasis';
  if (variant === 'security') return 'a-security';
  if (variant === 'dashed') return 'a-dashed';
  return 'a-default';
}

// Variant → canonical wire element name (E15/E16/E17; E16a flow-wire aliases emphasis).
export function wireElementForVariant(variant) {
  if (variant === 'dashed') return ELEMENT.E17_DASHED_WIRE;
  if (variant === 'emphasis') return ELEMENT.E16_STRONG_WIRE;
  if (variant === 'security') return ELEMENT.E16_STRONG_WIRE;
  return ELEMENT.E15_PLAIN_WIRE;
}

// E6 node card mask: 260x60-grown card underlay, rx 6, --mask. One place to fix.
export function cardMaskRect(x, y, width, height) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${CARD_RX}" class="${CARD_MASK_CLASS}" data-element="${ELEMENT.E6_NODE_CARD}"/>`;
}

// E10/E12 label backing: rx 3, own --label-mask token, tinted+bordered from own
// wire in template CSS via data-wire (V1: 22% color-mix + 1px wire-colour border).
// R4: the backing sits on its wire; it never erases it (see template note).
export function labelBackingRect(x, y, width, height, wireClass, role) {
  const wire = wireClass || 'a-default';
  const graphRole = role || ELEMENT.E10_EDGE_LABEL_BACKING;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${LABEL_RX}" class="${LABEL_BACKING_CLASS}" data-element="${graphRole}" data-wire="${wire}"/>`;
}
