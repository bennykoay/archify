#!/usr/bin/env node
// SEE-016 O3 byte-identical proof: sha256 every renderable chart before AND after O3
// (same renderer, only the preset layer changed). Renders post-O3 into after/.
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const before = join(here, 'before');
const after = join(here, 'after');
mkdirSync(after, { recursive: true });

const corpus = [
  'design-explore/sys003-einvoice-structure.architecture.json',
  'design-explore/sys003-org-structure.architecture.json',
  'archify/examples/web-app.architecture.json',
  'examples/archify-repo-grid.architecture.json',
];

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const rows = [];
for (const rel of corpus) {
  const slug = rel.replace(/[\/\\]/g, '__').replace(/\.architecture\.json$/, '');
  const b = join(before, slug + '.html');
  const o = join(after, slug + '.html');
  const src = join(root, rel);
  let exit = 0, err = '';
  try {
    execFileSync('node', ['archify/bin/archify.mjs', 'render', 'architecture', src, o, '--quality', 'showcase'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
  } catch (e) { exit = e.status ?? 1; err = String(e.stderr || e.message || e).split('\n').slice(0, 2).join(' | '); }
  const bh = existsSync(b) ? sha(b) : null;
  const ah = existsSync(o) ? sha(o) : null;
  rows.push({ spec: rel, exit, err, beforeSha: bh, afterSha: ah, identical: bh != null && bh === ah });
}
writeFileSync(join(here, 'hash-pairs.json'), JSON.stringify(rows, null, 2));
for (const r of rows) {
  console.log(`${r.spec} exit=${r.exit} identical=${r.identical}`);
  console.log(`  before: ${r.beforeSha}`);
  console.log(`  after:  ${r.afterSha}`);
  if (r.err) console.log(`  err: ${r.err}`);
}
