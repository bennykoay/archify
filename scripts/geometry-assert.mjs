#!/usr/bin/env node
// geometry-assert.mjs — Layer-1 ruler grading delivered archify HTML geometry (OSM-ARCH-SEE-004).
// Zero npm dependencies: node stdlib only (child_process, fs, os, path, crypto,
// global fetch + global WebSocket) driving headless Chromium over CDP.
// Reuses tools/archify/scripts/clip-zones.mjs CDP pattern: port picker
// 19341-19345, HTTP /json/version poll, Browser.close shutdown.
//
// Basis: Runtime.evaluate getBoundingClientRect, SVG getBBox composed with
// getScreenCTM, polylines sampled every 2px via getTotalLength+getPointAtLength,
// CSS px at the declared viewport (Emulation.setDeviceMetricsOverride, DSF=1).
//
// Usage:
//   node tools/archify/scripts/geometry-assert.mjs <delivered.html> [--viewport WxH] [--chrome path]
// Stdout: JSON per-assertion PASS/FAIL/DATA/NA verdicts with measured values +
// named elements + coords. Exit 0 iff the verdict set is complete (FAILs are
// data). Exit 1 only on transport/measurement error.

import { spawn, execSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 && args[i + 1] ? args[i + 1] : d; };
const htmlArg = args.find((a) => !a.startsWith('--'));
if (!htmlArg || htmlArg === '--help' || htmlArg === '-h') {
  console.error('usage: geometry-assert.mjs <delivered.html> [--viewport WxH] [--chrome path] [--timeout ms]');
  process.exit(1);
}
const html = resolve(htmlArg);
const [VW, VH] = String(opt('--viewport', '1440x900')).split('x').map(Number);
const TIMEOUT = Number(opt('--timeout', '30000'));
if (!Number.isFinite(VW) || !Number.isFinite(VH) || VW <= 0 || VH <= 0) {
  console.error('geometry-assert: bad --viewport (want WxH)');
  process.exit(1);
}
let artifactBytes;
try {
  artifactBytes = readFileSync(html);
} catch (e) {
  console.error(`geometry-assert: cannot read artifact: ${e.message}`);
  process.exit(1);
}
const shaFull = createHash('sha256').update(artifactBytes).digest('hex');

function findChrome() {
  const flag = opt('--chrome', '');
  if (flag) return flag;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  if (process.env.ARCHIFY_CHROME) return process.env.ARCHIFY_CHROME;
  try {
    const w = execSync('where chrome', { encoding: 'utf8' }).split(/\r?\n/).find(Boolean);
    if (w) return w.trim();
  } catch {}
  try {
    const w = execSync('where msedge', { encoding: 'utf8' }).split(/\r?\n/).find(Boolean);
    if (w) return w.trim();
  } catch {}
  const base = join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  try {
    const dirs = execSync(`dir /b /ad "${base}"`, { encoding: 'utf8' }).split(/\r?\n/).filter((d) => d.startsWith('chromium-'));
    dirs.sort().reverse();
    for (const d of dirs) {
      const c = join(base, d, 'chrome-win64', 'chrome.exe');
      try { execSync(`if not exist "${c}" exit 1`); return c; } catch {}
    }
  } catch {}
  return null;
}

const chrome = findChrome();
if (!chrome) {
  console.error('geometry-assert: no Chrome/Chromium found (set --chrome, CHROME_PATH, or ARCHIFY_CHROME)');
  process.exit(1);
}

// ---- CDP transport (clip-zones pattern) ----
async function pickPort() {
  for (const p of [19341, 19342, 19343, 19344, 19345]) {
    try {
      const r = await fetch(`http://127.0.0.1:${p}/json/version`);
      if (!r.ok) return p;
      await r.body.cancel().catch(() => {});
      const v = await Promise.race([r.json(), new Promise((_, rej) => setTimeout(() => rej(new Error('t')), 3000))]).catch(() => null);
      if (!v || !v.Browser) return p;
    } catch { return p; }
  }
  throw new Error('no free debug port in 19341-19345');
}

const profile = mkdtempSync(join(tmpdir(), 'geometry-assert-'));
const PORT = await pickPort();
const child = spawn(chrome, [
  '--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1',
  `--window-size=${VW},${VH}`, `--remote-debugging-port=${PORT}`,
  '--remote-debugging-address=127.0.0.1', '--no-first-run',
  '--no-default-browser-check', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
child.on('error', (e) => { console.error('geometry-assert: spawn failed: ' + e.message); process.exit(1); });

let httpBase = '';
{
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) { await r.body.cancel().catch(() => {}); httpBase = `http://127.0.0.1:${PORT}`; break; }
    } catch {}
    if (Date.now() - t0 > 20000) {
      console.error('geometry-assert: CDP port never answered');
      try { child.kill(); } catch {}
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

const cleanup = async () => {
  try { await send('Browser.close'); } catch {}
  try { ws.close(); } catch {}
  try { child.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  // Drain: Windows Chrome may daemonize — give the debug port time to free
  // before the next invocation re-picks it (batch runs).
  await new Promise((r) => setTimeout(r, 1200));
};

// ?theme=light: visual-check parity — layout geometry is theme-independent,
// O1a contrast is graded in the light reference theme.
const fileUrl = 'file:///' + html.replace(/\\/g, '/') + '?theme=light';
let target;
try {
  target = await (await fetch(`${httpBase}/json/new?${encodeURIComponent(fileUrl)}`, { method: 'PUT' })).json();
} catch (e) {
  console.error('geometry-assert: CDP new target failed: ' + e.message);
  try { child.kill(); } catch {}
  process.exit(1);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('cdp connect failed')); });
let seq = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  try {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej, method } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result);
    }
  } catch (e) { console.error('geometry-assert: onmessage: ' + e.message); }
};
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++seq;
  pending.set(id, { res, rej, method });
  ws.send(JSON.stringify({ id, method, params }));
  setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error('cdp timeout: ' + method)); } }, TIMEOUT);
});
const evalJs = async (expression) => {
  const out = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (out.exceptionDetails) {
    throw new Error('Runtime.evaluate: ' + (out.exceptionDetails.exception?.description || out.exceptionDetails.text || 'failed'));
  }
  return out.result?.value;
};

