#!/usr/bin/env node
// Visual Lint Gate — OSM-SYS-001 O2A rewrite (2026-09-12).
// OSM-SEE-007 O2: readership hole closed — every declared surface value must
// also be READ by something (byte-equality alone stayed green while
// .c-region was transparent). New surface tokens mirrored the same way.
// The pre-SYS-001 gate hardcoded D:/OSM-KKSE paths and nodes===13 and guarded
// nothing shippable. This gate asserts the O1 system-default contract instead:
// one versioned token source (renderers/shared/system-tokens.mjs) drives
// template.html + renderers. Chrome-free and fast; the Layer-1 ruler gate
// (geometry) runs inside `deliver` / `visual-check` via bin/geometry-gate.mjs.
// Usage: node tools/archify/scripts/visual-lint-gate.mjs [--json] [--template <path>] [--tokens <path>]
// (--template/--tokens overrides exist for the readership demo: run the REAL
// gate binary against a fixture template). Exit 0 iff every check passes, 1 otherwise.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..', 'archify');
const tokenPathDefault = path.join(skillRoot, 'renderers', 'shared', 'system-tokens.mjs');
const templatePathDefault = path.join(skillRoot, 'assets', 'template.html');
const archRendererPath = path.join(skillRoot, 'renderers', 'architecture', 'render-architecture.mjs');
const gridPath = path.join(skillRoot, 'renderers', 'architecture', 'grid.mjs');

const opt = (k, d) => { const i = process.argv.indexOf(k); return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; };
const tokenPath = path.resolve(opt('--tokens', tokenPathDefault));
const templatePath = path.resolve(opt('--template', templatePathDefault));
const asJson = process.argv.includes('--json');
const fails = [];
const passes = [];
function check(name, ok, detail = '') {
  if (ok) passes.push(name);
  else fails.push(detail ? `${name} — ${detail}` : name);
}

const tokens = fs.readFileSync(tokenPath, 'utf8');
const template = fs.readFileSync(templatePath, 'utf8');
const arch = fs.readFileSync(archRendererPath, 'utf8');
const grid = fs.readFileSync(gridPath, 'utf8');

// 1. Token file is versioned and frozen.
const version = (tokens.match(/SYSTEM_TOKENS_VERSION = '([^']+)'/) || [])[1] || null;
check('token file versioned', version !== null, 'SYSTEM_TOKENS_VERSION missing');
check('token file frozen', tokens.includes('Object.freeze({') && tokens.includes('version: SYSTEM_TOKENS_VERSION'), 'not frozen');

// 2. Every Commander seed present at its approved value.
const seeds = [
  ['card width 260', /width: 260/],
  ['gutter empty 40', /empty: 40/],
  ['gutter route-through 56', /routeThrough: 56/],
  ['frame label above 34', /above: 34/],
  ['frame label below 14', /below: 14/],
  ['clearance route-to-frame 16', /routeToFrame: 16/],
  ['arrowhead tip-to-node 8', /tipToNode: 8/],
  ['arrowhead tip rule max(8, 5 * strokeWidth)', /max\(8, 5 \* strokeWidth\)/],
  ['context text 11', /context: 11/],
  ['boundary text 13', /boundary: 13/],
  ['region light f5f5f7', /regionLight: '#f5f5f7'/],
  ['region dark 2c2c2e', /regionDark: '#2c2c2e'/],
];
for (const [name, re] of seeds) check(`token ${name}`, re.test(tokens), 'seed missing or wrong value');

// 3. Template :root block mirrors the token file (single literal home).
const rootBlock = (template.match(/OSM-SYS-001 system tokens v([^\s]+)[\s\S]*?:root \{([\s\S]*?)\}/) || [])[0] || '';
check('template carries versioned :root token block', rootBlock.length > 0, 'block missing');
const mirrorVars = [
  ['--sys-card-width', '260px'], ['--sys-gutter-empty', '40px'],
  ['--sys-gutter-route-through', '56px'], ['--sys-frame-label-above', '34px'],
  ['--sys-frame-label-below', '14px'], ['--sys-clearance-route-to-frame', '16px'],
  ['--sys-arrowhead-tip-to-node', '8px'], ['--sys-type-context', '11px'],
  ['--sys-type-boundary', '13px'], ['--sys-surface-dark', '#1c1c1e'],
  ['--sys-surface-light', '#f5f5f7'], ['--sys-surface-tint', '#f2f2f7'],
  ['--sys-surface-region-light', '#f5f5f7'], ['--sys-surface-region-dark', '#2c2c2e'],
];
for (const [name, value] of mirrorVars) {
  check(`template mirrors ${name}=${value}`, rootBlock.includes(`${name}: ${value};`), 'mirror mismatch');
}

