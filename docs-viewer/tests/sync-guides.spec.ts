#!/usr/bin/env node
/**
 * Black-box spec for `pnpm build` and `pnpm start` (src/sync-guides.ts).
 *
 * Running TypeDoc and VitePress for real means building the whole site, which is what the
 * pr-preview workflow does on every docs PR. This spec instead copies the package's `src/` and
 * `package.json` into a minimal fixture repo, puts stub `typedoc` and `vitepress` executables in
 * the fixture's `node_modules/.bin` (where the real ones would resolve from), and asserts on what
 * the script does around them: which stubs it calls, with what arguments and cwd, and what it
 * writes before and after them.
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, test } from 'node:test';

const docsViewerRoot = join(import.meta.dirname, '..');

const tempDirs: string[] = [];
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

function writeFiles(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
}

/** appends `<name>\t<cwd>\t<args>` to $STUB_LOG, then does just enough of the real tool's job for the script to carry on */
const stubs: Record<string, string> = {
  typedoc: [
    '#!/bin/sh',
    'printf "typedoc\\t%s\\t%s\\n" "$PWD" "$*" >> "$STUB_LOG"',
    'mkdir -p tmp/api',
    'echo "[]" > tmp/api/typedoc-sidebar.json',
    'printf "# API\\n" > tmp/api/index.md',
  ].join('\n'),
  vitepress: [
    '#!/bin/sh',
    'printf "vitepress\\t%s\\t%s\\n" "$PWD" "$*" >> "$STUB_LOG"',
    'if [ "$1" = "build" ]; then',
    '  dist="$2/.vitepress/dist"',
    '  mkdir -p "$dist/guides"',
    '  printf "<html></html>" > "$dist/guides/index.html"',
    '  printf "# Guides\\n" > "$dist/guides.md"',
    '  printf "# Legacy Setup\\n" > "$dist/guides/legacy-setup.md"',
    'fi',
  ].join('\n'),
};

/**
 * A repo with the directories sync-guides.ts reads relative to its own location: the content
 * roots it copies into the site, and packages with and without a `typedoc.config.mjs`.
 */
function createFixtureRepo(): { repo: string; docsViewer: string; stubLog: string } {
  const repo = realpathSync(mkdtempSync(join(tmpdir(), 'sync-guides-')));
  tempDirs.push(repo);
  const docsViewer = join(repo, 'docs-viewer');

  cpSync(join(docsViewerRoot, 'src'), join(docsViewer, 'src'), { recursive: true });
  cpSync(join(docsViewerRoot, 'package.json'), join(docsViewer, 'package.json'));
  mkdirSync(join(docsViewer, 'docs.warp-drive.io'), { recursive: true });

  // the real dependencies, minus the real bins, so the stubs below are what resolves
  const nodeModules = join(docsViewer, 'node_modules');
  mkdirSync(join(nodeModules, '.bin'), { recursive: true });
  for (const entry of readdirSync(join(docsViewerRoot, 'node_modules'))) {
    if (entry === '.bin') continue;
    symlinkSync(join(docsViewerRoot, 'node_modules', entry), join(nodeModules, entry));
  }
  for (const [name, script] of Object.entries(stubs)) {
    writeFileSync(join(nodeModules, '.bin', name), `${script}\n`);
    chmodSync(join(nodeModules, '.bin', name), 0o755);
  }

  writeFiles(repo, {
    'guides/index.md': '# Guides\n',
    'guides/legacy-setup.md': '---\ntitle: Legacy Setup\nlegacy: true\n---\n\n# Legacy Setup\n',
    'upgrading/index.md': '# Upgrading\n',
    'blog/index.md': '# Blog\n',
    'rfcs/index.md': '# RFCs\n',
    'warp-drive-packages/memory-alpha/skills/index.md': '# Skills\n',
    'warp-drive-packages/memory-alpha/typedoc.config.mjs': 'export default {};\n',
    'warp-drive-packages/core/typedoc.config.mjs': 'export default {};\n',
    'warp-drive-packages/core/src/index.ts': 'export {};\n',
    'packages/store/typedoc.config.mjs': 'export default {};\n',
    'packages/store/src/index.ts': 'export {};\n',
    'packages/no-docs/src/index.ts': 'export {};\n',
  });

  return { repo, docsViewer, stubLog: join(repo, 'stub.log') };
}

function readStubLog(stubLog: string): string[][] {
  if (!existsSync(stubLog)) return [];
  return readFileSync(stubLog, 'utf8')
    .trim()
    .split('\n')
    .map((line) => line.split('\t'));
}

