// TEMPORARY DIAGNOSTIC -- investigating an intermittent CI flake where
// //#sync:core is sometimes entirely absent from a `turbo run build:pkg`
// invocation's resolved task graph despite `cache: false` and a declared
// dependency from @warp-drive/core#build:pkg. Prints every task turbo
// actually resolved for the most recent run, with its cache status, so we
// can see directly whether sync:core was included. Remove once root-caused.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = '.turbo/runs';
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort();
const latest = files.at(-1);
if (!latest) {
  console.log('DEBUG_TURBO_SUMMARY: no run summary found in .turbo/runs');
  process.exit(0);
}

const data = JSON.parse(readFileSync(join(dir, latest), 'utf-8'));
const tasks = (data.tasks ?? []).map((t) => ({
  id: t.taskId,
  cache: t.cache,
  hash: t.hash,
}));

console.log(`DEBUG_TURBO_SUMMARY: run ${data.id}, ${tasks.length} tasks resolved`);
for (const t of tasks) {
  console.log(`DEBUG_TURBO_SUMMARY_TASK: ${JSON.stringify(t)}`);
}
console.log(
  `DEBUG_TURBO_SUMMARY: sync:core present = ${tasks.some((t) => t.id === '//#sync:core')}`
);
