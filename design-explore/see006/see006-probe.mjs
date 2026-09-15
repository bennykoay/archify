#!/usr/bin/env node
// see006-probe.mjs — OSM-SEE-006: surface-rect probe for the colour gate.
// Zero-dep CDP (copies the tools/archify/scripts/geometry-assert.mjs transport:
// port picker 19341-19345, /json/version poll, Browser.close shutdown).
// Reads layout ONLY (getBoundingClientRect, DSF=1 CSS px = PNG pixels).
// Colours are never read here; colour-assert.mjs samples the saved PNG.
//
// Usage:
//   node tools/archify/design-explore/see006/see006-probe.mjs <delivered.html> --viewport WxH --out <json>
// Stdout: the spec JSON. Exit 1 on transport error.

import { spawn, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i > -1 && args[i + 1] ? args[i + 1] : d; };
const htmlArg = args.find((a) => !a.startsWith('--'));
if (!htmlArg) { console.error('usage: see006-probe.mjs <delivered.html> --viewport WxH --out <json>'); process.exit(1); }
const html = resolve(htmlArg);
const chromeFlag = (() => { const i = args.indexOf('--chrome'); return i > -1 && args[i + 1] ? args[i + 1] : ''; })();
const [VW, VH] = String(opt('--viewport', '1440x900')).split('x').map(Number);
const TIMEOUT = 30000;

function findChrome() {
  if (chromeFlag) return chromeFlag;
  try {
    const w = execSync('where chrome', { encoding: 'utf8' }).split(/\r?\n/).find(Boolean);
    if (w) return w.trim();
  } catch {}
  try {
    const w = execSync('where msedge', { encoding: 'utf8' }).split(/\r?\n/).find(Boolean);
    if (w) return w.trim();
  } catch {}
  return null;
}
const chrome = findChrome();
if (!chrome) { console.error('see006-probe: no Chrome/Chromium found'); process.exit(1); }

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

const profile = mkdtempSync(join(tmpdir(), 'see006-probe-'));
const PORT = await pickPort();
const child = spawn(chrome, [
  '--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1',
  `--window-size=${VW},${VH}`, `--remote-debugging-port=${PORT}`,
  '--remote-debugging-address=127.0.0.1', '--no-first-run',
  '--no-default-browser-check', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });
child.on('error', (e) => { console.error('see006-probe: spawn failed: ' + e.message); process.exit(1); });

let httpBase = '';
{
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) { await r.body.cancel().catch(() => {}); httpBase = `http://127.0.0.1:${PORT}`; break; }
    } catch {}
    if (Date.now() - t0 > 20000) { console.error('see006-probe: CDP port never answered'); try { child.kill(); } catch {} process.exit(1); }
    await new Promise((r) => setTimeout(r, 250));
  }
}
const cleanup = async () => {
  try { await send('Browser.close'); } catch {}
  try { ws.close(); } catch {}
  try { child.kill(); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  await new Promise((r) => setTimeout(r, 1200));
};

const fileUrl = 'file:///' + html.replace(/\\/g, '/') + '?theme=light';
let target;
try {
  target = await (await fetch(`${httpBase}/json/new?${encodeURIComponent(fileUrl)}`, { method: 'PUT' })).json();
} catch (e) { console.error('see006-probe: CDP new target failed: ' + e.message); try { child.kill(); } catch {} process.exit(1); }
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
  } catch (e) { console.error('see006-probe: onmessage: ' + e.message); }
};
const send = (method, params = {}) => new Promise((res, rej) => {
  const id = ++seq;
  pending.set(id, { res, rej, method });
  ws.send(JSON.stringify({ id, method, params }));
  setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error('cdp timeout: ' + method)); } }, TIMEOUT);
});
const evalJs = async (expression) => {
  const out = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (out.exceptionDetails) throw new Error('Runtime.evaluate: ' + (out.exceptionDetails.exception?.description || 'failed'));
  return out.result?.value;
};

try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false });
  {
    const t0 = Date.now();
    for (;;) {
      let n = -1, rs = '';
      try {
        n = await evalJs(`document.querySelectorAll('svg g[data-node-id]').length`);
        rs = await evalJs(`document.readyState`);
      } catch {}
      if (n > 0 || Date.now() - t0 > 20000) break;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  await evalJs(`(async () => {
    try { await document.fonts.ready.catch(() => {}); } catch (_) {}
    await new Promise((r) => setTimeout(r, 600));
    try { window.scrollTo(0, 0); } catch (_) {}
    return true;
  })()`);
} catch (e) { console.error('see006-probe: page ready failed: ' + e.message); await cleanup(); process.exit(1); }

// NOTE: no template literals inside the page fn (transported as source text).
const PAGE_FN = String.raw`(function () {
  var R = function (el) {
    var r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  var svg = document.querySelector('svg');
  var frames = Array.prototype.slice.call(document.querySelectorAll('rect[data-composition-frame-kind]')).map(function (r) {
    return { id: r.getAttribute('data-composition-frame-label') || r.getAttribute('data-composition-frame-id') || '', x: 0, y: 0, w: 0, h: 0, box: R(r) };
  }).map(function (f) { return { id: f.id, x: f.box.x, y: f.box.y, w: f.box.w, h: f.box.h }; });
  var cards = Array.prototype.slice.call(document.querySelectorAll('svg g[data-node-id]')).map(function (g) {
    return { id: g.getAttribute('data-node-id') || '', box: R(g) };
  }).filter(function (c) { return c.box.w > 0 && c.box.h > 0; }).map(function (c) {
    return { id: c.id, x: c.box.x, y: c.box.y, w: c.box.w, h: c.box.h };
  });
  var pills = Array.prototype.slice.call(document.querySelectorAll('g[data-graph-role="structural-frame-label"]')).map(function (g) {
    var r = R(g); return { x: r.x, y: r.y, w: r.w, h: r.h };
  }).filter(function (p) { return p.w > 0 && p.h > 0; });
  var overlays = [];
  ['header', '[role="toolbar"]', '.toolbar', '.legend', '[data-legend]', '#navigation-dock', '.dock', '.facts', '#facts-panel'].forEach(function (sel) {
    Array.prototype.slice.call(document.querySelectorAll(sel)).forEach(function (el) {
      var r = R(el);
      if (r.w > 0 && r.h > 0) overlays.push({ sel: sel, x: r.x, y: r.y, w: r.w, h: r.h });
    });
  });
  var sbox = svg ? R(svg) : { x: 0, y: 0, w: 0, h: 0 };
  return {
    svg: { x: sbox.x, y: sbox.y, w: sbox.w, h: sbox.h },
    frames: frames, cards: cards, pills: pills, overlays: overlays,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    scroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }
  };
})()`;

let spec;
try {
  spec = await evalJs(PAGE_FN);
} catch (e) { console.error('see006-probe: collect failed: ' + e.message); await cleanup(); process.exit(1); }

const shaFull = createHash('sha256').update(readFileSync(html)).digest('hex');
const out = {
  tool: 'see006-probe.mjs', html, sha256: shaFull,
  viewport: `${VW}x${VH}`, image: { width: VW, height: VH },
  ...spec,
};
const outArg = opt('--out', '');
if (outArg) { mkdirSync(dirname(resolve(outArg)), { recursive: true }); writeFileSync(resolve(outArg), JSON.stringify(out, null, 2) + '\n'); }
console.log(JSON.stringify(out, null, 2));
await cleanup();