function env(stubLog: string): NodeJS.ProcessEnv {
  return { ...process.env, STUB_LOG: stubLog, HOSTNAME: 'https://docs.example', BASE: '/' };
}

describe('pnpm build', () => {
  test('syncs the content, runs typedoc then vitepress build, and emits the llms twins', () => {
    const { repo, docsViewer, stubLog } = createFixtureRepo();

    const result = spawnSync('pnpm', ['--silent', 'run', 'build'], {
      cwd: docsViewer,
      env: env(stubLog),
      encoding: 'utf8',
    });
    assert.equal(result.error, undefined, `could not run pnpm: ${result.error?.message}`);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.equal(result.status, 0, output);

    assert.deepEqual(readStubLog(stubLog), [
      ['typedoc', docsViewer, ''],
      ['vitepress', docsViewer, 'build docs.warp-drive.io'],
    ]);

    const site = join(docsViewer, 'docs.warp-drive.io');
    for (const dir of ['guides', 'upgrading', 'blog', 'rfcs', 'skills']) {
      assert.ok(existsSync(join(site, dir, 'index.md')), `${dir}/ was synced into the site`);
    }
    assert.match(
      readFileSync(join(site, 'guides/legacy-setup.md'), 'utf8'),
      /:::warning Legacy guide/,
      'legacy guides are marked'
    );
    assert.match(
      readFileSync(join(site, 'api/index.md'), 'utf8'),
      /## Universal Packages/,
      'typedoc output was post-processed'
    );

    const dist = join(site, '.vitepress/dist');
    assert.match(result.stdout, /emitted 1 index\.md twins for directory-index pages/);
    assert.ok(existsSync(join(dist, 'guides/index.md')), 'guides.md was copied to guides/index.md');
    assert.match(result.stdout, /with 1 legacy guides and 0 legacy API pages/);
    assert.match(
      readFileSync(join(dist, 'llms-legacy.txt'), 'utf8'),
      /- \[Legacy Setup\]\(https:\/\/docs\.example\/guides\/legacy-setup\.md\)/
    );
    assert.equal(readFileSync(join(dist, 'llms-legacy-full.txt'), 'utf8'), '# Legacy Setup\n');
  });
});

describe('pnpm start', () => {
  test('runs vitepress dev without rebuilding existing API docs, and watches every documented package', async (t) => {
    const { repo, docsViewer, stubLog } = createFixtureRepo();
    // API docs from an earlier run, so typedoc is skipped without --force
    writeFiles(docsViewer, { 'tmp/api/typedoc-sidebar.json': '[]', 'tmp/api/index.md': '# API\n' });

    const child = spawn('pnpm', ['--silent', 'run', 'start'], {
      cwd: docsViewer,
      env: env(stubLog),
      detached: true,
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    const exited = new Promise((resolve) => child.on('exit', resolve));
    t.after(async () => {
      try {
        process.kill(-child.pid!, 'SIGKILL');
      } catch {
        // already gone
      }
      await exited;
    });

    async function waitFor(condition: () => boolean, what: string, poke?: () => void): Promise<void> {
      const deadline = Date.now() + 20_000;
      while (!condition()) {
        if (child.exitCode !== null) assert.fail(`exited with ${child.exitCode} while waiting for ${what}\n${output}`);
        if (Date.now() > deadline) assert.fail(`timed out waiting for ${what}\n${output}`);
        poke?.();
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    await waitFor(() => readStubLog(stubLog).length > 0, 'vitepress dev');
    assert.deepEqual(readStubLog(stubLog), [['vitepress', docsViewer, 'dev docs.warp-drive.io']]);

    // an edit in a package without typedoc.config.mjs is not watched; edits in the ones with it are
    const touch = (path: string) => writeFileSync(join(repo, path), `export {}; // ${Date.now()}\n`);
    touch('packages/no-docs/src/index.ts');
    const changed = (path: string) => output.includes(`package changed ${join(repo, path)}`);
    await waitFor(
      () => changed('packages/store/src'),
      'a change in packages/store',
      () => touch('packages/store/src/index.ts')
    );
    await waitFor(
      () => changed('warp-drive-packages/core/src'),
      'a change in warp-drive-packages/core',
      () => touch('warp-drive-packages/core/src/index.ts')
    );
    assert.equal(changed('packages/no-docs/src'), false, output);
  });
});
