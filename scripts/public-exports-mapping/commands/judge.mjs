/* eslint-disable no-console -- a command reports on stdout and stderr */
/**
 * `cli.mjs judge --from <v> [--to <v>] [--dry-run] [--judge claude|jev] [--threshold 0.8]
 * [--calibrate] [--check]`: judges the residue of a release pair with Claude and writes
 * `decisions/<from>.json`. See judge.mjs for the live procedure.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { DATA_ROOT, REPO_ROOT, canonical, readJson, releases, report, writeArtifact } from '../artifacts.mjs';
import {
  DEFAULT_EFFORT,
  DEFAULT_OUT,
  DEFAULT_POLL_SECONDS,
  DEFAULT_THRESHOLD,
  InputError,
  JUDGES,
  SETTLED_BY,
  agreementReport,
  buildContext,
  calibrationBundles,
  decide,
  defaultGit,
  evidenceFor,
  loadInputs,
  requestFor,
  shimFor,
  staleDecisions,
} from '../judge.mjs';

export const name = 'judge';
export const describe = 'judge the residue of a release pair with Claude and write decisions/<from>.json';

const SYNOPSIS = `usage: cli.mjs judge --from <version> [--to <version>] [--dry-run] [--judge claude|jev] [--threshold 0.8]
                     [--calibrate] [--check] [--limit <n>] [--effort low|medium|high|xhigh|max]
                     [--batch <id>] [--poll <seconds>] [--out <dir>]`;

const USAGE = `${SYNOPSIS}

  --from       the release whose residue is judged (decisions/<from>.json)
  --to         the release the successors come from (default: the newest in releases.json)
  --dry-run    write the evidence bundles and request bodies, print a summary, send nothing
  --judge      claude (default) or jev (not configured)
  --threshold  lowest confidence written to decisions/ (default ${DEFAULT_THRESHOLD})
  --calibrate  judge the declarations git settles, blind, and report agreement; writes no decisions
  --check      fail on stale or malformed decisions files (all of them unless --from is given)
  --limit      judge only the first n declarations
  --effort     output_config.effort for claude-opus-5-5 (default ${DEFAULT_EFFORT})
  --batch      resume polling an existing message batch instead of creating one
  --poll       seconds between batch status checks (default ${DEFAULT_POLL_SECONDS})
  --out        scratch output directory (default ${path.relative(REPO_ROOT, DEFAULT_OUT)})

Reads ANTHROPIC_API_KEY from the environment for a live run.`;

/** @type {import('node:util').ParseArgsConfig['options']} */
const OPTIONS = {
  from: { type: 'string' },
  to: { type: 'string' },
  'dry-run': { type: 'boolean', default: false },
  judge: { type: 'string', default: 'claude' },
  threshold: { type: 'string' },
  calibrate: { type: 'boolean', default: false },
  check: { type: 'boolean', default: false },
  limit: { type: 'string' },
  effort: { type: 'string' },
  batch: { type: 'string' },
  poll: { type: 'string' },
  out: { type: 'string' },
  help: { type: 'boolean', short: 'h', default: false },
};

const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];

/**
 * @typedef {object} JudgeContext
 * @property {string} [dataRoot]  the directory the artifacts live in (cli.mjs passes it)
 * @property {string} [cwd]  the directory the command was run from; a relative `--out` resolves against it
 * @property {import('../judge.mjs').Git} [git]  runs git; tests stub it
 * @property {any} [client]  an Anthropic client; tests pass a fake, a live run builds one from `ANTHROPIC_API_KEY`
 * @property {Record<string, string | undefined>} [env]  where `ANTHROPIC_API_KEY` is read from
 * @property {(ms: number) => Promise<unknown>} [sleep]  waits between batch polls
 */

/**
 * Throws on a usage error or a missing input (cli.mjs prints the message and exits 1).
 * @param {string[]} argv  the arguments after `judge`
 * @param {JudgeContext} [context]  `{ dataRoot, cwd }` from cli.mjs, plus what tests inject
 * @returns {Promise<number>} the exit code: 0 done, 1 `--check` found problems, 2 the judge is not configured
 */
