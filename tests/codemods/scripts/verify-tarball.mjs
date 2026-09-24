#!/usr/bin/env node
/**
 * Packaging smoke test for @ember-data/codemods.
 *
 * Verifies the packed tarball is actually runnable by consumers — the class of
 * regression that produced:
 *  - issue #9979:  a host-platform compiled binary shipped as `bin`
 *  - issue #10539: `bin` pointing at a file absent from the tarball
 *                  (npm creates no bin link and fails only at invocation time)
 *  - the 5.9.0-alpha canary: a `dist/index.js` bundle with no shebang
 *
 * Usage: node verify-tarball.mjs --tarball <abs-path-to-tgz> [--pm npm|pnpm|bun]
 *
 * Plain node + tar only (no bash, no deps) so it runs unmodified inside
 * a node:alpine container for musl coverage.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
}

const tarball = argValue('--tarball');
const pm = argValue('--pm', 'npm');

if (!tarball || !path.isAbsolute(tarball) || !existsSync(tarball)) {
  console.error(`--tarball must be an absolute path to an existing .tgz (got: ${tarball})`);
  process.exit(1);
}
if (!['npm', 'pnpm', 'bun'].includes(pm)) {
  console.error(`--pm must be npm, pnpm, or bun (got: ${pm})`);
  process.exit(1);
}

let failures = 0;
function check(label, fn) {
  try {
    fn();
    console.log(`ok   ${label}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${label}`);
    console.error(`     ${error.message}`);
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(cmd, cmdArgs, options = {}) {
  return execFileSync(cmd, cmdArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
}

// ---------------------------------------------------------------------------
// 1. Static tarball checks (package-manager independent)
// ---------------------------------------------------------------------------

const listing = run('tar', ['-tzf', tarball]).split('\n').filter(Boolean);

check('tarball contains package/dist/index.js', () => {
  assert(
    listing.includes('package/dist/index.js'),
    `entries: ${listing.filter((e) => e.startsWith('package/dist')).join(', ') || '(no dist entries)'}`
  );
});

check('tarball contains no stray build output (maps, dist/src, tsbuildinfo)', () => {
  const stray = listing.filter(
    (e) => e.endsWith('.map') || e.startsWith('package/dist/src/') || e.endsWith('.tsbuildinfo')
  );
  assert(stray.length === 0, `stray entries: ${stray.join(', ')}`);
});

const extractDir = mkdtempSync(path.join(tmpdir(), 'codemods-tarball-'));
run('tar', ['-xzf', tarball, '-C', extractDir]);
const pkgDir = path.join(extractDir, 'package');
const manifest = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));

check('every bin entry resolves to a file inside the tarball', () => {
  // npm silently SKIPs bin links whose target is missing (bin-links/link-gently.js),
  // so this is the check the package manager itself will never do for us.
  const bin = typeof manifest.bin === 'string' ? { codemods: manifest.bin } : manifest.bin;
  assert(bin && Object.keys(bin).length > 0, 'manifest has no bin');
  for (const [name, target] of Object.entries(bin)) {
    assert(existsSync(path.join(pkgDir, target)), `bin "${name}" -> ${target} is not in the tarball`);
  }
});

check('dist/index.js starts with #!/usr/bin/env node', () => {
  const firstLine = readFileSync(path.join(pkgDir, 'dist/index.js'), 'utf8').split('\n', 1)[0];
  assert(firstLine === '#!/usr/bin/env node', `first line: ${JSON.stringify(firstLine)}`);
});

check('bundle has no dangling sourceMappingURL', () => {
  const bundle = readFileSync(path.join(pkgDir, 'dist/index.js'), 'utf8');
  assert(!bundle.includes('sourceMappingURL='), 'found sourceMappingURL comment but no map ships');
});

check('@ast-grep/napi is the sole runtime dependency', () => {
  const deps = Object.keys(manifest.dependencies ?? {});
  assert(
    deps.length === 1 && deps[0] === '@ast-grep/napi',
    `dependencies: ${deps.join(', ')} — bundled libs must stay in devDependencies`
  );
});

check('manifest declares an engines.node floor', () => {
  assert(typeof manifest.engines?.node === 'string', 'engines.node missing');
});

// ---------------------------------------------------------------------------
// 2. Behavioral checks: install the tarball like a consumer and run the bin
// ---------------------------------------------------------------------------

// Outside any workspace so repo-level package-manager policies don't apply.
// The tarball is a declared file: dependency (rather than an `add <path>`
// argument) because pnpm 12 rejects tarball paths passed to `pnpm add`.
const smokeDir = mkdtempSync(path.join(tmpdir(), `codemods-smoke-${pm}-`));
writeFileSync(
  path.join(smokeDir, 'package.json'),
  JSON.stringify({ name: 'smoke', private: true, dependencies: { '@ember-data/codemods': `file:${tarball}` } }),
  'utf8'
);

const installArgs = {
  npm: ['install', '--no-audit', '--no-fund'],
  pnpm: ['install'],
  bun: ['install'],
}[pm];

check(`${pm} installs the tarball`, () => {
  run(pm, installArgs, { cwd: smokeDir });
});

const binPath = path.join(smokeDir, 'node_modules', '.bin', 'codemods');

check('node_modules/.bin/codemods exists', () => {
  assert(existsSync(binPath), 'bin link was not created');
});

check('codemods --version runs via shebang and matches the manifest', () => {
  const out = run(binPath, ['--version'], { cwd: smokeDir }).trim();
  assert(out === manifest.version, `got ${out}, expected ${manifest.version}`);
});

check('codemods list names both codemods', () => {
  const out = run(binPath, ['list'], { cwd: smokeDir });
  assert(out.includes('legacy-compat-builders'), 'missing legacy-compat-builders');
  assert(out.includes('migrate-to-schema'), 'missing migrate-to-schema');
});

// Real apply #1: legacy-compat-builders (jscodeshift path, pure JS)
const fixtureSource = readFileSync(
  new URL(
    '../tests/__testfixtures__/legacy-compat-builders/js/find-record/simple/by-type-plus-id.input.js',
    import.meta.url
  ),
  'utf8'
);
const projectDir = path.join(smokeDir, 'project');
mkdirSync(path.join(projectDir, 'app'), { recursive: true });
const sampleFile = path.join(projectDir, 'app', 'sample.js');
writeFileSync(sampleFile, fixtureSource, 'utf8');

check('apply legacy-compat-builders --dry leaves files untouched', () => {
  run(binPath, ['apply', 'legacy-compat-builders', '--dry', 'app/**/*.js'], { cwd: projectDir });
  assert(readFileSync(sampleFile, 'utf8') === fixtureSource, 'dry run modified the file');
});