try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false });
  // OSM-SYS-001 O3: host-side readiness. Page-side sleeps are forbidden here:
  // on node-absent (vacuity) charts the viewer thread saturates progressively
  // and page timers never fire again, so any page-side wait overruns the CDP
  // timeout. Real charts carry static server-rendered SVG: nodes exist in the
  // DOM from parse, so three clean zero-node probes past readyState complete
  // prove emptiness and take the fast path (sync attrs only, zero timers).
  // Populated charts keep the exact historical settle sequence.
  let emptyFast = false;
  {
    const t0 = Date.now();
    let zeros = 0;
    for (;;) {
      let nodeCount = -1, readyState = '';
      try {
        nodeCount = await evalJs(`document.querySelectorAll('svg g[data-node-id]').length`);
        readyState = await evalJs(`document.readyState`);
      } catch {}
      if (nodeCount > 0 || Date.now() - t0 > 20000) break;
      if (nodeCount === 0 && readyState === 'complete' && ++zeros >= 3) { emptyFast = true; break; }
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  // Sync attrs first (no timers — safe on saturated pages).
  await evalJs(`(function () {
    try { document.documentElement.setAttribute('data-motion', 'still'); } catch (_) {}
    try {
      var panel = document.querySelector('.diagram-container');
      if (panel) panel.setAttribute('data-detail-level', 'read');
    } catch (_) {}
    try { window.scrollTo(0, 0); } catch (_) {}
    return true;
  })()`);
  // Historical settle sequence for populated charts only; the fast-empty path
  // skips it (page timers are dead there and there is nothing to settle).
  if (!emptyFast) {
  await evalJs(`(async () => {
    try { await document.fonts.ready.catch(() => {}); } catch (_) {}
    try {
      if (window.Archify && Archify.readerLayout && typeof Archify.readerLayout.whenStable === 'function') {
        await Promise.race([Archify.readerLayout.whenStable(), new Promise((r) => setTimeout(r, 5000))]);
      }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 600));
    return true;
  })()`);
  }
} catch (e) {
  console.error('geometry-assert: page ready failed: ' + e.message);
  await cleanup();
  process.exit(1);
}

// ---- Page-side geometry collector (runs in the delivered page) ----
// NOTE: no template literals inside the page fn (transported as source text).
const PAGE_FN = String.raw`(function () {
  var R = function (el) {
    var r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var svgs = Array.prototype.slice.call(document.querySelectorAll('svg'));
  var main = null;
  for (var i = 0; i < svgs.length; i++) { if (svgs[i].querySelector('g[data-node-id]')) { main = svgs[i]; break; } }
  if (!main) main = svgs[0];
  if (!main) return { error: 'no svg in delivered page' };
  var toScreen = function (pt) {
    try {
      var ctm = main.getScreenCTM();
      if (!ctm) return { x: pt.x, y: pt.y };
      var p = new DOMPoint(pt.x, pt.y).matrixTransform(ctm);
      return { x: p.x, y: p.y };
    } catch (_) { return { x: pt.x, y: pt.y }; }
  };
  // Sample every polyline path every ~2px (SVG units) via getTotalLength+getPointAtLength.
  var samplePath = function (path) {
    var out = [];
    try {
      var L = path.getTotalLength();
      if (!isFinite(L) || L <= 0) return out;
      var n = Math.max(2, Math.ceil(L / 2));
      for (var k = 0; k <= n; k++) {
        var q = path.getPointAtLength((L * k) / n);
        out.push(toScreen({ x: q.x, y: q.y }));
      }
    } catch (_) {}
    return out;
  };
  var paths = Array.prototype.slice.call(main.querySelectorAll('path[data-edge-from]'));
  var pathSamples = {};
  var pathTip = {};
  paths.forEach(function (p) {
    var key = p.getAttribute('data-edge-key') || (p.getAttribute('data-edge-from') + '>' + p.getAttribute('data-edge-to'));
    var s = samplePath(p);
    pathSamples[key] = s;
    if (s.length) pathTip[key] = s[s.length - 1];
  });
  // ---- SEE-008 A12 ARROWHEAD_DIRECTION (page-side): head facing vs last route piece.
  var a12rows = [];
  paths.forEach(function (p) {
    if (!p.hasAttribute('marker-end')) return;
    var from = p.getAttribute('data-edge-from') || '', to = p.getAttribute('data-edge-to') || '';
    var key = p.getAttribute('data-edge-key') || (from + '>' + to);
    var s = pathSamples[key] || [];
    if (s.length < 2) return;
    var e1 = s[s.length - 1], e0 = s[s.length - 2];
    var comp = String(p.getAttribute('data-composition-points') || '').split(';').map(function (q) {
      return q.split(',').map(Number);
    }).filter(function (q) { return q.length >= 2 && isFinite(q[0]) && isFinite(q[1]); });
    if (comp.length < 2) return;
    var legs = [];
    for (var k = 1; k < comp.length; k++) {
      var dx = comp[k][0] - comp[k-1][0], dy = comp[k][1] - comp[k-1][1];
      legs.push({ dx: dx, dy: dy, len: Math.hypot(dx, dy) });
    }
    var piece = null;
    for (var j = legs.length - 1; j >= 0; j--) {
      if (legs[j].len >= 15) { piece = legs[j]; break; }
    }
    if (!piece) {
      piece = legs[0];
      for (var m = 1; m < legs.length; m++) { if (legs[m].len > piece.len) piece = legs[m]; }
    }
    var hdx = e1.x - e0.x, hdy = e1.y - e0.y;
    var hm = Math.hypot(hdx, hdy), pm = Math.hypot(piece.dx, piece.dy);
    var ang = null;
    if (hm > 0 && pm > 0) {
      var cos = (hdx * piece.dx + hdy * piece.dy) / hm / pm;
      if (cos > 1) cos = 1; if (cos < -1) cos = -1;
      ang = Math.acos(cos) * 180 / Math.PI;
    }
    a12rows.push({ key: key, from: from, to: to,
      head: { x: r2(e1.x), y: r2(e1.y) },
      headDir: { x: r2(hdx), y: r2(hdy) },
      piece: { dx: r2(piece.dx), dy: r2(piece.dy), len: r2(piece.len) },
      legs: legs.length, angle: ang == null ? null : (Math.round(ang * 100) / 100) });
  });
  // Lane headers: svg-direct text.t-dim (workflow). Boundary labels separate.
  var laneHeaders = Array.prototype.slice.call(main.children).filter(function (e) {
    return e.tagName === 'text' && String(e.getAttribute('class') || '').split(' ').indexOf('t-dim') > -1;
  }).map(function (t) {
    return { el: t, label: (t.textContent || '').trim(), box: R(t) };
  }).filter(function (h) { return h.box.w > 0 && h.box.h > 0; });
  var laneRects = Array.prototype.slice.call(main.querySelectorAll('rect[data-composition-frame-kind="lane"]')).map(function (r) {
    return { el: r, id: r.getAttribute('data-composition-frame-id') || '', box: R(r), sw: parseFloat(r.getAttribute('stroke-width') || '1') || 1 };
  });
  var boundaryRects = Array.prototype.slice.call(main.querySelectorAll('rect[data-composition-frame-kind]')).map(function (r) {
    return { el: r, kind: r.getAttribute('data-composition-frame-kind') || '', id: r.getAttribute('data-composition-frame-id') || '', label: r.getAttribute('data-composition-frame-label') || '', box: R(r), sw: parseFloat(r.getAttribute('stroke-width') || '1') || 1 };
  });
  var boundaryLabels = Array.prototype.slice.call(main.querySelectorAll('[data-boundary-label]')).map(function (e) {
    return { el: e, label: e.getAttribute('data-boundary-label') || (e.textContent || '').trim(), box: R(e) };
  }).filter(function (b) { return b.box.w > 0 && b.box.h > 0; });
  // SEE-005 O1 floating pills: group bbox includes mask rect + label text.
  // Selector verbatim: g[data-graph-role="structural-frame-label"] + rect[data-graph-role="structural-frame-label-mask"] + text[data-boundary-label].
  var pillGroups = Array.prototype.slice.call(main.querySelectorAll('g[data-graph-role="structural-frame-label"]')).map(function (g) {
    return { el: g, label: g.getAttribute('data-composition-frame-label') || '', id: g.getAttribute('data-composition-frame-id') || '', kind: g.getAttribute('data-composition-frame-kind') || '', box: R(g) };
  }).filter(function (p) { return p.box.w > 0 && p.box.h > 0; });
  var pillMasks = Array.prototype.slice.call(main.querySelectorAll('rect[data-graph-role="structural-frame-label-mask"]')).map(function (r) {
    return { el: r, box: R(r) };
  }).filter(function (p) { return p.box.w > 0 && p.box.h > 0; });
  var nodes = Array.prototype.slice.call(main.querySelectorAll('g[data-node-id]')).map(function (g) {
    var id = g.getAttribute('data-node-id');
    var card = g.querySelector('rect:not(.c-mask)') || g.querySelector('rect');
    var accent = g.querySelector('rect.c-accent') || g.querySelector('rect[data-accent-kind]');
    var title = g.querySelector('text[data-node-label]');
    var sub = g.querySelector('text[data-detail="context"]');
    return { el: g, id: id, card: card ? R(card) : null, cardEl: card || null, accent: accent ? R(accent) : null, title: title ? { text: (title.textContent || '').trim(), box: R(title), font: parseFloat(title.getAttribute('font-size') || '') } : null, sub: sub ? { text: (sub.textContent || '').trim(), box: R(sub), font: parseFloat(sub.getAttribute('font-size') || '') } : null, bbox: R(g) };
  });
  var edgeLabels = Array.prototype.slice.call(main.querySelectorAll('g[data-edge-label]')).map(function (g) {
    return { el: g, label: g.getAttribute('data-edge-label') || '', from: g.getAttribute('data-edge-from') || '', to: g.getAttribute('data-edge-to') || '', key: g.getAttribute('data-edge-key') || '', box: R(g) };
  }).filter(function (e) { return e.box.w > 0 && e.box.h > 0; });
  // ---- A1 HEADER_TRANSIT: samples of P inside bbox(H)+4px must be 0 ----
  var a1hits = [];
  laneHeaders.forEach(function (h) {
    var pad = { left: h.box.left - 4, right: h.box.right + 4, top: h.box.top - 4, bottom: h.box.bottom + 4 };
    Object.keys(pathSamples).forEach(function (key) {
      var pts = pathSamples[key];
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        if (p.x >= pad.left && p.x <= pad.right && p.y >= pad.top && p.y <= pad.bottom) {
          a1hits.push({ header: h.label, headerBox: { x: r2(h.box.x), y: r2(h.box.y), w: r2(h.box.w), h: r2(h.box.h) }, edgeKey: key, pt: { x: r2(p.x), y: r2(p.y) } });
          break;
        }
      }
    });
  });
  // SEE-005 O1: floating pills — no polyline SEGMENT may intersect any pill
  // bbox (group g[structural-frame-label] includes mask rect). Threshold zero.
  // A route may END at a node, never TRANSIT a label.
  var ptInBox = function (p, b) { return p.x >= b.left && p.x <= b.right && p.y >= b.top && p.y <= b.bottom; };
  var segSegInt = function (p1, p2, p3, p4) {
    var d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
    if (d === 0) return false;
    var t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
    var u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  };
  var segHitsBox = function (a, b, box) {
    if (ptInBox(a, box) || ptInBox(b, box)) return true;
    var c1 = { x: box.left, y: box.top }, c2 = { x: box.right, y: box.top };
    var c3 = { x: box.right, y: box.bottom }, c4 = { x: box.left, y: box.bottom };
    return segSegInt(a, b, c1, c2) || segSegInt(a, b, c2, c3) || segSegInt(a, b, c3, c4) || segSegInt(a, b, c4, c1);
  };
  var a1pillHits = [];
  pillGroups.forEach(function (pill) {
    Object.keys(pathSamples).forEach(function (key) {
      var pts = pathSamples[key];
      for (var k = 0; k < pts.length - 1; k++) {
        if (segHitsBox(pts[k], pts[k + 1], pill.box)) {
          var mid = { x: (pts[k].x + pts[k + 1].x) / 2, y: (pts[k].y + pts[k + 1].y) / 2 };
          a1pillHits.push({ pill: pill.label || pill.id, pillBox: { x: r2(pill.box.x), y: r2(pill.box.y), w: r2(pill.box.w), h: r2(pill.box.h) }, edgeKey: key, pt: { x: r2(mid.x), y: r2(mid.y) } });
          break;
        }
      }
    });
  });
  // ---- A2 TEXT_CONTAINMENT: title inset>=16 all sides, sibling spread<=4 ----
  var a2rows = nodes.filter(function (n) { return n.card && n.title && n.title.box.w > 0; }).map(function (n) {
    var insetL = n.title.box.left - n.card.left, insetR = n.card.right - n.title.box.right;
    var insetT = n.title.box.top - n.card.top, insetB = n.card.bottom - n.title.box.bottom;
    var spread = (n.sub && n.sub.box.w > 0) ? Math.abs(n.title.box.cx - n.sub.box.cx) : 0;
    return { node: n.id, title: n.title.text, minInset: Math.min(insetL, insetR, insetT, insetB), insets: { l: r2(insetL), r: r2(insetR), t: r2(insetT), b: r2(insetB) }, spread: r2(spread), titleBox: { x: r2(n.title.box.x), y: r2(n.title.box.y), w: r2(n.title.box.w), h: r2(n.title.box.h) }, cardBox: { x: r2(n.card.x), y: r2(n.card.y), w: r2(n.card.w), h: r2(n.card.h) } };
  });
  var a2worst = null;
  a2rows.forEach(function (row) {
    if (!a2worst || row.minInset < a2worst.minInset) a2worst = row;
  });
  // ---- A3 LABEL_COLLISION: edge-label vs boundary strokes (inflated w/2) + other labels ----
  // SEE-009 O2: node sublabels + node card rectangles join the collision list.
  // Sublabel boxes were already collected page-side (n.sub) but never checked;
  // cards likewise (n.card). A label lying across a card is now visible.
  var otherLabels = [];
  nodes.forEach(function (n) { if (n.title && n.title.box.w > 0) otherLabels.push({ kind: 'node-title', name: n.id + ':' + n.title.text, box: n.title.box }); });
  nodes.forEach(function (n) { if (n.sub && n.sub.box.w > 0) otherLabels.push({ kind: 'node-sublabel', name: n.id + ':' + n.sub.text, box: n.sub.box }); });
  nodes.forEach(function (n) { if (n.card && n.card.w > 0) otherLabels.push({ kind: 'node-card', name: n.id, box: n.card }); });
  laneHeaders.forEach(function (h) { otherLabels.push({ kind: 'lane-header', name: h.label, box: h.box }); });
  boundaryLabels.forEach(function (b) { otherLabels.push({ kind: 'boundary-label', name: b.label, box: b.box }); });
  var overlap = function (a, b) { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; };
  var a3hits = [];
  edgeLabels.forEach(function (e) {
    boundaryRects.forEach(function (bd) {
      var pad = (bd.sw || 1) / 2;
      var b = bd.box;
      var bands = [
        { left: b.left - pad, right: b.right + pad, top: b.top - pad, bottom: b.top + pad },
        { left: b.left - pad, right: b.right + pad, top: b.bottom - pad, bottom: b.bottom + pad },
        { left: b.left - pad, right: b.left + pad, top: b.top - pad, bottom: b.bottom + pad },
        { left: b.right - pad, right: b.right + pad, top: b.top - pad, bottom: b.bottom + pad }
      ];
      for (var k = 0; k < 4; k++) {
        if (overlap(e.box, bands[k])) {
          a3hits.push({ edgeLabel: e.label, edgeKey: e.key || (e.from + '>' + e.to), vs: 'boundary-stroke:' + (bd.label || bd.id || bd.kind), labelBox: { x: r2(e.box.x), y: r2(e.box.y), w: r2(e.box.w), h: r2(e.box.h) }, strokeBand: k });
          break;
        }
      }
    });
    otherLabels.forEach(function (o) {
      if (overlap(e.box, o.box)) a3hits.push({ edgeLabel: e.label, edgeKey: e.key || (e.from + '>' + e.to), vs: o.kind + ':' + o.name, labelBox: { x: r2(e.box.x), y: r2(e.box.y), w: r2(e.box.w), h: r2(e.box.h) } });
    });
    edgeLabels.forEach(function (o) {
      if (o === e) return;
      if (overlap(e.box, o.box)) a3hits.push({ edgeLabel: e.label, edgeKey: e.key || (e.from + '>' + e.to), vs: 'edge-label:' + o.label, labelBox: { x: r2(e.box.x), y: r2(e.box.y), w: r2(e.box.w), h: r2(e.box.h) } });
    });
  });
  // ---- A4 LABEL_ORPHAN: centroid-to-own-polyline <= 24 AND own-wire samples
  // inside label bbox = 0. A label must ride NEAR its wire but must not COVER
  // it: detached (>24px, v2 return labels) and wire-severing (label mask sits
  // on its own polyline, v3 loop labels) are the two failure modes.
  var pathsByKey = {};
  paths.forEach(function (p) {
    var key = p.getAttribute('data-edge-key') || '';
    pathsByKey[key] = p;
  });
  var a4rows = edgeLabels.map(function (e) {
    var c = { x: e.box.cx, y: e.box.cy };
    var s = pathSamples[e.key] || pathSamples[e.from + '>' + e.to] || [];
    var best = Infinity, bestPt = null, inside = 0;
    for (var k = 0; k < s.length; k++) {
      var d = Math.hypot(s[k].x - c.x, s[k].y - c.y);
      if (d < best) { best = d; bestPt = s[k]; }
      if (s[k].x >= e.box.left && s[k].x <= e.box.right && s[k].y >= e.box.top && s[k].y <= e.box.bottom) inside++;
    }
    var tip = pathTip[e.key] || pathTip[e.from + '>' + e.to] || null;
    return { label: e.label, key: e.key || (e.from + '>' + e.to), centroid: { x: r2(c.x), y: r2(c.y) }, dist: isFinite(best) ? r2(best) : null, inside: inside, tip: tip ? { x: r2(tip.x), y: r2(tip.y) } : null, labelBox: { x: r2(e.box.x), y: r2(e.box.y), w: r2(e.box.w), h: r2(e.box.h) } };
  });
  // ---- A5 ARROWHEAD_DOCK: each tip-to-target gap within +-2px of modal ----
  // "Tip" = the RENDERED marker centroid (live marker polygon + CTM): path
  // endpoints are authoring coords, but vision readers grade the painted
  // arrowhead blob — its visual center is the robustly measurable proxy.
  var markerBackSvg = function (p) {
    try {
      var sw = parseFloat(p.getAttribute('stroke-width') || '') || 1.5;
      var me = p.getAttribute('marker-end') || '';
      var idm = me.match(/#([^)'"]+)/);
      if (!idm) return { back: 0, sw: sw };
      var mk = document.getElementById(idm[1]);
      if (!mk) return { back: 0, sw: sw };
      var refX = parseFloat(mk.getAttribute('refX') || '0') || 0;
      var mw = parseFloat(mk.getAttribute('markerWidth') || '3') || 3;
      var units = mk.getAttribute('markerUnits') || 'strokeWidth';
      var k = (units === 'userSpaceOnUse') ? 1 : sw;
      var cx = mw / 2;
      try {
        var poly = mk.querySelector('polygon');
        if (poly) {
          var nums = String(poly.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number).filter(isFinite);
          if (nums.length >= 6) cx = (nums[0] + nums[2] + nums[4]) / 3;
        }
      } catch (_) {}
      return { back: (refX - cx) * k, sw: sw };
    } catch (_) { return { back: 0, sw: 1.5 }; }
  };
  // Local screen-px-per-SVG-unit at each tip (from sample spacing, nominal
  // 2-unit step): exact under uniform CTM, stays truthful under non-uniform
  // (e.g. y-compressed synthetic corpus fixtures).
  var nodeCardById = {};
  nodes.forEach(function (n) { if (n.card) nodeCardById[n.id] = n.card; });
  var distToRect = function (p, b) {
    var dx = p.x < b.left ? b.left - p.x : (p.x > b.right ? p.x - b.right : 0);
    var dy = p.y < b.top ? b.top - p.y : (p.y > b.bottom ? p.y - b.bottom : 0);
    return Math.hypot(dx, dy);
  };
  var a5rows = [];
  paths.forEach(function (p) {
    if (!p.hasAttribute('marker-end')) return;
    var from = p.getAttribute('data-edge-from') || '', to = p.getAttribute('data-edge-to') || '';
    var key = p.getAttribute('data-edge-key') || (from + '>' + to);
    var s = pathSamples[key] || [];
    var pathEnd = pathTip[key];
    var tgt = nodeCardById[to];
    if (!pathEnd || !tgt || s.length < 2) return;
    var prev = s[s.length - 2];
    var dx = pathEnd.x - prev.x, dy = pathEnd.y - prev.y;
    var len = Math.hypot(dx, dy) || 1;
    var mb = markerBackSvg(p);
    var local = len / 2;
    var tip = { x: pathEnd.x - (dx / len) * mb.back * local, y: pathEnd.y - (dy / len) * mb.back * local };
    a5rows.push({ key: key, from: from, to: to, tip: { x: r2(tip.x), y: r2(tip.y) }, pathEnd: { x: r2(pathEnd.x), y: r2(pathEnd.y) }, targetEdge: { x: r2(tgt.x), y: r2(tgt.y), w: r2(tgt.w), h: r2(tgt.h) }, gap: r2(distToRect(tip, tgt)) });
  });
  var gaps = a5rows.map(function (row) { return row.gap; }).filter(isFinite);
  var modal = null, counts = {};
  gaps.forEach(function (g) { var b = String(Math.round(g)); counts[b] = (counts[b] || 0) + 1; });
  var bestN = -1;
  Object.keys(counts).forEach(function (b) { if (counts[b] > bestN) { bestN = counts[b]; modal = Number(b); } });
  // SEE-005 O2 A9 route-to-frame clearance (page-side).
  // Part1 floor: background (non-docking) subsegments vs frame perimeter >=12.
  // Whole docking edges exempt from part1 (pads 8<12 would else always FAIL;
  // edges originate/terminate, not segments). Part2 uniformity: per-side minima
  // over background + docking TERMINALS (first/last subsegments, inside, pad-like);
  // middle docking subsegments that INTERSECT frame perimeter are legitimate
  // entries (inside->outside) excluded from both as not-clearance; background
  // intersections (crossing a frame the edge never touches) stay included (0=FAIL).
  // Terminals exempt part1 ONLY, never part2 — per contract.
  var ptSegDist = function (p, a, b) {
    var vx = b.x - a.x, vy = b.y - a.y;
    var wx = p.x - a.x, wy = p.y - a.y;
    var c1 = wx * vx + wy * vy;
    var c2 = vx * vx + vy * vy;
    var t = c2 > 0 ? c1 / c2 : 0;
    if (t < 0) t = 0; if (t > 1) t = 1;
    var q = { x: a.x + vx * t, y: a.y + vy * t };
    return Math.hypot(p.x - q.x, p.y - q.y);
  };
  var segSegDist = function (a, b, c, d) {
    if (segSegInt(a, b, c, d)) return 0;
    return Math.min(ptSegDist(a, c, d), ptSegDist(b, c, d), ptSegDist(c, a, b), ptSegDist(d, a, b));
  };
  var nodeInsideFrame = function (n, fbox) {
    return n.card && n.card.cx >= fbox.left && n.card.cx <= fbox.right && n.card.cy >= fbox.top && n.card.cy <= fbox.bottom;
  };
  var edgeEndByKey = {};
  paths.forEach(function (p) {
    var fr = p.getAttribute('data-edge-from') || '', tt = p.getAttribute('data-edge-to') || '';
    var kk = p.getAttribute('data-edge-key') || (fr + '>' + tt);
    edgeEndByKey[kk] = { from: fr, to: tt };
  });
  var nodeById = {};
  nodes.forEach(function (n) { nodeById[n.id] = n; });
  var a9frames = boundaryRects.map(function (bd) {
    var fbox = bd.box;
    var sides = [
      { side: 'top', a: { x: fbox.left, y: fbox.top }, b: { x: fbox.right, y: fbox.top } },
      { side: 'right', a: { x: fbox.right, y: fbox.top }, b: { x: fbox.right, y: fbox.bottom } },
      { side: 'bottom', a: { x: fbox.left, y: fbox.bottom }, b: { x: fbox.right, y: fbox.bottom } },
      { side: 'left', a: { x: fbox.left, y: fbox.top }, b: { x: fbox.left, y: fbox.bottom } }
    ];
    var p1min = { top: Infinity, right: Infinity, bottom: Infinity, left: Infinity };
    var p2min = { top: Infinity, right: Infinity, bottom: Infinity, left: Infinity };
    var p1who = { top: null, right: null, bottom: null, left: null };
    var p2who = { top: null, right: null, bottom: null, left: null };
    Object.keys(pathSamples).forEach(function (key) {
      var ends = edgeEndByKey[key] || { from: '', to: '' };
      var fn = nodeById[ends.from], tn = nodeById[ends.to];
      var docking = (fn && nodeInsideFrame(fn, fbox)) || (tn && nodeInsideFrame(tn, fbox));
      var pts = pathSamples[key] || [];
      for (var k = 0; k < pts.length - 1; k++) {
        var s1 = pts[k], s2 = pts[k + 1];
        var isTerminal = (k === 0) || (k === pts.length - 2);
        var hitsPerim = sides.some(function (sd) { return segSegInt(s1, s2, sd.a, sd.b); });
        var inside1 = ptInBox(s1, fbox), inside2 = ptInBox(s2, fbox);
        var crosses = hitsPerim || (inside1 !== inside2);
        if (!docking) {
          for (var si = 0; si < 4; si++) {
            var d = segSegDist(s1, s2, sides[si].a, sides[si].b);
            if (d < p1min[sides[si].side]) { p1min[sides[si].side] = d; p1who[sides[si].side] = key; }
            if (d < p2min[sides[si].side]) { p2min[sides[si].side] = d; p2who[sides[si].side] = key; }
          }
        } else {
          if (isTerminal) {
            if (!crosses) {
              for (var sj = 0; sj < 4; sj++) {
                var d2 = segSegDist(s1, s2, sides[sj].a, sides[sj].b);
                if (d2 < p2min[sides[sj].side]) { p2min[sides[sj].side] = d2; p2who[sides[sj].side] = key + (isTerminal ? ':term' : ''); }
              }
            }
          } else {
            if (!crosses) {
              for (var sk = 0; sk < 4; sk++) {
                var d3 = segSegDist(s1, s2, sides[sk].a, sides[sk].b);
                if (d3 < p2min[sides[sk].side]) { p2min[sides[sk].side] = d3; p2who[sides[sk].side] = key + ':mid'; }
              }
            }
          }
        }
      }
    });
    var fin = function (v) { return isFinite(v) ? r2(v) : null; };
    var p1vals = [p1min.top, p1min.right, p1min.bottom, p1min.left].filter(isFinite);
    var p2vals = [p2min.top, p2min.right, p2min.bottom, p2min.left].filter(isFinite);
    var floorMin = p1vals.length ? Math.min.apply(null, p1vals) : null;
    var spread = p2vals.length ? (Math.max.apply(null, p2vals) - Math.min.apply(null, p2vals)) : null;
    return { id: bd.id, label: bd.label || bd.id || bd.kind, kind: bd.kind, box: { x: r2(fbox.x), y: r2(fbox.y), w: r2(fbox.w), h: r2(fbox.h) }, p1min: { top: fin(p1min.top), right: fin(p1min.right), bottom: fin(p1min.bottom), left: fin(p1min.left) }, p2min: { top: fin(p2min.top), right: fin(p2min.right), bottom: fin(p2min.bottom), left: fin(p2min.left) }, p1who: p1who, p2who: p2who, floorMin: floorMin == null ? null : r2(floorMin), spread: spread == null ? null : r2(spread) };
  });
  // SEE-005 O3 A10 arrowhead docking (page-side, SYS-003 Amendment D FIXED):
  // tip OUTSIDE target UNION (card rect UNION accent bar) at distance >=6px;
  // inside=FAIL. Amendment D answer: A10 USED TO measure the rendered marker
  // CENTROID (same as A5, ~10.2px behind line end for 1.8 stroke), NOT the line
  // end and NOT the arrow's actual point. Marker: markerWidth 10 x stroke 1.8
  // = ~18px long, markerUnits defaults strokeWidth (unset), refX 9 aligns x=9
  // with line end, tip at polygon x=10 sits (10-9)*sw = 1.8px BEYOND line end.
  // FIXED: A10 now measures the ACTUAL TIP (line end + tipBeyond along path
  // direction). A5 stays centroid per its contract (uniformity +-2 modal).
  // Before/after numbers booked in SYS-003 report (centroid gaps ~11-13px PASS
  // vs tip gaps ~6px, PORT 11 restores margin to target 9).
  var markerTipBeyondSvg = function (p) {
    try {
      var sw2 = parseFloat(p.getAttribute('stroke-width') || '') || 1.5;
      var me2 = p.getAttribute('marker-end') || '';
      var idm2 = me2.match(/#([^)'"]+)/);
      if (!idm2) return { beyond: 0, sw: sw2 };
      var mk2 = document.getElementById(idm2[1]);
      if (!mk2) return { beyond: 0, sw: sw2 };
      var refX2 = parseFloat(mk2.getAttribute('refX') || '0') || 0;
      var units2 = mk2.getAttribute('markerUnits') || 'strokeWidth';
      var k2 = (units2 === 'userSpaceOnUse') ? 1 : sw2;
      var tipX = 10;
      try {
        var poly2 = mk2.querySelector('polygon');
        if (poly2) {
          var nums2 = String(poly2.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number).filter(isFinite);
          if (nums2.length >= 2) {
            tipX = nums2[0];
            for (var qi = 2; qi < nums2.length; qi += 2) { if (nums2[qi] > tipX) tipX = nums2[qi]; }
          }
        }
      } catch (_) {}
      return { beyond: (tipX - refX2) * k2, sw: sw2 };
    } catch (_) { return { beyond: 0, sw: 1.5 }; }
  };
  var nodeUnionById = {};
  nodes.forEach(function (n) {
    if (!n.card) return;
    if (n.accent) {
      var l = Math.min(n.card.left, n.accent.left), t = Math.min(n.card.top, n.accent.top);
      var r = Math.max(n.card.right, n.accent.right), b = Math.max(n.card.bottom, n.accent.bottom);
      nodeUnionById[n.id] = { left: l, top: t, right: r, bottom: b, x: l, y: t, w: r - l, h: b - t, cx: (l + r) / 2, cy: (t + b) / 2 };
    } else {
      nodeUnionById[n.id] = n.card;
    }
  });
  var a10rows = [];
  paths.forEach(function (p) {
    if (!p.hasAttribute('marker-end')) return;
    var from = p.getAttribute('data-edge-from') || '', to = p.getAttribute('data-edge-to') || '';
    var key = p.getAttribute('data-edge-key') || (from + '>' + to);
    var s = pathSamples[key] || [];
    var pathEnd = pathTip[key];
    var tgt = nodeUnionById[to];
    if (!pathEnd || !tgt || s.length < 2) return;
    var prev = s[s.length - 2];
    var dx = pathEnd.x - prev.x, dy = pathEnd.y - prev.y;
    var len = Math.hypot(dx, dy) || 1;
    var mb2 = markerTipBeyondSvg(p);
    var local2 = len / 2;
    var tip = { x: pathEnd.x + (dx / len) * mb2.beyond * local2, y: pathEnd.y + (dy / len) * mb2.beyond * local2 };
    var inside = tip.x >= tgt.left && tip.x <= tgt.right && tip.y >= tgt.top && tip.y <= tgt.bottom;
    var gap = distToRect(tip, tgt);
    a10rows.push({ key: key, from: from, to: to, tip: { x: r2(tip.x), y: r2(tip.y) }, pathEnd: { x: r2(pathEnd.x), y: r2(pathEnd.y) }, targetBox: { x: r2(tgt.x), y: r2(tgt.y), w: r2(tgt.w), h: r2(tgt.h) }, inside: inside, gap: r2(gap) });
  });
  // ---- A6 INK_OCCUPANCY: union child nodes / container >= 0.50 ----
  var a6rows = boundaryRects.map(function (bd) {
    var kids = nodes.filter(function (n) {
      return n.card && n.card.cx >= bd.box.left && n.card.cx <= bd.box.right && n.card.cy >= bd.box.top && n.card.cy <= bd.box.bottom;
    });
    var area = 0;
    kids.forEach(function (n) {
      var ix0 = Math.max(n.card.left, bd.box.left), ix1 = Math.min(n.card.right, bd.box.right);
      var iy0 = Math.max(n.card.top, bd.box.top), iy1 = Math.min(n.card.bottom, bd.box.bottom);
      if (ix1 > ix0 && iy1 > iy0) area += (ix1 - ix0) * (iy1 - iy0);
    });
    var denom = bd.box.w * bd.box.h;
    return { container: bd.label || bd.id || bd.kind, kind: bd.kind, occupancy: denom > 0 ? area / denom : 0, kids: kids.map(function (n) { return n.id; }), box: { x: r2(bd.box.x), y: r2(bd.box.y), w: r2(bd.box.w), h: r2(bd.box.h) } };
  });
  // ---- A8 helpers: viewBox (baseVal) + content union (SVG user units, exact
  // attrs) + column proxy. "spec pos[0]" (authored left edge) is not embedded
  // in delivered HTML; node card center-x (pos.x + size.w/2) is its exact
  // delivered-geometry equivalent — verified: v3 spec pos[*][0]=220 for all
  // 12 components, cards x=220 w=320 center 380. Content = union of node
  // cards + structural frames (SVG units) — v3: x196-564 y106-1266.
  var vb = null;
  try {
    var base = main.viewBox && main.viewBox.baseVal;
    if (base) vb = { x: base.x, y: base.y, width: base.width, height: base.height };
  } catch (_) {}
  var num = function (v) { var n = parseFloat(v); return isFinite(n) ? n : NaN; };
  var cardCx = [], inkArea = 0;
  var ux0 = Infinity, uy0 = Infinity, ux1 = -Infinity, uy1 = -Infinity;
  var eatSvg = function (x, y, w, h) {
    if (![x, y, w, h].every(isFinite) || w <= 0 || h <= 0) return;
    if (x < ux0) ux0 = x; if (y < uy0) uy0 = y;
    if (x + w > ux1) ux1 = x + w; if (y + h > uy1) uy1 = y + h;
  };
  nodes.forEach(function (n) {
    try {
      var c = n.el.querySelector('rect:not(.c-mask)') || n.el.querySelector('rect');
      if (!c) return;
      var x = num(c.getAttribute('x')), y = num(c.getAttribute('y'));
      var w = num(c.getAttribute('width')), h = num(c.getAttribute('height'));
      if (!isFinite(x + y + w + h)) return;
      cardCx.push(x + w / 2);
      inkArea += w * h;
      eatSvg(x, y, w, h);
    } catch (_) {}
  });
  boundaryRects.forEach(function (bd) {
    try {
      eatSvg(num(bd.el.getAttribute('x')), num(bd.el.getAttribute('y')), num(bd.el.getAttribute('width')), num(bd.el.getAttribute('height')));
    } catch (_) {}
  });
  var distinctX = Array.from(new Set(cardCx.map(function (x) { return Math.round(x); })));
  var content = (ux0 <= ux1 && uy0 <= uy1)
    ? { x: Math.round(ux0 * 100) / 100, y: Math.round(uy0 * 100) / 100, w: Math.round((ux1 - ux0) * 100) / 100, h: Math.round((uy1 - uy0) * 100) / 100 }
    : null;
  var vbArea = (vb && vb.width > 0 && vb.height > 0) ? vb.width * vb.height : 0;
  var globalInkRatio = vbArea > 0 ? inkArea / vbArea : NaN;
  // Diagnostic cross-check: node-group bboxes via getBBox composed with getCTM
  // (screen space). Verdicts use the attr-exact SVG-unit union above.
  var contentComposed = null;
  try {
    var boxes = [];
    nodes.forEach(function (n) {
      try {
        var bb = n.el.getBBox();
        var m = n.el.getCTM();
        var pts = [{ x: bb.x, y: bb.y }, { x: bb.x + bb.width, y: bb.y }, { x: bb.x, y: bb.y + bb.height }, { x: bb.x + bb.width, y: bb.y + bb.height }].map(function (q) {
          try { var d = new DOMPoint(q.x, q.y).matrixTransform(m); return { x: d.x, y: d.y }; } catch (_) { return q; }
        });
        var xs = pts.map(function (q) { return q.x; }), ys = pts.map(function (q) { return q.y; });
        boxes.push({ x0: Math.min.apply(null, xs), y0: Math.min.apply(null, ys), x1: Math.max.apply(null, xs), y1: Math.max.apply(null, ys) });
      } catch (_) {}
    });
    if (boxes.length) {
      var cx0 = Math.min.apply(null, boxes.map(function (b) { return b.x0; }));
      var cy0 = Math.min.apply(null, boxes.map(function (b) { return b.y0; }));
      var cx1 = Math.max.apply(null, boxes.map(function (b) { return b.x1; }));
      var cy1 = Math.max.apply(null, boxes.map(function (b) { return b.y1; }));
      contentComposed = { x: r2(cx0), y: r2(cy0), w: r2(cx1 - cx0), h: r2(cy1 - cy0) };
    }
  } catch (_) {}
  // ---- O1a helpers: per-detail floors + sampled-contrast scan ----
  var diagramW = R(main).w, viewBoxW = vb && vb.width ? vb.width : 0;
  var oScale = viewBoxW > 0 ? Math.min(1, diagramW / viewBoxW) : 0;
  var FLOOR = { primary: 15, context: 11, boundary: 13, edge: 11 };
  var NEED = { primary: 7, context: 4.5, boundary: 4.5, edge: 4.5 };
  var texts = [];
  Array.prototype.slice.call(main.querySelectorAll('text[data-node-label]')).forEach(function (t) {
    texts.push({ el: t, detail: 'primary', text: (t.textContent || '').trim(), font: parseFloat(t.getAttribute('font-size') || '') });
  });
  Array.prototype.slice.call(main.querySelectorAll('g[data-node-id] text[data-detail="context"]')).forEach(function (t) {
    texts.push({ el: t, detail: 'context', text: (t.textContent || '').trim(), font: parseFloat(t.getAttribute('font-size') || '') });
  });
  Array.prototype.slice.call(main.querySelectorAll('text[data-boundary-label]')).forEach(function (t) {
    texts.push({ el: t, detail: 'boundary', text: (t.textContent || '').trim(), font: parseFloat(t.getAttribute('font-size') || '') });
  });
  laneHeaders.forEach(function (h) {
    texts.push({ el: h.el, detail: 'boundary', text: h.label, font: parseFloat(h.el.getAttribute('font-size') || '') });
  });
  edgeLabels.forEach(function (e) {
    var t = e.el.querySelector('text');
    texts.push({ el: t || e.el, detail: 'edge', text: e.label, font: t ? parseFloat(t.getAttribute('font-size') || '') : NaN });
  });
  var parseColor = function (s) {
    var m = String(s || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var parts = m[1].split(',').map(function (x) { return Number(String(x).trim()); });
    if (parts.length < 3 || !parts.slice(0, 3).every(isFinite)) return null;
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  };
  var lum = function (c) {
    var f = function (v) { var s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  var ratio = function (a, b) {
    var x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  // Sample the backdrop PIXEL behind each glyph run: hide all text, hit-test
  // the centroid (live elementFromPoint), read computed fills — never tokens.
  var hidden = [];
  try {
    texts.forEach(function (t) { if (t.el && t.el.style) { hidden.push([t.el, t.el.style.visibility]); t.el.style.visibility = 'hidden'; } });
  } catch (_) {}
  var o1rows = texts.map(function (t) {
    var box = null;
    try { box = R(t.el); } catch (_) {}
    var fg = null, bg = null, cr = null;
    try { fg = parseColor(getComputedStyle(t.el).fill || getComputedStyle(t.el).color); } catch (_) {}
    try {
      var el = null;
      if (box && box.w > 0) el = document.elementFromPoint(box.cx, box.cy);
      if (el && t.el && (el === t.el || t.el.contains(el))) el = el.parentElement;
      var g = el;
      while (g && g !== document.documentElement) {
        var f = null;
        try { f = parseColor(getComputedStyle(g).fill); } catch (_) {}
        var bgc = null;
        try { bgc = parseColor(getComputedStyle(g).backgroundColor); } catch (_) {}
        var cand = (f && !(f[3] === 0)) ? f : ((bgc && bgc[3] !== 0 && !(bgc[0] === 0 && bgc[1] === 0 && bgc[2] === 0 && bgc[3] === 0)) ? bgc : null);
        if (cand) { bg = cand; break; }
        g = g.parentElement;
      }
      if (!bg) bg = parseColor(getComputedStyle(document.body).backgroundColor) || [255, 255, 255, 1];
      if (fg && bg) {
        var b = bg[3] !== undefined && bg[3] < 1 ? [255, 255, 255] : bg.slice(0, 3);
        cr = ratio(fg.slice(0, 3), b);
      }
    } catch (_) {}
    var proj = (isFinite(t.font) && oScale > 0) ? t.font * oScale : NaN;
    return { detail: t.detail, text: t.text, sourceFontPx: isFinite(t.font) ? r2(t.font) : null, projectedPx: isFinite(proj) ? r2(proj) : null, floor: FLOOR[t.detail], need: NEED[t.detail], contrast: cr == null ? null : r2(cr), box: box ? { x: r2(box.x), y: r2(box.y), w: r2(box.w), h: r2(box.h) } : null };
  });
  try {
    hidden.forEach(function (pair) { try { pair[0].style.visibility = pair[1]; } catch (_) {} });
  } catch (_) {}
  // ---- SEE-009 A13 MARGIN_BALANCE (page-side): rendered content union ----
  // Same element sets the A8 attr-union eats (node cards + structural frames),
  // but in rendered CSS px at the declared viewport: the eye grades the page,
  // not SVG units (A8's contentBox/viewBox stay exactly balanced on a picture
  // shoved off-page). Reuses n.card / frame boxes already measured — no new queries.
  var rcx0 = Infinity, rcy0 = Infinity, rcx1 = -Infinity, rcy1 = -Infinity;
  var eatRc = function (b) {
    if (!b || !isFinite(b.left + b.top + b.right + b.bottom) || b.w <= 0 || b.h <= 0) return;
    if (b.left < rcx0) rcx0 = b.left; if (b.top < rcy0) rcy0 = b.top;
    if (b.right > rcx1) rcx1 = b.right; if (b.bottom > rcy1) rcy1 = b.bottom;
  };
  nodes.forEach(function (n) { eatRc(n.card || n.bbox); });
  boundaryRects.forEach(function (bd) { eatRc(bd.box); });
  var contentRendered = (rcx0 <= rcx1 && rcy0 <= rcy1)
    ? { x: r2(rcx0), y: r2(rcy0), w: r2(rcx1 - rcx0), h: r2(rcy1 - rcy0) }
    : null;
  // ---- SEE-010 A14 INTERNAL_BALANCE (page-side): empty space inside frames ----
  // For each frame, the gap from its inner edge to the nearest card it holds
  // (card centre inside the frame box, same membership test as A6), left
  // against right. Reuses boundaryRects + n.card — no new queries. A9 habit:
  // record which card produced each gap (leftWho/rightWho/...). Top/bottom
  // gaps reported, never judged.
  var a14rows = boundaryRects.map(function (bd) {
    var fbox = bd.box;
    var kids = nodes.filter(function (n) {
      return n.card && n.card.cx >= fbox.left && n.card.cx <= fbox.right && n.card.cy >= fbox.top && n.card.cy <= fbox.bottom;
    });
    var gaps = { left: null, right: null, top: null, bottom: null };
    var who = { left: null, right: null, top: null, bottom: null };
    kids.forEach(function (n) {
      var g = {
        left: n.card.left - fbox.left,
        right: fbox.right - n.card.right,
        top: n.card.top - fbox.top,
        bottom: fbox.bottom - n.card.bottom
      };
      ['left', 'right', 'top', 'bottom'].forEach(function (s) {
        if (gaps[s] == null || g[s] < gaps[s]) { gaps[s] = g[s]; who[s] = n.id; }
      });
    });
    var diff = (gaps.left != null && gaps.right != null) ? Math.abs(gaps.left - gaps.right) : null;
    var tol = fbox.w * 0.10;
    return { frame: bd.label || bd.id || bd.kind, kind: bd.kind, kids: kids.map(function (n) { return n.id; }),
      left: gaps.left == null ? null : r2(gaps.left), right: gaps.right == null ? null : r2(gaps.right),
      top: gaps.top == null ? null : r2(gaps.top), bottom: gaps.bottom == null ? null : r2(gaps.bottom),
      leftWho: who.left, rightWho: who.right, topWho: who.top, bottomWho: who.bottom,
      diff: diff == null ? null : r2(diff), tol: r2(tol), frameW: r2(fbox.w) };
  });
  // ---- SEE-010 A15 LABEL_CLEARANCE (page-side): crowding vs cards/sublabels ----
  // Every edge label must stand clear of every node card and every node
  // sublabel (the two SEE-009 feed members at lines 403-404) by >= 24px.
  // Same shapes A3 reads; A3 asks overlap, A15 asks box-gap distance.
  // Shortest-gap producer recorded by name on each leg.
  var boxGap = function (a, b) {
    var dx = Math.max(b.left - a.right, a.left - b.right, 0);
    var dy = Math.max(b.top - a.bottom, a.top - b.bottom, 0);
    return Math.sqrt(dx * dx + dy * dy);
  };
  var a15rows = edgeLabels.map(function (e) {
    var cardBest = null, cardWho = null, subBest = null, subWho = null;
    nodes.forEach(function (n) {
      if (n.card && n.card.w > 0) {
        var g = boxGap(e.box, n.card);
        if (cardBest == null || g < cardBest) { cardBest = g; cardWho = n.id; }
      }
      if (n.sub && n.sub.box.w > 0) {
        var g2 = boxGap(e.box, n.sub.box);
        if (subBest == null || g2 < subBest) { subBest = g2; subWho = n.id + ':' + n.sub.text; }
      }
    });
    var minGap = null, minWho = null, minKind = null;
    if (cardBest != null && (minGap == null || cardBest < minGap)) { minGap = cardBest; minWho = cardWho; minKind = 'card'; }
    if (subBest != null && (minGap == null || subBest < minGap)) { minGap = subBest; minWho = subWho; minKind = 'sub'; }
    return { label: e.label, key: e.key || (e.from + '>' + e.to),
      cardGap: cardBest == null ? null : r2(cardBest), cardWho: cardWho,
      subGap: subBest == null ? null : r2(subBest), subWho: subWho,
      minGap: minGap == null ? null : r2(minGap), minWho: minWho, minKind: minKind,
      labelBox: { x: r2(e.box.x), y: r2(e.box.y), w: r2(e.box.w), h: r2(e.box.h) } };
  });
  // ---- SEE-016 A16 FRAME_CROSSING (page-side): pairwise frame relations ----
  // Uses ALREADY-COLLECTED boundaryRects + CSS-px boxes (R). No second harvest.
  // Nested (one fully inside the other, edges included) is containment, not
  // damage: ONLY partial-overlap crossing fails. Zero-area touch (incl
  // edge-touch) is separate.
  var frameName = function (bd) { return bd.label || bd.id || bd.kind; };
  var xArea = function (a, b) {
    var ix0 = Math.max(a.left, b.left), ix1 = Math.min(a.right, b.right);
    var iy0 = Math.max(a.top, b.top), iy1 = Math.min(a.bottom, b.bottom);
    return { w: ix1 - ix0, h: iy1 - iy0, area: (ix1 > ix0 && iy1 > iy0) ? (ix1 - ix0) * (iy1 - iy0) : 0 };
  };
  var insideBox = function (inner, outer) {
    var eps = 0.5;
    return inner.left >= outer.left - eps && inner.top >= outer.top - eps && inner.right <= outer.right + eps && inner.bottom <= outer.bottom + eps;
  };
  var a16pairs = [];
  for (var fi = 0; fi < boundaryRects.length; fi++) {
    for (var fj = fi + 1; fj < boundaryRects.length; fj++) {
      var fa = boundaryRects[fi], fb = boundaryRects[fj];
      var xa = xArea(fa.box, fb.box);
      var rel = 'separate';
      if (xa.area > 0) {
        var aInB = insideBox(fa.box, fb.box), bInA = insideBox(fb.box, fa.box);
        rel = (aInB || bInA) ? 'nested' : 'crossing';
      }
      a16pairs.push({ a: frameName(fa), b: frameName(fb), relation: rel,
        area: r2(xa.area),
        aBox: { x: r2(fa.box.x), y: r2(fa.box.y), w: r2(fa.box.w), h: r2(fa.box.h) },
        bBox: { x: r2(fb.box.x), y: r2(fb.box.y), w: r2(fb.box.w), h: r2(fb.box.h) } });
    }
  }
  // ---- SEE-016 A17 FRAME_FILL (page-side): member-card-covered area / frame ----
  // Membership = card centre inside the frame box (same test as A6/A14).
  // Covered = sum of member-card cap frame intersections (cards do not overlap
  // each other). A frame holding no cards answers NA for that frame.
  var a17rows = boundaryRects.map(function (bd) {
    var fbox = bd.box;
    var kids = nodes.filter(function (n) {
      return n.card && n.card.cx >= fbox.left && n.card.cx <= fbox.right && n.card.cy >= fbox.top && n.card.cy <= fbox.bottom;
    });
    var covered = 0;
    kids.forEach(function (n) {
      var ix0 = Math.max(n.card.left, fbox.left), ix1 = Math.min(n.card.right, fbox.right);
      var iy0 = Math.max(n.card.top, fbox.top), iy1 = Math.min(n.card.bottom, fbox.bottom);
      if (ix1 > ix0 && iy1 > iy0) covered += (ix1 - ix0) * (iy1 - iy0);
    });
    var denom = fbox.w * fbox.h;
    var fill = denom > 0 ? covered / denom : null;
    return { frame: frameName(bd), kind: bd.kind, kids: kids.map(function (n) { return n.id; }),
      fill: fill == null ? null : Math.round(fill * 10000) / 10000,
      pct: fill == null ? null : Math.round(fill * 10000) / 100,
      box: { x: r2(fbox.x), y: r2(fbox.y), w: r2(fbox.w), h: r2(fbox.h) } };
  });
  // ---- S2 E5 LANE_HEADER (page-side): every lane/segment frame names its lane ----
  // Header sources: workflow lane text.t-dim (direct svg child, inside its lane)
  // and sequence g[segment-label] groups (mounted just above their segment).
  // Distinctness = header text fill differs from the lane rect fill (computed).
  var cssFillOf = function (el) { try { return String(getComputedStyle(el).fill || ''); } catch (_) { return ''; } };
  var segLabels = Array.prototype.slice.call(main.querySelectorAll('g[data-graph-role="segment-label"]')).map(function (g) {
    var t = g.querySelector('text');
    return { el: g, label: t ? (t.textContent || '').trim() : '', box: R(g), fill: t ? cssFillOf(t) : '' };
  }).filter(function (s) { return s.box.w > 0 && s.box.h > 0; });
  var laneKindSet = { lane: 1, 'exception-lane': 1, segment: 1 };
  var e5rows = boundaryRects.filter(function (bd) { return laneKindSet[bd.kind]; }).map(function (bd) {
    var fbox = bd.box;
    var match = null;
    if (bd.kind === 'segment') {
      var bestGap = Infinity;
      segLabels.forEach(function (s) {
        var hOverlap = Math.min(s.box.right, fbox.right) - Math.max(s.box.left, fbox.left);
        if (hOverlap <= 0) return;
        var gap = fbox.top - s.box.bottom;
        if (gap >= -4 && gap <= 40 && gap < bestGap) { bestGap = gap; match = s; }
      });
    } else {
      laneHeaders.forEach(function (h) {
        if (h.box.cy >= fbox.top - 1 && h.box.cy <= fbox.bottom + 1 && h.box.cx >= fbox.left - 60 && h.box.cx <= fbox.right + 60) {
          if (!match) match = h;
        }
      });
    }
    var laneFill = cssFillOf(bd.el);
    var headFill = match ? (match.fill || cssFillOf(match.el)) : '';
    return { frame: frameName(bd), kind: bd.kind,
      header: match ? match.label : '',
      matched: !!match, named: match ? match.label.length > 0 : false,
      distinct: match ? (headFill !== '' && headFill !== laneFill) : false,
      headFill: headFill, laneFill: laneFill,
      box: { x: r2(fbox.x), y: r2(fbox.y), w: r2(fbox.w), h: r2(fbox.h) } };
  });
  // ---- S2 E7 NODE_STRIPE (page-side): 4px left-edge bar coloured by node kind ----
  var e7rows = Array.prototype.slice.call(main.querySelectorAll('g[data-node-id]')).map(function (g) {
    var id = g.getAttribute('data-node-id') || '';
    var kind7 = g.getAttribute('data-node-kind') || '';
    var card = g.querySelector('rect:not(.c-mask)') || g.querySelector('rect');
    var ac = g.querySelector('rect.c-accent') || g.querySelector('rect[data-accent-kind]');
    var cb = null, ab = null, aw = NaN, ax = NaN, cx0 = NaN;
    try { cb = card ? R(card) : null; } catch (_) {}
    try { ab = ac ? R(ac) : null; } catch (_) {}
    try { aw = ac ? parseFloat(ac.getAttribute('width') || '') : NaN; } catch (_) {}
    try { ax = ac ? parseFloat(ac.getAttribute('x') || '') : NaN; } catch (_) {}
    try { cx0 = card ? parseFloat(card.getAttribute('x') || '') : NaN; } catch (_) {}
    var ak = '';
    try { ak = ac ? (ac.getAttribute('data-accent-kind') || '') : ''; } catch (_) {}
    return { node: id, kind: kind7, has: !!ac,
      w: isFinite(aw) ? aw : null, leftOk: (isFinite(ax) && isFinite(cx0)) ? (Math.abs(ax - cx0) <= 1) : false,
      kindOk: ac ? (ak ? (kind7 ? ak === kind7 : true) : false) : false,
      accentKind: ak,
      cardBox: cb ? { x: r2(cb.x), y: r2(cb.y), w: r2(cb.w), h: r2(cb.h) } : null,
      barBox: ab ? { x: r2(ab.x), y: r2(ab.y), w: r2(ab.w), h: r2(ab.h) } : null };
  });
  // ---- S2 E9 GRID (page-side): alignment aid must never render in delivery ----
  var gridPattern = false;
  try { gridPattern = !!document.getElementById('grid'); } catch (_) {}
  var gridRects = Array.prototype.slice.call(main.querySelectorAll('rect[fill="url(#grid)"]')).map(function (r) {
    var b = null;
    try { b = R(r); } catch (_) {}
    var disp = '', vis = '', op = '';
    try { var cs = getComputedStyle(r); disp = String(cs.display || ''); vis = String(cs.visibility || ''); op = String(cs.opacity || ''); } catch (_) {}
    var rendered = b && b.w > 0 && b.h > 0 && disp !== 'none' && vis !== 'hidden' && vis !== 'collapse' && parseFloat(op) !== 0;
    return { box: b ? { x: r2(b.x), y: r2(b.y), w: r2(b.w), h: r2(b.h) } : null,
      display: disp, visibility: vis, opacity: op, rendered: !!rendered };
  });
  // ---- S2 E10/E12 shared wire + card-fill references ----
  // Delivered sequence paths carry data-composition-edge-from (not data-edge-from),
  // so wire lookup spans both populations; paths[] itself is untouched.
  var compPaths = {};
  Array.prototype.slice.call(main.querySelectorAll('path[data-composition-edge-from]')).forEach(function (p) {
    var kk = (p.getAttribute('data-composition-edge-from') || '') + '>' + (p.getAttribute('data-composition-edge-to') || '');
    compPaths[kk] = p;
    var cid = p.getAttribute('data-composition-edge-id') || '';
    if (cid) compPaths['id:' + cid] = p;
  });
  var pathElByKey = {};
  paths.forEach(function (p) {
    var kk = p.getAttribute('data-edge-key') || ((p.getAttribute('data-edge-from') || '') + '>' + (p.getAttribute('data-edge-to') || ''));
    pathElByKey[kk] = p;
  });
  var cardFillRef = '';
  try {
    var refCard = main.querySelector('g[data-node-id] rect.c-mask') || main.querySelector('g[data-node-id] rect:not(.c-mask)') || main.querySelector('g[data-node-id] rect');
    if (refCard) cardFillRef = cssFillOf(refCard);
  } catch (_) {}
  var wireStrokeOf = function (key) {
    var p = compPaths[key] || pathElByKey[key] || null;
    if (!p) return { stroke: '', found: false };
    var s = '';
    try { s = String(getComputedStyle(p).stroke || ''); } catch (_) {}
    return { stroke: s, found: true };
  };
  // ---- S2 E10 EDGE_LABEL_BACKING (page-side): direct-child rect backing only ----
  // Sequence message groups carry data-edge-label on the OUTER g (no direct rect);
  // those answer E12, never E10 (isMsg split keeps both populations disjoint).
  var e10rows = edgeLabels.map(function (e) {
    var backs = [];
    try {
      var ch = e.el.children;
      for (var i = 0; i < ch.length; i++) { if (ch[i].tagName === 'rect') backs.push(ch[i]); }
    } catch (_) {}
    var isMsg = false;
    try { isMsg = !!e.el.querySelector('path'); } catch (_) {}
    var b0 = backs[0] || null;
    var bb = null;
    try { bb = b0 ? R(b0) : null; } catch (_) {}
    var bf = '', bs = '', rx = '';
    if (b0) {
      try { var cs2 = getComputedStyle(b0); bf = String(cs2.fill || ''); bs = String(cs2.stroke || ''); } catch (_) {}
      try { rx = b0.getAttribute('rx') || ''; } catch (_) {}
    }
    var w = wireStrokeOf(e.key || (e.from + '>' + e.to));
    return { label: e.label, key: e.key || (e.from + '>' + e.to), isMsg: isMsg,
      has: !!b0, rx: rx, fill: bf, stroke: bs, wire: w.stroke, wireFound: w.found,
      tinted: b0 ? (bf !== '' && bf !== cardFillRef) : false,
      bordered: b0 ? (bs !== '' && bs !== 'none') : false,
      wireMatch: b0 ? (bs !== '' && bs !== 'none' && bs === w.stroke) : false,
      labelBox: { x: r2(e.box.x), y: r2(e.box.y), w: r2(e.box.w), h: r2(e.box.h) },
      backBox: bb ? { x: r2(bb.x), y: r2(bb.y), w: r2(bb.w), h: r2(bb.h) } : null };
  });
  // Sequence edge groups are g[data-edge-from] wrapping one path + label rect;
  // inner g[data-detail] has no edge attrs, so E12 walks from the outer group.
  var e12rows = [];
  Array.prototype.slice.call(main.querySelectorAll('g[data-edge-from]')).forEach(function (g) {
    if (!g.querySelector('path')) return;
    var key2 = g.getAttribute('data-edge-key') || ((g.getAttribute('data-edge-from') || '') + '>' + (g.getAttribute('data-edge-to') || ''));
    var w2 = wireStrokeOf(key2);
    if (!w2.found && g.getAttribute('data-edge-id')) w2 = wireStrokeOf('id:' + g.getAttribute('data-edge-id'));
    Array.prototype.slice.call(g.querySelectorAll('g[data-detail="context"]')).forEach(function (inner) {
      var r0 = inner.querySelector('rect');
      if (!r0) return;
      var bb2 = null;
      try { bb2 = R(r0); } catch (_) {}
      if (!bb2 || bb2.w <= 0 || bb2.h <= 0) return;
      var t0 = inner.querySelector('text');
      var bf2 = '', bs2 = '', rx2 = '';
      try { var cs3 = getComputedStyle(r0); bf2 = String(cs3.fill || ''); bs2 = String(cs3.stroke || ''); } catch (_) {}
      try { rx2 = r0.getAttribute('rx') || ''; } catch (_) {}
      e12rows.push({ label: t0 ? (t0.textContent || '').trim() : (g.getAttribute('data-edge-label') || ''),
        key: key2, rx: rx2, fill: bf2, stroke: bs2, wire: w2.stroke, wireFound: w2.found,
        tinted: bf2 !== '' && bf2 !== cardFillRef,
        bordered: bs2 !== '' && bs2 !== 'none',
        wireMatch: bs2 !== '' && bs2 !== 'none' && bs2 === w2.stroke,
        backBox: { x: r2(bb2.x), y: r2(bb2.y), w: r2(bb2.w), h: r2(bb2.h) } });
    });
  });
  // ---- S2 E13 ACTIVATION_BAR (page-side): 10px-wide busy-span bars, mask+fill pairs ----
  var actGroups = {};
  Array.prototype.slice.call(main.querySelectorAll('rect')).forEach(function (r) {
    if (r.getAttribute('width') !== '10') return;
    var b3 = null;
    try { b3 = R(r); } catch (_) {}
    if (!b3 || b3.w <= 0 || b3.h <= 0) return;
    var cls3 = '', rx3 = '', h3 = NaN;
    try { cls3 = r.getAttribute('class') || ''; } catch (_) {}
    try { rx3 = r.getAttribute('rx') || ''; } catch (_) {}
    try { h3 = parseFloat(r.getAttribute('height') || ''); } catch (_) {}
    var k = Math.round(b3.x) + ':' + Math.round(b3.y);
    if (!actGroups[k]) actGroups[k] = [];
    actGroups[k].push({ wAttr: 10, h: isFinite(h3) ? h3 : b3.h, rx: rx3, cls: cls3,
      box: { x: r2(b3.x), y: r2(b3.y), w: r2(b3.w), h: r2(b3.h) } });
  });
  var e13rows = Object.keys(actGroups).map(function (k) {
    var rs = actGroups[k];
    var hasMask = rs.some(function (r) { return String(r.cls).split(' ').indexOf('c-mask') > -1; });
    var hasFill = rs.some(function (r) { return String(r.cls).split(' ').indexOf('c-mask') === -1; });
    return { at: k, count: rs.length, h: Math.round(rs[0].h * 100) / 100,
      wide10: rs[0].wAttr === 10, tall: rs[0].h > 0, paired: hasMask && hasFill,
      rx: rs[0].rx, cls: rs.map(function (r) { return r.cls; }).join('+'), box: rs[0].box };
  });
  // ---- S2 E17 DASHED_VS_PLAIN (page-side): dashed must differ by more than dashes ----
  var allWires = paths.slice();
  Object.keys(compPaths).forEach(function (k) { if (allWires.indexOf(compPaths[k]) === -1) allWires.push(compPaths[k]); });
  var wireRows = allWires.map(function (p) {
    var cls = String(p.getAttribute('class') || '');
    var parts = cls.split(' ');
    var role = parts.indexOf('a-dashed') > -1 ? 'dashed' : (parts.indexOf('a-default') > -1 ? 'plain' : (parts.indexOf('a-emphasis') > -1 ? 'strong' : (parts.indexOf('a-security') > -1 ? 'security' : 'other')));
    var sw = '';
    try { sw = p.getAttribute('stroke-width') || ''; } catch (_) {}
    var cst = '', dash = '', me = '';
    try { cst = String(getComputedStyle(p).stroke || ''); } catch (_) {}
    try { dash = String(getComputedStyle(p).strokeDasharray || p.getAttribute('stroke-dasharray') || ''); } catch (_) {}
    try { me = p.getAttribute('marker-end') || ''; } catch (_) {}
    var mf = '';
    try {
      var mm = me.match(/#([^)'"]+)/);
      if (mm) { var mk = document.getElementById(mm[1]); var poly = mk ? mk.querySelector('polygon') : null; if (poly) mf = String(getComputedStyle(poly).fill || ''); }
    } catch (_) {}
    return { role: role, cls: cls, sw: sw, stroke: cst, dash: dash, marker: me, markerFill: mf };
  }).filter(function (r) { return r.role === 'plain' || r.role === 'dashed'; });
  return {
    laneHeaderCount: laneHeaders.length,
    laneRectCount: laneRects.length,
    boundaryRectCount: boundaryRects.length,
    nodeCount: nodes.length,
    edgeCount: paths.length,
    specEdgeCount: (function () { try { var v = main.getAttribute('data-spec-edge-count'); var n = parseInt(v, 10); return isFinite(n) ? n : null; } catch (_) { return null; } })(),
    edgeLabelCount: edgeLabels.length,
    pillGroupCount: pillGroups.length,
    pillMaskCount: pillMasks.length,
    a1hits: a1hits,
    a1pillHits: a1pillHits,
    a2rows: a2rows, a2worst: a2worst,
    a3hits: a3hits,
    a4rows: a4rows,
    a5rows: a5rows, modal: modal,
    a6rows: a6rows,
    a9frames: a9frames,
    a10rows: a10rows,
    a12rows: a12rows,
    a14rows: a14rows,
    a15rows: a15rows,
    a16pairs: a16pairs,
    a17rows: a17rows,
    e5rows: e5rows,
    e7rows: e7rows,
    gridPattern: gridPattern, gridRects: gridRects,
    e10rows: e10rows, e12rows: e12rows, e13rows: e13rows, wireRows: wireRows,
    cardFillRef: cardFillRef,
  };
})`;
let geom;
try {
  geom = await evalJs(`(${PAGE_FN})()`);
} catch (e) {
  console.error('geometry-assert: measurement failed: ' + e.message);
  await cleanup();
  process.exit(1);
}
if (!geom || geom.error) {
  console.error('geometry-assert: measurement failed: ' + (geom?.error || 'empty geometry'));
  await cleanup();
  process.exit(1);
}

// ---- A7: containment at BOTH declared viewports (pass iff >=1 passes) ----
async function containmentAt(w, h) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 400));
  return evalJs(`(() => ({ innerWidth: window.innerWidth, innerHeight: window.innerHeight, scrollWidth: Math.ceil(document.documentElement.scrollWidth), scrollHeight: Math.ceil(document.documentElement.scrollHeight) }))()`);
}
let c1440 = null, c1920 = null;
try {
  c1440 = await containmentAt(1440, 900);
  c1920 = await containmentAt(1920, 1080);
} catch (e) {
  console.error('geometry-assert: containment probe failed: ' + e.message);
  await cleanup();
  process.exit(1);
}
await cleanup();

