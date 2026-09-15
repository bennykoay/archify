#!/usr/bin/env node
// see006-calib.mjs — OSM-SEE-006 O3: calibration-fixture builder + grader.
// Builds 10 synthetic PNGs (480x360) with KNOWN colour geometry, grades each
// with colour-assert.mjs measure(), and exits 1 unless every primary
// predicted==actual (self-checking fixtures: palette search hits bands or
// the builder refuses to emit).
//
// Bands (pre-committed, same floors as the gate):
//   NEG  pair dE00 in [3.0, 6.0]   (clear PASS)
//   POSJ pair dE00 in [0.5, 0.9]    (just under the 1.0 floor)
//   POSC pair dE00 = 0              (identical)
//   P3N  drift 0                    (token-exact)
//   P3J  drift in [2.2, 2.8]        (just over the 2.0 ceiling)
//   P3C  drift >= 8                 (clearly over)
// Fixtures: C1 P1-neg, C2 P1-posJ, C3 P1-posC, C4 P2-neg(+border),
//   C5 P2-posJ(+border), C6 P2-posC(+border), C7 P3-neg, C8 P3-posJ,
//   C9 P3-posC, C10 empty (no surfaces -> all NA).
// Geometry mirrors real charts: frame F in svg, card C inside F, page outside.
// P2 fixtures draw a 2px contrasting border on both boundaries: the border
// must not save identical fills (C5/C6 FAIL) nor sink distinct fills (C4 PASS).
//
// Usage: node tools/archify/design-explore/see006/see006-calib.mjs [--outdir D]
// Stdout: per-fixture predicted-vs-actual + catch/false-alarm rates.

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { writePngPixels } from '../../archify/renderers/shared/png-pixels.mjs';
import { measure, deltaE2000, rgbToLab, FLOOR_DE00_SEPARATION, FLOOR_DE00_DRIFT } from '../../scripts/colour-assert.mjs';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 && args[i + 1] ? args[i + 1] : d; };
const OUT = resolve(opt('--outdir', 'tools/archify/design-explore/see006/calib'));
mkdirSync(OUT, { recursive: true });

