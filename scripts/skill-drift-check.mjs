#!/usr/bin/env node
// skill-drift-check.mjs — fail if SKILL.md disagrees with the code it describes.
//
// SKILL.md drifted into teaching the SYS-003-banned `pos` for months because
// nothing ever compared it to the validator. A rule with no check is a note,
// and notes rot. This is that check.
//
// Usage: node scripts/skill-drift-check.mjs   (exit 0 = agree, 1 = drift)

import { readFileSync } from 'node:fs';

const SKILL = 'archify/SKILL.md';
const VALIDATOR = 'archify/renderers/shared/validator.mjs';

const fail = [];
const note = (m) => fail.push(m);

// --- 1. truth: BANNED_GEOMETRY in the validator -----------------------------
const vsrc = readFileSync(VALIDATOR, 'utf8');
const vblock = vsrc.match(/const BANNED_GEOMETRY\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/);
if (!vblock) { console.error(`FAIL: BANNED_GEOMETRY not found in ${VALIDATOR}`); process.exit(1); }

const truth = new Set();
for (const line of vblock[1].split('\n')) {
  const m = line.match(/types:\s*\[([^\]]+)\].*?collection:\s*'([^']+)'.*?keys:\s*\[([^\]]+)\]/);
  if (!m) continue;
  const types = m[1].match(/'([^']+)'/g).map((s) => s.slice(1, -1));
  const keys  = m[3].match(/'([^']+)'/g).map((s) => s.slice(1, -1));
  for (const t of types) for (const k of keys) truth.add(`${t}|${m[2]}|${k}`);
}

// --- 2. claim: the table under "## Banned geometry" in SKILL.md -------------
const ssrc = readFileSync(SKILL, 'utf8');
const sec = ssrc.split(/^## /m).find((s) => s.startsWith('Banned geometry'));
if (!sec) { console.error(`FAIL: no "## Banned geometry" section in ${SKILL}`); process.exit(1); }

const claim = new Set();
for (const line of sec.split('\n')) {
  const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
  if (cells.length !== 3 || !cells[0].startsWith('`')) continue;
  const type = cells[0].replace(/`/g, '');
  const coll = cells[1].replace(/`/g, '');
  for (const k of cells[2].match(/`([^`]+)`/g) || []) claim.add(`${type}|${coll}|${k.replace(/`/g, '')}`);
}

for (const t of truth) if (!claim.has(t)) note(`SKILL.md does not document banned key: ${t}`);
for (const c of claim) if (!truth.has(c)) note(`SKILL.md documents a ban the code does not enforce: ${c}`);

// --- 3. no passage may present a banned key as usable ----------------------
const BANNED_TEACHING = [
  /full manual layout control/i,
  /apply at most one diagnosed geometry control/i,
  /before a diagnostic calls for one/i,
];
for (const re of BANNED_TEACHING) {
  const hit = ssrc.match(re);
  if (hit) note(`SKILL.md still teaches banned geometry: "${hit[0]}"`);
}

// --- 4. the gates must be present ------------------------------------------
for (const h of ['## Banned geometry', '## Where to save', '## Verify by looking']) {
  if (!ssrc.includes(h)) note(`SKILL.md is missing required section: ${h}`);
}

if (fail.length) {
  console.error(`SKILL DRIFT — ${fail.length} finding(s):`);
  for (const f of fail) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`SKILL.md agrees with ${VALIDATOR}: ${truth.size} banned key(s) documented, 3 gates present.`);