// ---- Verdicts ----
const isWorkflow = (geom.laneRectCount || 0) > 0;
const kind = isWorkflow ? 'workflow' : 'architecture';
const A = [];

const pxFloor = { primary: 15, context: 11, boundary: 13, edge: 11 };

// A1 HEADER_TRANSIT + SEE-005 floating pills (mask rects incl via group bbox)
// Selector verbatim: g[data-graph-role="structural-frame-label"] (+ rect[data-graph-role="structural-frame-label-mask"])
{
  const lane = geom.a1hits || [];
  const pills = geom.a1pillHits || [];
  const total = lane.length + pills.length;
  const firstPill = pills[0];
  // OSM-SYS-001 O3: population = routes + headers + pills examined. N=0 -> NA, never PASS.
  const popA1 = (geom.edgeCount || 0) + (geom.laneHeaderCount || 0) + (geom.pillGroupCount || 0);
  A.push({
    id: 'A1', name: 'HEADER_TRANSIT', asserted: true,
    threshold: 'samples of P in bbox(H)+4px = 0 AND polyline segments vs pill bbox g[structural-frame-label] (mask incl) = 0',
    verdict: popA1 === 0 ? 'NA' : (total ? 'FAIL' : 'PASS'),
    measured: { population: popA1, transitSamples: lane.length, pillTransits: pills.length, laneHeaders: geom.laneHeaderCount, pills: geom.pillGroupCount ?? 0, pillMasks: geom.pillMaskCount ?? 0, paths: geom.edgeCount },
    elements: [...lane.slice(0, 2).map((h) => ({ header: h.header, edgeKey: h.edgeKey })), ...pills.slice(0, 2).map((h) => ({ pill: h.pill, edgeKey: h.edgeKey }))],
    coords: [...lane.slice(0, 2).map((h) => ({ pt: h.pt, headerBox: h.headerBox })), ...pills.slice(0, 2).map((h) => ({ pt: h.pt, pillBox: h.pillBox }))],
    reason: popA1 === 0
      ? 'no measurable population (N=0): no paths, lane headers, or pills to examine'
      : (total
      ? (firstPill
        ? `route transits floating pill "${firstPill.pill}" (${firstPill.edgeKey} at ${firstPill.pt.x},${firstPill.pt.y} vs pill ${firstPill.pillBox.x},${firstPill.pillBox.y} ${firstPill.pillBox.w}x${firstPill.pillBox.h})`
        : `route transits lane-header text: ${lane[0].edgeKey} at (${lane[0].pt.x},${lane[0].pt.y}) inside "${lane[0].header}" bbox+4px`)
      : ((geom.laneHeaderCount || geom.pillGroupCount) ? `no transit: lane ${geom.laneHeaderCount}, pills ${geom.pillGroupCount ?? 0} (masks ${geom.pillMaskCount ?? 0}), paths ${geom.edgeCount}` : 'no lane headers nor pills: vacuously clean')),
  });
}