export async function run(argv, context = {}) {
  const { dataRoot = DATA_ROOT, cwd = process.cwd(), env = process.env } = context;
  /** @type {Record<string, any>} */
  let args;
  try {
    args = parseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: false }).values;
  } catch (error) {
    throw usageError(/** @type {Error} */ (error).message);
  }
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  if (args.check) return check({ from: args.from, dataRoot, cwd });

  const judge = JUDGES[/** @type {keyof typeof JUDGES} */ (args.judge)];
  if (!judge) throw usageError(`unknown judge ${args.judge}; use claude or jev`);
  if (!judge.configured) {
    try {
      await judge.ask([]);
    } catch (error) {
      console.error(/** @type {Error} */ (error).message);
    }
    return 2;
  }
  if (!args.from) throw usageError('--from is required');
  const threshold = args.threshold === undefined ? DEFAULT_THRESHOLD : Number(args.threshold);
  if (!(threshold >= 0 && threshold <= 1)) throw usageError('--threshold takes a number from 0 to 1');
  const limit = args.limit === undefined ? undefined : Number(args.limit);
  if (limit !== undefined && !(Number.isInteger(limit) && limit > 0)) {
    throw usageError('--limit takes a positive integer');
  }
  const effort = args.effort ?? DEFAULT_EFFORT;
  if (!EFFORTS.includes(effort)) throw usageError(`--effort takes one of ${EFFORTS.join(', ')}`);
  const poll = args.poll === undefined ? DEFAULT_POLL_SECONDS : Number(args.poll);
  if (!(poll > 0)) throw usageError('--poll takes a number of seconds');

  const versions = releaseList(dataRoot);
  const from = args.from;
  const to = args.to ?? versions.filter((v) => v !== 'head').at(-1);
  let inputs;
  try {
    inputs = loadInputs({ from, to, versions, dataRoot });
  } catch (error) {
    if (error instanceof InputError) throw new InputError(`judge: ${error.message}`);
    throw error;
  }
  const ctx = buildContext({ ...inputs, git: context.git ?? defaultGit() });
  const outDir = path.join(path.resolve(cwd, args.out ?? DEFAULT_OUT), `${from}-${to}`);
  const shown = display(outDir, cwd);
  const dryRun = args['dry-run'];

  /** @param {import('../judge.mjs').Bundle[]} bundles @param {string} prefix */
  const ask = async (bundles, prefix) => {
    /** @type {Array<{ id: string, round: number, requests: number }>} */
    const batches = [];
    return judge.ask(bundles, {
      client: context.client ?? (await clientFrom(env)),
      model: judge.model,
      effort,
      tieBreak: ctx.tieBreak,
      pollIntervalMs: poll * 1000,
      batchId: args.batch ?? null,
      sleep: context.sleep,
      log: (line) => console.log(line),
      onBatch: (batch, info) => {
        batches.push({ id: batch.id, round: info.round, requests: info.requests });
        scratch(outDir, `${prefix}batches.json`, canonical(batches));
      },
    });
  };
  const requireKey = () => {
    if (!context.client && !env.ANTHROPIC_API_KEY) {
      throw new InputError('judge: ANTHROPIC_API_KEY is not set; export it for a live run, or pass --dry-run');
    }
  };

  if (args.calibrate) {
    const { bundles, truth } = calibrationBundles(ctx, { limit });
    const requests = bundles.map((b) => requestFor(b, { model: judge.model, effort, tieBreak: ctx.tieBreak }));
    scratch(outDir, 'calibration-bundles.json', canonical(bundles));
    const body = scratch(outDir, 'calibration-requests.json', `${JSON.stringify({ requests }, null, 2)}\n`);
    const kinds = SETTLED_BY.map(
      (kind) => `${Object.values(truth).filter((t) => t.settledBy === kind).length} ${kind}`
    );
    console.log(
      `judge --calibrate ${from} -> ${to}: ${bundles.length} of the ${ctx.settled.length} declarations git settles, judged blind`
    );
    console.log(
      `  settled by ${kinds.join(', ')} (symbols: a history.symbols entry; files: a file move; same: unchanged id)`
    );
    console.log(
      `  wrote ${shown}/calibration-bundles.json and calibration-requests.json (${sizeLine(body, requests.length)})`
    );
    if (dryRun) {
      console.log('judge: dry run, nothing sent');
      return 0;
    }
    requireKey();
    const answers = await ask(bundles, 'calibration-');
    scratch(outDir, 'calibration-answers.json', canonical(answers));
    const result = agreementReport(answers, truth);
    scratch(outDir, 'calibration.json', canonical({ from, to, report: result, truth }));
    printCalibration(result);
    printUsage(answers);
    return 0;
  }

  const existing = inputs.decisions?.entries ?? [];
  const stale = staleDecisions({
    decisions: { from, to, entries: existing },
    fromSurface: inputs.surfaces[from],
    toSurface: inputs.surfaces[to],
  });
  const staleDecls = new Set(stale.map((p) => p.decl));
  for (const p of stale) console.log(`judge: dropping the stale decision for ${p.decl}: ${p.problem}`);
  const kept = existing.filter((/** @type {any} */ e) => !staleDecls.has(e.decl));
  const decided = new Set(kept.map((/** @type {any} */ e) => e.decl));
  const open = ctx.residue.filter((item) => !decided.has(item.decl));
  const bundles = (limit ? open.slice(0, limit) : open).map((item) => evidenceFor(item, ctx));
  const requests = bundles.map((b) => requestFor(b, { model: judge.model, effort, tieBreak: ctx.tieBreak }));
  scratch(outDir, 'bundles.json', canonical(bundles));
  const body = scratch(outDir, 'requests.json', `${JSON.stringify({ requests }, null, 2)}\n`);
  printSummary({ ctx, from, to, bundles, decided: decided.size, open: open.length });
  console.log(`  wrote ${shown}/bundles.json and requests.json (${sizeLine(body, requests.length)})`);
  if (dryRun) {
    console.log('judge: dry run, nothing sent');
    return 0;
  }
  if (bundles.length) requireKey();

  const answers = bundles.length ? await ask(bundles, '') : [];
  scratch(outDir, 'answers.json', canonical(answers));
  const byId = new Map(bundles.map((b) => [b.id, b]));
  for (const answer of answers) {
    if (answer.error !== undefined || answer.choice !== null) continue;
    const bundle = /** @type {any} */ (byId.get(answer.id));
    const removal =
      bundle.removal ?? (bundle.history?.commit ? { commit: bundle.history.commit, path: bundle.history.path } : null);
    if (removal) bundle.shim = shimFor(bundle, removal, { git: ctx.git, names: bundle.names });
  }
  const { entries, review } = decide({
    residue: bundles,
    answers,
    threshold,
    toSurface: ctx.toIndex,
    judge: judge.model,
    tieBreak: ctx.tieBreak,
  });
  scratch(outDir, 'judge-review.json', canonical(review));
  const merged = [...kept, ...entries].sort((a, b) => (a.decl < b.decl ? -1 : a.decl > b.decl ? 1 : 0));
  const written = writeArtifact(path.join(dataRoot, 'decisions', `${from}.json`), {
    schema: 1,
    kind: 'decisions',
    from,
    to,
    entries: merged,
  });
  console.log(`judge: ${entries.length} decisions at or above ${threshold}, ${review.length} for review`);
  for (const r of review) {
    const answer = r.error ?? `${r.choice ? `${r.choice.module} ${r.choice.export}` : 'removed'} at ${r.confidence}`;
    console.log(`  review ${r.decl} [${r.why.join(', ')}]: ${answer}`);
  }
  if (review.length) console.log(`  see ${shown}/judge-review.json`);
  printUsage(answers);
  return report([written], { command: 'judge' });
}

