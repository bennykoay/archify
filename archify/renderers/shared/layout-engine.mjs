// layout-engine.mjs — OSM-SYS-003 Obj1: THIN layout interface over elkjs.
//
// CONTRACT: this is the ONLY module in archify that imports elkjs. Typed
// renderers call layoutArchitectureStructure() and never touch elkjs. A future
// engine swap touches THIS FILE ONLY (seam demo: grep elkjs across renderers
// hits here and nowhere else).
//
// What it owns: structure (ids, sides, wraps, kinds) IN → machine geometry
// (pos, routes, label anchors) OUT. No per-chart values anywhere: card size,
// gaps, padding, seed come from system-tokens.mjs or ENGINE_OPTIONS below.
// Specs stay structure-only; the banned geometry keys (pos, via, channelX,
// channelY, labelAt, route) never appear in any spec — engine output is
// injected post-validation, in memory only.
//
// Provenance: primitive source/target edge form + FIXED_SIDE 8px ports follow
// the SYS-002 spike (design-explore/sys002-spike/run-spike.mjs), which proved
// 3/3 identical layouts and 13/13 exact-side docks. Nodes lay out FLAT (see
// buildElkGraph); the extended sources[]/targets[] edge form silently drops
// port bindings (spike-measured 6/13 side drifts) and is NEVER used here —
// unexpected engine shapes throw loudly (N5: no silent drops).

import ELK from 'elkjs';
import { SYSTEM_TOKENS } from './system-tokens.mjs';
import { textUnits } from './utils.mjs';
import { segmentIntersectsRect } from './geometry.mjs';

// Engine identity for reports and the swap seam.
export const LAYOUT_ENGINE = Object.freeze({
  name: 'elkjs',
  version: '0.12.0',
  algorithm: 'layered',
});

// Uniform engine options (tuned SYS-003; every value documented, none
// per-chart). Strings per elk-api.d.ts ([key: string]: string).
export const ENGINE_OPTIONS = Object.freeze({
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT', // (1) flow direction declared: story flows left-to-right
  'elk.edgeRouting': 'ORTHOGONAL',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.randomSeed': '1', // nonzero => seeded; zero would be time-based (R4)
  'elk.spacing.nodeNode': String(SYSTEM_TOKENS.gutter.empty), // 40, token empty (reverted from 56 routeThrough: wider gaps worsened O1a 0.69->0.66 with no A9 gain)
  'elk.layered.spacing.nodeNodeBetweenLayers': String(SYSTEM_TOKENS.gutter.empty), // 40, token
  // (1) pin start node first layer: cycleBreaking MODEL_ORDER + considerModelOrder
  // NODES_AND_EDGES respects spec order (components/edges in story order).
  // Without it the request<->match 2-cycle inverts (measured: match x70 before
  // request x386, story began mid-canvas). With it request layouts first.
  // Model order is structure (ids order), never geometry — zero hand values.
  'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
  'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
  // (Amendment C, OSM-SYS-004) renderer clearance target 16 above ruler floor 12:
  // edge-to-node and edge-to-edge gaps aim 16 so delivered clears 12 with
  // margin. Tokens hold the target (system-tokens.mjs v1.1.0 routeToFrame 16); these engine spacings match it.
  'elk.layered.spacing.edgeNodeBetweenLayers': '16',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '16',
  'elk.spacing.edgeNode': '16',
  'elk.spacing.edgeEdge': '16',
  // Fold: flat chains lay out 1-wide (RIGHT: 3314x1080 single row); wrapping
  // folds them into compact 2D grids (RIGHT-wrap: 1214x1122, 0 edge
  // crossings, A1/A7/A10 PASS measured). Uniform for every chart; verified
  // per chart by the single-section guard (N5).
  'elk.layered.wrapping.strategy': 'SINGLE_EDGE',
  // Frame padding mirrors the renderer frame formula (boundaryRect:
  // sides pad 18 tuned (was 30), top max(pad,18+34)=52, bottom pad+14=32)
  // so ELK's obstacle model matches the frames the renderer will draw.
  'elk.padding': '[top=52,left=18,bottom=32,right=18]',
});

