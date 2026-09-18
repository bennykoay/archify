#!/usr/bin/env node
// jev-shadow-log.mjs — Jev shadow sidecar under OSM-CONS-083 (objective ruler-jev-shadow, ALIENBEN).
// v2 NEUTRAL prompts: each state gives measurements + floors only (no verdict words); the noul
// question asks for the flag itself (noul>=0.5 = Jev flags FAIL). v1 LEAKED because each state
// asserted its verdict and the question asked agreement, so 8/8 agree proved nothing about screening.
// Jev flags every oracle chart, the ruler still runs on every chart, both verdicts logged side by side.
// NO SKIP LOGIC SHIPS in this file. The ruler runs on all 8 oracle cases at both viewports. Jev never signs off.
//
// EXIT CRITERION (text only — documented, NOT implemented):
//   A future skip-gated loop may ship only after zero false negatives on gap-type checks
//   (A9, A15, O1a) over 50-100 charts; math-type checks (A6) ALWAYS run the ruler regardless.
//   This sidecar implements no skipping, no vote, no gating.
//
// Oracle: D:/tmp/see015/sys003-AFTER.html (720715 B, sha8 8b7768fa per SEE-015 section O3).
// Jev endpoint: OpenRouter /api/alpha/decisions ONLY, model ~typesafe/jev-latest.
//   NEVER chat/completions (400s by design per Brief 125 section 1).
// Ruler: tools/archify/scripts/geometry-assert.mjs per SEE-015 O3 at 1440x900 and 2048x1320.
// Output: D:/tmp/see015/jev-shadow-8row.json — 8 rows, each with jev_score + ruler_verdict + gap/math tag.
//
// Gap/math tags come from ruler SOURCE LOGIC (floors in geometry-assert.mjs), not from scores:
//   A6  INK_OCCUPANCY        math-type — area occupancy ratio vs 0.50 (container + global legs, A6 block).
//   A9  ROUTE_TO_FRAME_CLEARANCE gap-type — px floor 12 (segment-to-frame-edge CSS px).
//   A15 LABEL_CLEARANCE      gap-type — px floor 24 (A4 24px box-gap floor).
//   O1a READABILITY_FLOORS   gap-type — px FLOOR { primary: 15, context: 11, boundary: 13, edge: 11 }
//                                        + contrast NEED { primary: 7, context/boundary/edge: 4.5 }.
//
// Auth: process.env.OPENROUTER_API_KEY (hydrate via ". D:/Onesimus/scripts/credman-loader.ps1").
// Zero npm dependencies: node stdlib only.

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RULER = join(HERE, 'geometry-assert.mjs');
const ORACLE = 'D:/tmp/see015/sys003-AFTER.html';
const OUT = 'D:/tmp/see015/jev-shadow-8row.json';
const ENDPOINT = 'https://openrouter.ai/api/alpha/decisions';
const MODEL = '~typesafe/jev-latest';

// 8 oracle cases: Brief 125 section 2 direction to reproduce (7 FAIL + O1a@2048 PASS).
// v2 NEUTRAL: each state states measurements + floors only — NO verdict words anywhere
// (no FAIL, PASS, fails, passes, violation, meets). Per-case question asks for the flag
// itself; noul>=0.5 means Jev flags FAIL.
const CASES = [
  { id: 'A6', viewport: '1440x900', tag: 'math-type',
    state: 'Chart sys003-AFTER.html at viewport 1440x900, check A6 INK_OCCUPANCY: container "Accounting" ink occupancy 0.2928; floor 0.50.',
    question: 'On these measurements alone, does this chart flag check A6 INK_OCCUPANCY?' },
  { id: 'A9', viewport: '1440x900', tag: 'gap-type',
    state: 'Chart sys003-AFTER.html at viewport 1440x900, check A9 ROUTE_TO_FRAME_CLEARANCE: frame "Sales" route-to-frame clearance floor minimum 4.13px; floor 12px.',
    question: 'On these measurements alone, does this chart flag check A9 ROUTE_TO_FRAME_CLEARANCE?' },
  { id: 'A15', viewport: '1440x900', tag: 'gap-type',
    state: 'Chart sys003-AFTER.html at viewport 1440x900, check A15 LABEL_CLEARANCE: edge label "mismatch retry cap 2" stands 2.32px from card "match" (sub-label leg 11.32px vs match:tally w/ supplier cap 2); floor 24px box-gap.',
    question: 'On these measurements alone, does this chart flag check A15 LABEL_CLEARANCE?' },
  { id: 'O1a', viewport: '1440x900', tag: 'gap-type',
    state: 'Chart sys003-AFTER.html at viewport 1440x900, check O1a READABILITY_FLOORS: text "Collect 6 facts" (primary) projects at 10.32px; primary floor 15px.',
    question: 'On these measurements alone, does this chart flag check O1a READABILITY_FLOORS?' },
  { id: 'A6', viewport: '2048x1320', tag: 'math-type',
    state: 'Chart sys003-AFTER.html at viewport 2048x1320, check A6 INK_OCCUPANCY: container "Accounting" ink occupancy 0.2928; floor 0.50.',
    question: 'On these measurements alone, does this chart flag check A6 INK_OCCUPANCY?' },
  { id: 'A9', viewport: '2048x1320', tag: 'gap-type',
    state: 'Chart sys003-AFTER.html at viewport 2048x1320, check A9 ROUTE_TO_FRAME_CLEARANCE: frame "Sales" route-to-frame clearance floor minimum 7.19px; floor 12px.',
    question: 'On these measurements alone, does this chart flag check A9 ROUTE_TO_FRAME_CLEARANCE?' },
  { id: 'A15', viewport: '2048x1320', tag: 'gap-type',
    state: 'Chart sys003-AFTER.html at viewport 2048x1320, check A15 LABEL_CLEARANCE: edge label "mismatch retry cap 2" stands 3.98px from card "match" (sub-label leg 20.17px vs match:tally w/ supplier cap 2); floor 24px box-gap.',
    question: 'On these measurements alone, does this chart flag check A15 LABEL_CLEARANCE?' },
  { id: 'O1a', viewport: '2048x1320', tag: 'gap-type',
    state: 'Chart sys003-AFTER.html at viewport 2048x1320, check O1a READABILITY_FLOORS: worst text "Collect 6 facts" projects at 15px; primary floor 15px; zero contrast-rule shortfalls recorded.',
    question: 'On these measurements alone, does this chart flag check O1a READABILITY_FLOORS?' },
];

