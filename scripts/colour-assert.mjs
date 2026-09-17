#!/usr/bin/env node
// colour-assert.mjs — Layer-2 colour gate: P1/P2/P3 over saved PNG pixels (OSM-SEE-006).
//
// Zero colour changes: this module only READS pixels and reports verdicts.
// Reader seam: pixels arrive via ../archify/renderers/shared/png-pixels.mjs
// (the sole pngjs importer). This file never imports pngjs.
//
// Floors (quoted with sources in the OSM-SEE-006 report, standalone item):
//   P1/P2: CIEDE2000 distance >= 1.0 (just-noticeable difference).
//   P3:    CIEDE2000 drift from declared token <= 2.0 (reproduction tolerance).
// Contrast ratios are reported as diagnostics (WCAG 2.2 SC 1.4.11 context),
// never verdicts.
// Populations always: every assertion reports N; N=0 -> NA, never PASS.
//
// Usage:
//   node tools/archify/scripts/colour-assert.mjs --png <file.png> --spec <rects.json>
//     --role-page <hex> --role-lane <hex> --role-card <hex> [--out <json>]
//   node tools/archify/scripts/colour-assert.mjs --selftest
// Stdout: JSON verdict set. Exit 0 iff measurement complete (FAILs are data).
// Exit 1 only on transport/measurement error.
//
// Spec schema (pixel coords; CDP probes and fixture sidecars share it):
//   { image:{width,height}, svg:{x,y,w,h}, frames:[{id,x,y,w,h}],
//     cards:[{id,frame,x,y,w,h}], pills:[{x,y,w,h}], overlays:[{x,y,w,h}] }

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readPngPixels } from '../archify/renderers/shared/png-pixels.mjs';

// ---- verdict floors (sources quoted in report) ----
export const FLOOR_DE00_SEPARATION = 1.0; // P1/P2: JND, must be >= this
export const FLOOR_DE00_DRIFT = 2.0; // P3: reproduction tolerance, must be <= this
const MIN_POOL = 25; // a side with fewer sampled pixels is dropped, never guessed

