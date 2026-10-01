/* eslint-disable no-console -- a command reports on stdout and stderr */
/**
 * `cli.mjs judge --from <v> [--to <v>] [--dry-run] [--judge claude|jev|thread] [--threshold 0.8]
 * [--calibrate] [--check] [--import <answers.json>]` and `cli.mjs judge --compare <a> <b>`: judges
 * the residue of a release pair and writes decisions. See judge.mjs for the live procedure and
 * jev.mjs for Jev.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { DATA_ROOT, REPO_ROOT, canonical, readJson, releases, report, writeArtifact } from '../artifacts.mjs';
import { JEV, JEV_KEY, askJev, jevKey, jevRequests, rankWithJev } from '../jev.mjs';
import {
  DEFAULT_EFFORT,
  DEFAULT_OUT,
  DEFAULT_POLL_SECONDS,
  DEFAULT_THRESHOLD,
  InputError,
  JUDGE_MODEL,
  SETTLED_BY,
  agreementReport,
  askClaude,
  buildContext,
  calibrationBundles,
  compareDecisions,
  decide,
  defaultGit,
  evidenceFor,
  importedAnswers,
  indexSurface,
  loadInputs,
  requestFor,
  shimFor,
  staleDecisions,
} from '../judge.mjs';

export const name = 'judge';
export const describe =
  'judge the residue of a release pair (Claude, Jev or the project thread) and write decisions/<from>.json';

/** What each judge writes into a decision's `judge` field. */
const JUDGE_FIELD = { claude: JUDGE_MODEL, jev: JEV, thread: 'thread' };
const JUDGE_NAMES = /** @type {Array<keyof typeof JUDGE_FIELD>} */ (Object.keys(JUDGE_FIELD));

const SYNOPSIS = `usage: cli.mjs judge --from <version> [--to <version>] [--dry-run] [--judge claude|jev|thread]
                     [--threshold 0.8] [--calibrate] [--check] [--import <answers.json>] [--limit <n>]
                     [--effort low|medium|high|xhigh|max] [--batch <id>] [--poll <seconds>] [--out <dir>]
       cli.mjs judge --compare <a.json> <b.json> [--threshold 0.8]`;

const USAGE = `${SYNOPSIS}

  --from       the release whose residue is judged (decisions/<from>.json)
  --to         the release the successors come from (default: the newest in releases.json)
  --dry-run    write the evidence bundles and request bodies, print a summary, send nothing
  --judge      claude (default), jev (TypeSafe AI's Jev) or thread (the answers of --import)
  --threshold  lowest confidence written as a decision (default ${DEFAULT_THRESHOLD}); --compare lists what is below it
  --calibrate  judge the declarations git settles, blind, and report agreement; writes no decisions
  --check      fail on stale or malformed decisions files (all of them unless --from is given)
  --import     answers a person or the project thread gave from the dry-run bundles:
               { "<decl>": { "choice": { "module", "export" } | null, "confidence": 0.9, "reason": "..." } }
  --compare    where two decisions files (or review or answers files) agree and differ
  --limit      judge only the first n declarations
  --effort     output_config.effort for claude-opus-5-5 (default ${DEFAULT_EFFORT})
  --batch      resume polling an existing message batch instead of creating one (claude)
  --poll       seconds between batch status checks (default ${DEFAULT_POLL_SECONDS}) (claude)
  --out        scratch output directory (default ${path.relative(REPO_ROOT, DEFAULT_OUT)})

The judge preferences.json names ("judge", default claude) writes decisions/<from>.json; any
other writes <out>/<from>-<to>/decisions.<judge>.json. A live run reads ANTHROPIC_API_KEY
(claude) or ${JEV_KEY} (jev) from the environment.`;