function runRuler(viewport) {
  const r = spawnSync(process.execPath, [RULER, ORACLE, '--viewport', viewport], { encoding: 'utf8', timeout: 120000 });
  return { exit: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

async function askJev(state, question) {
  const t0 = Date.now();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, state, questions: { flag: { type: 'noul', instructions: question } } }),
  });
  const latencyMs = Date.now() - t0;
  const body = await res.json();
  if (!res.ok) throw new Error('decisions HTTP ' + res.status + ': ' + JSON.stringify(body).slice(0, 300));
  return { noul: body.answers.flag.noul, latencyMs, usage: body.usage, model: body.model, rawId: body.id };
}

const main = async () => {
  if (!process.env.OPENROUTER_API_KEY) { console.error('jev-shadow-log: OPENROUTER_API_KEY missing'); process.exit(1); }
  // 1. Ruler per SEE-015 O3 at both sizes — must exit 0, full verdict set, zero skips.
  const ruler = {};
  for (const vp of ['1440x900', '2048x1320']) {
    const r = runRuler(vp);
    if (r.exit !== 0) { console.error('jev-shadow-log: ruler exit ' + r.exit + ' @' + vp + '\n' + r.stderr.slice(0, 500)); process.exit(1); }
    const parsed = JSON.parse(r.stdout);
    ruler[vp] = { exit: r.exit, complete: parsed.complete, count: parsed.assertions.length, parsed };
  }
  // 2. Jev flags every case via /api/alpha/decisions; ruler verdicts read from the runs above.
  const rows = [];
  for (const c of CASES) {
    const a = ruler[c.viewport].parsed.assertions.find((x) => x.id === c.id);
    if (!a || !a.verdict) { console.error('jev-shadow-log: SKIP detected — no ruler verdict for ' + c.id + '@' + c.viewport); process.exit(1); }
    const j = await askJev(c.state, c.question);
    rows.push({
      case: c.id + '@' + c.viewport, check: c.id, viewport: c.viewport, tag: c.tag,
      ruler_verdict: a.verdict, ruler_reason: a.reason,
      jev_prompt_version: 'v2-neutral', jev_state: c.state, jev_question: c.question,
      jev_score: j.noul, jev_latency_ms: j.latencyMs,
      jev_input_tokens: j.usage?.input_tokens ?? null, jev_output_tokens: j.usage?.output_tokens ?? null,
      jev_cost_usd: j.usage?.cost ?? null, jev_model: j.model, jev_id: j.rawId,
    });
    console.log(`${c.id}@${c.viewport} [${c.tag}] ruler=${a.verdict} jev_noul=${j.noul} ${j.latencyMs}ms ${j.usage?.input_tokens}/${j.usage?.output_tokens} $${j.usage?.cost}`);
  }
  // 3. Zero-skip proof: 8/8 rows, every row carries jev_score + ruler_verdict + tag.
  const skips = rows.filter((r) => r.jev_score == null || !r.ruler_verdict || !r.tag);
  if (rows.length !== 8 || skips.length) { console.error('jev-shadow-log: SKIP detected — rows=' + rows.length); process.exit(1); }
  const doc = {
    tool: 'jev-shadow-log.mjs (OSM-CONS-083 ruler-jev-shadow)',
    prompt_version: 'v2-neutral (states: measurements + floors only; per-case flag question; noul>=0.5 = Jev flags FAIL)',
    oracle: { path: ORACLE, bytes: 720715, sha8: '8b7768fa' },
    endpoint: ENDPOINT, model_requested: MODEL,
    ruler: { exit_1440x900: ruler['1440x900'].exit, exit_2048x1320: ruler['2048x1320'].exit,
             complete_1440x900: ruler['1440x900'].complete, complete_2048x1320: ruler['2048x1320'].complete,
             assertions_1440x900: ruler['1440x900'].count, assertions_2048x1320: ruler['2048x1320'].count, skips: 0 },
    rows,
  };
  writeFileSync(OUT, JSON.stringify(doc, null, 2));
  console.log('wrote ' + OUT + ' rows=8 skips=0');
};

await main();