// Amendment C renderer targets (OSM-SYS-004: tokens hold targets, engine matches):
// clearance target 16 (token routeToFrame + engine spacings above) vs ruler floor 12;
// arrowhead target max(8, 5*strokeWidth) (token tipToNodeRule + renderTipTarget/PORT below) vs ruler floor 6.
export const RENDER_CLEARANCE_TARGET = 16;
export function renderTipTarget(strokeWidth) {
  const sw = Number.isFinite(strokeWidth) ? strokeWidth : 1.5;
  return Math.max(8, 5 * sw);
}

const CARD_W = SYSTEM_TOKENS.card.width; // 260, token v1.1.0
const CARD_H = SYSTEM_TOKENS.card.height; // 60, token v1.1.0
const PORT = 11; // (Amendment C) elk port box; engine docks at port outer edge.
// Tip gap = PORT - (10-refX)*sw = PORT-1.8 for emphasis 1.8. PORT 11 gives
// 9.2px tip clearance at scale 1 (target 9 = max(8,5*1.8)), clearing floor 6
// with margin; at 0.69 downscale 6.35 still PASS. Tokens hold target 8 + max rule (v1.1.0).
const SIDE2ELK = Object.freeze({ top: 'NORTH', bottom: 'SOUTH', left: 'WEST', right: 'EAST' });
const ELK2SIDE = Object.freeze({ NORTH: 'top', SOUTH: 'bottom', WEST: 'left', EAST: 'right' });
function sideOf(value, fallback) {
  return value === 'top' || value === 'bottom' || value === 'left' || value === 'right'
    ? value
    : fallback;
}

// A structure-only architecture spec: no layout grid, and no component
// carries pos or grid row/col. Grid specs and free-placement specs keep the
// legacy renderer path untouched.
export function isStructureOnlyArchitecture(spec) {
  if (!spec || spec.diagram_type !== 'architecture') return false;
  if (spec.layout && spec.layout.mode === 'grid') return false;
  for (const c of spec.components ?? []) {
    if (Array.isArray(c.pos)) return false;
    if (Number.isInteger(c.row) || Number.isInteger(c.col)) return false;
  }
  return true;
}

// Optional caller overrides (tuning knob only: uniform option swaps during
// SYS-003 tuning, never per-chart values). Keys must exist in
// ENGINE_OPTIONS; unknown keys throw.
export function resolveEngineOptions(overrides = {}) {
  const out = { ...ENGINE_OPTIONS };
  for (const [k, v] of Object.entries(overrides)) {
    if (!(k in ENGINE_OPTIONS)) throw new Error(`layout-engine: unknown option "${k}"`);
    out[k] = v;
  }
  return out;
}
// Canvas margin (SYS-003, uniform): ELK packs from 0,0 but the renderer fits
// frames (pad 30) and title rails (34 clearance + ~20 pill) around members,
// and left frames outside the viewBox (measured: CS title at y-24). The
// margin translates the whole machine layout rigidly; docks hold.
export const ENGINE_MARGIN = Object.freeze({ x: 40, y: 120 });

