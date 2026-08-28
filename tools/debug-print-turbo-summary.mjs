// TEMPORARY DIAGNOSTIC -- investigating an intermittent CI flake where
// //#sync:core is sometimes entirely absent from a `turbo run build:pkg`
// invocation's resolved task graph despite `cache: false` and a declared
// dependency from @warp-drive/core#build:pkg. Prints every task turbo
// actually resolved for the most recent run, with its cache status, so we
// can see directly whether sync:core was included. Remove once root-caused.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = '.turbo/runs';
let files;
try {
  files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort();
} catch {
  files = [];
}
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

// Directly inspect the actual on-disk state of the file core's babel.config.mjs
// needs, both the real (source) copy and core's pnpm-injected copy of it, taken
// right after prepare finishes (success or failure) -- to see whether //#sync:core
// running actually refreshed the injected copy, independent of whether turbo
// resolved/executed the task correctly.
import { statSync, readFileSync as readFileSync2 } from 'node:fs';
import { createHash } from 'node:crypto';

function inspect(label, path) {
  try {
    const stat = statSync(path);
    const buf = readFileSync2(path);
    const hash = createHash('sha1').update(buf).digest('hex').slice(0, 12);
    console.log(
      `DEBUG_FILE_STATE: ${label} exists mtimeMs=${stat.mtimeMs} size=${stat.size} sha1=${hash}`
    );
  } catch (e) {
    console.log(`DEBUG_FILE_STATE: ${label} MISSING (${e.code})`);
  }
}

inspect('real build-config dist', 'warp-drive-packages/build-config/dist/babel-macros.js');
inspect(
  'core injected build-config dist (before manual re-sync)',
  'warp-drive-packages/core/node_modules/@warp-drive/build-config/dist/babel-macros.js'
);

// 100% of observed failures have build-config#build:pkg served as a cache HIT
// (turbo restores cached output directly, bypassing pnpm's script runner
// entirely -- so pnpm's sync-injected-deps-after-scripts hook never fires for
// build-config in that case, only for whichever package's *own* script pnpm
// actually ran). Test directly: does manually invoking `pnpm --filter
// @warp-drive/core run sync` right now (a genuine, isolated pnpm run,
// independent of turbo/prepare entirely) fix the injected copy?
import { execSync } from 'node:child_process';
try {
  execSync('pnpm --filter @warp-drive/core run sync', { stdio: 'inherit' });
} catch (e) {
  console.log('DEBUG_MANUAL_SYNC: threw', e.message);
}
inspect(
  'core injected build-config dist (after manual re-sync)',
  'warp-drive-packages/core/node_modules/@warp-drive/build-config/dist/babel-macros.js'
);
