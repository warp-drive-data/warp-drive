import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { after, describe, it } from 'node:test';

import { makeTempDir, RELEASE_DIR, stripAnsi } from './helpers.ts';

const CMD_MODULE = path.join(RELEASE_DIR, 'utils/cmd.ts');

type Outcome = {
  status: number | null;
  /** everything the snippet printed (ANSI stripped), minus the RESULT line */
  output: string;
  stderr: string;
  value?: unknown;
  error?: { isError: boolean; message?: string; logText?: string; errText?: string; value?: unknown };
};

/**
 * `exec` prints as it runs and reads `CI` when its module loads, so each case
 * runs in a fresh Node process: `call` is the expression passed to `await`.
 */
function runExec(call: string, env: NodeJS.ProcessEnv = {}, cwd?: string): Outcome {
  const code = `
    import { exec } from ${JSON.stringify(CMD_MODULE)};
    let outcome;
    try {
      outcome = { value: await ${call} };
    } catch (e) {
      outcome = e instanceof Error
        ? { error: { isError: true, message: e.message, logText: e.logText, errText: e.errText } }
        : { error: { isError: false, value: e } };
    }
    process.stdout.write('\\nRESULT:' + JSON.stringify(outcome) + '\\n');
  `;
  const baseEnv = { ...process.env };
  delete baseEnv.CI;
  const result = spawnSync(process.execPath, ['--no-warnings', '--input-type=module', '-e', code], {
    cwd: cwd ?? RELEASE_DIR,
    env: { ...baseEnv, ...env },
    encoding: 'utf8',
    timeout: 30_000,
  });
  const stdout = stripAnsi(result.stdout);
  const marker = stdout.lastIndexOf('\nRESULT:');
  assert.notEqual(marker, -1, `no result printed\nstdout:\n${stdout}\nstderr:\n${result.stderr}`);
  return {
    status: result.status,
    output: stdout.slice(0, marker),
    stderr: result.stderr,
    ...JSON.parse(stdout.slice(marker + '\nRESULT:'.length)),
  };
}

const node = JSON.stringify(process.execPath);

describe('utils/cmd exec', () => {
  const tmp = makeTempDir('cmd');
  after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  it('returns stdout of a successful command and logs what it runs', () => {
    const outcome = runExec(`exec([${node}, '-e', 'process.stdout.write("hello")'])`);
    assert.equal(outcome.value, 'hello');
    assert.match(outcome.output, /Running: .* -e process\.stdout\.write\("hello"\) in\s+\.\.\./);
  });

  it('splits a string command on spaces', () => {
    const outcome = runExec(`exec('echo one two')`);
    assert.equal(outcome.value, 'one two\n');
    assert.match(outcome.output, /Running: echo one two/);
  });

  it('runs in the configured cwd with the configured env, silently', () => {
    const outcome = runExec(
      `exec({ cmd: [${node}, '-e', 'process.stdout.write(process.cwd() + "|" + process.env.RELEASE_TEST_VALUE)'], cwd: ${JSON.stringify(tmp)}, env: { ...process.env, RELEASE_TEST_VALUE: 'from-env' }, silent: true })`
    );
    assert.equal(outcome.value, `${fs.realpathSync(tmp)}|from-env`);
    assert.doesNotMatch(outcome.output, /Running:/);
  });

  it('throws an Error carrying stdout and stderr when the command fails', () => {
    const outcome = runExec(
      `exec([${node}, '-e', 'console.log("some output"); console.error("some error"); process.exit(3)'])`
    );
    assert.deepEqual(outcome.error, {
      isError: true,
      message: 'exit code: 3',
      logText: 'some output\n',
      errText: 'some error\n',
    });
    assert.match(outcome.stderr, /\tsome error/);
  });

  it('rejects when the command cannot be spawned', () => {
    const outcome = runExec(`exec(['release-tool-command-that-does-not-exist'])`);
    assert.ok(outcome.error, 'expected a rejection');
  });

  it('drains large stderr output instead of deadlocking', () => {
    const outcome = runExec(
      `exec([${node}, '-e', 'process.stderr.write("x".repeat(1 << 20)); process.stdout.write("done")'])`
    );
    assert.equal(outcome.value, 'done');
  });

  it('only prints the command in dry-run mode', () => {
    const marker = path.join(tmp, 'dry-run-marker');
    const outcome = runExec(`exec(['touch', ${JSON.stringify(marker)}], true)`);
    assert.equal(outcome.value, '');
    assert.match(outcome.output, new RegExp(`Would Run: touch ${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.equal(fs.existsSync(marker), false);
  });

  it('rejects when the command cannot be spawned in condensed mode', () => {
    const outcome = runExec(`exec({ cmd: ['release-tool-command-that-does-not-exist'], condense: true })`, {
      CI: 'true',
    });
    assert.equal(outcome.error?.message, 'spawn release-tool-command-that-does-not-exist ENOENT');
    // nothing claims the step started or finished
    assert.doesNotMatch(outcome.output, /🚀|☑️/);
  });

  it('rejects without success output when the cwd does not exist in condensed mode', () => {
    const outcome = runExec(
      `exec({ cmd: [${node}, '-e', '1'], cwd: ${JSON.stringify(path.join(tmp, 'missing-dir'))}, condense: true })`,
      { CI: 'true' }
    );
    assert.match(outcome.error?.message ?? '', /ENOENT/);
    assert.doesNotMatch(outcome.output, /🚀|☑️/);
  });

  describe('condensed', () => {
    const emitLines = `for (let i = 1; i <= 3; i++) { setTimeout(() => console.log("line " + i), i * 50); }`;

    it('streams output line by line on CI and returns all of it', () => {
      const outcome = runExec(`exec({ cmd: [${node}, '-e', ${JSON.stringify(emitLines)}], condense: true })`, {
        CI: 'true',
      });
      assert.equal(outcome.value, 'line 1\nline 2\nline 3\n');
      const lines = outcome.output.split('\n');
      // each chunk re-prints the tail of the output, framed, on its own lines
      assert.ok(lines.includes('⏐ line 1'), outcome.output);
      assert.ok(lines.includes('⏐ line 3'), outcome.output);
      assert.ok(lines.filter((line) => line === '⎿').length >= 3, outcome.output);
      assert.match(outcome.output, /🚀 .* -e /);
      assert.match(outcome.output, /☑️\t.* -e .* in <root>/);
      assert.doesNotMatch(outcome.output, /Running:/);
    });

    it('drains stderr while streaming stdout', () => {
      const outcome = runExec(
        `exec({ cmd: [${node}, '-e', 'process.stderr.write("x".repeat(1 << 20)); console.log("done")'], condense: true })`,
        { CI: 'true' }
      );
      assert.equal(outcome.value, 'done\n');
    });

    it('prints stdout and stderr and throws the exit code when the command fails', () => {
      const outcome = runExec(
        `exec({ cmd: [${node}, '-e', 'console.log("partial"); console.error("broken"); process.exit(4)'], condense: true })`,
        { CI: 'true' }
      );
      assert.deepEqual(outcome.error, { isError: false, value: 4 });
      assert.match(outcome.output, /partial/);
      assert.match(outcome.stderr, /\tbroken/);
    });
  });
});
