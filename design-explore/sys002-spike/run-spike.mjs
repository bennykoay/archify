// run-spike.mjs — OSM-SYS-002 O2 spike: STRUCTURE ONLY in, engine geometry out.
// Reads spike-input.json (nodes, edges, owners, kinds; zero geometry keys).
// Lays out with elkjs (layered + ORTHOGONAL + ports + compound), THREE times,
// asserts byte-identical canonical output (R4 determinism gate), then emits an
// archify architecture spec whose ONLY geometry (pos, via) is engine output.
// Engine config (uniform sizes/padding/spacing/seed) is documented below and
// sourced from system-tokens.mjs where a token exists — never per-node values.
import ELK from 'elkjs';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYSTEM_TOKENS } from '../../archify/renderers/shared/system-tokens.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const fail = (msg) => { console.error(`spike ABORT: ${msg}`); process.exit(2); };

// ---- Engine config (uniform, documented; no per-node authoring) ----
const CARD_W = SYSTEM_TOKENS.card.width; // 260, token v1.0.0
const CARD_H = SYSTEM_TOKENS.card.height; // 60, token v1.0.0
const GAP = SYSTEM_TOKENS.gutter.empty; // 40, token v1.0.0
// Frame padding mirrors the archify frame formula (render-architecture.mjs
// boundaryRect: sides pad, top max(pad, 18+34)=52, bottom pad+14) so ELK's
// obstacle model matches the frames the renderer will draw. Default pad 30.
const ELK_PADDING = '[top=52,left=30,bottom=44,right=30]';
const SEED = 1; // elk.randomSeed nonzero => seeded, never time-based
const SIDE2ELK = { top: 'NORTH', bottom: 'SOUTH', left: 'WEST', right: 'EAST' };

const input = JSON.parse(readFileSync(join(HERE, 'spike-input.json'), 'utf8'));
const ownerOf = new Map();
for (const o of input.owners) for (const id of o.wraps) ownerOf.set(id, o.label);

function buildElkGraph() {
  const needPort = new Map(); // nodeId -> Set(side)
  for (const e of input.edges) {
    if (!needPort.has(e.from)) needPort.set(e.from, new Set());
    if (!needPort.has(e.to)) needPort.set(e.to, new Set());
    needPort.get(e.from).add(e.fromSide);
    needPort.get(e.to).add(e.toSide);
  }
  const frames = input.owners.map((o, fi) => ({
    id: `frame${fi}`,
    layoutOptions: { 'elk.padding': ELK_PADDING },
    children: o.wraps.map((id) => ({
      id,
      width: CARD_W,
      height: CARD_H,
      layoutOptions: { 'elk.portConstraints': 'FIXED_SIDE' },
      ports: [...needPort.get(id)].map((s) => ({
        id: `${id}__${s}`,
        width: 8,
        height: 8,
        layoutOptions: { 'elk.port.side': SIDE2ELK[s] },
      })),
    })),
  }));
  // Primitive edge form (source/target singular): the ONLY elkjs edge form
  // carrying sourcePort/targetPort (elk-api.d.ts: ElkPrimitiveEdge; the
  // extended sources[]/targets[] form silently drops port bindings —
  // found empirically: 6/13 side drifts with arrays, 0 tolerated here).
  const edges = input.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    sourcePort: `${e.from}__${e.fromSide}`,
    targetPort: `${e.to}__${e.toSide}`,
  }));
  return {
    id: 'root',
  layoutOptions: {
    // LayoutOptions values are strings per elk-api.d.ts ([key:string]:string).
    'elk.algorithm': 'layered',
    'elk.direction': 'DOWN',
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.randomSeed': String(SEED),
    'elk.spacing.nodeNode': String(GAP),
    'elk.layered.spacing.nodeNodeBetweenLayers': String(GAP),
  },
    children: frames,
    edges,
  };
}

// Deterministic canonical form: recursive key sort, dropping GWT runtime
// identity fields ($H object hashes differ per JS object identity and carry
// zero layout meaning — verified identical geometry with differing $H).
function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).filter((k) => !k.startsWith('$')).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  }
  return JSON.stringify(v);
}
const sha8 = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);