/** @type {import('node:util').ParseArgsConfig['options']} */
const OPTIONS = {
  from: { type: 'string' },
  to: { type: 'string' },
  'dry-run': { type: 'boolean', default: false },
  judge: { type: 'string' },
  threshold: { type: 'string' },
  calibrate: { type: 'boolean', default: false },
  check: { type: 'boolean', default: false },
  import: { type: 'string' },
  compare: { type: 'boolean', default: false },
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
 * @property {string} [cwd]  the directory the command was run from; relative paths resolve against it
 * @property {import('../judge.mjs').Git} [git]  runs git; tests stub it
 * @property {any} [client]  an Anthropic client; tests pass a fake, a live run builds one from `ANTHROPIC_API_KEY`
 * @property {import('../jev.mjs').Fetch} [fetch]  Jev's HTTP layer; tests pass a fake, a live run uses `globalThis.fetch`
 * @property {Record<string, string | undefined>} [env]  where `ANTHROPIC_API_KEY` and `TYPESAFE_API_KEY` are read from
 * @property {(ms: number) => Promise<unknown>} [sleep]  waits between batch polls and before Jev retries
 */

/**
 * Throws on a usage error or a missing input (cli.mjs prints the message and exits 1).
 * @param {string[]} argv  the arguments after `judge`
 * @param {JudgeContext} [context]  `{ dataRoot, cwd }` from cli.mjs, plus what tests inject
 * @returns {Promise<number>} the exit code: 0 done, 1 `--check` found problems
 */
export async function run(argv, context = {}) {
  const { dataRoot = DATA_ROOT, cwd = process.cwd(), env = process.env } = context;
  /** @type {Record<string, any>} */
  let args;
  /** @type {string[]} */
  let positionals;
  try {
    ({ values: args, positionals } = parseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: true }));
  } catch (error) {
    throw usageError(/** @type {Error} */ (error).message);
  }
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  const threshold = args.threshold === undefined ? DEFAULT_THRESHOLD : Number(args.threshold);
  if (!(threshold >= 0 && threshold <= 1)) throw usageError('--threshold takes a number from 0 to 1');
  if (args.compare) {
    if (positionals.length !== 2) throw usageError('--compare takes two files');
    return compare({ files: positionals, threshold, dataRoot, cwd, to: args.to });
  }
  if (positionals.length) throw usageError(`unexpected argument ${positionals[0]}`);
  if (args.check) return check({ from: args.from, dataRoot, cwd });

  if (args.judge !== undefined && !JUDGE_NAMES.includes(args.judge)) {
    throw usageError(`unknown judge ${args.judge}; use ${JUDGE_NAMES.join(', ')}`);
  }
  if (args.import !== undefined && args.judge !== undefined && args.judge !== 'thread') {
    throw usageError(
      `--import records the answers of a person or the project thread; it takes no --judge ${args.judge}`
    );
  }
  /** @type {keyof typeof JUDGE_FIELD} */
  const judgeName = args.import !== undefined ? 'thread' : (args.judge ?? 'claude');
  if (judgeName === 'thread' && args.import === undefined) {
    throw usageError('--judge thread takes its answers from --import <answers.json>');
  }
  if (judgeName === 'thread' && args.calibrate) throw usageError('--calibrate asks a model: use --judge claude or jev');
  const claudeOnly = ['effort', 'batch', 'poll'].filter((flag) => args[flag] !== undefined);
  if (judgeName !== 'claude' && claudeOnly.length) {
    throw usageError(`--${claudeOnly[0]} is for --judge claude`);
  }
  if (!args.from) throw usageError('--from is required');
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
  const preferred = inputs.preferences?.judge ?? 'claude';
  if (!JUDGE_NAMES.includes(preferred)) {
    throw new InputError(`judge: preferences.json names judge ${preferred}; use ${JUDGE_NAMES.join(', ')}`);
  }
  // the judge preferences.json names writes decisions/<from>.json; another judge marks its files
  const official = judgeName === preferred;
  const named = (/** @type {string} */ file) => (official ? file : file.replace(/\.json$/, `.${judgeName}.json`));
  const ctx = buildContext({ ...inputs, git: context.git ?? defaultGit() });
  const outDir = path.join(path.resolve(cwd, args.out ?? DEFAULT_OUT), `${from}-${to}`);
  const shown = display(outDir, cwd);
  const dryRun = args['dry-run'];

  /** @param {import('../judge.mjs').Bundle[]} bundles @param {string} prefix */
  const ask = async (bundles, prefix) => {
    if (judgeName === JEV) return askJev(bundles, jevSettings());
    if (!context.client && !env.ANTHROPIC_API_KEY) {
      throw new InputError('judge: ANTHROPIC_API_KEY is not set; export it for a live run, or pass --dry-run');
    }
    /** @type {Array<{ id: string, round: number, requests: number }>} */
    const batches = [];
    return askClaude(bundles, {
      client: context.client ?? (await clientFrom(env)),
      model: JUDGE_MODEL,
      effort,
      tieBreak: ctx.tieBreak,
      pollIntervalMs: poll * 1000,
      batchId: args.batch ?? null,
      sleep: context.sleep,
      log: (line) => console.log(line),
      onBatch: (batch, info) => {
        batches.push({ id: batch.id, round: info.round, requests: info.requests });
        scratch(outDir, `${prefix}${named('batches.json')}`, canonical(batches));
      },
    });
  };
  /** @returns {import('../jev.mjs').JevOptions} */
  const jevSettings = () => ({
    fetch: context.fetch ?? globalThis.fetch,
    apiKey: jevKey(env),
    sleep: context.sleep,
    log: (line) => console.log(line),
  });
  /** The request bodies as a dry run writes them. @param {import('../judge.mjs').Bundle[]} bundles */
  const requestsOf = (bundles) => {
    if (judgeName === JEV) {
      const doc = jevRequests(bundles);
      return { text: `${JSON.stringify(doc, null, 2)}\n`, count: doc.requests.length, unsent: doc.unsent.length };
    }
    const requests = bundles.map((b) => requestFor(b, { model: JUDGE_MODEL, effort, tieBreak: ctx.tieBreak }));
    return { text: `${JSON.stringify({ requests }, null, 2)}\n`, count: requests.length, unsent: 0 };
  };

  if (args.calibrate) {
    const { bundles, truth } = calibrationBundles(ctx, { limit });
    const requests = requestsOf(bundles);
    scratch(outDir, 'calibration-bundles.json', canonical(bundles));
    const requestsFile = `calibration-${named('requests.json')}`;
    scratch(outDir, requestsFile, requests.text);
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
      `  wrote ${shown}/calibration-bundles.json and ${requestsFile} (${sizeLine(requests.text, requests.count)})`
    );
    if (dryRun) {
      console.log('judge: dry run, nothing sent');
      return 0;
    }
    const answers = await ask(bundles, 'calibration-');
    scratch(outDir, `calibration-${named('answers.json')}`, canonical(answers));
    const result = agreementReport(answers, truth);
    scratch(outDir, named('calibration.json'), canonical({ from, to, report: result, truth }));
    printCalibration(result);
    printUsage(answers, judgeName);
    return 0;
  }

  const decisionsFile = official
    ? path.join(dataRoot, 'decisions', `${from}.json`)
    : path.join(outDir, `decisions.${judgeName}.json`);
  const existing = official ? (inputs.decisions?.entries ?? []) : entriesIn(decisionsFile);
  const stale = staleDecisions({
    decisions: { from, to, entries: existing },
    fromSurface: inputs.surfaces[from],
    toSurface: inputs.surfaces[to],
  });
  const staleDecls = new Set(stale.map((p) => p.decl));
  for (const p of stale) console.log(`judge: dropping the stale decision for ${p.decl}: ${p.problem}`);
  const kept = existing.filter((/** @type {any} */ e) => !staleDecls.has(e.decl));
  const decided = new Set(kept.map((/** @type {any} */ e) => /** @type {string} */ (e.decl)));
  const open = ctx.residue.filter((item) => !decided.has(item.decl));

  /** @type {import('../judge.mjs').Bundle[]} */
  let bundles;
  /** @type {import('../judge.mjs').Answer[]} */
  let answers;
  if (judgeName === 'thread') {
    const imported = importedAnswers(readJsonInput(path.resolve(cwd, args.import), cwd), {
      residue: ctx.residue.map((item) => item.decl),
      decided,
    });
    for (const s of imported.skipped) console.log(`judge --import: skipped ${s.decl}: ${s.why}`);
    const answeredDecls = new Set(imported.answers.map((a) => a.decl));
    bundles = open.filter((item) => answeredDecls.has(item.decl)).map((item) => evidenceFor(item, ctx));
    answers = imported.answers;
    console.log(
      `judge --import ${from} -> ${to}: ${answers.length} answers for ${open.length} open declarations, ${imported.skipped.length} skipped`
    );
    if (dryRun) {
      const { entries, review } = decide({
        residue: bundles,
        answers,
        threshold,
        toSurface: ctx.toIndex,
        judge: JUDGE_FIELD.thread,
        tieBreak: ctx.tieBreak,
      });
      printDecided(entries.length, review, threshold);
      console.log('judge: dry run, nothing written');
      return 0;
    }
  } else {
    bundles = (limit ? open.slice(0, limit) : open).map((item) => evidenceFor(item, ctx));
    const requests = requestsOf(bundles);
    scratch(outDir, 'bundles.json', canonical(bundles));
    scratch(outDir, named('requests.json'), requests.text);
    printSummary({ ctx, from, to, bundles, decided: decided.size, open: open.length });
    console.log(
      `  wrote ${shown}/bundles.json and ${named('requests.json')} (${sizeLine(requests.text, requests.count)})`
    );
    if (requests.unsent) {
      console.log(`  declarations without candidates, not sent to Jev and left for review: ${requests.unsent}`);
    }
    if (dryRun) {
      console.log('judge: dry run, nothing sent');
      return 0;
    }
    answers = bundles.length ? await ask(bundles, '') : [];
    scratch(outDir, named('answers.json'), canonical(answers));
  }

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
    judge: JUDGE_FIELD[judgeName],
    tieBreak: ctx.tieBreak,
  });
  if (judgeName === JEV && review.length) await attachScores(review, bundles, jevSettings());
  scratch(outDir, named('judge-review.json'), canonical(review));
  const merged = [...kept, ...entries].sort((a, b) => (a.decl < b.decl ? -1 : a.decl > b.decl ? 1 : 0));
  const doc = { schema: 1, kind: 'decisions', from, to, entries: merged };
  const written = official ? writeArtifact(decisionsFile, doc) : null;
  if (!official) scratch(outDir, named('decisions.json'), canonical(doc));
  printDecided(entries.length, review, threshold);
  if (review.length) console.log(`  see ${shown}/${named('judge-review.json')}`);
  printUsage(answers, judgeName);
  if (written) return report([written], { command: 'judge' });
  console.log(
    `judge: wrote ${shown}/${named('decisions.json')} (${merged.length} entries); decisions/${from}.json belongs to ${preferred} (preferences.json "judge")`
  );
  return 0;
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