// 4. No literal surface declarations survive outside :root (was 10; O1: 0).
const templateNoRoot = template.replace(rootBlock, '');
const literalSurfaces = (templateNoRoot.match(/--bg-surface-primary: #/g) || []).length;
check('no literal --bg-surface-primary outside :root', literalSurfaces === 0, `found ${literalSurfaces}`);
const surfaceRefs = (templateNoRoot.match(/--bg-surface-primary: var\(--sys-surface-(dark|light|tint)\);/g) || []).length;
check('theme blocks derive surface via var()', surfaceRefs === 10, `found ${surfaceRefs}, want 10`);
const regionRefs = (templateNoRoot.match(/--region-fill: var\(--sys-surface-region-(light|dark)\);/g) || []).length;
check('theme blocks derive region-fill via var()', regionRefs === 10, `found ${regionRefs}, want 10`);

// 5. Renderers derive from the token module (no literal defaults beside it).
check('arch renderer imports SYSTEM_TOKENS', arch.includes("from '../shared/system-tokens.mjs'"), 'import missing');
const staleLiterals = [
  ['defaultW: 120', /defaultW: 120/], ['boundaryExtraBottom: 20', /boundaryExtraBottom: 20/],
  ['boundaryLabelClearance: 4,', /boundaryLabelClearance: 4,/], ['clearance = 2)', /clearance = 2\)/],
  ['minimumBridge = 16', /minimumBridge = 16/],
];
for (const [name, re] of staleLiterals) check(`arch renderer: no stale ${name}`, !re.test(arch), 'stale literal survives');
check('grid imports SYSTEM_TOKENS', grid.includes("from '../shared/system-tokens.mjs'"), 'import missing');
check('grid: no stale gapX 30', !/gapX: 30/.test(grid), 'stale literal survives');
check('grid: no stale cellW 130', !/cellW: 130/.test(grid), 'stale literal survives');

// 6. Declared surface values must be READ by something (OSM-SEE-007 O2).
// Byte-equality between the token file and :root proves nothing about the
// picture: both files were green while .c-region was transparent and the svg
// gap painted panel-white. Every --sys-surface-* var must be referenced via
// var() outside :root, and every theme surface var must keep at least one
// non-declaration reader (a fill/background/stroke outside its own `--x:` line).
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sysSurfaceNames = ['--sys-surface-dark', '--sys-surface-light', '--sys-surface-tint', '--sys-surface-region-light', '--sys-surface-region-dark'];
for (const name of sysSurfaceNames) {
  const reads = (templateNoRoot.match(new RegExp('var\\(' + escRe(name) + '[,)]', 'g')) || []).length;
  check(`surface ${name} is read via var()`, reads >= 1, `declared in :root but read ${reads}x outside it`);
}
const themeSurfaces = ['--bg-surface-primary', '--region-fill', '--lane-fill'];
for (const name of themeSurfaces) {
  const noDecl = templateNoRoot.split('\n').filter((ln) => !ln.includes(name + ':')).join('\n');
  const reads = (noDecl.match(new RegExp('var\\(' + escRe(name) + '[,)]', 'g')) || []).length;
  check(`theme surface ${name} has a picture reader`, reads >= 1, 'declared but never read outside its own declaration');
}
const ok = fails.length === 0;
const receipt = { ok, tool: 'visual-lint-gate.mjs (OSM-SYS-001)', tokenVersion: version, passes, fails, total: passes.length + fails.length };
if (asJson) {
  console.log(JSON.stringify(receipt, null, 2));
} else if (!ok) {
  console.error(`VISUAL LINT FAIL — ${fails.length} checks failed:`);
  for (const f of fails) console.error(`  X ${f}`);
  console.log(`pass ${passes.length}/${receipt.total}`);
} else {
  console.log(`VISUAL LINT PASS — ${passes.length}/${receipt.total} checks (tokens v${version})`);
}
process.exit(ok ? 0 : 1);