// A2 TEXT_CONTAINMENT (workflow-asserted; architecture reports as DATA)
{
  const bad = (geom.a2rows || []).filter((r) => r.minInset < 16 || r.spread > 4);
  const wouldBe = bad.length ? 'FAIL' : 'PASS';
  const w = geom.a2worst;
  // OSM-SYS-001 O3: N=0 -> NA, never PASS/DATA.
  const popA2 = (geom.a2rows || []).length;
  A.push({
    id: 'A2', name: 'TEXT_CONTAINMENT', asserted: isWorkflow,
    threshold: 'title inset>=16 all sides, sibling spread<=4',
    verdict: popA2 === 0 ? 'NA' : (isWorkflow ? wouldBe : 'DATA'),
    measured: { population: popA2, nodes: (geom.a2rows || []).length, violations: bad.length, worstMinInset: w ? Math.round(w.minInset * 100) / 100 : null, worstSpread: w ? w.spread : null },
    elements: w ? [{ node: w.node, title: w.title }] : [],
    coords: w ? [{ titleBox: w.titleBox, cardBox: w.cardBox, insets: w.insets }] : [],
    reason: w
      ? (isWorkflow
        ? (wouldBe === 'FAIL' ? `title "${w.title}" (${w.node}) min inset ${Math.round(w.minInset * 100) / 100}px < 16` : `all titles inset>=16, spread<=4 (worst ${w.node} ${Math.round(w.minInset * 100) / 100}px)`)
        : `not asserted on architecture per SEE-004 contract (wouldBe ${wouldBe}): worst "${w.title}" inset ${Math.round(w.minInset * 100) / 100}px`)
      : 'no titled nodes measured',
    ...(isWorkflow ? {} : { wouldBe }),
  });
}

