#!/usr/bin/env node
// clip-zones.mjs — zone-crop seeing pipeline for delivered archify HTML.
// Zero npm dependencies: node stdlib only (child_process, fs, WebSocket, fetch)
// driving headless Chromium over CDP. No geometry math: zones are clipped
// from live SVG DOM bounding boxes (getBoundingClientRect).
//
// Usage:
//   node scripts/clip-zones.mjs <input.html> <out-dir> [--viewport 1600x1000]
//       [--pad 12] [--chrome "C:\path\chrome.exe"] [--timeout 30000]
//
// Zones (main diagram svg = the svg containing g[data-node-id]):
//   node:<id>      union bbox of text inside svg g[data-node-id]
//   lane:<label>   svg-direct text.t-dim header strips
//   boundary:<lbl> [data-boundary-label] header strips (when present)
//   strip:<suffix> full lane width (that lane's left edge to right edge) x header-text row y +/-12px (same suffix as its lane/boundary header zone)
//   edge:<from>-<to>  svg g[data-edge-label] with non-empty label (mask+text)
//   legend:<kind>  svg [data-legend-kind] chips
//   + full-view.png (whole viewport)
// Stdout: manifest JSON {input, viewport, zones:[{id,kind,label,bbox,file}]}.
// Exit 0 = manifest printed and every file written; anything else = exit 1.

import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const html = resolve(args[0] || '');
const outDir = resolve(args[1] || '');
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 && args[i + 1] ? args[i + 1] : d; };
const [VW, VH] = (opt('--viewport', '1600x1000')).split('x').map(Number);
const PAD = Number(opt('--timeout-pad', '0')) || Number(opt('--pad', '12'));
const TIMEOUT = Number(opt('--timeout', '30000'));

if (!html || !outDir) { console.error('usage: clip-zones.mjs <input.html> <out-dir> [opts]'); process.exit(1); }

function findChrome() {
  const flag = opt('--chrome', '');
  if (flag) return flag;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
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
const profile = mkdtempSync(join(tmpdir(), 'clip-zones-'));
// NOTE (Windows): chrome may daemonize on launch — child 'exit' is NOT failure.
// Readiness = CDP /json/version answering on our port; shutdown = Browser.close.
async function pickPort() {
  for (const p of [19341, 19342, 19343, 19344, 19345]) {
    try {
      const r = await fetch(`http://127.0.0.1:${p}/json/version`);
      if (!r.ok) return p;
      await r.body.cancel().catch(() => {});
      const v = await Promise.race([r.json(), new Promise((_, rej) => setTimeout(() => rej(new Error('t')), 3000))]).catch(() => null);
      if (!v || !v.Browser) return p; // occupied by non-browser: treat as free is wrong; skip
    } catch { return p; }
  }
  throw new Error('no free debug port in 19341-19345');
}
const PORT = await pickPort();
const child = spawn(chrome, [
  '--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1',
  `--window-size=${VW},${VH}`, `--remote-debugging-port=${PORT}`,
  '--remote-debugging-address=127.0.0.1', '--no-first-run',
  '--no-default-browser-check', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
child.on('error', (e) => { console.error('clip-zones: spawn failed: ' + e.message); process.exit(1); });
let httpBase = '';
{
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) { await r.body.cancel().catch(() => {}); httpBase = `http://127.0.0.1:${PORT}`; break; }
    } catch {}
    if (Date.now() - t0 > 20000) { console.error('clip-zones: CDP port never answered'); try { child.kill(); } catch {} process.exit(1); }
    await new Promise((r) => setTimeout(r, 250));
  }
}
const fileUrl = 'file:///' + html.replace(/\\/g, '/');
const target = await (await fetch(`${httpBase}/json/new?${encodeURIComponent(fileUrl)}`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('cdp connect failed')); });
let seq = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  try {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { res, rej, method } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result); }
  } catch (e) { console.error('clip-zones: onmessage: ' + e.message); }
};
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++seq; pending.set(id, { res, rej, method });
  ws.send(JSON.stringify({ id, method, params }));
  setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error('cdp timeout: ' + method)); } }, TIMEOUT);
});
const evalJs = async (fn, ...a) => (await send('Runtime.evaluate', {
  expression: `(${fn})(...${JSON.stringify(a)})`, returnByValue: true, awaitPromise: true,
})).result.value;

