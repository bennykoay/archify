// geometry-gate.mjs — OSM-SYS-001 O2A: deliver/visual-check invoke the Layer-1
// ruler automatically. Non-zero signal on any asserted FAIL. `--no-gate` skips
// with gated:false stamped (visible, never silent).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Ruler lives beside the skill (tools/archify/scripts/), not inside archify/.
export const RULER_PATH = path.resolve(__dirname, '..', '..', 'scripts', 'geometry-assert.mjs');
export const GATE_VIEWPORT = '1440x900';

// Runs the ruler over one delivered HTML artifact. NEVER throws: transport or
// measurement failures report ok:false with transport:true so callers fail loud.
export function runGeometryGate(htmlPath) {
  let res;
  try {
    res = spawnSync(process.execPath, [RULER_PATH, htmlPath, '--viewport', GATE_VIEWPORT], { encoding: 'utf8' });
  } catch (error) {
    return { ok: false, transport: true, error: `geometry gate could not start the ruler: ${error.message}`, failures: [], verdicts: [] };
  }
  const stdout = typeof res.stdout === 'string' ? res.stdout : '';
  const jsonText = stdout.slice(stdout.indexOf('{'));
  let ruler = null;
  try {
    ruler = JSON.parse(jsonText);
  } catch {
    ruler = null;
  }
  if (res.status !== 0 || !ruler || ruler.complete !== true || !Array.isArray(ruler.assertions)) {
    const stderr = typeof res.stderr === 'string' ? res.stderr.trim().split('\n').slice(-3).join(' ') : '';
    return {
      ok: false,
      transport: true,
      error: `geometry gate transport/measurement failure (ruler exit ${res.status ?? 'unknown'})${stderr ? `: ${stderr}` : ''}`,
      failures: [],
      verdicts: [],
    };
  }
  // Only ASSERTED FAILs block delivery. DATA/NA/PASS never block; thresholds
  // live in the ruler (SYS-001 adjusts none).
  const failures = ruler.assertions
    .filter((a) => a && a.asserted === true && a.verdict === 'FAIL')
    .map((a) => a.id);
  return {
    ok: failures.length === 0,
    transport: false,
    error: null,
    failures,
    sha8: ruler.artifact ? ruler.artifact.sha8 : null,
    kind: ruler.kind || null,
    verdicts: ruler.assertions.map((a) => ({
      id: a.id,
      verdict: a.verdict,
      asserted: a.asserted === true,
      population: a.measured && typeof a.measured.population === 'number' ? a.measured.population : null,
    })),
  };
}