export function buildElkGraph(spec, options = ENGINE_OPTIONS, sides = null) {
  const connections = spec.connections ?? [];
  const sideFor = (e, end) => {
    const id = e.id ?? `${e.from}__${e.to}`;
    if (sides?.has(id)) return sides.get(id)[end];
    return end === 'from' ? sideOf(e.fromSide, 'bottom') : sideOf(e.toSide, 'top');
  };
  const needPort = new Map(); // nodeId -> Set(side)
  for (const e of connections) {
    if (!needPort.has(e.from)) needPort.set(e.from, new Set());
    if (!needPort.has(e.to)) needPort.set(e.to, new Set());
    needPort.get(e.from).add(sideFor(e, 'from'));
    needPort.get(e.to).add(sideFor(e, 'to'));
  }
  // Model choice (SYS-003, evidence-backed): nodes lay out FLAT — frames are
  // fitted post-hoc by the renderer (boundaryRect) and never enter the ELK
  // model. Compound ELK inverts chain order on this graph (measured 4-5 edge
  // crossings across default/DFS/GREEDY, LONGEST_PATH, INTERACTIVE-c12c13,
  // DOWN and RIGHT — showcase validation can never pass); flat measures 0
  // crossings with chain-linear ranks. Flat-proven spacing applies at root
  // (a/b/c chain: exact 56 gaps). Interleaved owners yield overlapping
  // frames, as the hand layout does; frame-overlap validation only gates
  // deployment-ownership profiles, which structure-only specs omit.
  const children = (spec.components ?? []).map((c) => ({
    id: c.id,
    width: CARD_W,
    height: CARD_H,
    layoutOptions: { 'elk.portConstraints': 'FIXED_SIDE' },
    ports: [...(needPort.get(c.id) ?? ['bottom', 'top'])].map((s) => ({
      id: `${c.id}__${s}`,
      width: PORT,
      height: PORT,
      layoutOptions: { 'elk.port.side': SIDE2ELK[s] },
    })),
  }));
  // Primitive edge form (source/target singular): the ONLY elkjs edge form
  // carrying sourcePort/targetPort (ElkPrimitiveEdge). The extended
  // sources[]/targets[] form silently drops port bindings — banned here.
  const edges = connections.map((e) => ({
    id: e.id ?? `${e.from}__${e.to}`,
    source: e.from,
    target: e.to,
    sourcePort: `${e.from}__${sideFor(e, 'from')}`,
    targetPort: `${e.to}__${sideFor(e, 'to')}`,
  }));
  const rootOptions = {};
  for (const [k, v] of Object.entries(options)) {
    if (k === 'elk.padding') continue;
    rootOptions[k] = v;
  }
  return { id: 'root', layoutOptions: rootOptions, children, edges };
}

// Label anchors (SYS-003 N3, uniform): every labeled edge gets a machine
// anchor that clears ALL routes by >=4px (showcase label-route-clearance
// floor) and never overlaps a component. Per segment (longest first) and
// side, the scan takes the SMALLEST integer offset clearing the buffered
// test — nearest-clear wins, which also minimizes centroid-to-own-wire
// distance (A4 caps the centroid at 24px; sharing a corridor with an
// antiparallel twin can force it past 24 — then A4 fails honestly while the
// render stays valid). Rect math mirrors the renderer (renderConnectionLabel:
// w = max(30, textUnits*4.8+10), h = 14, centered). Deterministic: fixed
// order, integer steps, best-effort max-clearance fallback.
const LABEL_GAP = 4;
const LABEL_H = 14;
const LABEL_OFF_MIN = 10;
const LABEL_OFF_MAX = 120;

function labelRect(lx, ly, label) {
  const w = Math.max(30, textUnits(label) * 4.8 + 10);
  return { x: lx - w / 2, y: ly - 10, width: w, height: LABEL_H };
}

function pointSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function segIntersectsBufferedRect(rect, buf, p, q) {
  const x0 = rect.x - buf;
  const y0 = rect.y - buf;
  const x1 = rect.x + rect.width + buf;
  const y1 = rect.y + rect.height + buf;
  const inside = ([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  if (inside(p) || inside(q)) return true;
  const edges = [
    [[x0, y0], [x1, y0]], [[x1, y0], [x1, y1]],
    [[x1, y1], [x0, y1]], [[x0, y1], [x0, y0]],
  ];
  const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const cross = (a, b, c, d) => orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;
  return edges.some(([a, b]) => cross(p, q, a, b));
}

function anchorClearance(rect, routes, boxes) {
  for (const pts of routes) {
    for (let i = 0; i < pts.length - 1; i += 1) {
      if (segIntersectsBufferedRect(rect, LABEL_GAP, pts[i], pts[i + 1])) return 0;
    }
  }
  for (const b of boxes) {
    if (rect.x < b.x + b.width && rect.x + rect.width > b.x && rect.y < b.y + b.height && rect.y + rect.height > b.y) return 0;
  }
  let best = Infinity;
  for (const pts of routes) {
    for (let i = 0; i < pts.length - 1; i += 1) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      for (const [cx, cy] of [[rect.x, rect.y], [rect.x + rect.width, rect.y], [rect.x, rect.y + rect.height], [rect.x + rect.width, rect.y + rect.height]]) {
        best = Math.min(best, pointSegDist(cx, cy, ax, ay, bx, by));
      }
      best = Math.min(best, pointSegDist(ax, ay, rect.x, rect.y, rect.x + rect.width, rect.y + rect.height));
    }
  }
  return best;
}

function placeLabel(label, points, allRoutes, boxes) {
  if (points.length < 2) return null;
  const order = points.slice(0, -1).map((p, i) => {
    const q = points[i + 1];
    return { i, len: Math.hypot(q[0] - p[0], q[1] - p[1]) };
  }).sort((a, b) => b.len - a.len);
  for (const { i } of order) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    for (const s of [1, -1]) {
      for (let off = LABEL_OFF_MIN; off <= LABEL_OFF_MAX; off += 1) {
        const lx = Math.round(mx + nx * off * s);
        const ly = Math.round(my + ny * off * s);
        const rect = labelRect(lx, ly, label);
        if (anchorClearance(rect, allRoutes, boxes) > 0) return [lx, ly];
      }
    }
  }
  return null;
}

// Structure IN → machine geometry OUT. Returns a patched spec clone (engine
// pos injected; banned keys still absent from the author's spec) plus route
// tables the renderer consumes verbatim. Throws loudly on any unexpected
// engine shape — never a silent drop (N5).
// Side derivation (SYS-003, uniform): pass-1 positions decide every edge's
// dock sides from center geometry — dominant axis wins, ties go vertical
// (chain-friendly). Hand sides referenced hand positions; machine positions
// need machine sides, else routes loop against the grain (measured: c01
// left/left on flat geometry yields a 10px interior stub, showcase rhythm
// floor is 16). Spec sides act as pass-1 hints only. Deterministic: pure
// function of pass-1 geometry, no chart values.
export function deriveSides(positions, connections) {
  const out = new Map();
  for (const e of connections ?? []) {
    const id = e.id ?? `${e.from}__${e.to}`;
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b) continue;
    const dx = (b[0] + CARD_W / 2) - (a[0] + CARD_W / 2);
    const dy = (b[1] + CARD_H / 2) - (a[1] + CARD_H / 2);
    if (Math.abs(dy) >= Math.abs(dx)) {
      out.set(id, dy >= 0 ? { from: 'bottom', to: 'top' } : { from: 'top', to: 'bottom' });
    } else {
      out.set(id, dx >= 0 ? { from: 'right', to: 'left' } : { from: 'left', to: 'right' });
    }
  }
  return out;
}

function revive(node, dx, dy, frames, nodes) {
  const ax = (node.x ?? 0) + dx;
  const ay = (node.y ?? 0) + dy;
  if (node.id?.startsWith('frame')) {
    frames.set(node.id, { x: ax, y: ay, width: node.width, height: node.height });
    for (const c of node.children ?? []) revive(c, ax, ay, frames, nodes);
  } else if (node.id !== 'root') {
    nodes.set(node.id, { x: ax, y: ay, width: node.width, height: node.height });
  } else {
    for (const c of node.children ?? []) revive(c, ax, ay, frames, nodes);
  }
}

export function sidesEqual(a, b) {
  if (!a || !b || a.size !== b.size) return false;
  for (const [k, v] of a) {
    const w = b.get(k);
    if (!w || w.from !== v.from || w.to !== v.to) return false;
  }
  return true;
}