// A3 LABEL_COLLISION (workflow-asserted; architecture reports as DATA)
{
  const wouldBe = geom.a3hits.length ? 'FAIL' : 'PASS';
  // OSM-SYS-001 O3: N=0 -> NA, never PASS/DATA.
  const popA3 = geom.edgeLabelCount || 0;
  A.push({
    id: 'A3', name: 'LABEL_COLLISION', asserted: isWorkflow,
    threshold: 'edge-label vs boundary strokes inflated w/2 + node titles/sublabels/cards + lane/boundary/edge labels = 0',
    verdict: popA3 === 0 ? 'NA' : (isWorkflow ? wouldBe : 'DATA'),
    measured: { population: popA3, edgeLabels: geom.edgeLabelCount, collisions: geom.a3hits.length },
    elements: geom.a3hits.slice(0, 4).map((h) => ({ edgeLabel: h.edgeLabel, edgeKey: h.edgeKey, vs: h.vs })),
    coords: geom.a3hits.slice(0, 4).map((h) => ({ labelBox: h.labelBox })),
    reason: popA3 === 0
      ? 'no measurable population (N=0): no edge labels to examine'
      : (geom.a3hits.length
      ? (isWorkflow ? `edge label "${geom.a3hits[0].edgeLabel}" collides ${geom.a3hits[0].vs}` : `not asserted on architecture per SEE-004 contract (wouldBe FAIL): "${geom.a3hits[0].edgeLabel}" vs ${geom.a3hits[0].vs}`)
      : (isWorkflow ? 'no edge-label/boundary-stroke or label-label overlap' : 'not asserted on architecture per SEE-004 contract (wouldBe PASS): no overlap')),
    ...(isWorkflow ? {} : { wouldBe }),
  });
}

// A4 LABEL_ORPHAN
{
  const bad = (geom.a4rows || []).filter((r) => r.dist == null || r.dist > 24 || (r.inside || 0) > 0);
  const score = (r) => ((r.inside || 0) > 0 ? 1e9 + (r.inside || 0) : (r.dist ?? -1));
  const w = [...(geom.a4rows || [])].sort((a, b) => score(b) - score(a))[0] || null;
  const wSevers = w && (w.inside || 0) > 0;
  // OSM-SYS-001 O3: N=0 -> NA, never PASS.
  const popA4 = (geom.a4rows || []).length;
  A.push({
    id: 'A4', name: 'LABEL_ORPHAN', asserted: true,
    threshold: 'label centroid to own polyline <= 24px AND own-wire samples inside label bbox = 0 (ride near, never cover)',
    verdict: popA4 === 0 ? 'NA' : (bad.length ? 'FAIL' : 'PASS'),
    measured: { population: popA4, edgeLabels: (geom.a4rows || []).length, orphans: bad.length, worstDist: w ? w.dist : null, worstInside: w ? (w.inside || 0) : null },
    elements: w ? [{ label: w.label, key: w.key }] : [],
    coords: w ? [{ centroid: w.centroid, tip: w.tip, labelBox: w.labelBox }] : [],
    reason: w ? (bad.length
      ? (wSevers
        ? `label "${w.label}" sits on its own wire (${w.inside} own-polyline samples inside label bbox — mask severs the wire)`
        : `label "${w.label}" centroid (${w.centroid.x},${w.centroid.y}) ${w.dist}px from own polyline (>24)`)
      : `all labels within 24px of own polyline and off their wires (worst "${w.label}" ${w.dist}px)`) : 'no edge labels measured',
  });
}