const W = 480, H = 360;
const FRAME = { id: 'F', x: 60, y: 60, w: 360, h: 240 };
const CARD = { id: 'C', frame: 'F', x: 150, y: 140, w: 180, h: 80 };
const hex = (v) => '#' + [v, v, v].map((c) => c.toString(16).padStart(2, '0')).join('');
const dE = (h1, h2) => {
  const p = (h) => { const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
  return deltaE2000(rgbToLab(p(h1)), rgbToLab(p(h2)));
};
// Deterministic neutral-gray palette search (grays keep the fixtures in the
// same achromatic class as the real-chart surfaces under test).
const GRAYS = [];
for (let v = 8; v <= 248; v += 2) GRAYS.push(hex(v));
function findPair(lo, hi, except = []) {
  for (const a of GRAYS) {
    if (except.includes(a)) continue;
    for (const b of GRAYS) {
      if (b <= a || except.includes(b)) continue;
      const d = dE(a, b);
      if (d >= lo && d <= hi) return [a, b, d];
    }
  }
  throw new Error(`see006-calib: no gray pair in [${lo},${hi}]`);
}
function paint({ page, lane, card, border }) {
  const buf = Buffer.alloc(W * H * 4);
  const set = (x, y, h) => {
    const v = parseInt(h.slice(1), 16);
    const i = (y * W + x) * 4;
    buf[i] = (v >> 16) & 255; buf[i + 1] = (v >> 8) & 255; buf[i + 2] = v & 255; buf[i + 3] = 255;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, page);
  for (let y = FRAME.y; y < FRAME.y + FRAME.h; y++) for (let x = FRAME.x; x < FRAME.x + FRAME.w; x++) set(x, y, lane);
  for (let y = CARD.y; y < CARD.y + CARD.h; y++) for (let x = CARD.x; x < CARD.x + CARD.w; x++) set(x, y, card);
  if (border) {
    // 2px contrasting line centred on each boundary (1px in, 1px out).
    const line = (r) => {
      for (let x = r.x - 1; x < r.x + r.w + 1; x++) for (const y of [r.y - 1, r.y, r.y + r.h - 1, r.y + r.h]) {
        if (x >= 0 && y >= 0 && x < W && y < H) set(x, y, border);
      }
      for (let y = r.y - 1; y < r.y + r.h + 1; y++) for (const x of [r.x - 1, r.x, r.x + r.w - 1, r.x + r.w]) {
        if (x >= 0 && y >= 0 && x < W && y < H) set(x, y, border);
      }
    };
    line(FRAME); line(CARD);
  }
  return buf;
}
function specFor() {
  return {
    image: { width: W, height: H },
    svg: { x: 0, y: 0, w: W, h: H },
    frames: [{ ...FRAME }], cards: [{ ...CARD }], pills: [], overlays: [],
  };
}
// Separation palette (searched, printed, baked).
const [negA, negB, negD] = findPair(3.0, 6.0); // distinct fills, clear PASS
const [posJA, posJB, posJD] = findPair(0.5, 0.9); // just under floor
const posC = hex(200); // identical pair fill
// P3-neg: three token-exact roles, pairwise distinct so P1/P2 also PASS.
// Mid-gray page leaves drift room downward (near-white compresses: only
// ~1.7 dE available above #f2f2f2, not enough for the P3J/P3C bands).
const roleP = hex(140), roleL = hex(220), roleC = hex(60);
if (dE(roleP, roleL) < 3 || dE(roleL, roleC) < 3 || dE(roleP, roleC) < 3) throw new Error('see006-calib: P3-neg roles too close');
// P3-posJ/C: drift the PAGE downward away from its role (lane stays far, so
// the FAIL is attributable to drift, not separation).
const pv = 140;
let driftJ = null, driftC = null;
for (let v = pv - 1; v >= 8; v--) {
  const h = hex(v), d = dE(h, roleP);
  if (!driftJ && d >= 2.2 && d <= 2.8 && dE(h, roleL) >= 1.5) driftJ = [h, d];
  if (!driftC && d >= 8 && dE(h, roleL) >= 1.5) driftC = [h, d];
  if (driftJ && driftC) break;
}
if (!driftJ || !driftC) throw new Error('see006-calib: no page-drift gray found');
const BORDER = hex(40);

const FIX = [
  { id: 'C1', primary: 'P1', predicted: 'PASS', fills: { page: negA, lane: negB, card: negA }, border: null, roles: { page: negA, lane: negB, card: negA } },
  { id: 'C2', primary: 'P1', predicted: 'FAIL', fills: { page: posJA, lane: posJB, card: negA }, border: null, roles: { page: posJA, lane: posJB, card: negA } },
  { id: 'C3', primary: 'P1', predicted: 'FAIL', fills: { page: posC, lane: posC, card: negA }, border: null, roles: { page: posC, lane: posC, card: negA } },
  { id: 'C4', primary: 'P2', predicted: 'PASS', fills: { page: negA, lane: negB, card: negA }, border: BORDER, roles: { page: negA, lane: negB, card: negA } },
  { id: 'C5', primary: 'P2', predicted: 'FAIL', fills: { page: posJA, lane: posJB, card: negA }, border: BORDER, roles: { page: posJA, lane: posJB, card: negA } },
  { id: 'C6', primary: 'P2', predicted: 'FAIL', fills: { page: posC, lane: posC, card: negA }, border: BORDER, roles: { page: posC, lane: posC, card: negA } },
  { id: 'C7', primary: 'P3', predicted: 'PASS', fills: { page: roleP, lane: roleL, card: roleC }, border: null, roles: { page: roleP, lane: roleL, card: roleC } },
  { id: 'C8', primary: 'P3', predicted: 'FAIL', fills: { page: driftJ[0], lane: roleL, card: roleC }, border: null, roles: { page: roleP, lane: roleL, card: roleC } },
  { id: 'C9', primary: 'P3', predicted: 'FAIL', fills: { page: driftC[0], lane: roleL, card: roleC }, border: null, roles: { page: roleP, lane: roleL, card: roleC } },
  { id: 'C10', primary: 'ALL', predicted: 'NA', fills: null, border: null, roles: { page: roleP, lane: roleL, card: roleC } },
];

console.log(`palette: NEG ${negA}/${negB} dE=${negD.toFixed(2)}; POSJ ${posJA}/${posJB} dE=${posJD.toFixed(2)}; POSC ${posC}; P3 roles P=${roleP} L=${roleL} C=${roleC}; driftJ ${driftJ[0]} dE=${driftJ[1].toFixed(2)}; driftC ${driftC[0]} dE=${driftC[1].toFixed(2)}; floor ${FLOOR_DE00_SEPARATION}, ceiling ${FLOOR_DE00_DRIFT}`);
const rows = [];
let bad = 0;
for (const fx of FIX) {
  const pngPath = join(OUT, `see006-${fx.id}.png`);
  const specPath = join(OUT, `see006-${fx.id}.spec.json`);
  let spec;
  if (fx.fills) {
    writePngPixels(pngPath, W, H, paint(fx.fills));
    spec = specFor();
  } else {
    // C10 empty: flat mid-gray, no surfaces at all.
    const buf = Buffer.alloc(W * H * 4);
    for (let i = 0; i < W * H; i++) { buf[i * 4] = 128; buf[i * 4 + 1] = 128; buf[i * 4 + 2] = 128; buf[i * 4 + 3] = 255; }
    writePngPixels(pngPath, W, H, buf);
    spec = { image: { width: W, height: H }, svg: { x: 0, y: 0, w: W, h: H }, frames: [], cards: [], pills: [], overlays: [] };
  }
  writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n');
  const res = measure(pngPath, spec, fx.roles);
  const got = (id) => res.assertions.find((a) => a.id === id).verdict;
  let actual, ok;
  if (fx.primary === 'ALL') {
    actual = [got('P1'), got('P2'), got('P3')].join('/');
    ok = got('P1') === 'NA' && got('P2') === 'NA' && got('P3') === 'NA';
  } else {
    actual = got(fx.primary);
    ok = actual === fx.predicted;
  }
  if (!ok) bad++;
  const pops = res.assertions.map((a) => `${a.id}:N=${a.measured.population}`).join(' ');
  rows.push({ fixture: fx.id, primary: fx.primary, predicted: fx.predicted, actual, match: ok ? 1 : 0, pops });
  console.log(`${fx.id} primary=${fx.primary} predicted=${fx.predicted} actual=${actual} ${ok ? 'ok' : 'MISMATCH'} [${pops}]`);
}
const pos = rows.filter((r) => r.predicted === 'FAIL');
const neg = rows.filter((r) => r.predicted === 'PASS');
const caught = pos.filter((r) => r.match).length;
const fp = neg.filter((r) => !r.match).length;
console.log(`catch-rate: ${caught}/${pos.length}; false-alarm-rate: ${fp}/${neg.length}; emptiness C10: ${rows.find((r) => r.fixture === 'C10').actual}`);
writeFileSync(join(OUT, 'see006-calib-grades.json'), JSON.stringify({ palette: { neg: [negA, negB], posJ: [posJA, posJB], roles: { page: roleP, lane: roleL, card: roleC }, driftJ, driftC }, rows, catchRate: [caught, pos.length], falseAlarmRate: [fp, neg.length] }, null, 2) + '\n');
if (bad) { console.error(`see006-calib: ${bad} MISMATCH(ES)`); process.exit(1); }
console.log('see006-calib: 10/10 primaries match predicted');
