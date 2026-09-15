import { fileURLToPath } from 'node:url';
import { runVisualCheck } from '../../archify/bin/visual-check.mjs';

const r = await runVisualCheck({
  artifactPath: fileURLToPath(new URL('./sys002-spike_b9268876_r01.html', import.meta.url)),
  chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
});
console.log(`exitCode=${r.exitCode}`);
console.log(`shots=${JSON.stringify(r.receipt.captures.screenshots.map((s) => s.path || s))}`);
console.log(`contact=${r.receipt.captures.contactSheet}`);