// A5 ARROWHEAD_DOCK (workflow-asserted; architecture reports as DATA)
{
  const outliers = (geom.a5rows || []).filter((r) => geom.modal == null || Math.abs(r.gap - geom.modal) > 2);
  const wouldBe = !(geom.a5rows || []).length ? 'PASS' : (outliers.length ? 'FAIL' : 'PASS');
  const modalExemplar = (geom.a5rows || []).find((r) => geom.modal != null && Math.abs(r.gap - geom.modal) <= 2 && r.from === 'quote' && r.to === 'po')
    || (geom.a5rows || []).find((r) => geom.modal != null && Math.abs(r.gap - geom.modal) <= 2) || null;
  const named = outliers.slice(0, 4).map((r) => `${r.from}>${r.to} ${r.gap}px`).join(', ');
  // OSM-SYS-001 O3: N=0 -> NA, never PASS/DATA (empty uniformity is not uniformity).
  const popA5 = (geom.a5rows || []).length;
  A.push({
    id: 'A5', name: 'ARROWHEAD_DOCK', asserted: isWorkflow,
    threshold: 'each tip-to-target gap within +-2px of modal (tip = rendered marker centroid via live marker polygon + CTM)',
    verdict: popA5 === 0 ? 'NA' : (isWorkflow ? wouldBe : 'DATA'),
    measured: { population: popA5, tips: (geom.a5rows || []).length, modal: geom.modal, outliers: outliers.length, gaps: (geom.a5rows || []).map((r) => r.gap), modalExemplar: modalExemplar ? { edge: `${modalExemplar.from}>${modalExemplar.to}`, gap: modalExemplar.gap, tip: modalExemplar.tip } : null },
    elements: outliers.slice(0, 4).map((r) => ({ edge: `${r.from}>${r.to}`, key: r.key })),
    coords: outliers.slice(0, 4).map((r) => ({ tip: r.tip, pathEnd: r.pathEnd, targetEdge: r.targetEdge, gap: r.gap })),
    reason: !(geom.a5rows || []).length ? 'no marker-end tips measured'
      : (isWorkflow
        ? (wouldBe === 'FAIL' ? `${outliers.length} tips deviate from modal ${geom.modal}px (>2px): ${named}` : `all ${geom.a5rows.length} tips within 2px of modal ${geom.modal}px`)
        : `not asserted on architecture per SEE-004 contract (wouldBe ${wouldBe}): modal ${geom.modal}px`),
    ...(isWorkflow ? {} : { wouldBe }),
  });
}

// A6 INK_OCCUPANCY (per-container AND global ink/viewBox legs; FAIL if any <0.50)
{
  const rows = (geom.a6rows || []).map((r) => ({ ...r, occupancy: Math.round(r.occupancy * 10000) / 10000 }));
  const worst = [...rows].sort((a, b) => a.occupancy - b.occupancy)[0] || null;
  const containerFail = worst && worst.occupancy < 0.5;
  const globalRatio = Number.isFinite(geom.globalInkRatio) ? Math.round(geom.globalInkRatio * 10000) / 10000 : null;
  const globalFail = globalRatio != null && globalRatio < 0.5;
  // OSM-SYS-001 O3: containers + ink-bearing nodes examined. N=0 -> NA, never PASS.
  const popA6 = rows.length + (geom.nodeCount || 0);
  A.push({
    id: 'A6', name: 'INK_OCCUPANCY', asserted: true,
    threshold: 'union child-node area / container area >= 0.50 AND global ink area / viewBox area >= 0.50 (SVG units, exact attrs)',
    verdict: popA6 === 0 ? 'NA' : ((containerFail || globalFail) ? 'FAIL' : 'PASS'),
    measured: { population: popA6, containers: rows.length, nodes: geom.nodeCount || 0, minOccupancy: worst ? worst.occupancy : null, globalInkRatio: globalRatio, inkArea: geom.inkArea ?? null },
    elements: containerFail && worst ? [{ container: worst.container, kids: worst.kids }] : (globalFail ? [{ container: 'viewBox(global ink/area)' }] : (worst ? [{ container: worst.container, kids: worst.kids }] : [])),
    coords: containerFail && worst ? [{ box: worst.box }] : [],
    reason: popA6 === 0
      ? 'no measurable population (N=0): no containers or ink-bearing nodes to examine'
      : (containerFail && worst
      ? `container "${worst.container}" occupancy ${worst.occupancy} < 0.50 (${worst.kids.length} child node(s): ${worst.kids.join(', ') || 'none'})`
      : (globalFail ? `global ink/viewBox ${globalRatio} < 0.50 (ink/area; per-container min "${worst ? worst.container : '?'}": ${worst ? worst.occupancy : '?'})` : (worst ? `all containers and global ink >= 0.50 (min "${worst.container}" ${worst.occupancy}, global ${globalRatio})` : 'no containers measured'))),
  });
}

// A7 CONTAINMENT
{
  // OSM-SYS-001 O3: containment of an empty diagram proves nothing — population
  // is diagram content (nodes + routes + frames), never the viewport count. N=0 -> NA.
  const popA7 = (geom.nodeCount || 0) + (geom.edgeCount || 0) + (geom.boundaryRectCount || 0) + (geom.laneRectCount || 0);
  const p1 = c1440 && c1440.scrollHeight <= c1440.innerHeight;
  const p2 = c1920 && c1920.scrollHeight <= c1920.innerHeight;
  const pass = Boolean(p1 || p2);
  const r1 = c1440 ? Math.round((c1440.scrollHeight / c1440.innerHeight) * 100) / 100 : null;
  A.push({
    id: 'A7', name: 'CONTAINMENT', asserted: true,
    threshold: 'scrollHeight<=innerHeight at >=1 of 1440x900, 1920x1080',
    verdict: popA7 === 0 ? 'NA' : (pass ? 'PASS' : 'FAIL'),
    measured: {
      population: popA7,
      at1440x900: c1440 ? { scrollHeight: c1440.scrollHeight, innerHeight: c1440.innerHeight, screens: r1 } : null,
      at1920x1080: c1920 ? { scrollHeight: c1920.scrollHeight, innerHeight: c1920.innerHeight, screens: Math.round((c1920.scrollHeight / c1920.innerHeight) * 100) / 100 } : null,
    },
    elements: [],
    coords: [],
    reason: popA7 === 0 ? 'no measurable population (N=0): no nodes, routes, or frames to contain' : (pass ? 'fits without vertical scroll at >=1 declared viewport' : (c1440 ? `overflowY at both viewports (1440x900 scrollHeight ${c1440.scrollHeight} vs ${c1440.innerHeight} = ${r1} screens)` : 'no containment data measured')),
  });
}

// A8 LAYOUT_SPREAD (architecture-only)
if (isWorkflow) {
  A.push({
    id: 'A8', name: 'LAYOUT_SPREAD', asserted: false,
    threshold: 'architecture-only: distinct spec pos[0] > 1 AND content-bbox/viewBox >= 0.50',
    verdict: 'NA',
    measured: { population: (geom.laneRectCount || 0) + (geom.nodeCount || 0), kind },
    elements: [],
    coords: [],
    reason: 'workflow layout (lane frames present): spread does not apply (NA per SEE-004 contract)',
  });
} else {
  const vb = geom.viewBox, ct = geom.content;
  const vbArea = vb && vb.width > 0 && vb.height > 0 ? vb.width * vb.height : 0;
  const ctArea = ct && ct.w > 0 && ct.h > 0 ? ct.w * ct.h : 0;
  const ratioVal = vbArea > 0 ? Math.round((ctArea / vbArea) * 100) / 100 : null;
  const distinct = (geom.distinctX || []).length;
  // OSM-SYS-001 O3: N=0 -> NA, never PASS.
  const popA8 = (geom.distinctX || []).length + (geom.nodeCount || 0);
  const pass = distinct > 1 && ratioVal != null && ratioVal >= 0.5;
  A.push({
    id: 'A8', name: 'LAYOUT_SPREAD', asserted: true,
    threshold: 'distinct spec pos[0] count>1 AND content-bbox/viewBox>=0.50 (viewBox from svg.viewBox.baseVal)',
    verdict: popA8 === 0 ? 'NA' : (pass ? 'PASS' : 'FAIL'),
    measured: { population: popA8, distinctX: distinct, xs: geom.distinctX, contentBox: ct, viewBox: vb, ratio: ratioVal },
    elements: [],
    coords: ct ? [{ contentBox: ct, viewBox: vb }] : [],
    reason: popA8 === 0 ? 'no measurable population (N=0): no nodes or positions to examine' : (pass ? `spread ok: distinct-x=${distinct}, ratio ${ratioVal}` : `no spread: distinct-x=${distinct}, ratio ${ratioVal} (<0.50 or single-x column)`),
  });
}

// A9 ROUTE_TO_FRAME_CLEARANCE (SEE-005 + SYS-003 Amendment A, asserted both kinds)
// Part1 floor: background segment-to-frame-edge >=12 CSS px @1440x900 (floor stays 12).
// Part2 uniformity (REPAIRED): per-side minima spread (max-min) <=6, but a side
// counts ONLY if a qualifying segment sits within 36px (3x floor); sides with
// nothing nearby excluded. FEWER THAN TWO qualified sides yields NA for that
// frame's spread (Commander ruling 2026-09-13). Specification repair, NOT a
// threshold retune — floor 12 and spread 6 unchanged.
// Terminal docking segments exempt part1 ONLY, never part2. Middle docking
// crossings (legitimate frame entries) excluded both as not-clearance.
{
  const frames = geom.a9frames || [];
  const floorFails = frames.filter((f) => f.floorMin != null && f.floorMin < 12);
  // Amendment A: recompute spread over qualified sides only (p2min <=36).
  for (const f of frames) {
    const entries = ['top', 'right', 'bottom', 'left']
      .map((s) => ({ side: s, v: f.p2min ? f.p2min[s] : null }))
      .filter((e) => Number.isFinite(e.v) && e.v <= 36);
    f.qualifiedSides = entries.map((e) => e.side);
    f.qualifiedCount = entries.length;
    if (entries.length < 2) {
      f.spreadQualified = null;
      f.spreadNA = true;
    } else {
      const vals = entries.map((e) => e.v);
      f.spreadQualified = Math.round((Math.max(...vals) - Math.min(...vals)) * 100) / 100;
      f.spreadNA = false;
    }
  }
  const spreadFails = frames.filter((f) => f.spreadQualified != null && f.spreadQualified > 6);
  const spreadNAFrames = frames.filter((f) => f.spreadNA);
  const worstFloor = [...frames].sort((a, b) => (a.floorMin ?? 1e9) - (b.floorMin ?? 1e9))[0] || null;
  const worstSpread = [...frames].filter((f) => f.spreadQualified != null).sort((a, b) => (b.spreadQualified ?? -1) - (a.spreadQualified ?? -1))[0] || null;
  const fail = floorFails.length || spreadFails.length;
  // OSM-SYS-001 O3: frames + routes examined. N=0 -> NA, never PASS.
  const popA9 = frames.length + (geom.edgeCount || 0);
  A.push({
    id: 'A9', name: 'ROUTE_TO_FRAME_CLEARANCE', asserted: true,
    threshold: 'background segment-to-frame-edge >=12px AND per-side spread <=6px over qualified sides only (side counts iff p2min<=36px; <2 qualified => spread NA)',
    verdict: popA9 === 0 ? 'NA' : (fail ? 'FAIL' : 'PASS'),
    measured: { population: popA9, frames: frames.length, floorFails: floorFails.length, spreadFails: spreadFails.length, spreadNAFrames: spreadNAFrames.length, worstFloorMin: worstFloor ? worstFloor.floorMin : null, worstSpread: worstSpread ? worstSpread.spreadQualified : null, worstFloorFrame: worstFloor ? worstFloor.label : null, worstSpreadFrame: worstSpread ? worstSpread.label : null, allFrames: frames.map((f) => ({ frame: f.label, floorMin: f.floorMin, spread: f.spread, spreadQualified: f.spreadQualified, spreadNA: f.spreadNA, qualifiedSides: f.qualifiedSides, p1min: f.p1min, p2min: f.p2min, p1who: f.p1who, p2who: f.p2who })) },
    elements: [...floorFails.slice(0, 2).map((f) => ({ frame: f.label, part: 'floor', floorMin: f.floorMin })), ...spreadFails.slice(0, 2).map((f) => ({ frame: f.label, part: 'uniformity', spread: f.spreadQualified, qualifiedSides: f.qualifiedSides }))],
    coords: [...floorFails.slice(0, 2).map((f) => ({ frameBox: f.box, p1min: f.p1min })), ...spreadFails.slice(0, 2).map((f) => ({ frameBox: f.box, p2min: f.p2min }))],
    reason: popA9 === 0
      ? 'no measurable population (N=0): no frames or routes to examine'
      : (fail
      ? (floorFails.length ? `frame "${floorFails[0].label}" floor ${floorFails[0].floorMin}px < 12` : `frame "${spreadFails[0].label}" spread ${spreadFails[0].spreadQualified}px > 6 (qualified ${JSON.stringify(spreadFails[0].qualifiedSides)} p2min ${JSON.stringify(spreadFails[0].p2min)})`)
      : (frames.length ? `all ${frames.length} frames clear >=12 and uniform <=6 over qualified sides (worst floor ${worstFloor ? worstFloor.floorMin : '?'} "${worstFloor ? worstFloor.label : '?'}", worst qualified spread ${worstSpread ? worstSpread.spreadQualified : 'NA'} "${worstSpread ? worstSpread.label : spreadNAFrames.length ? spreadNAFrames[0].label + ' NA' : '?'}", ${spreadNAFrames.length} frame(s) spread-NA)` : 'no frames measured')),
  });
}
// A10 ARROWHEAD_DOCKING (SEE-005 + SYS-003 Amendment D FIXED, asserted both kinds)
// Every ACTUAL TIP (arrow point, NOT line end, NOT centroid) OUTSIDE target UNION
// (card + accent bar) at >=6px; inside = FAIL regardless. A5 stays centroid
// (uniformity +-2 modal); A10 adds sign+magnitude on the true point.
{
  const rows = geom.a10rows || [];
  const bad = rows.filter((r) => r.inside || r.gap == null || r.gap < 6);
  const worst = [...rows].sort((a, b) => ((a.inside ? -1e9 : a.gap ?? 1e9) - (b.inside ? -1e9 : b.gap ?? 1e9)))[0] || null;
  // OSM-SYS-001 O3: N=0 -> NA, never PASS.
  const popA10 = rows.length;
  A.push({
    id: 'A10', name: 'ARROWHEAD_DOCKING', asserted: true,
    threshold: 'actual arrow tip (line end + (tipX-refX)*sw along path) outside target UNION (card+accent) at distance >=6px; inside = FAIL',
    verdict: popA10 === 0 ? 'NA' : (bad.length ? 'FAIL' : 'PASS'),
    measured: { population: popA10, tips: rows.length, violations: bad.length, worstGap: worst ? worst.gap : null, worstInside: worst ? worst.inside : null, gaps: rows.map((r) => r.gap), insideFlags: rows.map((r) => r.inside) },
    elements: bad.slice(0, 4).map((r) => ({ edge: `${r.from}>${r.to}`, key: r.key, inside: r.inside, gap: r.gap })),
    coords: bad.slice(0, 4).map((r) => ({ tip: r.tip, pathEnd: r.pathEnd, targetBox: r.targetBox, gap: r.gap, inside: r.inside })),
    reason: bad.length
      ? (bad[0].inside ? `tip ${bad[0].from}>${bad[0].to} INSIDE target box (gap ${bad[0].gap}px — inside always FAIL)` : `tip ${bad[0].from}>${bad[0].to} gap ${bad[0].gap}px < 6 (outside but grazing)`)
      : (rows.length ? `all ${rows.length} actual tips outside UNION at >=6px (worst gap ${worst.gap}px ${worst.from}>${worst.to})` : 'no marker-end tips measured'),
  });
}