const elk = new ELK();
const runs = [];
for (let i = 0; i < 3; i++) {
  // Fresh object graph each run so no layout residue leaks between runs.
  const out = await elk.layout(buildElkGraph());
  runs.push(canonical(out));
}
const hashes = runs.map((r) => createHash('sha256').update(r).digest('hex'));
console.log(`triple-render layout sha256:\n 1 ${hashes[0]}\n 2 ${hashes[1]}\n 3 ${hashes[2]}`);
if (!(hashes[0] === hashes[1] && hashes[1] === hashes[2])) fail('non-identical triple layout — candidate DISQUALIFIED on R4');
console.log('determinism: 3/3 identical [Certain, empirical]');

const laid = JSON.parse(runs[0]);
// Rehydrate: canonical() sorted keys, values intact.
function revive(node, dx, dy, frames, nodes) {
  const ax = (node.x ?? 0) + dx, ay = (node.y ?? 0) + dy;
  if (node.id?.startsWith('frame')) {
    frames.set(node.id, { x: ax, y: ay, width: node.width, height: node.height });
    for (const c of node.children ?? []) revive(c, ax, ay, frames, nodes);
  } else if (node.id !== 'root') {
    nodes.set(node.id, { x: ax, y: ay, width: node.width, height: node.height });
  } else {
    for (const c of node.children ?? []) revive(c, ax, ay, frames, nodes);
  }
}
const frames = new Map(), nodes = new Map();
revive(laid, 0, 0, frames, nodes);
// Verify frame geometry matches children bbox + configured padding.
for (const [fid, f] of frames) {
  const kids = input.owners[Number(fid.replace('frame', ''))].wraps.map((id) => nodes.get(id));
  const minX = Math.min(...kids.map((k) => k.x)), minY = Math.min(...kids.map((k) => k.y));
  const maxX = Math.max(...kids.map((k) => k.x + k.width)), maxY = Math.max(...kids.map((k) => k.y + k.height));
  const dw = f.width - (maxX - minX), dh = f.height - (maxY - minY);
  console.log(`${fid}: padL/R~${(f.x <= minX ? minX - f.x : NaN).toFixed(1)} top~${(minY - f.y).toFixed(1)} w+${dw.toFixed(1)} h+${dh.toFixed(1)}`);
}
// Edge sections -> absolutized via bend points (bendPoints only; the renderer
// computes its own endpoint anchors from pos+sides).
// Coordinate frames (verified empirically): an edge whose endpoints share one
// compound frame carries sections relative to THAT frame; cross-frame edges
// carry root-relative sections. Multi-section edges are rejected (none occur
// with hierarchyHandling=INCLUDE_CHILDREN on this graph; abort if seen).
const frameOf = new Map();
input.owners.forEach((o, fi) => o.wraps.forEach((id) => frameOf.set(id, `frame${fi}`)));
const edgeById = new Map(laid.edges.map((e) => [e.id, e]));
let sideMismatches = 0;
const SIDE_OF = { left: 'WEST', right: 'EAST', top: 'NORTH', bottom: 'SOUTH' };
// ELK places bound ports OUTSIDE the node border: an 8px port on side S puts
// the section endpoint 8px outside S, free to slide along S (FIXED_SIDE).
// Verified: request__left port at node-local (-8,26), section starts at the
// port outer edge. So the check is: endpoint on the requested side's port
// line (8px out, 3px tolerance) with the along-side coordinate inside the
// node span. Side identity is exact (not nearest-side guesswork).
const PORT = 8;
function onRequestedSide(rect, side, pt) {
  const t = 3;
  if (side === 'left') return Math.abs(pt.x - (rect.x - PORT)) <= t && pt.y >= rect.y - t && pt.y <= rect.y + rect.height + t;
  if (side === 'right') return Math.abs(pt.x - (rect.x + rect.width + PORT)) <= t && pt.y >= rect.y - t && pt.y <= rect.y + rect.height + t;
  if (side === 'top') return Math.abs(pt.y - (rect.y - PORT)) <= t && pt.x >= rect.x - t && pt.x <= rect.x + rect.width + t;
  if (side === 'bottom') return Math.abs(pt.y - (rect.y + rect.height + PORT)) <= t && pt.x >= rect.x - t && pt.x <= rect.x + rect.width + t;
  return false;
}
const connections = input.edges.map((e) => {
  const le = edgeById.get(e.id) ?? fail(`ELK dropped edge ${e.id}`);
  if ((le.sections?.length ?? 0) !== 1) fail(`edge ${e.id} has ${le.sections?.length ?? 0} sections (expected exactly 1)`);
  if (le.sourcePort !== `${e.from}__${e.fromSide}` || le.targetPort !== `${e.to}__${e.toSide}`) {
    fail(`edge ${e.id} port binding lost (got ${le.sourcePort}/${le.targetPort})`);
  }
  const sec = le.sections[0];
  const sameFrame = frameOf.get(e.from) === frameOf.get(e.to);
  const org = sameFrame ? frames.get(frameOf.get(e.from)) : { x: 0, y: 0 };
  const abs = (p) => ({ x: p.x + org.x, y: p.y + org.y });
  const start = abs(sec.startPoint), end = abs(sec.endPoint);
  const bends = (sec.bendPoints ?? []).map(abs);
  const from = nodes.get(e.from), to = nodes.get(e.to);
  const sOk = onRequestedSide(from, e.fromSide, start), tOk = onRequestedSide(to, e.toSide, end);
  if (!sOk || !tOk) {
    sideMismatches++;
    console.log(`side drift ${e.id}: want ${e.fromSide}/${e.toSide} start=(${start.x.toFixed(1)},${start.y.toFixed(1)}) end=(${end.x.toFixed(1)},${end.y.toFixed(1)})`);
  }
  const via = bends.map((p) => [Math.round(p.x), Math.round(p.y)]);
  const conn = { from: e.from, fromSide: e.fromSide, id: e.id, to: e.to, toSide: e.toSide, variant: e.variant };
  if (e.label) conn.label = e.label;
  if (via.length) conn.via = via;
  return conn;
});
console.log(`port docking: ${input.edges.length - sideMismatches}/${input.edges.length} exact-side`);
// All-orthogonal check on engine sections (absolutized full point lists).
let nonOrtho = 0;
for (const e of input.edges) {
  const sec = edgeById.get(e.id).sections[0];
  const sameFrame = frameOf.get(e.from) === frameOf.get(e.to);
  const org = sameFrame ? frames.get(frameOf.get(e.from)) : { x: 0, y: 0 };
  const pts = [sec.startPoint, ...(sec.bendPoints ?? []), sec.endPoint].map((p) => ({ x: p.x + org.x, y: p.y + org.y }));
  for (let i = 0; i + 1 < pts.length; i++) {
    if (Math.abs(pts[i].x - pts[i + 1].x) > 0.01 && Math.abs(pts[i].y - pts[i + 1].y) > 0.01) nonOrtho++;
  }
}
console.log(`orthogonal segments: ${nonOrtho === 0 ? 'ALL' : `${nonOrtho} NON-ORTHO SEGMENTS`}`);