check('apply legacy-compat-builders rewrites the file', () => {
  run(binPath, ['apply', 'legacy-compat-builders', 'app/**/*.js'], { cwd: projectDir });
  const transformed = readFileSync(sampleFile, 'utf8');
  assert(transformed !== fixtureSource, 'file was not modified');
  assert(transformed.includes('store.request'), 'transformed file does not call store.request');
});

// Real apply #2: migrate-to-schema — the only path that loads the native
// @ast-grep/napi binding, i.e. the platform-resolution check (issue #9979 class).
mkdirSync(path.join(projectDir, 'app', 'models'), { recursive: true });
writeFileSync(
  path.join(projectDir, 'app', 'models', 'user.js'),
  `import Model, { attr } from '@ember-data/model';\n\nexport default class User extends Model {\n  @attr('string') name;\n}\n`,
  'utf8'
);

check('apply migrate-to-schema generates schemas via @ast-grep/napi', () => {
  run(binPath, ['apply', 'migrate-to-schema', './app'], { cwd: projectDir });
  const generated = path.join(projectDir, 'app', 'data', 'resources', 'user.schema.ts');
  assert(existsSync(generated), `expected generated schema at ${generated}`);
});

// ---------------------------------------------------------------------------

rmSync(extractDir, { recursive: true, force: true });
rmSync(smokeDir, { recursive: true, force: true });

if (failures > 0) {
  console.error(`\n${failures} check(s) failed for pm=${pm}`);
  process.exit(1);
}
console.log(`\nall checks passed for pm=${pm}`);