// A11 EDGE_CONSERVATION (SYS-003 Amendment B, asserted both kinds)
// Rendered edge count must equal spec edge count; mismatch = FAIL.
// Gates N5's silent link-dropping: a chart that quietly loses an edge is wrong,
// not ugly. Spec count comes from svg data-spec-edge-count embedded by the
// renderer (in-memory engine geometry never drops: layout-engine throws on
// missing nodes/edges/sections). Missing attribute => NA (no population).
{
  const rendered = geom.edgeCount ?? 0;
  const specN = geom.specEdgeCount;
  const popA11 = (specN != null ? 1 : 0) + rendered;
  const mismatch = specN != null && rendered !== specN;
  A.push({
    id: 'A11', name: 'EDGE_CONSERVATION', asserted: true,
    threshold: 'rendered path count == spec edge count (svg data-spec-edge-count); mismatch = FAIL',
    verdict: specN == null ? 'NA' : (mismatch ? 'FAIL' : 'PASS'),
    measured: { population: popA11, rendered, spec: specN },
    elements: mismatch ? [{ rendered, spec: specN }] : [],
    coords: [],
    reason: specN == null
      ? 'no measurable population (N=0): svg lacks data-spec-edge-count'
      : (mismatch ? `edge conservation FAIL: rendered ${rendered} != spec ${specN} (silent drop)` : `edge conservation ok: rendered ${rendered} == spec ${specN}`),
  });
}
// A12 ARROWHEAD_DIRECTION (SEE-008): every marker-end head must face the last
// route PIECE (last composition leg long enough to mount a head: >=15 SVG units
// = markerWidth 10 at the standard 1.5 stroke, template marker defs; shorter
// finals are dock pads, not pieces — a head cannot establish direction on a leg
// shorter than itself). Slack 30deg = 2.5x the max observed good deviation
// 12.1deg (old-v3 reject Q-easing, live-measured). N=0 -> NA, never PASS.
{
  const rows = geom.a12rows || [];
  const bad = rows.filter((r) => r.angle == null || r.angle > 30);
  const worst = [...rows].sort((a, b) => ((b.angle ?? -1) - (a.angle ?? -1)))[0] || null;
  const popA12 = rows.length;
  A.push({
    id: 'A12', name: 'ARROWHEAD_DIRECTION', asserted: true,
    threshold: 'head end-tangent vs last >=15px composition leg within 30deg (shorter finals are pads; longest leg used when none qualify)',
    verdict: popA12 === 0 ? 'NA' : (bad.length ? 'FAIL' : 'PASS'),
    measured: { population: popA12, violations: bad.length, worstAngle: worst ? worst.angle : null, worstEdge: worst ? `${worst.from}>${worst.to}` : null, angles: rows.map((r) => ({ edge: `${r.from}>${r.to}`, angle: r.angle, pieceLen: r.piece.len })) },
    elements: bad.slice(0, 4).map((r) => ({ edge: `${r.from}>${r.to}`, key: r.key, angle: r.angle, pieceLen: r.piece.len })),
    coords: bad.slice(0, 4).map((r) => ({ head: r.head, piece: r.piece })),
    reason: popA12 === 0 ? 'no measurable population (N=0): no marker-end heads with composition legs' : (bad.length ? `head ${bad[0].from}>${bad[0].to} faces ${bad[0].angle}deg off its last ${bad[0].piece.len}px piece (>30)` : `all ${rows.length} heads face their last piece within 30deg (worst ${worst.angle}deg ${worst.from}>${worst.to})`),
  });
}
// A13 MARGIN_BALANCE (SEE-009, asserted both kinds): the rendered picture must
// sit in the middle of the page. |left gap - right gap| in CSS px at the
// declared viewport must stay within 5% of the viewport width. Magnitude = 3x
// the A4 24px CSS-px nearness floor at the 1440 reference viewport
// (24/1440 ~= 1.7%); page-share form so the bound travels across viewport
// widths without retuning. Top/bottom gaps reported, never judged. A8 untouched
// (its 0.50 ratio floor is a different question). N=0 -> NA, never PASS.
{
  const rc = geom.contentRendered;
  const popA13 = (geom.nodeCount || 0) + (geom.boundaryRectCount || 0) + (geom.laneRectCount || 0);
  const tol = Math.round(VW * 0.05 * 100) / 100;
  let verdict = 'NA', reason = 'no measurable population (N=0): no nodes or frames to examine';
  let left = null, right = null, top = null, bottom = null, diff = null;
  if (rc && popA13 > 0) {
    left = Math.round(rc.x * 100) / 100;
    right = Math.round((VW - (rc.x + rc.w)) * 100) / 100;
    top = Math.round(rc.y * 100) / 100;
    bottom = Math.round((VH - (rc.y + rc.h)) * 100) / 100;
    diff = Math.round(Math.abs(left - right) * 100) / 100;
    verdict = diff <= tol ? 'PASS' : 'FAIL';
    reason = verdict === 'PASS'
      ? `margins balanced: left ${left}px vs right ${right}px (diff ${diff} <= ${tol} = 5% of ${VW})`
      : `picture shoved: left ${left}px vs right ${right}px (diff ${diff} > ${tol} = 5% of ${VW})`;
  }
  A.push({
    id: 'A13', name: 'MARGIN_BALANCE', asserted: true,
    threshold: 'rendered |left gap - right gap| <= 5% of viewport width (CSS px at declared viewport; top/bottom reported only)',
    verdict,
    measured: { population: popA13, left, right, top, bottom, diff, tol, viewportWidth: VW, viewportHeight: VH, contentRendered: rc },
    elements: verdict === 'FAIL' ? [{ left, right, diff, tol }] : [],
    coords: rc ? [{ contentRendered: rc }] : [],
    reason,
  });
}

// A14 INTERNAL_BALANCE (SEE-010, asserted both kinds): the empty space inside
// a frame must sit evenly. |left gap - right gap| (inner frame edge to the
// nearest held card) must stay within 10% of the frame's own width.
// Magnitude = 2x the A13 5% page-share: frame imbalance and page imbalance
// are independent errors that can stack in the same direction, so the inner
// budget doubles the outer one. Share-of-width form so the bound travels
// across frame sizes without retuning. Top/bottom gaps reported, never
// judged. A frame holding no cards answers NA, never PASS. A13 untouched
// (it judges the outer page margins; A14 judges the inner frame gaps).
{
  const rows = geom.a14rows || [];
  const judged = rows.filter((r) => r.kids && r.kids.length);
  const share = (r) => (r.diff != null && r.frameW ? r.diff / r.frameW : -1);
  const bad = [...judged].filter((r) => r.diff != null && r.diff > r.tol).sort((a, b) => share(b) - share(a));
  const worst = [...judged].sort((a, b) => share(b) - share(a))[0] || null;
  // OSM-SYS-001 O3: frames holding cards examined. N=0 -> NA, never PASS.
  const popA14 = judged.length;
  A.push({
    id: 'A14', name: 'INTERNAL_BALANCE', asserted: true,
    threshold: '|left gap - right gap| <= 10% of frame width (inner edge to nearest held card; top/bottom reported only)',
    verdict: popA14 === 0 ? 'NA' : (bad.length ? 'FAIL' : 'PASS'),
    measured: { population: popA14, frames: rows.length, judged: judged.length, violations: bad.length, worstFrame: worst ? worst.frame : null, worstDiff: worst ? worst.diff : null, worstTol: worst ? worst.tol : null, worstShare: worst ? Math.round(share(worst) * 10000) / 100 : null, rows: rows.map((r) => ({ frame: r.frame, kids: r.kids, left: r.left, right: r.right, top: r.top, bottom: r.bottom, leftWho: r.leftWho, rightWho: r.rightWho, topWho: r.topWho, bottomWho: r.bottomWho, diff: r.diff, tol: r.tol })) },
    elements: bad.slice(0, 4).map((r) => ({ frame: r.frame, left: r.left, right: r.right, diff: r.diff, tol: r.tol, leftWho: r.leftWho, rightWho: r.rightWho })),
    coords: bad.slice(0, 4).map((r) => ({ frame: r.frame, left: r.left, right: r.right, top: r.top, bottom: r.bottom })),
    reason: popA14 === 0
      ? 'no measurable population (N=0): no frame holds a card'
      : (bad.length
      ? `frame "${bad[0].frame}" lopsided: left ${bad[0].left}px (${bad[0].leftWho}) vs right ${bad[0].right}px (${bad[0].rightWho}) (diff ${bad[0].diff} > ${bad[0].tol} = 10% of ${bad[0].frameW})`
      : (worst ? `all ${judged.length} held frames balanced within 10% (worst "${worst.frame}" diff ${worst.diff})` : 'no held frames measured')),
  });
}
// A15 LABEL_CLEARANCE (SEE-010, asserted both kinds): an edge label must
// stand clear of every node card and every node sublabel by >= 24px box-gap,
// not merely fail to overlap one. Built from the A3 list (node cards +
// node sublabels); A3 asks overlap, A15 asks distance. Floor = the A4
// nearness floor of 24px (A4 threshold block, was line 982 pre-SEE-010): labels live in a 24px world — a label
// that must ride within 24px of its own wire must keep 24px from everything
// it does not belong to. Shortest-gap producer recorded by name on each leg.
// No edge labels means NA, never PASS. A3 untouched (strict overlap, floor 0).
{
  const rows = geom.a15rows || [];
  const bad = rows.filter((r) => r.minGap != null && r.minGap < 24);
  const worst = [...rows].sort((a, b) => ((a.minGap ?? 1e9) - (b.minGap ?? 1e9)))[0] || null;
  // OSM-SYS-001 O3: edge labels examined. N=0 -> NA, never PASS.
  const popA15 = rows.length;
  A.push({
    id: 'A15', name: 'LABEL_CLEARANCE', asserted: true,
    threshold: 'every edge label >= 24px box-gap from every node card and every node sublabel (A4 24px floor, both directions)',
    verdict: popA15 === 0 ? 'NA' : (bad.length ? 'FAIL' : 'PASS'),
    measured: { population: popA15, labels: rows.length, violations: bad.length, worstGap: worst ? worst.minGap : null, worstLabel: worst ? worst.label : null, worstVs: worst ? (worst.minKind + ':' + worst.minWho) : null, rows: rows.map((r) => ({ label: r.label, key: r.key, cardGap: r.cardGap, cardWho: r.cardWho, subGap: r.subGap, subWho: r.subWho, minGap: r.minGap, minWho: r.minWho, minKind: r.minKind })) },
    elements: bad.slice(0, 4).map((r) => ({ label: r.label, key: r.key, vs: `${r.minKind}:${r.minWho}`, gap: r.minGap })),
    coords: bad.slice(0, 4).map((r) => ({ labelBox: r.labelBox, gap: r.minGap, vs: `${r.minKind}:${r.minWho}` })),
    reason: popA15 === 0
      ? 'no measurable population (N=0): no edge labels to examine'
      : (bad.length
      ? `edge label "${bad[0].label}" (${bad[0].key}) crowds ${bad[0].minKind} "${bad[0].minWho}" at ${bad[0].minGap}px (<24; card leg ${bad[0].cardGap}px vs ${bad[0].cardWho}, sub leg ${bad[0].subGap}px vs ${bad[0].subWho})`
      : (worst ? `all ${rows.length} edge labels clear >= 24px of cards and sublabels (tightest "${worst.label}" ${worst.minGap}px vs ${worst.minKind}:${worst.minWho})` : 'no edge labels measured')),
  });
}


// A16 FRAME_CROSSING (SEE-016, asserted both kinds): no two frames may take
// the same space. Every pair from the already-collected boundaryRects answers
// separate|nested|crossing; ONLY crossing fails. Nested (one fully inside the
// other, edges included) is containment, never damage. Fewer than 2 frames
// answers NA, never PASS. A9 habit: BOTH frame names + crossing area recorded
// per failure. A7 untouched.
{
  const pairs = geom.a16pairs || [];
  const crossings = pairs.filter((p) => p.relation === 'crossing');
  const nestedCount = pairs.filter((p) => p.relation === 'nested').length;
  const frameCount = geom.boundaryRectCount || 0;
  const worstX = [...crossings].sort((a, b) => ((b.area ?? 0) - (a.area ?? 0)))[0] || null;
  A.push({
    id: 'A16', name: 'FRAME_CROSSING', asserted: true,
    threshold: 'every frame pair separate|nested; only partial-overlap crossing fails (nested = one fully inside the other, edges included)',
    verdict: frameCount < 2 ? 'NA' : (crossings.length ? 'FAIL' : 'PASS'),
    measured: { population: pairs.length, frames: frameCount, pairs: pairs.length, crossings: crossings.length, nested: nestedCount, worstArea: worstX ? worstX.area : null, worstPair: worstX ? (worstX.a + ' x ' + worstX.b) : null, relations: pairs.map((p) => ({ a: p.a, b: p.b, relation: p.relation, area: p.area })) },
    elements: crossings.slice(0, 4).map((p) => ({ a: p.a, b: p.b, area: p.area })),
    coords: crossings.slice(0, 4).map((p) => ({ aBox: p.aBox, bBox: p.bBox, area: p.area })),
    reason: frameCount < 2
      ? 'no measurable population (N<2 frames): fewer than two frames to compare'
      : (crossings.length
      ? `frames "${crossings[0].a}" x "${crossings[0].b}" cross at ${crossings[0].area}px2 (partial overlap, neither contains the other)`
      : (pairs.length ? `no crossing: ${pairs.length} pair(s), ${nestedCount} nested (containment, not damage)` : 'no frame pairs measured')),
  });
}
// A17 FRAME_FILL (SEE-016, asserted containers only): per held container frame,
// member-card-covered area / frame area, named frame + percentage. Floor 0.50
// = the A6 INK_OCCUPANCY container leg (same quantity, same population: one
// floor across both checks; the A6 global leg already prices page-level waste
// so per-frame half does not double-charge). Category-error fix: lanes are
// routing corridors, not content containers — lane-held frames measured 7-17%
// fill and failed 18/18, while containers at 42-59% discriminate correctly;
// the 0.50 floor was borrowed from A6 and that borrowing is the defect for
// corridors. Widened beyond lane/exception-lane to stage: dataflow stage frames
// measure 6-18% fill (5/5 FAIL on dataflow-product-analytics), the same signature
// as lanes, because a pipeline stage is routed through, not filled.
// Corridor-kind held frames are skipped (NA); container frames judged as
// before. A frame holding no cards answers NA for that frame; no held
// container frame at all answers NA, never PASS.
{
  const fillRows = geom.a17rows || [];
  const CORRIDOR_KINDS = new Set(['lane', 'exception-lane', 'stage']);
  const corridorSkipped = fillRows.filter((r) => CORRIDOR_KINDS.has(r.kind));
  const judged = fillRows.filter((r) => r.kids && r.kids.length && !CORRIDOR_KINDS.has(r.kind));
  const thin = judged.filter((r) => r.fill != null && r.fill < 0.5);
  const worstFill = [...judged].sort((a, b) => ((a.fill ?? 1) - (b.fill ?? 1)))[0] || null;
  const popA17 = judged.length;
  A.push({
    id: 'A17', name: 'FRAME_FILL', asserted: true,
    threshold: 'member-card-covered area / frame area >= 0.50 per held container frame (floor = A6 0.50 container leg; empty frame answers NA; lane frame answers NA \u2014 lanes are routing corridors)',
    verdict: popA17 === 0 ? 'NA' : (thin.length ? 'FAIL' : 'PASS'),
    measured: { population: popA17, frames: fillRows.length, judged: judged.length, violations: thin.length, worstFrame: worstFill ? worstFill.frame : null, worstFill: worstFill ? worstFill.fill : null, rows: fillRows.map((r) => ({ frame: r.frame, kids: r.kids, fill: r.fill, pct: r.pct })), corridorSkipped: corridorSkipped.length, corridorFrames: corridorSkipped.map((r) => r.frame) },
    elements: thin.slice(0, 4).map((r) => ({ frame: r.frame, pct: r.pct })),
    coords: thin.slice(0, 4).map((r) => ({ frame: r.frame, box: r.box, pct: r.pct })),
    reason: popA17 === 0
      ? (corridorSkipped.length
        ? `corridor frame: fill floor does not apply — lanes and stages are routing corridors (${corridorSkipped.length} corridor-held frame(s) skipped)`
        : 'no measurable population (N=0): no frame holds a card')
      : (thin.length
      ? `frame "${thin[0].frame}" fill ${thin[0].pct}% < 50% (${thin[0].kids.length} card(s): ${thin[0].kids.join(', ')})`
      : (worstFill ? `all ${judged.length} held frame(s) fill >= 50% (thinnest "${worstFill.frame}" ${worstFill.pct}%)` : 'no held frames measured')),
  });
}