/** A JSON file a person points at: missing or broken is a missing input. @param {string} file @param {string} cwd */
function readJsonInput(file, cwd) {
  if (!existsSync(file)) throw new InputError(`judge: ${display(file, cwd)} does not exist`);
  try {
    return readJson(file);
  } catch (error) {
    throw new InputError(`judge: ${display(file, cwd)} is not JSON: ${/** @type {Error} */ (error).message}`);
  }
}

/** The entries of a decisions file a second judge wrote earlier, if any. @param {string} file */
function entriesIn(file) {
  if (!existsSync(file)) return [];
  const doc = readJson(file);
  return Array.isArray(doc?.entries) ? doc.entries : [];
}

/**
 * Scores the candidates of every declaration that goes to review and keeps the scores there. A
 * failed ranking is noted on the entry; the run goes on.
 * @param {any[]} review
 * @param {import('../judge.mjs').Bundle[]} bundles
 * @param {import('../jev.mjs').JevOptions} settings
 */
async function attachScores(review, bundles, settings) {
  const inReview = new Set(review.map((r) => r.decl));
  const ranked = await rankWithJev(
    bundles.filter((b) => inReview.has(b.decl)),
    settings
  );
  let failed = 0;
  for (const entry of review) {
    const result = ranked.get(entry.decl);
    if (!result) continue;
    if ('scores' in result) entry.scores = result.scores;
    else {
      entry.scoresError = result.error;
      failed++;
    }
  }
  console.log(
    `judge: Jev ranked the candidates of the review entries: ${ranked.size - failed} scored, ${failed} failed`
  );
}

