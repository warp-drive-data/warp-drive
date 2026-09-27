import { spawn, type ChildProcessByStdio } from 'node:child_process';
import { Readable } from 'node:stream';
import { styleText } from 'node:util';
import path from 'path';
import * as readline from 'readline/promises';

type CMD = {
  cwd?: string;
  cmd: string[] | string;
  condense?: boolean;
  lines?: number;
  silent?: boolean;
  env?: Record<string, string>;
};

// async function step() {
//   await new Promise((resolve) => setTimeout(resolve, 10));
// }

const isCI = Boolean(process.env.CI);

type PipedProcess = ChildProcessByStdio<null, Readable, Readable>;

function spawnPiped(args: string[], cwd: string, env: NodeJS.ProcessEnv | Record<string, string>): PipedProcess {
  const [command, ...commandArgs] = args;
  return spawn(command, commandArgs, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * Buffers everything a stream emits, so a pipe is always drained while the
 * child runs. Read the result once the child has closed.
 */
function collect(stream: Readable): () => string {
  const chunks: Buffer[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(chunk));
  return () => Buffer.concat(chunks).toString('utf8');
}

/**
 * Resolves with the exit code once the child has exited and its stdio has
 * closed. A child killed by a signal resolves with the signal name instead.
 * Rejects if the child could not be spawned (e.g. the command does not exist).
 */
function exited(proc: PipedProcess): Promise<number | NodeJS.Signals> {
  const result = new Promise<number | NodeJS.Signals>((resolve, reject) => {
    proc.once('error', reject);
    proc.once('close', (code, signal) => resolve(code ?? signal ?? 1));
  });
  // callers may still be reading stdout when a spawn error arrives; they
  // observe the rejection when they await this promise
  result.catch(() => {});
  return result;
}

class CLICondenser {
  declare reader: ReadableStreamDefaultReader<Uint8Array>;
  declare cmd: string;
  declare lines: number;
  declare cwd: string;

  constructor(cmd: string, reader: ReadableStreamDefaultReader<Uint8Array>, config: CMD) {
    this.reader = reader;
    this.cmd = cmd;
    this.lines = config.lines ?? 8;
    this.cwd = config.cwd ?? process.cwd();
  }

  async read() {
    const { reader, cmd, lines } = this;
    let output = '';
    let currentLines = 0;
    const packets = [];

    const rd = new readline.Readline(process.stdout);
    process.stdout.write(
      `\n🚀 ${styleText('yellow', cmd)} in ${styleText('greenBright', path.relative(process.cwd(), this.cwd))}\n${styleText(
        'magentaBright',
        `⎾`
      )}\n`
    );

    // await step();
    while (true) {
      let done, value;
      try {
        const result = await reader.read();
        done = result.done;
        value = result.value;
      } catch (e) {
        throw e;
      }
      if (done) {
        break;
      }

      const maxWidth = process.stdout.columns ?? 80;
      const maxLines = Math.min(process.stdout.rows, lines);
      const packet = new TextDecoder().decode(value, { stream: true });
      packets.push(packet);
      output += packet;
      const lineOutput = output.split(`\n`);
      const lastLines = lineOutput.slice(-maxLines);
      const lastLineOutput = lastLines
        .map((line) => {
          return styleText('magentaBright', '⏐ ') + line.substring(0, maxWidth - 2);
        })
        .join(`\n`);

      if (!isCI && currentLines) {
        // process.stdout.write(`\tclearing ${currentLines} lines`);
        // await step();
        rd.cursorTo(0);
        // await rd.commit();
        // await step();
        while (currentLines--) {
          rd.clearLine(0);
          // await rd.commit();
          // await step();
          rd.moveCursor(0, currentLines === 0 ? 0 : -1);
          // await rd.commit();
          // await step();
        }
        await rd.commit();
      }

      currentLines = lastLines.length + 1;
      process.stdout.write(lastLineOutput + '\n' + styleText('magentaBright', '⎿'));
      if (isCI) {
        process.stdout.write('\n');
      }
      // await step();
    }

    if (!isCI) {
      currentLines = currentLines + 3;
      // process.stdout.write(`\tclearing ${currentLines} lines`);
      // await step();
      rd.cursorTo(0);
      // await rd.commit();
      // await step();
      while (currentLines--) {
        rd.clearLine(0);
        // await rd.commit();
        // await step();
        rd.moveCursor(0, currentLines === 0 ? 0 : -1);
        // await rd.commit();
        // await step();
      }
      await rd.commit();
    }
    process.stdout.write(
      `\t☑️\t${styleText('gray', cmd)} in ${styleText('greenBright', path.relative(process.cwd(), this.cwd) || '<root>')}\n`
    );

    return output;
  }
}

/**
 *
 * @see {@link CMD}
 *
 * @internal
 */
export async function exec(cmd: string[] | string | CMD, dryRun: boolean = false) {
  const isCmdWithConfig = typeof cmd === 'object' && !Array.isArray(cmd);
  const mainCommand = isCmdWithConfig ? cmd.cmd : cmd;
  const cwd = isCmdWithConfig && cmd.cwd ? cmd.cwd : process.cwd();

  let args = mainCommand;
  if (typeof args === 'string') {
    args = args.split(' ');
  }

  if (dryRun) {
    console.log(
      `\t` + styleText('gray', `Would Run: ${Array.isArray(mainCommand) ? mainCommand.join(' ') : mainCommand}`)
    );
  } else if (!isCmdWithConfig || (!cmd.condense && !cmd.silent)) {
    console.log(
      `\t` +
        styleText('gray', `Running: ${args.join(' ')} in ${styleText('green', path.relative(process.cwd(), cwd))}\t...`)
    );
  }

  if (!dryRun) {
    if (isCmdWithConfig && cmd.condense) {
      const proc = spawnPiped(args, cwd, cmd.env || process.env);
      const readErr = collect(proc.stderr);
      const exit = exited(proc);

      const reader = Readable.toWeb(proc.stdout).getReader() as ReadableStreamDefaultReader<Uint8Array>;
      const condenser = new CLICondenser(args.join(' '), reader, cmd);
      const result = await condenser.read();

      const exitCode = await exit;
      if (exitCode !== 0) {
        console.log(result);
        const errText = readErr();
        console.error('\t' + errText.split('\n').join('\n\t'));
        throw exitCode;
      }
      return result;
    } else {
      const proc = spawnPiped(args, cwd, isCmdWithConfig ? cmd.env || process.env : process.env);
      const readLog = collect(proc.stdout);
      const readErr = collect(proc.stderr);

      const exitCode = await exited(proc);
      if (exitCode !== 0) {
        const logText = readLog();
        const errText = readErr();
        console.error('\t' + errText.split('\n').join('\n\t'));

        const error = new Error(`exit code: ${String(exitCode)}`);
        // @ts-expect-error - adding properties to custom Error
        error.logText = logText;
        // @ts-expect-error - adding properties to custom Error
        error.errText = errText;

        throw error;
      }

      return readLog();
    }
  } else {
    return '';
  }
}