/** @param {string} message */
function usageError(message) {
  return new Error(`judge: ${message}\n${SYNOPSIS}`);
}

/** @param {Record<string, string | undefined>} env */
async function clientFrom(env) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}

/** The covered releases plus `head`. @param {string} dataRoot @returns {string[]} */
function releaseList(dataRoot) {
  const file = path.join(dataRoot, 'releases.json');
  const doc = existsSync(file) ? readJson(file) : releases();
  return [...doc.releases, 'head'];
}

/** @param {string} dir @param {string} file @param {string} text */
function scratch(dir, file, text) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, file), text);
  return text;
}

/** @param {string} dir @param {string} cwd */
function display(dir, cwd) {
  const rel = path.relative(cwd, dir);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : dir;
}

/** @param {string} body @param {number} count */
function sizeLine(body, count) {
  return `${count} requests, ${Math.round(body.length / 1024)} KB, about ${Math.round(body.length / 4 / 1000)}k input tokens at 4 characters per token`;
}

/**
 * @param {{ ctx: import('../judge.mjs').Context, from: string, to: string, bundles: import('../judge.mjs').Bundle[], decided: number, open: number }} options
 */
function printSummary({ ctx, from, to, bundles, decided, open }) {
  const tokens = ctx.residue.reduce((n, item) => n + item.tokens.length, 0);
  const returned = [...ctx.residue, ...ctx.settled].filter((item) => item.chain.returned).length;
  console.log(`judge ${from} -> ${to}`);
  console.log(`  residue: ${ctx.residue.length} declarations (${tokens} tokens); git settles ${ctx.settled.length}`);
  if (returned) console.log(`  chains that resumed in a later release: ${returned}`);
  console.log(`  already decided: ${decided}; open: ${open}; judged in this run: ${bundles.length}`);
  /** @type {Array<[string, number, number]>} */
  const buckets = [
    ['0', 0, 0],
    ['1', 1, 1],
    ['2-3', 2, 3],
    ['4-7', 4, 7],
    ['8-15', 8, 15],
    ['16-31', 16, 31],
    ['32+', 32, Infinity],
  ];
  const counts = bundles.flatMap((b) => {
    const n = b.candidates.reduce((sum, c) => sum + c.tokens.length, 0);
    return b.source.tokens.map(() => n);
  });
  const widest = Math.max(1, ...buckets.map(([, lo, hi]) => counts.filter((n) => n >= lo && n <= hi).length));
  console.log('  candidate exports per residue token:');
  for (const [label, lo, hi] of buckets) {
    const n = counts.filter((c) => c >= lo && c <= hi).length;
    console.log(`    ${label.padStart(5)}  ${String(n).padStart(4)}  ${'#'.repeat(Math.round((n / widest) * 40))}`);
  }
  const none = bundles.filter((b) => !b.candidates.length);
  const noneTokens = none.flatMap((b) =>
    b.source.tokens.map((t) => ({ token: `${t.module} ${t.export}`, decl: b.decl }))
  );
  console.log(`  tokens with no candidate: ${noneTokens.length}`);
  for (const { token, decl } of noneTokens) console.log(`    ${token}  (${decl})`);
}

