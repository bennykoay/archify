#!/usr/bin/env node
// SEE-016 O2 corpus before-render: explicit list, pre-fix renders into sessions/OSM-SEE-016/before/.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); // sessions/OSM-SEE-016
const root = join(here, '..', '..'); // tools/archify
const before = join(here, 'before');
mkdirSync(before, { recursive: true });

// Explicit corpus: all renderable *.architecture.json excluding benchmarks/results + schemas.
// design-explore + archify/examples + examples + docs/gallery/sources + docs/cases +
// experiments/mco-showcase + archify/test/fixtures/v1-baseline as applicable.
// Hand-placed specs (pos keys) REFUSE under the SYS-003 ban — render attempted,
// refusal recorded; only position-free specs produce HTML.
const corpus = [
  'design-explore/sys003-einvoice-structure.architecture.json',
  'design-explore/sys003-org-structure.architecture.json',
  'design-explore/einvoice-order-flow-v3.architecture.json',
  'archify/examples/web-app.architecture.json',
  'archify/examples/brand-aware-delivery.architecture.json',
  'archify/examples/checkout-platform.base.architecture.json',
  'archify/examples/checkout-platform.head.architecture.json',
  'archify/examples/production-deployment.architecture.json',
  'archify/test/fixtures/v1-baseline/web-app.architecture.json',
  'archify/test/fixtures/v1-baseline/production-deployment.architecture.json',
  'examples/archify-repo.architecture.json',
  'examples/archify-repo-grid.architecture.json',
  'examples/maka-architecture.architecture.json',
  'examples/rag-pipeline.architecture.json',
  'docs/gallery/sources/web-app.architecture.json',
  'docs/gallery/sources/production-deployment.architecture.json',
  'docs/cases/mco-runtime.architecture.json',
  'experiments/mco-showcase/mco-runtime.architecture.json',
];

const rows = [];
for (const rel of corpus) {
  const src = join(root, rel);
  const slug = rel.replace(/[\/\\]/g, '__').replace(/\.architecture\.json$/, '');
  const out = join(before, slug + '.html');
  if (!existsSync(src)) { rows.push({ spec: rel, out: null, exit: 'missing' }); continue; }
  try {
    execFileSync('node', ['archify/bin/archify.mjs', 'render', 'architecture', src, out, '--quality', 'showcase'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
    rows.push({ spec: rel, out, exit: 0 });
  } catch (e) {
    const err = String(e.stderr || e.message || e).split('\n').slice(0, 3).join(' | ');
    rows.push({ spec: rel, out: null, exit: e.status ?? 1, err });
  }
}
console.log(JSON.stringify(rows, null, 2));