export async function layoutArchitectureStructure(spec, overrides = {}) {
  const elk = new ELK();
  const options = resolveEngineOptions(overrides);
  // Two passes, no more (SYS-003): pass 1 lays out with spec-side/default
  // ports; pass 2 re-lays with sides derived from pass-1 geometry, then
  // settles routes from those ports. Deeper fixpoint iteration DIVERGES on
  // wrapped folds (measured: 4 rounds oscillate c07/c08/c09/c10 sides while
  // columns proliferate 4->6) — single refinement is the stable point.
  // Seeded-deterministic; the round trail is returned for report evidence.
  const sideTrail = [];
  const first = await elk.layout(buildElkGraph(spec, options, null));
  const firstNodes = new Map();
  revive(first, 0, 0, new Map(), firstNodes);
  const pass1 = new Map([...firstNodes.entries()].map(([id, r]) => [id, [r.x, r.y]]));
  sideTrail.push({ round: 0, stable: false });
  const sides = deriveSides(pass1, spec.connections);
  const laid = await elk.layout(buildElkGraph(spec, options, sides));
  sideTrail.push({ round: 'settle', stable: true });
  const frames = new Map();
  const nodes = new Map();
  revive(laid, 0, 0, frames, nodes);
  for (const c of spec.components ?? []) {
    if (!nodes.has(c.id)) {
      throw new Error(
        `layout-engine: elkjs dropped node "${c.id}" — no silent drops (N5); check wraps/edges reference it`,
      );
    }
  }
  // Coordinate frames (spike-verified): edges whose endpoints share one
  // compound frame carry sections relative to THAT frame; cross-frame edges
  // carry root-relative sections. Multi-section edges never occur with
  // hierarchyHandling=INCLUDE_CHILDREN on these graphs — abort if seen.
  const frameOf = new Map();
  (spec.boundaries ?? []).forEach((o, fi) => (o.wraps ?? []).forEach((id) => frameOf.set(id, `frame${fi}`)));
  const edgeById = new Map((laid.edges ?? []).map((e) => [e.id, e]));
  const routes = new Map(); // edgeId -> absolute full point list (incl endpoints)
  const sideChecks = [];
  for (const e of spec.connections ?? []) {
    const id = e.id ?? `${e.from}__${e.to}`;
    const le = edgeById.get(id);
    if (!le) throw new Error(`layout-engine: elkjs dropped edge "${id}" — no silent drops (N5)`);
    const sections = le.sections ?? [];
    if (sections.length !== 1) {
      throw new Error(
        `layout-engine: edge "${id}" returned ${sections.length} sections (expected 1) — no silent drops (N5)`,
      );
    }
    const [sec] = sections;
    const sameFrame = frameOf.has(e.from) && frameOf.get(e.from) === frameOf.get(e.to);
    const base = sameFrame ? (frames.get(frameOf.get(e.from)) ?? { x: 0, y: 0 }) : { x: 0, y: 0 };
    const origin = { x: (sec.startPoint?.x ?? 0) + base.x, y: (sec.startPoint?.y ?? 0) + base.y };
    const bends = (sec.bendPoints ?? []).map((p) => [p.x + base.x, p.y + base.y]);
    const end = { x: (sec.endPoint?.x ?? 0) + base.x, y: (sec.endPoint?.y ?? 0) + base.y };
    const points = [
      [Math.round(origin.x), Math.round(origin.y)],
      ...bends.map(([x, y]) => [Math.round(x), Math.round(y)]),
      [Math.round(end.x), Math.round(end.y)],
    ];
    // All-orthogonal guard: engine contract is square routes (R2).
    for (let i = 0; i < points.length - 1; i += 1) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      if (x1 !== x2 && y1 !== y2) {
        throw new Error(
          `layout-engine: edge "${id}" returned a diagonal segment ${JSON.stringify(points[i])}->${JSON.stringify(points[i + 1])} — orthogonal contract broken (R2)`,
        );
      }
    }
    routes.set(id, points);
    // Exact-side dock check (R3) against the DERIVED sides: endpoint must
    // sit on the derived side's port line (11px outside the node border per
    // Amendment C PORT, 3px tolerance), free to slide along the side.
    const derived = sides.get(id) ?? { from: 'bottom', to: 'top' };
    const fromRect = nodes.get(e.from);
    const toRect = nodes.get(e.to);
    sideChecks.push({ id, from: onRequestedSide(fromRect, derived.from, points[0]), to: onRequestedSide(toRect, derived.to, points[points.length - 1]), sides: derived });
  }
  // Micro-jog merge (SYS-003, uniform): ELK emits sub-16px interior stubs at
  // port-approach jogs (measured: c07 11px); the showcase rhythm floor is
  // 16px. A stub collinear with a neighbor folds into that run — endpoints
  // never move, orthogonality holds. The folded run must clear every
  // non-endpoint node or the merge is skipped (renderer validation judges).
  const nodeBoxes = new Map(
    [...nodes.entries()].map(([nid, r]) => [nid, { id: nid, x: r.x, y: r.y, width: r.width, height: r.height }]),
  );
  for (const e of spec.connections ?? []) {
    const id = e.id ?? `${e.from}__${e.to}`;
    const merged = mergeMicroSegments(routes.get(id), nodeBoxes, e.from, e.to);
    if (merged) routes.set(id, merged);
  }
  // Rigid margin translation (ENGINE_MARGIN): positions and routes shift
  // together — docks hold exactly.
  const shift = ([x, y]) => [x + ENGINE_MARGIN.x, y + ENGINE_MARGIN.y];
  const positions = new Map(
    [...nodes.entries()].map(([id, r]) => [id, shift([Math.round(r.x), Math.round(r.y)])]),
  );
  for (const [id, pts] of routes) routes.set(id, pts.map(shift));
  // (2) backward edges via dedicated full-page edge margin (SYS-003):
  // edges against story order (src index > tgt index in spec.components order,
  // e.g. c12 match->request retry, c13 md_signoff->costing reject) must NOT
  // circumnavigate or share the forward twin corridor (measured: c01/c12 share
  // y162 opposite directions, forcing labels 45-77px off-wire and A9 spread
  // 83px). They route via a uniform horizontal channel in the inter-row gutter
  // (full-page width, no nodes): for same-row feedback, marginY = max(sy,ty)+16
  // (16px below bottom ports, rhythm-exact; clears row above by 27px and row
  // below by 26px in the 53px gutter, both above target 16). Sides overridden
  // bottom->bottom, endpoints centered on bottom ports. Pills sit above members,
  // so below-row avoids A1; 16px+ clears A9 floor 12; isolated corridor lets
  // labels sit nearest-clear (A4). Different-row feedback (none in e-invoice)
  // falls back to global bottom marginY = maxNodeBottom+60. No per-chart values:
  // indices from spec order, margins from layout bounds. Trees (no backward)
  // skip this entirely — zero org-specific branching.
  {
    const compIndex = new Map((spec.components ?? []).map((c, i) => [c.id, i]));
    const backwardIds = [];
    for (const e of spec.connections ?? []) {
      const id = e.id ?? `${e.from}__${e.to}`;
      const si = compIndex.get(e.from);
      const ti = compIndex.get(e.to);
      if (si !== undefined && ti !== undefined && si > ti) backwardIds.push({ id, from: e.from, to: e.to });
    }
    if (backwardIds.length) {
      let maxBottom = -Infinity;
      for (const [, p] of positions) maxBottom = Math.max(maxBottom, p[1] + CARD_H);
      const globalMarginY = Math.round(maxBottom + 60);
      for (const { id, from, to } of backwardIds) {
        const sp = positions.get(from);
        const tp = positions.get(to);
        if (!sp || !tp) continue;
        const sx = Math.round(sp[0] + CARD_W / 2);
        const sy = Math.round(sp[1] + CARD_H + PORT);
        const tx = Math.round(tp[0] + CARD_W / 2);
        const ty = Math.round(tp[1] + CARD_H + PORT);
        const sameRow = sp[1] === tp[1];
        if (!sameRow) {
          const newRoute = [[sx, sy], [sx, globalMarginY], [tx, globalMarginY], [tx, ty]];
          routes.set(id, newRoute);
          sides.set(id, { from: 'bottom', to: 'bottom' });
          const sc0 = sideChecks.find((s) => s.id === id);
          if (sc0) {
            sc0.from = true;
            sc0.to = true;
            sc0.sides = { from: 'bottom', to: 'bottom' };
            sc0.margin = true;
          }
          continue;
        }
        // Same-row feedback (OSM-SEE-008): enter the target's facing side so
        // the head arrives along the row (A12). Bottom-entry left 14px
        // up-hooks shorter than the 15px head they carry (10 x 1.5); the head
        // read as turned 90 degrees against its 300px+ run while A10 passed.
        // Shape: downstub, below-deck run (labels ride here, A4), riser in
        // the inter-card corridor, 20px facing-side final (head mounts fully).
        // Corridor guard: midpoint riser needs 28px each side for the A9 12px
        // floor with margin; narrower falls back to bottom/bottom (old shape).
        // MarginY rule unchanged (14px below ports: terminals stop 1px short
        // of the forward mid-gap horizontals, no proper-crossings, in-gap).
        // Terminals stay exempt from the 16px rhythm floor (pads).
        const marginY = Math.max(sy, ty) + 14;
        const toRight = sx >= tx;
        const targetEdge = toRight ? tp[0] + CARD_W : tp[0];
        const originEdge = toRight ? sp[0] : sp[0] + CARD_W;
        const corridor = Math.abs(originEdge - targetEdge);
        const entrySide = toRight ? 'right' : 'left';
        const sc = sideChecks.find((s) => s.id === id);
        if (corridor < 56) {
          const newRoute = [[sx, sy], [sx, marginY], [tx, marginY], [tx, ty]];
          routes.set(id, newRoute);
          sides.set(id, { from: 'bottom', to: 'bottom' });
          if (sc) {
            sc.from = true;
            sc.to = true;
            sc.sides = { from: 'bottom', to: 'bottom' };
            sc.margin = true;
          }
          continue;
        }
        const rx = Math.round((targetEdge + originEdge) / 2);
        const ey = Math.round(tp[1] + CARD_H / 2);
        const ex = toRight ? Math.round(targetEdge + PORT) : Math.round(targetEdge - PORT);
        const newRoute = [[sx, sy], [sx, marginY], [rx, marginY], [rx, ey], [ex, ey]];
        routes.set(id, newRoute);
        sides.set(id, { from: 'bottom', to: entrySide });
        if (sc) {
          sc.from = true;
          sc.to = true;
          sc.sides = { from: 'bottom', to: entrySide };
          sc.margin = true;
        }
      }
    }
  }