/** @param {ReturnType<typeof agreementReport>} result */
function printCalibration(result) {
  const pct = (/** @type {number} */ n, /** @type {number} */ d) => (d ? `${Math.round((n / d) * 100)}%` : '-');
  /** @param {string} label @param {{ answers: number, sameDeclaration: number, sameExport: number }} t */
  const row = (label, t) =>
    `  ${label.padEnd(13)}  ${String(t.answers).padStart(7)}  ${pct(t.sameDeclaration, t.answers).padStart(16)}  ${pct(t.sameExport, t.answers).padStart(11)}`;
  console.log(`judge --calibrate: ${result.answers} answers, ${result.errors} errors`);
  console.log('  confidence     answers  same declaration  same export');
  for (const b of result.buckets) console.log(row(`${b.from.toFixed(2)}-${b.to.toFixed(2)}`, b));
  console.log('  at or above    answers  same declaration  same export');
  for (const a of result.atOrAbove) console.log(row(a.threshold.toFixed(2), a));
  console.log('  settled by     answers  same declaration  same export');
  for (const [kind, t] of Object.entries(result.bySettled)) console.log(row(kind, t));
}

/** @param {import('../judge.mjs').Answer[]} answers */
function printUsage(answers) {
  const total = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  for (const a of answers) {
    for (const key of /** @type {Array<keyof typeof total>} */ (Object.keys(total))) {
      total[key] += Number(a.usage?.[key] ?? 0);
    }
  }
  console.log(
    `judge: usage ${total.input_tokens} input, ${total.output_tokens} output, ${total.cache_read_input_tokens} cache read, ${total.cache_creation_input_tokens} cache write tokens (batch pricing applies)`
  );
}

