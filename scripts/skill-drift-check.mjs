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
// OSM-SEE-017 miss A2. This was a list of three fixed phrases. It passed:
//   "`components[].pos` lets authors place cards by hand for pixel-perfect
//    results; prefer it when the engine looks off."
// A phrase list can never win -- there are unlimited ways to write the same bad
// advice. So the rule is inverted: a banned key may be NAMED anywhere, but the
// line that names it must also say it is banned. Mechanical, and it does not
// care how the advice is phrased.
const bannedKeys = [...new Set([...truth].map((t) => t.split('|')[2]))];
const BAN_WORDS = /\b(ban|bans|banned|never|forbidden|not allowed|refuse|refuses|rejected|remove it|must not|cannot|illegal|outlawed)\b/i;

// Only count a key that appears in code context -- backticked, or dotted onto a
// collection. Bare English words like "route" would otherwise fire constantly.
// Regex LITERALS, not strings. Written first with the RegExp constructor and
// plain quotes, where '\b' is a BACKSPACE character and '\w' is the letter w --
// the pattern could never match and miss A2 sailed straight through the patch
// meant to close it. Caught only by replaying the exact SEE-017 text.
const BACKTICK_SPAN = /`[^`\n]+`/g;
const DOTTED_FIELD  = /\b\w+\[\]\.\w+/g;
const namesBannedKey = (line) => {
  const spans = [...(line.match(BACKTICK_SPAN) || []), ...(line.match(DOTTED_FIELD) || [])];
  return spans.some((sp) => bannedKeys.some((k) => new RegExp(`(^|[^A-Za-z0-9_])${k}([^A-Za-z0-9_]|$)`).test(sp)));
};

const lines = ssrc.split('\n');
let inBannedSection = false;
lines.forEach((line, i) => {
  if (/^## /.test(line)) inBannedSection = /^## Banned geometry/.test(line);
  if (inBannedSection) return;              // the table is where bans are declared
  if (/^\s*(\||```)/.test(line)) return;    // table rows and fence markers
  if (!namesBannedKey(line)) return;
  if (BAN_WORDS.test(line)) return;         // names the key AND says it is banned
  note(`SKILL.md:${i + 1} names a banned key without saying it is banned: "${line.trim().slice(0, 90)}"`);
});

// --- 3b. the quoted error text must be the one the code actually throws ------
// OSM-SEE-017 miss A4. SKILL.md quoted an invented message and nothing noticed:
//   "Layout hint ignored (SYS-003): <type> <collection>[i] suggests \"<key>\""
// The skill's quote was never compared to the validator's. Now it is.
const vmsg = vsrc.match(/message:\s*`([^`]*Authored geometry[^`]*)`/);
if (!vmsg) {
  note(`cannot find the authored-geometry error template in ${VALIDATOR}`);
} else {
  // The literal stem, up to the first interpolation -- the part a human can quote.
  const stem = vmsg[1].split('${')[0].trim();
  if (!ssrc.includes(stem)) {
    note(`SKILL.md does not quote the real error text. The code throws: "${stem}"`);
  }
  // And no INVENTED variant may sit in the skill pretending to be it.
  for (const m of ssrc.matchAll(/^[^\n]*\(SYS-003\)[^\n]*$/gm)) {
    const line = m[0].trim();
    if (!line.includes(stem) && /(ignored|suggests|hint|warning|notice)/i.test(line)) {
      note(`SKILL.md quotes an error the code never throws: "${line.slice(0, 90)}"`);
    }
  }
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
console.log(`SKILL.md agrees with ${VALIDATOR}: ${truth.size} banned key(s) documented, error text quoted verbatim,
  no passage names a banned key without banning it, 3 gates present.
  Not checked: glyph tricks, case-folded key names, near-miss section headings (OSM-SEE-017 left untried).`);