// Fold one sub-16px interior stub into a collinear neighbor run. Returns the
// new point list, or null when no safe fold exists. Never touches endpoints.
function mergeMicroSegments(points, nodeBoxes, fromId, toId) {
  if (!points || points.length < 4) return null;
  const segLen = (i) => Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
  const clears = (a, b) => {
    const seg = { start: a, end: b };
    for (const [nid, box] of nodeBoxes) {
      if (nid === fromId || nid === toId) continue;
      if (segmentIntersectsRect(seg, box, 0)) return false;
    }
    return true;
  };
  for (let i = 1; i < points.length - 2; i += 1) {
    if (segLen(i) >= 16) continue;
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const [cx, cy] = points[i + 1];
    const [dx, dy] = points[i + 2];
    // Stub B->C collinear with previous run A->B: drop B, extend the run.
    if ((ax === bx && bx === cx) || (ay === by && by === cy)) {
      if (!clears(points[i - 1], points[i + 1])) continue;
      return [...points.slice(0, i), ...points.slice(i + 1)];
    }
    // Stub B->C collinear with next run C->D: drop C, extend that run.
    if ((bx === cx && cx === dx) || (by === cy && cy === dy)) {
      if (!clears(points[i], points[i + 2])) continue;
      return [...points.slice(0, i + 1), ...points.slice(i + 2)];
    }
    // Isolated jog: stub B->C short with both neighbor runs on the other
    // axis (A->B parallel C->D). Unite the runs at B's line: drop C, move D
    // onto it (endpoints never move). Accept only when every interior run
    // stays >=16px and new runs clear non-endpoint nodes.
    const abVert = ax === bx;
    const abHoriz = ay === by;
    const cdVert = cx === dx;
    const cdHoriz = cy === dy;
    const bcVert = bx === cx;
    const bcHoriz = by === cy;
    if (i + 2 <= points.length - 2 && ((abVert && cdVert && bcHoriz) || (abHoriz && cdHoriz && bcVert))) {
      const dp = abVert ? [bx, dy] : [dx, by];
      const cand = [...points.slice(0, i + 1), dp, ...points.slice(i + 3)];
      let ok = true;
      for (let k = 1; k < cand.length - 2; k += 1) {
        const [x1, y1] = cand[k];
        const [x2, y2] = cand[k + 1];
        if (x1 !== x2 && y1 !== y2) { ok = false; break; }
        if (Math.hypot(x2 - x1, y2 - y1) < 16) { ok = false; break; }
      }
      if (ok) {
        const segOK = (a, b) => {
          const seg = { start: a, end: b };
          for (const [nid, box] of nodeBoxes) {
            if (nid === fromId || nid === toId) continue;
            if (segmentIntersectsRect(seg, box, 0)) return false;
          }
          return true;
        };
        if (segOK(cand[i - 1], cand[i]) && segOK(cand[i], cand[i + 1])) return cand;
      }
    }
  }
  return null;
}

  const patched = structuredClone(spec);
  for (const c of patched.components) {
    const p = positions.get(c.id);
    if (p) c.pos = p; // engine output, in memory only — the author spec stays clean
  }
  for (const c of patched.connections ?? []) {
    const lid = c.id ?? `${c.from}__${c.to}`;
    const s = sides.get(lid);
    if (s) { c.fromSide = s.from; c.toSide = s.to; } // engine sides, in memory only
  }
  return { spec: patched, positions, routes, sideChecks, sides, sideTrail, engine: LAYOUT_ENGINE };
}