const byId = new Map(input.nodes.map((n) => [n.id, n]));
const spec = {
  boundaries: input.owners.map((o) => ({ kind: o.kind, label: o.label, wraps: o.wraps })),
  components: input.nodes.map((n) => {
    const p = nodes.get(n.id) ?? fail(`ELK dropped node ${n.id}`);
    return { id: n.id, label: n.label, pos: [Math.round(p.x), Math.round(p.y)], sublabel: n.sublabel, type: input.nodeKind };
  }),
  connections,
  diagram_type: 'architecture',
  meta: { title: 'sys002 spike — ELK orthogonal layout, zero authored geometry' },
  schema_version: 1,
};
const specCanon = canonical(spec);
const specSha = createHash('sha256').update(specCanon).digest('hex');
console.log(`spec canonical sha256: ${specSha}`);
// Immutable slot: same content => same sha8 stem, next free revision suffix.
const stem = `sys002-spike-spec_${specSha.slice(0, 8)}`;
const taken = new Set(readdirSync(HERE));
let rev = 1;
while (taken.has(`${stem}_r${String(rev).padStart(2, '0')}.json`)) rev++;
const specName = `${stem}_r${String(rev).padStart(2, '0')}.json`;
writeFileSync(join(HERE, specName), `${JSON.stringify(spec, null, 2)}\n`);
console.log(`SPEC_FILE: ${specName}`);
console.log(`NOTE: pos[] and via[] above are ELK output (regenerable by this script from spike-input.json); the input carries zero geometry keys.`);