/**
 * `--check`: every decisions file (or the one for `--from`) is canonical, well formed, and not
 * stale against its surfaces. A missing file or surface is a missing input and throws.
 * @param {{ from?: string, dataRoot: string, cwd: string }} options
 */
function check({ from, dataRoot, cwd }) {
  const dir = path.join(dataRoot, 'decisions');
  const files = from
    ? [`${from}.json`]
    : existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith('.json'))
          .sort()
      : [];
  let problems = 0;
  for (const file of files) {
    const issues = checkFile(path.join(dir, file), file.slice(0, -'.json'.length), dataRoot);
    for (const issue of issues) console.log(`judge --check: ${display(path.join(dir, file), cwd)}: ${issue}`);
    problems += issues.length;
  }
  console.log(`judge --check: ${files.length} decision files, ${problems} problems`);
  return problems ? 1 : 0;
}

/** @param {string} file @param {string} from @param {string} dataRoot @returns {string[]} */
function checkFile(file, from, dataRoot) {
  if (!existsSync(file)) throw new InputError(`judge --check: ${path.relative(dataRoot, file)} does not exist`);
  const text = readFileSync(file, 'utf8');
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (error) {
    return [`not JSON: ${/** @type {Error} */ (error).message}`];
  }
  const issues = [];
  if (doc.schema !== 1 || doc.kind !== 'decisions') issues.push('not a schema 1 decisions document');
  if (doc.from !== from) issues.push(`from is ${doc.from} but the file is named for ${from}`);
  if (typeof doc.to !== 'string') issues.push('to is not a version');
  if (!Array.isArray(doc.entries)) return [...issues, 'entries is not an array'];
  if (text !== canonical(doc)) issues.push('not canonical: keys sorted, two-space indent, trailing newline');
  const seen = new Set();
  for (const entry of doc.entries) {
    const problem = entryProblem(entry);
    if (problem) issues.push(`${entry?.decl ?? 'an entry'}: ${problem}`);
    else if (seen.has(entry.decl)) issues.push(`${entry.decl}: decided twice`);
    seen.add(entry?.decl);
  }
  if (doc.entries.length && typeof doc.to === 'string' && typeof doc.from === 'string') {
    const surfaceFiles = [doc.from, doc.to].map((v) => path.join(dataRoot, 'surfaces', `${v}.json`));
    const missing = surfaceFiles.filter((f) => !existsSync(f));
    if (missing.length) {
      const names = missing.map((f) => path.relative(dataRoot, f)).join(', ');
      throw new InputError(`judge --check: ${path.relative(dataRoot, file)} needs ${names} to check its entries`);
    }
    const [fromSurface, toSurface] = surfaceFiles.map((f) => readJson(f));
    for (const p of staleDecisions({ decisions: doc, fromSurface, toSurface })) {
      issues.push(`${p.decl}: stale, ${p.problem}`);
    }
  }
  return issues;
}

/** @param {any} ref */
const isRef = (ref) => Boolean(ref) && typeof ref.module === 'string' && typeof ref.export === 'string';

/** @param {any} entry @returns {string | null} */
function entryProblem(entry) {
  if (!entry || typeof entry !== 'object') return 'not an object';
  if (typeof entry.decl !== 'string') return 'decl is not a string';
  if (!isRef(entry.source)) return 'source is not { module, export }';
  if (entry.choice !== null && !isRef(entry.choice)) return 'choice is neither null nor { module, export }';
  if (typeof entry.confidence !== 'number' || entry.confidence < 0 || entry.confidence > 1) {
    return 'confidence is not a number from 0 to 1';
  }
  if (typeof entry.reason !== 'string') return 'reason is not a string';
  if (typeof entry.judge !== 'string') return 'judge is not a string';
  if (typeof entry.reviewed !== 'boolean') return 'reviewed is not true or false';
  if (entry.choice !== null && (entry.removedIn !== undefined || entry.shim !== undefined)) {
    return 'removedIn and shim belong to choice: null';
  }
  return null;
}
