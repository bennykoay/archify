#!/usr/bin/env node
// SEE-016 O2 before-ruler: run geometry-assert (with new A16/A17) over before/*.html,
// emit before-table.json + print the before table.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const before = join(here, 'before');
const files = readdirSync(before).filter((f) => f.endsWith('.html')).sort();
const rows = [];
for (const f of files) {
  const p = join(before, f);
  let json = null, exit = 0, err = '';
  try {
    const out = execFileSync('node', ['scripts/geometry-assert.mjs', p, '--viewport', '1440x900'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    json = JSON.parse(out);
  } catch (e) {
    exit = e.status ?? 1;
    err = String(e.stderr || e.message || e).split('\n').slice(0, 3).join(' | ');
    try { json = JSON.parse(String(e.stdout || '')); } catch { json = null; }
  }
  const byId = {};
  for (const a of (json?.assertions || [])) byId[a.id] = a;
  rows.push({
    file: f, exit, err,
    sha8: json?.artifact?.sha8, bytes: json?.artifact?.bytes,
    frames: json?.assertions?.find((a) => a.id === 'A16')?.measured?.frames ?? null,
    A16: byId.A16 ? { verdict: byId.A16.verdict, crossings: byId.A16.measured?.crossings, relations: byId.A16.measured?.relations } : null,
    A17: byId.A17 ? { verdict: byId.A17.verdict, rows: byId.A17.measured?.rows } : null,
    A9: byId.A9 ? { verdict: byId.A9.verdict, floorFails: byId.A9.measured?.floorFails, spreadFails: byId.A9.measured?.spreadFails } : null,
    all: (json?.assertions || []).map((a) => `${a.id}:${a.verdict}`).join(' '),
    complete: json?.complete ?? null,
  });
}
writeFileSync(join(here, 'before-table.json'), JSON.stringify(rows, null, 2));
for (const r of rows) {
  console.log(`### ${r.file} sha8=${r.sha8} bytes=${r.bytes} exit=${r.exit} complete=${r.complete}`);
  console.log(`ALL: ${r.all}`);
  if (r.A16) {
    console.log(`A16 ${r.A16.verdict} crossings=${r.A16.crossings}`);
    for (const p of (r.A16.relations || [])) console.log(`  ${p.a} x ${p.b}: ${p.relation} area=${p.area}`);
  }
  if (r.A17) {
    console.log(`A17 ${r.A17.verdict}`);
    for (const fr of (r.A17.rows || [])) console.log(`  ${fr.frame}: fill=${fr.fill} pct=${fr.pct}% kids=[${(fr.kids || []).join(',')}]`);
  }
  if (r.A9) console.log(`A9 ${r.A9.verdict} floorFails=${r.A9.floorFails} spreadFails=${r.A9.spreadFails}`);
  console.log('');
}