// Label placement entry for the renderer (SYS-003 N3): the renderer owns
// pill boxes (titles lift renderer-side), the search stays here. components
// is the renderer's measured component map (x/y/width/height); extraRects
// are pill boxes {x,y,width,height}. Returns edgeId -> [lx, ly] using the
// renderer's own label rect math. In memory only.
export function placeConnectionLabels(connections, routes, components, extraRects = []) {
  const allRoutes = [...routes.values()];
  const boxes = [
    ...[...components.values()].map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })),
    ...extraRects,
  ];
  const out = new Map();
  for (const e of connections ?? []) {
    if (!e.label) continue;
    const lid = e.id ?? `${e.from}__${e.to}`;
    const pts = routes.get(lid);
    if (!pts) continue;
    const at = placeLabel(e.label, pts, allRoutes, boxes);
    if (at) out.set(lid, at);
  }
  return out;
}

function onRequestedSide(rect, side, pt) {
  const TOL = 3;
  const [px, py] = pt;
  if (side === 'left') return Math.abs(px - (rect.x - PORT)) <= TOL && py >= rect.y - TOL && py <= rect.y + rect.height + TOL;
  if (side === 'right') return Math.abs(px - (rect.x + rect.width + PORT)) <= TOL && py >= rect.y - TOL && py <= rect.y + rect.height + TOL;
  if (side === 'top') return Math.abs(py - (rect.y - PORT)) <= TOL && px >= rect.x - TOL && px <= rect.x + rect.width + TOL;
  return Math.abs(py - (rect.y + rect.height + PORT)) <= TOL && px >= rect.x - TOL && px <= rect.x + rect.width + TOL;
}

export function dockSummary(sideChecks) {
  const bad = sideChecks.filter((s) => !(s.from && s.to));
  return {
    ok: bad.length === 0,
    text: `port docking: ${sideChecks.length - bad.length}/${sideChecks.length} exact-side`,
    bad,
  };
}