await send('Page.enable');
await evalJs(`async (timeout) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (document.querySelectorAll('svg g[data-node-id]').length > 0) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  window.scrollTo(0, 0);
  await document.fonts.ready.catch(() => {});
  await new Promise((r) => setTimeout(r, 800));
  return true;
}`, TIMEOUT);
const zones = await evalJs(`(VW, VH, PAD) => {
  const svgs = [...document.querySelectorAll('svg')];
  const main = svgs.find((s) => s.querySelector('g[data-node-id]')) || svgs[0];
  const safe = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const clamp = (b) => {
    const bw = (b.width !== undefined ? b.width : b.w), bh = (b.height !== undefined ? b.height : b.h);
    const x = Math.max(0, Math.floor(b.x - PAD)), y = Math.max(0, Math.floor(b.y - PAD));
    const w = Math.min(VW - x, Math.ceil(bw + PAD * 2)), h = Math.min(VH - y, Math.ceil(bh + PAD * 2));
    return { x, y, width: Math.max(1, w), height: Math.max(1, h) };
  };
  const union = (rs) => { const x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
    const x1 = Math.max(...rs.map((r) => r.x + (r.width !== undefined ? r.width : r.w))), y1 = Math.max(...rs.map((r) => r.y + (r.height !== undefined ? r.height : r.h)));
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }; };
  const out = [];
  main.querySelectorAll('g[data-node-id]').forEach((g) => {
    const id = g.getAttribute('data-node-id');
    const ts = [...g.querySelectorAll('text')].map(box).filter((b) => b.w > 0 && b.h > 0);
    if (!ts.length) return;
    out.push({ id: 'node-' + safe(id), kind: 'node-label', label: id, bbox: clamp(union(ts)) });
  });
  const laneFrames = [...main.querySelectorAll('rect[data-composition-frame-kind="lane"]')].map(box);
  const mainBox = box(main);
  const vclamp = (b) => {
    const bw = (b.width !== undefined ? b.width : b.w), bh = (b.height !== undefined ? b.height : b.h);
    const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y));
    const w = Math.min(VW - x, Math.ceil(bw)), h = Math.min(VH - y, Math.ceil(bh));
    return { x, y, width: Math.max(1, w), height: Math.max(1, h) };
  };
  // Strip band: full lane width (lane left edge to right edge) by header-text
  // row y +/-12px pad — NOT the text bbox. Container = the lane frame holding
  // the header row; fallback = nearest lane frame, then the main svg box.
  const stripFor = (t, suffix, label) => {
    const b = box(t);
    if (b.w <= 0 || b.h <= 0) return;
    const cy = b.y + b.h / 2;
    let lane = laneFrames.find((r) => cy >= r.y && cy <= r.y + r.h) || null;
    if (!lane && laneFrames.length) {
      let bd = 1e9;
      for (const r of laneFrames) { const d = Math.abs((r.y + r.h / 2) - cy); if (d < bd) { bd = d; lane = r; } }
    }
    const span = lane || mainBox;
    out.push({ id: 'strip-' + suffix, kind: 'strip', label, bbox: vclamp({ x: span.x, y: b.y - 12, w: span.w, h: b.h + 24 }) });
  };
  [...main.children].filter((e) => e.tagName === 'text' && (e.getAttribute('class') || '').split(' ').includes('t-dim'))
    .forEach((t) => { const b = box(t); if (b.w > 0 && b.h > 0) out.push({ id: 'lane-' + safe(t.textContent), kind: 'lane-header', label: t.textContent.trim(), bbox: clamp(b) }); });
  [...main.children].filter((e) => e.tagName === 'text' && (e.getAttribute('class') || '').split(' ').includes('t-dim'))
    .forEach((t) => stripFor(t, safe(t.textContent), t.textContent.trim()));
  main.querySelectorAll('[data-boundary-label]').forEach((e) => { const b = box(e);
    if (b.w > 0 && b.h > 0) out.push({ id: 'boundary-' + safe(e.getAttribute('data-boundary-label')), kind: 'boundary-header', label: e.getAttribute('data-boundary-label'), bbox: clamp(b) }); });
  main.querySelectorAll('[data-boundary-label]').forEach((e) => stripFor(e, safe(e.getAttribute('data-boundary-label')), e.getAttribute('data-boundary-label')));
  main.querySelectorAll('g[data-edge-label]').forEach((g) => {
    const lb = g.getAttribute('data-edge-label') || '';
    if (!lb) return;
    const b = box(g); if (b.w <= 0 || b.h <= 0) return;
    out.push({ id: 'edge-' + safe(g.getAttribute('data-edge-from') + '-' + g.getAttribute('data-edge-to')), kind: 'edge-label', label: lb, bbox: clamp(b) });
  });
  main.querySelectorAll('[data-legend-kind]').forEach((e) => { const b = box(e);
    if (b.w > 0 && b.h > 0) out.push({ id: 'legend-' + safe(e.getAttribute('data-legend-kind')), kind: 'legend-chip', label: e.getAttribute('data-legend-kind'), bbox: clamp(b) }); });
  return out;
}`, VW, VH, PAD);

mkdirSync(outDir, { recursive: true });
const shot = async (clip, scale) => Buffer.from((await send('Page.captureScreenshot', {
  format: 'png', clip, captureBeyondViewport: true, fromSurface: true,
})).data, 'base64');
const { writeFileSync: w } = await import('node:fs');
for (const z of zones) {
  const file = `${z.id}.png`;
  w(join(outDir, file), await shot({ ...z.bbox, scale: 2 }, 2));
  z.file = file;
}
w(join(outDir, 'full-view.png'), await shot({ x: 0, y: 0, width: VW, height: VH, scale: 1 }, 1));
try { await send('Browser.close'); } catch {}
ws.close();
try { child.kill(); } catch {}

console.log(JSON.stringify({ input: html, viewport: [VW, VH], zoneCount: zones.length, zones, fullView: 'full-view.png' }, null, 2));