// ---- colour science (sRGB D65; CIEDE2000 kL=kC=kH=1 per Sharma et al. 2005) ----
function parseHex(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) throw new Error(`colour-assert: bad hex "${hex}"`);
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function srgbToLinear(c) {
  const u = c / 255;
  return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
}
function rgbToXyz([r, g, b]) {
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
  return [
    0.4124564 * R + 0.3575761 * G + 0.1804375 * B,
    0.2126729 * R + 0.7151522 * G + 0.0721750 * B,
    0.0193339 * R + 0.1191920 * G + 0.9503041 * B,
  ];
}
function xyzToLab([X, Y, Z]) {
  const w = [0.95047, 1.0, 1.08883]; // D65
  const f = (t) => (t > Math.pow(6 / 29, 3) ? Math.cbrt(t) : t / (3 * Math.pow(6 / 29, 2)) + 4 / 29);
  const fx = f(X / w[0]), fy = f(Y / w[1]), fz = f(Z / w[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
export function rgbToLab(rgb) {
  return xyzToLab(rgbToXyz(rgb));
}
function deg(rad) {
  return (rad * 180) / Math.PI;
}
export function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1, [L2, a2, b2] = lab2;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const pow25_7 = Math.pow(25, 7);
  const Cbar7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + pow25_7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = C1p < 1e-9 ? 0 : (deg(Math.atan2(b1, a1p)) + 360) % 360;
  const h2p = C2p < 1e-9 ? 0 : (deg(Math.atan2(b2, a2p)) + 360) % 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p >= 1e-9 && C2p >= 1e-9) {
    const d = h2p - h1p;
    dhp = Math.abs(d) <= 180 ? d : d > 180 ? d - 360 : d + 360;
  }
  const dHp = 2 * Math.sqrt(Math.max(C1p * C2p, 0)) * Math.sin((dhp * Math.PI) / 360);
  const Lbarp = (L1 + L2) / 2, Cbarp = (C1p + C2p) / 2;
  let hbarp = h1p + h2p;
  if (C1p >= 1e-9 && C2p >= 1e-9) {
    hbarp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;
  }
  const T =
    1 - 0.17 * Math.cos(((hbarp - 30) * Math.PI) / 180) +
    0.24 * Math.cos(((2 * hbarp) * Math.PI) / 180) +
    0.32 * Math.cos(((3 * hbarp + 6) * Math.PI) / 180) -
    0.20 * Math.cos(((4 * hbarp - 63) * Math.PI) / 180);
  const dRo = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + pow25_7));
  const SL = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;
  const RT = -Math.sin((2 * dRo * Math.PI) / 180) * RC;
  return Math.sqrt(
    Math.pow(dLp / SL, 2) + Math.pow(dCp / SC, 2) + Math.pow(dHp / SH, 2) + RT * (dCp / SC) * (dHp / SH),
  );
}
function relLum([r, g, b]) {
  const f = (c) => {
    const u = c / 255;
    return u <= 0.03928 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
// Diagnostic only (never a verdict): WCAG contrast ratio.
export function contrastRatio(rgb1, rgb2) {
  const [a, b] = [relLum(rgb1), relLum(rgb2)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}
function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}
function medianColour(samples) {
  const ch = (i) => samples.map((s) => s[i]).sort((a, b) => a - b);
  const med = (arr) => arr[Math.floor(arr.length / 2)];
  const c = [med(ch(0)), med(ch(1)), med(ch(2))];
  return { rgb: c, hex: toHex(c), n: samples.length };
}

// ---- pixel pools ----
function inRect(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}
// Distance from (x,y) to the nearest edge of rect r (0 on/inside-near-edge;
// for outside points, distance to the rect). Pixel centres at +.5 ignored:
// integer coords throughout, documented.
function edgeDist(x, y, r) {
  const dx = x < r.x ? r.x - x : x >= r.x + r.w ? x - (r.x + r.w - 1) : Math.min(x - r.x, r.x + r.w - 1 - x);
  const dy = y < r.y ? r.y - y : y >= r.y + r.h ? y - (r.y + r.h - 1) : Math.min(y - r.y, r.y + r.h - 1 - y);
  const inside = x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  if (inside) return Math.min(dx, dy);
  if (x >= r.x && x < r.x + r.w) return dy;
  if (y >= r.y && y < r.y + r.h) return dx;
  return Math.hypot(dx, dy);
}
function collectPool(img, box, opt) {
  const { inside = null, outside = [], bandOf = null, bandLo = 0, bandHi = Infinity } = opt || {};
  const area = Math.max(box.w, 0) * Math.max(box.h, 0);
  const stride = Math.max(1, Math.floor(Math.sqrt(area / 2000)));
  const out = [];
  for (let y = box.y; y < box.y + box.h; y += stride) {
    if (y < 0 || y >= img.height) continue;
    for (let x = box.x; x < box.x + box.w; x += stride) {
      if (x < 0 || x >= img.width) continue;
      if (inside && !inRect(x, y, inside)) continue;
      let skip = false;
      for (const r of outside) {
        if (inRect(x, y, r)) { skip = true; break; }
      }
      if (skip) continue;
      if (bandOf) {
        const d = edgeDist(x, y, bandOf);
        if (d < bandLo || d > bandHi) continue;
      }
      const i = (y * img.width + x) * 4;
      out.push([img.data[i], img.data[i + 1], img.data[i + 2]]);
    }
  }
  return out;
}
const dilate = (r, d) => ({ x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d });

// ---- measurement ----
export function measure(pngPath, spec, roles) {
  const img = readPngPixels(pngPath);
  if (spec.image && (spec.image.width !== img.width || spec.image.height !== img.height)) {
    throw new Error(
      `colour-assert: spec is for ${spec.image.width}x${spec.image.height}, png is ${img.width}x${img.height}`,
    );
  }
  const svg = spec.svg || { x: 0, y: 0, w: img.width, h: img.height };
  const frames = spec.frames || [];
  const cards = spec.cards || [];
  // OSM-SEE-007 O2: the structural surface is the FRAME (SEE-006 misnamed it
  // lane after the workflow vocabulary). --role-frame preferred, --role-lane kept as alias.
  const frameRole = roles ? (roles.frame || roles.lane) : null;
  const pills = (spec.pills || []).map((p) => dilate(p, 2));
  const overlays = (spec.overlays || []).map((p) => dilate(p, 2));
  const ownerOf = (c) => {
    if (c.frame) return c.frame;
    // Nested frames: smallest containing frame owns the card.
    let best = null;
    for (const f of frames) {
      if (c.x >= f.x && c.y >= f.y && c.x + c.w <= f.x + f.w && c.y + c.h <= f.y + f.h) {
        if (!best || f.w * f.h < best.w * best.h) best = f;
      }
    }
    return best ? best.id : null;
  };

  // Page pools: inside svg, clear of frames/overlays. Margin check: outside-svg
  // strip median is reported to confirm the svg paints no own background.
  const frameOut3 = frames.map((f) => dilate(f, 3));
  const pageFarS = collectPool(img, svg, { outside: [...frameOut3, ...overlays] });
  const pageFar = pageFarS.length >= MIN_POOL ? medianColour(pageFarS) : null;
  const marginBox = { x: 0, y: 0, w: img.width, h: img.height };
  const marginS = collectPool(img, marginBox, { outside: [{ ...svg, w: svg.w, h: svg.h }, ...overlays] });
  const margin = marginS.length >= MIN_POOL ? medianColour(marginS) : null;
  const p1rows = [], p2rows = [], p3rows = [];
  let excluded = 0;
  const surf = {}; // frameId -> {laneNear, laneFar} for card pairing
  const intersects = (c, f) => c.x < f.x + f.w && c.x + c.w > f.x && c.y < f.y + f.h && c.y + c.h > f.y;
  for (const f of frames) {
    // Lane pools exclude EVERY card intersecting the frame (dilated 6: group
    // boxes understate painted extent — dark drop shadows reach ~8px past
    // the box). Ownership is for pairing only, never for exclusion: nested
    // frames share cards, and an owned-only filter leaks card pixels.
    const cardBoxes = cards.filter((c) => intersects(c, f)).map((c) => dilate(c, 6));
    const excl = [...cardBoxes, ...pills, ...overlays];
    const laneNearS = collectPool(img, f, { outside: excl, bandOf: f, bandLo: 2, bandHi: 8 });
    const laneFarS = collectPool(img, f, { outside: excl, bandOf: f, bandLo: 10, bandHi: 1e9 });
    const laneNear = laneNearS.length >= MIN_POOL ? medianColour(laneNearS) : null;
    const laneFar = laneFarS.length >= MIN_POOL ? medianColour(laneFarS) : null;
    surf[f.id] = { laneNear, laneFar };
    const ring = [
      { x: f.x - 8, y: f.y - 8, w: f.w + 16, h: 6 }, // top strip above edge
      { x: f.x - 8, y: f.y + f.h + 2, w: f.w + 16, h: 6 }, // bottom strip
      { x: f.x - 8, y: f.y, w: 6, h: f.h }, // left strip
      { x: f.x + f.w + 2, y: f.y, w: 6, h: f.h }, // right strip
    ];
    let pnS = [];
    for (const b of ring) pnS = pnS.concat(collectPool(img, b, { outside: [dilate(f, 1), ...overlays] }));
    const pageNear = pnS.length >= MIN_POOL ? medianColour(pnS) : null;
    if (pageNear && laneNear) {
      const d = deltaE2000(rgbToLab(pageNear.rgb), rgbToLab(laneNear.rgb));
      p1rows.push({
        pair: `page/frame:${f.id}`, nA: pageNear.n, nB: laneNear.n,
        a: pageNear.hex, b: laneNear.hex,
        de00: Math.round(d * 100) / 100,
        contrast: Math.round(contrastRatio(pageNear.rgb, laneNear.rgb) * 100) / 100,
        verdict: d < FLOOR_DE00_SEPARATION ? 'FAIL' : 'PASS',
      });
    } else excluded++;
    if (pageFar && laneFar) {
      const d = deltaE2000(rgbToLab(pageFar.rgb), rgbToLab(laneFar.rgb));
      p2rows.push({
        pair: `page/frame:${f.id}`, nA: pageFar.n, nB: laneFar.n,
        a: pageFar.hex, b: laneFar.hex,
        de00: Math.round(d * 100) / 100,
        contrast: Math.round(contrastRatio(pageFar.rgb, laneFar.rgb) * 100) / 100,
        verdict: d < FLOOR_DE00_SEPARATION ? 'FAIL' : 'PASS',
      });
    } else excluded++;
    if (frameRole && laneFar) {
      const d = deltaE2000(rgbToLab(laneFar.rgb), rgbToLab(parseHex(frameRole)));
      p3rows.push({
        surface: `frame:${f.id}`, n: laneFar.n, sampled: laneFar.hex, declared: frameRole,
        de00: Math.round(d * 100) / 100,
        verdict: d > FLOOR_DE00_DRIFT ? 'FAIL' : 'PASS',
      });
    } else if (frameRole) excluded++;
  }
  for (const c of cards) {
    const f = frames.find((g) => g.id === ownerOf(c));
    if (!f) { excluded++; continue; }
    const otherCards = cards.filter((k) => k !== c).map((k) => dilate(k, 3));
    const cardNearS = collectPool(img, c, { outside: [...otherCards, ...pills, ...overlays], bandOf: c, bandLo: 2, bandHi: 8 });
    const cardCoreS = collectPool(img, c, { outside: [...otherCards, ...pills, ...overlays], bandOf: c, bandLo: 6, bandHi: 1e9 });
    const cardNear = cardNearS.length >= MIN_POOL ? medianColour(cardNearS) : null;
    const cardCore = cardCoreS.length >= MIN_POOL ? medianColour(cardCoreS) : null;
    surf[c.id || `${c.x},${c.y}`] = { cardNear, cardCore };
    // lane side of the card boundary: recompute with explicit outside-card ring
    const cring = [
      { x: c.x - 8, y: c.y - 8, w: c.w + 16, h: 6 },
      { x: c.x - 8, y: c.y + c.h + 2, w: c.w + 16, h: 6 },
      { x: c.x - 8, y: c.y, w: 6, h: c.h },
      { x: c.x + c.w + 2, y: c.y, w: 6, h: c.h },
    ];
    let lnS = [];
    for (const b of cring) {
      // inside owner frame only:
      const bb = {
        x: Math.max(b.x, f.x + 1), y: Math.max(b.y, f.y + 1),
        w: Math.min(b.x + b.w, f.x + f.w - 1) - Math.max(b.x, f.x + 1),
        h: Math.min(b.y + b.h, f.y + f.h - 1) - Math.max(b.y, f.y + 1),
      };
      if (bb.w > 0 && bb.h > 0) lnS = lnS.concat(collectPool(img, bb, { outside: [dilate(c, 1), ...otherCards, ...pills, ...overlays] }));
    }
    const laneNear = lnS.length >= MIN_POOL ? medianColour(lnS) : null;
    const laneFar = surf[f.id] && surf[f.id].laneFar;
    const cname = `frame/card:${c.id || `${c.x},${c.y}`}`;
    if (laneNear && cardNear) {
      const d = deltaE2000(rgbToLab(laneNear.rgb), rgbToLab(cardNear.rgb));
      p1rows.push({
        pair: cname, nA: laneNear.n, nB: cardNear.n,
        a: laneNear.hex, b: cardNear.hex,
        de00: Math.round(d * 100) / 100,
        contrast: Math.round(contrastRatio(laneNear.rgb, cardNear.rgb) * 100) / 100,
        verdict: d < FLOOR_DE00_SEPARATION ? 'FAIL' : 'PASS',
      });
    } else excluded++;
    if (laneFar && cardCore) {
      const d = deltaE2000(rgbToLab(laneFar.rgb), rgbToLab(cardCore.rgb));
      p2rows.push({
        pair: cname, nA: laneFar.n, nB: cardCore.n,
        a: laneFar.hex, b: cardCore.hex,
        de00: Math.round(d * 100) / 100,
        contrast: Math.round(contrastRatio(laneFar.rgb, cardCore.rgb) * 100) / 100,
        verdict: d < FLOOR_DE00_SEPARATION ? 'FAIL' : 'PASS',
      });
    } else excluded++;
    if (roles && roles.card && cardCore) {
      const d = deltaE2000(rgbToLab(cardCore.rgb), rgbToLab(parseHex(roles.card)));
      p3rows.push({
        surface: `card:${c.id || `${c.x},${c.y}`}`, n: cardCore.n, sampled: cardCore.hex, declared: roles.card,
        de00: Math.round(d * 100) / 100,
        verdict: d > FLOOR_DE00_DRIFT ? 'FAIL' : 'PASS',
      });
    } else if (roles && roles.card) excluded++;
  }
  // OSM-SEE-008: P3 covers the frame-label box (Fault 1): the mask must read
  // as the frame it sits on. Ring-sampled (3px interior border) to avoid the
  // label text; declared = frame role (the box must disappear into the frame).
  const pillsLB = spec.pills || [];
  pillsLB.forEach((p, i) => {
    if (!frameRole) { excluded++; return; }
    const ring = [
      { x: p.x + 1, y: p.y + 1, w: p.w - 2, h: 3 },
      { x: p.x + 1, y: p.y + p.h - 4, w: p.w - 2, h: 3 },
      { x: p.x + 1, y: p.y + 1, w: 3, h: p.h - 2 },
      { x: p.x + p.w - 4, y: p.y + 1, w: 3, h: p.h - 2 },
    ];
    let lbS = [];
    for (const b of ring) {
      if (b.w <= 0 || b.h <= 0) continue;
      lbS = lbS.concat(collectPool(img, b, { outside: overlays }));
    }
    if (lbS.length < MIN_POOL) { excluded++; return; }
    const lb = medianColour(lbS);
    const d = deltaE2000(rgbToLab(lb.rgb), rgbToLab(parseHex(frameRole)));
    p3rows.push({
      surface: `labelbox:${i}`, n: lb.n, sampled: lb.hex, declared: frameRole,
      de00: Math.round(d * 100) / 100,
      verdict: d > FLOOR_DE00_DRIFT ? 'FAIL' : 'PASS',
    });
  });
  // Page drift is attributable only when structure exists to anchor roles:
  // a surfaceless field identifies no surface, so P3 joins P1/P2 at N=0.
  if (roles && roles.page && pageFar && frames.length > 0) {
    const d = deltaE2000(rgbToLab(pageFar.rgb), rgbToLab(parseHex(roles.page)));
    p3rows.unshift({
      surface: 'page', n: pageFar.n, sampled: pageFar.hex, declared: roles.page,
      de00: Math.round(d * 100) / 100,
      verdict: d > FLOOR_DE00_DRIFT ? 'FAIL' : 'PASS',
    });
  } else if (roles && roles.page) excluded++;

  const verdictOf = (rows, failFn) => {
    if (rows.length === 0) return 'NA';
    return rows.some(failFn) ? 'FAIL' : 'PASS';
  };
  return {
    tool: 'colour-assert.mjs',
    png: pngPath,
    image: { width: img.width, height: img.height },
    floors: {
      P1: `de00 >= ${FLOOR_DE00_SEPARATION}`,
      P2: `de00 >= ${FLOOR_DE00_SEPARATION} (border-excluded bands)`,
      P3: `de00 <= ${FLOOR_DE00_DRIFT} vs declared token`,
    },
    pageMarginCheck: { insideSvgGap: pageFar, outsideSvg: margin },
    assertions: [
      {
        id: 'P1', name: 'SURFACE_SEPARATION', asserted: true,
        threshold: `touching-pair CIEDE2000 >= ${FLOOR_DE00_SEPARATION} (near bands 2..8px)`,
        verdict: verdictOf(p1rows, (r) => r.verdict === 'FAIL'),
        measured: { population: p1rows.length, fails: p1rows.filter((r) => r.verdict === 'FAIL').length, rows: p1rows },
        reason: p1rows.length === 0 ? 'no measurable population (N=0): no touching pairs with both sides sampled' : undefined,
      },
      {
        id: 'P2', name: 'STRUCTURE_WITHOUT_BORDER', asserted: true,
        threshold: `same pairs CIEDE2000 >= ${FLOOR_DE00_SEPARATION} (far bands >=10px, hairline ignored)`,
        verdict: verdictOf(p2rows, (r) => r.verdict === 'FAIL'),
        measured: { population: p2rows.length, fails: p2rows.filter((r) => r.verdict === 'FAIL').length, rows: p2rows },
        reason: p2rows.length === 0 ? 'no measurable population (N=0): no pairs with border-excluded samples' : undefined,
      },
      {
        id: 'P3', name: 'DECLARED_VS_DELIVERED', asserted: true,
        threshold: `sampled vs declared-token CIEDE2000 <= ${FLOOR_DE00_DRIFT}`,
        verdict: verdictOf(p3rows, (r) => r.verdict === 'FAIL'),
        measured: { population: p3rows.length, fails: p3rows.filter((r) => r.verdict === 'FAIL').length, rows: p3rows },
        reason: p3rows.length === 0 ? 'no measurable population (N=0): no surfaces sampled' : undefined,
      },
    ],
    excludedForThinSample: excluded,
  };
}

// ---- CLI ----
const isMainModule = (() => { try { return fileURLToPath(import.meta.url) === resolve(process.argv[1]); } catch { return false; } })();
// Imported by see006-calib.mjs for measure(): the CLI below runs only as main.
if (isMainModule) {
const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i > -1 && args[i + 1] ? args[i + 1] : d;
};
if (args.includes('--selftest')) {
  const fails = [];
  const eq = (name, got, want, tol) => {
    const ok = Math.abs(got - want) <= tol;
    console.log(`${ok ? 'ok' : 'FAIL'} ${name}: got ${got}, want ${want} (tol ${tol})`);
    if (!ok) fails.push(name);
  };
  // Sharma et al. 2005 first supplementary test pair (Lab, kL=kC=kH=1).
  eq('ciede2000-sharma-pair1', deltaE2000([50.0, 2.6772, -79.7751], [50.0, 0.0, -82.7485]), 2.0425, 0.001);
  eq('ciede2000-identity', deltaE2000([60, 20, -30], [60, 20, -30]), 0, 1e-9);
  eq(
    'ciede2000-symmetry',
    deltaE2000(rgbToLab([242, 242, 247]), rgbToLab([255, 255, 255])) -
      deltaE2000(rgbToLab([255, 255, 255]), rgbToLab([242, 242, 247])),
    0, 1e-9,
  );
  eq('contrast-white-black', contrastRatio([255, 255, 255], [0, 0, 0]), 21, 0.01);
  eq('contrast-same', contrastRatio([28, 28, 30], [28, 28, 30]), 1, 1e-9);
  const labW = rgbToLab([255, 255, 255]);
  eq('lab-white-L', labW[0], 100, 0.01);
  const labK = rgbToLab([0, 0, 0]);
  eq('lab-black-L', labK[0], 0, 0.01);
  if (fails.length) {
    console.error(`colour-assert selftest: ${fails.length} FAILURE(S): ${fails.join(', ')}`);
    process.exit(1);
  }
  console.log('colour-assert selftest: all pass');
  process.exit(0);
}

const pngArg = opt('--png', '');
const specArg = opt('--spec', '');
if (!pngArg || !specArg) {
  console.error('usage: colour-assert.mjs --png <file.png> --spec <rects.json> --role-page <hex> --role-frame <hex> --role-card <hex> [--out <json>]');
  console.error('  (--role-lane is a legacy alias of --role-frame.)');
  process.exit(1);
}
// OSM-SEE-007 O2: P3 covers page, frame and card. --role-lane kept as alias.
const roles = { page: opt('--role-page', ''), frame: opt('--role-frame', opt('--role-lane', '')), lane: opt('--role-lane', ''), card: opt('--role-card', '') };
if (!roles.page || !(roles.frame || roles.lane) || !roles.card) {
  console.error('colour-assert: --role-page/--role-frame/--role-card are required (P3 declared tokens)');
  process.exit(1);
}
let result;
try {
  const spec = JSON.parse(readFileSync(resolve(specArg), 'utf8'));
  result = measure(resolve(pngArg), spec, roles);
} catch (e) {
  console.error(`colour-assert: measurement error: ${e.message}`);
  process.exit(1);
}
const outArg = opt('--out', '');
if (outArg) writeFileSync(resolve(outArg), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
}