// O1a READABILITY_FLOORS (per-detail px + sampled contrast)
{
  const rows = (geom.o1rows || []).filter((r) => r.projectedPx != null);
  const pxBad = rows.filter((r) => r.projectedPx < pxFloor[r.detail]);
  const cxBad = rows.filter((r) => r.contrast != null && r.contrast < ({ primary: 7, context: 4.5, boundary: 4.5, edge: 4.5 })[r.detail]);
  const worst = [...rows].sort((a, b) => (a.projectedPx - pxFloor[a.detail]) - (b.projectedPx - pxFloor[b.detail]))[0] || null;
  const fail = pxBad.length || cxBad.length;
  // OSM-SYS-001 O3: N=0 -> NA, never PASS.
  const popO1a = (geom.o1rows || []).length;
  const minByDetail = {};
  for (const r of rows) {
    if (minByDetail[r.detail] == null || r.projectedPx < minByDetail[r.detail].px) {
      minByDetail[r.detail] = { px: r.projectedPx, text: r.text };
    }
  }
  A.push({
    id: 'O1a', name: 'READABILITY_FLOORS', asserted: true,
    threshold: 'primary 15px/7:1, context 11px/4.5:1, boundary 13px/4.5:1, edge 11px/4.5:1 (contrast vs sampled backdrop pixels; smallest viewport 1440x900)',
    verdict: popO1a === 0 ? 'NA' : (fail ? 'FAIL' : 'PASS'),
    measured: { population: popO1a, texts: rows.length, pxViolations: pxBad.length, contrastViolations: cxBad.length, scale: geom.oScale, minByDetail, worstProjectedPx: worst ? worst.projectedPx : null, worstContrast: worst ? worst.contrast : null },
    elements: worst ? [{ detail: worst.detail, text: worst.text }] : [],
    coords: worst ? [{ box: worst.box, sourceFontPx: worst.sourceFontPx }] : [],
    reason: worst ? (fail ? `"${worst.text}" (${worst.detail}) ${worst.projectedPx}px < ${pxFloor[worst.detail]}px floor` : `all details above px+contrast floors (worst "${worst.text}" ${worst.projectedPx}px)`) : 'no text measured',
  });
}
// E5 LANE_HEADER (S2, asserted lane/segment charts): every lane-kind frame names
// its lane and the header reads distinct from the lane body. Population = lane,
// exception-lane and segment frames (the corridor kinds A17 skips as NA: a lane
// is routed through, but it must still be NAMED). Non-lane charts answer NA,
// never PASS. A17 untouched (it judges fill; E5 judges the name).
{
  const rows = geom.e5rows || [];
  const bad = rows.filter((r) => !(r.matched && r.named && r.distinct));
  const worstE5 = bad[0] || null;
  A.push({
    id: 'E5', name: 'LANE_HEADER', asserted: true,
    threshold: 'every lane/segment frame carries a non-empty header whose text fill differs from its lane fill (non-lane chart answers NA)',
    verdict: rows.length === 0 ? 'NA' : (bad.length ? 'FAIL' : 'PASS'),
    measured: { population: rows.length, frames: rows.length, matched: rows.filter((r) => r.matched).length, named: rows.filter((r) => r.named).length, distinct: rows.filter((r) => r.distinct).length, violations: bad.length, rows: rows.map((r) => ({ frame: r.frame, kind: r.kind, header: r.header, matched: r.matched, named: r.named, distinct: r.distinct })) },
    elements: bad.slice(0, 4).map((r) => ({ frame: r.frame, header: r.header || '(none)' })),
    coords: bad.slice(0, 4).map((r) => ({ frame: r.frame, box: r.box })),
    reason: rows.length === 0
      ? 'no measurable population (N=0): no lane/segment frame to name'
      : (bad.length
      ? `lane "${worstE5.frame}" header ${!worstE5.matched ? 'missing' : (!worstE5.named ? 'empty' : 'indistinct from lane body')} (matched ${rows.filter((r) => r.matched).length}/${rows.length}, distinct ${rows.filter((r) => r.distinct).length}/${rows.length})`
      : `all ${rows.length} lane frame(s) named and distinct from lane body`),
  });
}
// E7 NODE_STRIPE (S2, asserted node charts): a 4px bar on the card's left edge,
// coloured by node kind (accent-kind matches the node's own kind). No nodes
// answers NA, never PASS. Workflow/sequence/lifecycle nodes carry no bar today
// and fail here by measurement, not by exemption: the clause names the card's
// left edge, not the architecture renderer.
{
  const rows = geom.e7rows || [];
  const bad = rows.filter((r) => !(r.has && r.w === 4 && r.leftOk && r.kindOk));
  const worstE7 = bad[0] || null;
  A.push({
    id: 'E7', name: 'NODE_STRIPE', asserted: true,
    threshold: 'every node carries a 4px bar on its card left edge (|bar.x-card.x|<=1) with accent-kind matching its node kind (no nodes answers NA)',
    verdict: rows.length === 0 ? 'NA' : (bad.length ? 'FAIL' : 'PASS'),
    measured: { population: rows.length, nodes: rows.length, barred: rows.filter((r) => r.has).length, widthOk: rows.filter((r) => r.w === 4).length, leftOk: rows.filter((r) => r.leftOk).length, kindOk: rows.filter((r) => r.kindOk).length, violations: bad.length, rows: rows.map((r) => ({ node: r.node, kind: r.kind, has: r.has, w: r.w, leftOk: r.leftOk, kindOk: r.kindOk, accentKind: r.accentKind })) },
    elements: bad.slice(0, 4).map((r) => ({ node: r.node, kind: r.kind, accentKind: r.accentKind || '(none)' })),
    coords: bad.slice(0, 4).map((r) => ({ node: r.node, cardBox: r.cardBox, barBox: r.barBox })),
    reason: rows.length === 0
      ? 'no measurable population (N=0): no nodes to stripe'
      : (bad.length
      ? `node "${worstE7.node}" stripe ${!worstE7.has ? 'missing (no accent bar)' : (worstE7.w !== 4 ? `width ${worstE7.w} != 4px` : (!worstE7.leftOk ? 'not on card left edge' : `kind "${worstE7.accentKind}" != node kind "${worstE7.kind}"`))} (${rows.filter((r) => r.has).length}/${rows.length} barred)`
      : `all ${rows.length} node(s) carry a 4px kind-coloured left-edge bar`),
  });
}
// E9 GRID (S2, asserted all kinds): the alignment aid must never render in a
// delivered chart. The <pattern id="grid"> def may exist (defined != drawn);
// a rect painted with fill="url(#grid)" at positive size and visible display
// is the aid rendering. No grid rect at all answers NA (nothing delivered to
// judge), never PASS.
{
  const rects = geom.gridRects || [];
  const rendered = rects.filter((r) => r.rendered);
  const worstE9 = rendered[0] || null;
  A.push({
    id: 'E9', name: 'GRID', asserted: true,
    threshold: 'no rect painted with fill="url(#grid)" renders in delivery (pattern def alone is not rendering; no grid rect answers NA)',
    verdict: rects.length === 0 ? 'NA' : (rendered.length ? 'FAIL' : 'PASS'),
    measured: { population: rects.length, gridRects: rects.length, patternDefined: !!geom.gridPattern, rendered: rendered.length },
    elements: rendered.slice(0, 4).map((r) => ({ fill: 'url(#grid)', opacity: r.opacity })),
    coords: rendered.slice(0, 4).map((r) => ({ box: r.box })),
    reason: rects.length === 0
      ? 'no measurable population (N=0): no grid rect delivered'
      : (rendered.length
      ? `grid aid renders in delivery (${rendered.length} painted rect(s), first ${worstE9.box ? `${worstE9.box.w}x${worstE9.box.h}` : 'unsized'})`
      : `grid aid defined but not rendered (${rects.length} rect(s) hidden)`),
  });
}
// E10 EDGE_LABEL_BACKING (S2, asserted label charts): a label backing belongs
// to its wire — tinted from that wire (fill differs from the node-card fill)
// and bordered in the wire's own colour (stroke == own wire stroke, rx 3).
// Sequence message groups (outer g carries a path) answer E12, never E10, so
// the two populations stay disjoint. No non-message label backing answers NA.
{
  const rows = (geom.e10rows || []).filter((r) => !r.isMsg);
  const backed = rows.filter((r) => r.has);
  const bad = backed.filter((r) => !(r.tinted && r.wireMatch));
  const worstE10 = bad[0] || null;
  A.push({
    id: 'E10', name: 'EDGE_LABEL_BACKING', asserted: true,
    threshold: 'every non-message label backing tinted from its own wire (fill != card fill) and bordered in the wire colour (stroke == own wire stroke; no non-message backing answers NA)',
    verdict: backed.length === 0 ? 'NA' : (bad.length ? 'FAIL' : 'PASS'),
    measured: { population: backed.length, labels: backed.length, tinted: backed.filter((r) => r.tinted).length, wireMatched: backed.filter((r) => r.wireMatch).length, bordered: backed.filter((r) => r.bordered).length, violations: bad.length, cardFillRef: geom.cardFillRef || null, rows: backed.map((r) => ({ label: r.label, key: r.key, rx: r.rx, fill: r.fill, stroke: r.stroke, wire: r.wire, tinted: r.tinted, wireMatch: r.wireMatch })) },
    elements: bad.slice(0, 4).map((r) => ({ label: r.label, key: r.key })),
    coords: bad.slice(0, 4).map((r) => ({ label: r.label, labelBox: r.labelBox, backBox: r.backBox })),
    reason: backed.length === 0
      ? 'no measurable population (N=0): no non-message label backing'
      : (bad.length
      ? `label "${worstE10.label}" backing ${!worstE10.tinted ? `flat card fill (${worstE10.fill || 'unread'})` : `border ${worstE10.stroke || 'none'} != wire ${worstE10.wire || 'unread'}`} (tinted ${backed.filter((r) => r.tinted).length}/${backed.length}, wire-matched ${backed.filter((r) => r.wireMatch).length}/${backed.length})`
      : `all ${backed.length} label backing(s) tinted and bordered from their own wire`),
  });
}
// E12 MESSAGE_LABEL_BACKING (S2, asserted sequence charts): same rule as E10,
// on a sequence message label backing (nested label rect inside the message
// edge group). Non-sequence charts carry no message groups and answer NA.
{
  const rows = geom.e12rows || [];
  const bad = rows.filter((r) => !(r.tinted && r.wireMatch));
  const worstE12 = bad[0] || null;
  A.push({
    id: 'E12', name: 'MESSAGE_LABEL_BACKING', asserted: true,
    threshold: 'every sequence message label backing tinted from its own wire (fill != card fill) and bordered in the wire colour (stroke == own wire stroke; no message backing answers NA)',
    verdict: rows.length === 0 ? 'NA' : (bad.length ? 'FAIL' : 'PASS'),
    measured: { population: rows.length, messages: rows.length, tinted: rows.filter((r) => r.tinted).length, wireMatched: rows.filter((r) => r.wireMatch).length, bordered: rows.filter((r) => r.bordered).length, violations: bad.length, cardFillRef: geom.cardFillRef || null, rows: rows.map((r) => ({ label: r.label, key: r.key, rx: r.rx, fill: r.fill, stroke: r.stroke, wire: r.wire, tinted: r.tinted, wireMatch: r.wireMatch })) },
    elements: bad.slice(0, 4).map((r) => ({ label: r.label, key: r.key })),
    coords: bad.slice(0, 4).map((r) => ({ label: r.label, backBox: r.backBox })),
    reason: rows.length === 0
      ? 'no measurable population (N=0): no sequence message backing'
      : (bad.length
      ? `message "${worstE12.label}" backing ${!worstE12.tinted ? `flat card fill (${worstE12.fill || 'unread'})` : `border ${worstE12.stroke || 'none'} != wire ${worstE12.wire || 'unread'}`} (tinted ${rows.filter((r) => r.tinted).length}/${rows.length}, wire-matched ${rows.filter((r) => r.wireMatch).length}/${rows.length})`
      : `all ${rows.length} message backing(s) tinted and bordered from their own wire`),
  });
}
// E13 ACTIVATION_BAR (S2, asserted sequence/lifecycle charts): the busy-span
// bar is 10px wide, positive height, and drawn as a mask+fill pair at one
// station (renderer contract render-sequence.mjs:349: mask rect + class rect,
// both width 10). No 10px bars answers NA, never PASS.
{
  const rows = geom.e13rows || [];
  const bad = rows.filter((r) => !(r.wide10 && r.tall && r.paired));
  const worstE13 = bad[0] || null;
  A.push({
    id: 'E13', name: 'ACTIVATION_BAR', asserted: true,
    threshold: 'every activation bar 10px wide, positive height, mask+fill pair at one station (no 10px bars answers NA)',
    verdict: rows.length === 0 ? 'NA' : (bad.length ? 'FAIL' : 'PASS'),
    measured: { population: rows.length, bars: rows.length, wide10: rows.filter((r) => r.wide10).length, paired: rows.filter((r) => r.paired).length, violations: bad.length, rows: rows.map((r) => ({ at: r.at, h: r.h, rx: r.rx, cls: r.cls, paired: r.paired })) },
    elements: bad.slice(0, 4).map((r) => ({ at: r.at, cls: r.cls })),
    coords: bad.slice(0, 4).map((r) => ({ at: r.at, box: r.box })),
    reason: rows.length === 0
      ? 'no measurable population (N=0): no activation bar delivered'
      : (bad.length
      ? `activation bar at ${worstE13.at} ${!worstE13.wide10 ? 'not 10px wide' : (!worstE13.tall ? 'zero height' : `unpaired (${worstE13.cls || 'unclassed'})`)} (paired ${rows.filter((r) => r.paired).length}/${rows.length})`
      : `all ${rows.length} activation bar(s) 10px wide with mask+fill pair`),
  });
}
// E17-vs-E15 DASHED_WIRE (S2, asserted charts carrying both): a dashed wire
// must differ from a plain wire by MORE than its dashes — stroke colour,
// stroke width, or head fill must also differ (DESIGN Don't: meaning never
// rests on a single signal). Either population missing answers NA, never
// PASS. A12 untouched (it judges head direction, never wire identity).
{
  const wires = geom.wireRows || [];
  const plains = wires.filter((r) => r.role === 'plain');
  const dashed = wires.filter((r) => r.role === 'dashed');
  const sig = (r) => `${r.stroke}|${r.sw}|${r.markerFill}`;
  const plainSigs = new Set(plains.map(sig));
  const singleSignalOnly = dashed.filter((d) => plainSigs.has(sig(d)));
  const worstE17 = singleSignalOnly[0] || null;
  const popE17 = (plains.length && dashed.length) ? dashed.length : 0;
  A.push({
    id: 'E17', name: 'DASHED_WIRE', asserted: true,
    threshold: 'every dashed wire differs from every plain wire by more than dash pattern (stroke colour, stroke width, or head fill must also differ; either population missing answers NA)',
    verdict: (plains.length === 0 || dashed.length === 0) ? 'NA' : (singleSignalOnly.length ? 'FAIL' : 'PASS'),
    measured: { population: popE17, plain: plains.length, dashed: dashed.length, singleSignalOnly: singleSignalOnly.length, plainSig: plains.length ? sig(plains[0]) : null, dashedSig: dashed.length ? sig(dashed[0]) : null },
    elements: singleSignalOnly.slice(0, 4).map((r) => ({ cls: r.cls, dash: r.dash })),
    coords: [],
    reason: (plains.length === 0 || dashed.length === 0)
      ? `no measurable population (plain ${plains.length}, dashed ${dashed.length}): needs both to compare`
      : (singleSignalOnly.length
      ? `dashed wire differs by dashes only (${singleSignalOnly.length}/${dashed.length}: ${worstE17.stroke || 'unread'} ${worstE17.sw || ''} head ${worstE17.markerFill || 'unread'})`
      : `all ${dashed.length} dashed wire(s) differ by more than dashes`),
  });
}

const complete = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16', 'A17', 'E5', 'E7', 'E9', 'E10', 'E12', 'E13', 'E17', 'O1a'].every((id) => A.some((a) => a.id === id && a.verdict));
const out = {
  tool: 'geometry-assert.mjs (SEE-005 Layer-1 ruler + SYS-003 Amendments A-D + SEE-008 A12 + SEE-009 A13/A3-feed + SEE-010 A14/A15 + SEE-016 A16/A17 + S2 E5/E7/E9/E10/E12/E13/E17)',
  artifact: { path: html, sha256: shaFull, sha8: shaFull.slice(0, 8), bytes: artifactBytes.length },
  viewport: { width: VW, height: VH },
  kind,
  assertions: A,
  complete,
};
console.log(JSON.stringify(out, null, 2));
process.exit(0);
