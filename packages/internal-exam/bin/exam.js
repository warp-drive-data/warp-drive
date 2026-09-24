#!/usr/bin/env node
import { run } from '../src/node/run.js';

/**
 * Minimal `--flag`/`--flag=value`/`--flag value` argv parser for exactly the
 * options this tool supports -- we don't need a general-purpose CLI parsing
 * library since every caller in this repo is one of our own package.json
 * scripts, not an end user's terminal.
 */
function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;

    const eq = arg.indexOf('=');
    let name, value;
    if (eq !== -1) {
      name = arg.slice(2, eq);
      value = arg.slice(eq + 1);
    } else {
      name = arg.slice(2);
      // `--no-x` is a boolean-negation flag (classic ember-cli convention),
      // never takes a following value.
      if (name.startsWith('no-')) {
        name = name.slice(3);
        value = false;
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('--')) {
          value = next;
          i++;
        } else {
          value = true;
        }
      }
    }

    const camelName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    options[camelName] = value;
  }
  return options;
}

const options = parseArgs(process.argv.slice(2));

if (!options.path) {
  console.error(
    'Usage: warp-drive-exam --path <dist-dir> [--test-port <port>] [--parallel <n>] [--load-balance] [--server]'
  );
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}

if (options.testPort !== undefined) {
  options.port = parseInt(options.testPort, 10);
}
if (options.parallel !== undefined) {
  options.parallel = parseInt(options.parallel, 10);
}

try {
  await run(options);
  // eslint-disable-next-line n/no-process-exit
  process.exit(0);
} catch (error) {
  console.error(error.message || error);
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}
