#!/usr/bin/env node
/* eslint-disable no-console -- the loader prints usage, step progress and command errors */
/**
 * `node scripts/public-exports-mapping/cli.mjs <command> [...args] [--check]`
 *
 * Each command is one module in `commands/` exporting `name`, `describe` and
 * `async run(argv, context)`: `argv` is the argument list after the command name, `context` is
 * `{ dataRoot, scratchRoot, cwd }`. `run` resolves to the exit code and throws on a usage error or a missing
 * input; the loader prints the error's message and exits 1. A command CONTRACT.md lists whose
 * module does not exist yet reports "not implemented yet" and exits 2.
 */
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

import { DATA_ROOT, SCRATCH_ROOT } from './artifacts.mjs';

export const COMMANDS_DIR = path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'commands');

/** The commands CONTRACT.md defines, in pipeline order. */
export const CONTRACT_COMMANDS = ['surface', 'history', 'diff', 'audit', 'judge', 'update', 'release'];

/** Exit code for a command whose module does not exist yet. */
export const NOT_IMPLEMENTED = 2;

/** A command's file name: what `commands/<name>.mjs` may be called. */
const COMMAND_NAME = /^[a-z][a-z0-9-]*$/;

/**
 * @typedef {object} Context
 * @property {string} dataRoot the data directory, the plugin's `legacy-import-mapping/` (see data.mjs)
 * @property {string} scratchRoot where the intermediates go, `tmp/public-exports-mapping`
 * @property {string} cwd the directory the command was run from
 *
 * @typedef {object} CommandModule
 * @property {string} name
 * @property {string} describe
 * @property {(argv: string[], context: Context) => Promise<number>} run
 *
 * @typedef {object} LoaderOptions
 * @property {string} [dir] the commands directory; tests point it elsewhere
 * @property {Context} [context] what every command receives; defaults to {@link defaultContext}
 */

/**
 * @returns {Context}
 */
export function defaultContext() {
  return { dataRoot: DATA_ROOT, scratchRoot: SCRATCH_ROOT, cwd: process.cwd() };
}

/**
 * Loads `commands/<name>.mjs`.
 * @param {string} name
 * @param {LoaderOptions} [options]
 * @returns {Promise<CommandModule | null>} null when the module does not exist
 */
export async function loadCommand(name, { dir = COMMANDS_DIR } = {}) {
  const file = path.join(dir, `${name}.mjs`);
  if (!COMMAND_NAME.test(name) || !existsSync(file)) return null;
  const mod = await import(url.pathToFileURL(file).href);
  if (typeof mod.run !== 'function' || typeof mod.name !== 'string' || typeof mod.describe !== 'string') {
    throw new Error(`commands/${name}.mjs must export name, describe and run(argv, context)`);
  }
  if (mod.name !== name) throw new Error(`commands/${name}.mjs exports name '${mod.name}'`);
  return mod;
}

/**
 * Every command: the contract's, then any other module in `commands/`.
 * @param {LoaderOptions} [options]
 * @returns {Promise<{ name: string, describe: string, implemented: boolean }[]>}
 */
export async function listCommands({ dir = COMMANDS_DIR } = {}) {
  const files = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.mjs'))
        .map((f) => f.slice(0, -4))
        .filter((f) => COMMAND_NAME.test(f))
        .sort()
    : [];
  const names = [...CONTRACT_COMMANDS, ...files.filter((f) => !CONTRACT_COMMANDS.includes(f))];
  /** @type {{ name: string, describe: string, implemented: boolean }[]} */
  const out = [];
  for (const name of names) {
    try {
      const mod = await loadCommand(name, { dir });
      out.push(
        mod
          ? { name, describe: mod.describe, implemented: true }
          : { name, describe: 'not implemented yet', implemented: false }
      );
    } catch (error) {
      out.push({ name, describe: `failed to load: ${messageOf(error)}`, implemented: false });
    }
  }
  return out;
}

/**
 * Runs one command. A missing module prints "not implemented yet" and returns 2; a command that
 * throws (a usage error, a missing input) has its message printed and returns 1.
 * @param {string} name
 * @param {string[]} argv
 * @param {LoaderOptions} [options]
 * @returns {Promise<number>}
 */
export async function runCommand(name, argv, { dir = COMMANDS_DIR, context = defaultContext() } = {}) {
  try {
    const mod = await loadCommand(name, { dir });
    if (!mod) {
      console.error(`${name}: not implemented yet`);
      return NOT_IMPLEMENTED;
    }
    const code = await mod.run(argv, context);
    return typeof code === 'number' ? code : 0;
  } catch (error) {
    console.error(messageOf(error));
    return 1;
  }
}

/**
 * Runs `steps` in order for `update` and `release`. A step whose command does not exist yet is
 * skipped with a note. In check mode every step runs and the worst exit code wins; otherwise
 * the first failing step stops the run, since later steps read what earlier ones write.
 * @param {string} caller the command running the steps, for messages
 * @param {[string, string[]][]} steps command name and its arguments
 * @param {LoaderOptions & { check?: boolean }} [options]
 * @returns {Promise<number>}
 */
export async function runSteps(caller, steps, { check = false, dir = COMMANDS_DIR, context = defaultContext() } = {}) {
  let worst = 0;
  for (const [name, args] of steps) {
    if (!(await loadCommand(name, { dir }))) {
      console.log(`${caller}: skipping ${[name, ...args].join(' ')} (not implemented yet)`);
      continue;
    }
    const argv = check && !args.includes('--check') ? [...args, '--check'] : args;
    console.log(`${caller}: ${[name, ...argv].join(' ')}`);
    const code = await runCommand(name, argv, { dir, context });
    worst = Math.max(worst, code);
    if (code !== 0 && !check) {
      console.error(`${caller}: ${name} exited ${code}; stopping`);
      return code;
    }
  }
  return worst;
}

/**
 * @param {{ name: string, describe: string }[]} commands
 */
function usage(commands) {
  const width = Math.max(...commands.map((c) => c.name.length));
  return [
    'usage: node scripts/public-exports-mapping/cli.mjs <command> [...args] [--check]',
    '',
    'commands:',
    ...commands.map((c) => `  ${c.name.padEnd(width)}  ${c.describe}`),
  ].join('\n');
}

/**
 * @param {unknown} error
 */
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @param {string[]} argv
 * @param {LoaderOptions} [options]
 * @returns {Promise<number>}
 */
export async function main(argv, { dir = COMMANDS_DIR, context = defaultContext() } = {}) {
  const [name, ...rest] = argv;
  if (!name || name === 'help' || name === '--help' || name === '-h') {
    console.log(usage(await listCommands({ dir })));
    return name ? 0 : 1;
  }
  if (!CONTRACT_COMMANDS.includes(name) && !(COMMAND_NAME.test(name) && existsSync(path.join(dir, `${name}.mjs`)))) {
    console.error(`unknown command '${name}'\n`);
    console.error(usage(await listCommands({ dir })));
    return 1;
  }
  return runCommand(name, rest, { dir, context });
}

// No top-level await: command modules import this one (runSteps), and awaiting their import
// while this module is still evaluating would deadlock.
if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(messageOf(error));
      process.exitCode = 1;
    }
  );
}