/** @param {number} decisions @param {any[]} review @param {number} threshold */
function printDecided(decisions, review, threshold) {
  console.log(`judge: ${decisions} decisions at or above ${threshold}, ${review.length} for review`);
  for (const r of review) {
    const answer = r.error ?? `${r.choice ? `${r.choice.module} ${r.choice.export}` : 'removed'} at ${r.confidence}`;
    console.log(`  review ${r.decl} [${r.why.join(', ')}]: ${answer}`);
  }
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

/** @param {import('../judge.mjs').Answer[]} answers @param {string} judgeName */
function printUsage(answers, judgeName) {
  if (judgeName === 'thread') return;
  const total = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  for (const a of answers) {
    for (const key of /** @type {Array<keyof typeof total>} */ (Object.keys(total))) {
      total[key] += Number(a.usage?.[key] ?? 0);
    }
  }
  if (judgeName === JEV) {
    console.log(
      `judge: usage ${total.input_tokens} input, ${total.output_tokens} output tokens (Jev bills input tokens only)`
    );
    return;
  }
  console.log(
    `judge: usage ${total.input_tokens} input, ${total.output_tokens} output, ${total.cache_read_input_tokens} cache read, ${total.cache_creation_input_tokens} cache write tokens (batch pricing applies)`
  );
}

/** @param {any} entry */
function sideLine(entry) {
  if (!entry) return 'no entry';
  if (entry.error !== undefined) return `error: ${entry.error}`;
  if (entry.choice === undefined) return 'no answer';
  const choice = entry.choice ? `${entry.choice.module} ${entry.choice.export}` : 'removed';
  return `${choice} at ${entry.confidence}${entry.reason ? `: ${entry.reason}` : ''}`;
}

/**
 * `--compare <a> <b>`: where two judges agree, where they differ, and what is below the threshold,
 * for a person to read. Each file is a decisions file, a review file or an answers file.
 * @param {{ files: string[], threshold: number, dataRoot: string, cwd: string, to?: string }} options
 */
function compare({ files, threshold, dataRoot, cwd, to }) {
  const [a, b] = files.map((file) => {
    const absolute = path.resolve(cwd, file);
    const doc = readJsonInput(absolute, cwd);
    const entries = Array.isArray(doc) ? doc : doc?.entries;
    if (!Array.isArray(entries)) {
      throw new InputError(
        `judge --compare: ${display(absolute, cwd)} has no entries (a decisions, review or answers file)`
      );
    }
    const judges = [...new Set(entries.map((e) => e?.judge).filter((j) => typeof j === 'string'))].sort();
    return { shown: display(absolute, cwd), entries, judges, to: typeof doc?.to === 'string' ? doc.to : undefined };
  });
  const target = to ?? a.to ?? b.to;
  const surfaceFile = target && path.join(dataRoot, 'surfaces', `${target}.json`);
  /** @type {((ref: { module: string, export: string }) => string | undefined) | undefined} */
  let declOf;
  if (surfaceFile && existsSync(surfaceFile)) {
    const decls = new Map(indexSurface(readJson(surfaceFile)).tokens.map((t) => [`${t.module} ${t.export}`, t.decl]));
    declOf = (ref) => decls.get(`${ref.module} ${ref.export}`);
  }
  const result = compareDecisions(a.entries, b.entries, { threshold, declOf });
  const both = result.agree.length + result.sameDeclaration.length + result.disagree.length;
  const pct = (/** @type {number} */ n) => (both ? ` (${Math.round((n / both) * 100)}%)` : '');
  console.log('judge --compare');
  for (const [label, side] of /** @type {const} */ ([
    ['A', a],
    ['B', b],
  ])) {
    console.log(
      `  ${label}: ${side.shown}, ${side.entries.length} entries${side.judges.length ? ` (${side.judges.join(', ')})` : ''}`
    );
  }
  console.log(
    `  both answered ${both}: agree ${result.agree.length}${pct(result.agree.length)}, same declaration through another export ${result.sameDeclaration.length}, disagree ${result.disagree.length}`
  );
  console.log(`  only A answered ${result.onlyA.length}, only B answered ${result.onlyB.length}`);
  if (!declOf) {
    const missing = `surfaces/${target ?? '<to>'}.json`;
    console.log(`  (no ${missing}, so another export of the same declaration counts as a disagreement)`);
  }
  const listed = new Set();
  /** @param {string} title @param {Array<{ decl: string, a: any, b: any }>} sides */
  const section = (title, sides) => {
    if (!sides.length) return;
    console.log(`  ${title}:`);
    for (const side of sides) {
      listed.add(side.decl);
      console.log(`    ${side.decl}`);
      console.log(`      A: ${sideLine(side.a)}`);
      console.log(`      B: ${sideLine(side.b)}`);
    }
  };
  section('disagreements', result.disagree);
  section('same declaration, another export', result.sameDeclaration);
  section(
    `below ${threshold} in either file, not listed above`,
    result.low.filter((side) => !listed.has(side.decl))
  );
  section(
    'only A answered',
    result.onlyA.filter((side) => !listed.has(side.decl))
  );
  section(
    'only B answered',
    result.onlyB.filter((side) => !listed.has(side.decl))
  );
  return 0;
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
