/**
 * Area E of the public exports mapping pipeline (see CONTRACT.md and judge.mts): TypeSafe AI's
 * Jev as a second judge, `judge --judge jev`.
 *
 * Jev is a "System One" model (https://docs.typesafe.ai/introduction): it answers typed questions
 * about a `state` with a probability per option and a confidence, and writes no text. For each
 * residue declaration the judge sends the evidence Claude reads (`renderEvidence`, without the
 * tool instruction) as the state and asks one Choice, `successor`: which candidate continues the
 * declaration, or `removed`. An option is a candidate declaration, named after the export the
 * contract's ranking puts first among its exports (`<export> from <module>`) and described by its
 * number and id in the state. Most candidates carry several exports (125 of the 174 candidates of
 * 4.12.8 -> 5.9.1, up to 12 each): an option per export would split one declaration's
 * probability between them and lower the confidence for a reason that is not part of the
 * judgment, and picking among one declaration's exports is the ranking's job. A bundle without
 * candidates is not sent; its answer is an error, so it goes to review.
 *
 * `decide` (judge.mts) turns the answers into decisions entries with `judge: "jev"`: the chosen
 * export, or `null` for `removed`; Jev's `confidence` (how concentrated the probabilities are,
 * which is what the docs gate actions on); and a reason that lists where the probability went,
 * since Jev gives none.
 *
 * `rankWithJev` sends a second request per declaration with one Score per candidate, from 0 (a
 * different thing) to 3 (the same thing renamed or moved, or a drop-in replacement). The command
 * ranks the declarations that go to review and keeps the scores in the review file; a ranking
 * that fails is recorded there and never stops the run.
 *
 * ## The API (https://docs.typesafe.ai/api.md)
 *
 * ```
 * POST https://api.typesafe.ai/v1/systemone
 * Authorization: Bearer $TYPESAFE_API_KEY
 * Content-Type: application/json
 *
 * { "model": "jev-latest", "state": "<evidence>", "questions": { "successor": { "type": "choice",
 *   "instructions": "...", "criteria": { "<export> from <module>": "Candidate [1] ...", "removed": "..." } } } }
 *
 * -> { "model": "jev-1.13.0", "answers": { "successor": { "type": "choice", "choice": "<option>",
 *      "probabilities": { "<option>": 0.88, ... }, "confidence": 0.81 } },
 *      "usage": { "input_tokens": 318, "output_tokens": 34 } }
 * ```
 *
 * The key comes from `TYPESAFE_API_KEY`, the variable the docs and TypeSafe's SDKs read, and
 * goes into the Authorization header and nowhere else. 429 and 529 (and 408, other 5xx and
 * network failures) are retried with exponential backoff or after the `retry-after` the response
 * names; 401 and 403 stop the run; any other status is that declaration's error. The HTTP layer is
 * one injectable `fetch`-compatible function (`globalThis.fetch` by default; behind a proxy, run
 * node with `NODE_USE_ENV_PROXY=1`). The docs' limits for jev-1.13: 255 options per Choice, 2 to
 * 10 levels per Score, 32k tokens for the state plus the longest question, 40 requests and 100k
 * tokens per second. Jev bills input tokens only, $0.042 per million. For
 * 4.12.8 -> 5.9.1 that is 26 requests and about 110k tokens (8 of the 34 residue declarations have
 * no candidates), one ranking request per review entry, and 91 requests and about 340k tokens for
 * `--calibrate`: about two cents in all.
 *
 * ## Live procedure
 *
 * 1. `export TYPESAFE_API_KEY=...`
 * 2. `node scripts/public-exports-mapping/cli.mts judge --from 4.12.8 --judge jev --dry-run` writes
 *    the bundles and `requests.jev.json`, the exact bodies (the key shows as a placeholder).
 * 3. `... judge --from 4.12.8 --judge jev --calibrate` judges what git settled, blind, and prints
 *    agreement per confidence bucket and per kind; read the threshold from the `symbols` row.
 * 4. `... judge --from 4.12.8 --judge jev --threshold <t>` writes
 *    `<out>/4.12.8-5.9.1/decisions.jev.json` and `judge-review.jev.json` (with the scores), or
 *    `decisions/4.12.8.json` when `preferences.json` names `"judge": "jev"`.
 * 5. `... judge --compare packages/eslint-plugin-warp-drive/src/legacy-import-mapping/decisions/4.12.8.json
 *    tmp/public-exports-mapping/judge/4.12.8-5.9.1/decisions.jev.json` prints where Claude and Jev agree,
 *    where they differ, and the entries below the threshold.
 */
import { setTimeout as delay } from 'node:timers/promises';

import { InputError, renderEvidence, validateAnswer, type Answer, type Bundle, type TokenRef } from './judge.mts';

export const JEV = 'jev';
export const JEV_MODEL = 'jev-latest';
export const JEV_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
export const JEV_KEY = 'TYPESAFE_API_KEY';
export const SUCCESSOR_QUESTION = 'successor';
export const REMOVED = 'removed';
/** A Choice takes at most 255 options, and one of them is `removed`. */
export const MAX_CANDIDATES = 254;
export const NO_CANDIDATES = 'no candidates: Jev chooses among candidates, so a person decides this one';
/** The Score levels of `rankWithJev`, low to high: descriptive situations, no numbers, as the docs advise. */
export const SCORE_LEVELS = [
  'A different thing: it shares a name, a file or a feature with the declaration but does another job.',
  'Related: it works with the same feature, but code that imported the declaration cannot switch to it.',
  'A partial or reworked replacement: it takes over part of the job, or needs different calling code.',
  'The same thing renamed or moved, or a drop-in replacement that code importing the declaration can switch to.',
];
const REMOVED_DESCRIPTION =
  'The declaration was removed: none of the candidates is the same thing renamed or moved, or a drop-in replacement that code importing it can switch to.';
const RETRIES = 4;
const BACKOFF_MS = 1000;
const MAX_WAIT_MS = 60_000;
const TIMEOUT_MS = 60_000;

export type JevAnswer = Answer & { probabilities?: Record<string, number>; model?: string };
export type JevResponse = {
  ok: boolean;
  status: number;
  headers?: { get(name: string): string | null } | null;
  text(): Promise<string>;
};
/** The HTTP layer: `globalThis.fetch`, or a fake in tests. */
export type Fetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }
) => Promise<JevResponse>;
export type JevOptions = {
  fetch: Fetch;
  apiKey: string;
  model?: string;
  endpoint?: string;
  retries?: number;
  backoffMs?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<unknown>;
  log?: (line: string) => void;
};
export type SuccessorOption = { candidate: number; decl: string; token: TokenRef; via?: string[] };
export type JevScore = { candidate: number; choice: TokenRef; decl: string; score: number; confidence: number };

/**
 * The key, from the environment only.
 */
export function jevKey(env: Record<string, string | undefined>) {
  const key = env[JEV_KEY];
  if (!key) {
    throw new InputError(`judge: ${JEV_KEY} is not set; export it for a live --judge jev run, or pass --dry-run`);
  }
  return key;
}

const optionName = (token: TokenRef) => `${token.export} from ${token.module}`;

const round = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;

/**
 * The candidate options of the successor Choice, by option name: one per candidate declaration,
 * named after the export the ranking puts first (`evidenceFor` sorts a candidate's tokens).
 */
export function successorOptions(bundle: Bundle): Map<string, SuccessorOption> {
  const options = new Map<string, SuccessorOption>();
  bundle.candidates.slice(0, MAX_CANDIDATES).forEach((candidate, i) => {
    const best = candidate.tokens[0];
    if (!best) return;
    const option: SuccessorOption = {
      candidate: i + 1,
      decl: candidate.decl,
      token: { module: best.module, export: best.export },
    };
    if (candidate.via?.length) option.via = candidate.via;
    options.set(optionName(best), option);
  });
  return options;
}

function describeOption({ candidate, decl, via }: SuccessorOption) {
  return `Candidate [${candidate}] in the state, declaration \`${decl}\`${via?.length ? `, found by ${via.join(', ')}` : ''}.`;
}

function successorInstructions(bundle: Bundle) {
  return `The state describes a declaration that WarpDrive (formerly EmberData) ${bundle.from} exported and that git could not follow into ${bundle.to}, and candidate declarations of ${bundle.to}. Which candidate continues it: the same class, function, constant or type renamed or moved, or a drop-in replacement that code importing it can switch to? A replacement that needs different calling code, or that covers only part of it, does not continue it.`;
}

/**
 * The body of the successor request for one bundle, or null when it has no candidates.
 */
export function jevRequestFor(bundle: Bundle, { model = JEV_MODEL }: { model?: string } = {}) {
  const options = successorOptions(bundle);
  if (!options.size) return null;
  const criteria: Record<string, string> = {};
  for (const [name, option] of options) criteria[name] = describeOption(option);
  criteria[REMOVED] = REMOVED_DESCRIPTION;
  return {
    model,
    state: renderEvidence(bundle).trimEnd(),
    questions: {
      [SUCCESSOR_QUESTION]: { type: 'choice', instructions: successorInstructions(bundle), criteria },
    },
  };
}

/**
 * The body of the ranking request for one bundle: one Score per candidate, or null when it has
 * no candidates.
 */
export function jevRankRequestFor(bundle: Bundle, { model = JEV_MODEL }: { model?: string } = {}) {
  const options = successorOptions(bundle);
  if (!options.size) return null;
  const questions: Record<string, { type: 'score'; instructions: string; criteria: string[] }> = {};
  for (const [name, option] of options) {
    questions[`candidate_${option.candidate}`] = {
      type: 'score',
      instructions: `How well does candidate [${option.candidate}], ${name} (declaration \`${option.decl}\`), continue the declaration the state describes?`,
      criteria: SCORE_LEVELS,
    };
  }
  return { model, state: renderEvidence(bundle).trimEnd(), questions };
}

/**
 * What a dry run writes: every request as it is sent, the key replaced by a placeholder.
 */
export function jevRequests(
  bundles: Bundle[],
  { model = JEV_MODEL, endpoint = JEV_ENDPOINT }: { model?: string; endpoint?: string } = {}
) {
  const requests = [];
  const unsent: string[] = [];
  for (const bundle of bundles) {
    const body = jevRequestFor(bundle, { model });
    if (body) requests.push({ id: bundle.id, decl: bundle.decl, body });
    else unsent.push(bundle.decl);
  }
  return {
    method: 'POST',
    endpoint,
    headers: { authorization: `Bearer $${JEV_KEY}`, 'content-type': 'application/json' },
    requests,
    unsent,
  };
}

/** Numeric entries of a response map, rounded. */
function numbers(map: unknown) {
  const out: Record<string, number> = {};
  if (!map || typeof map !== 'object') return out;
  for (const [key, value] of Object.entries(map)) {
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = round(value, 3);
  }
  return out;
}

/**
 * Jev gives no reasons, so the reason says where it put its probability: the leading options,
 * with how each candidate was found.
 */
export function jevReason(
  model: string,
  probabilities: Record<string, number>,
  options: Map<string, SuccessorOption>,
  choice: string
) {
  const label = (name: string) => {
    const option = options.get(name);
    if (!option) return name;
    return `[${option.candidate}] ${name}${option.via?.length ? ` (found by ${option.via.join(', ')})` : ''}`;
  };
  const ranked = Object.entries(probabilities).sort(([a, p], [b, q]) => q - p || (a < b ? -1 : a > b ? 1 : 0));
  const shown = ranked.filter(([, p], i) => i < 3 && (i === 0 || p >= 0.01));
  if (!shown.length) return `Jev (${model}) chose ${label(choice)}.`;
  return `Jev (${model}) put ${shown.map(([name, p]) => `${p.toFixed(2)} on ${label(name)}`).join(', ')}.`;
}

/**
 * Reads the successor answer of a response body. A choice that is not an option is an error.
 */
export function parseJevChoice(response: any, bundle: Bundle): Omit<JevAnswer, 'decl' | 'id'> {
  const usage = response?.usage && typeof response.usage === 'object' ? numbers(response.usage) : undefined;
  const answer = response?.answers?.[SUCCESSOR_QUESTION];
  if (!answer || typeof answer.choice !== 'string') {
    return { error: `no ${SUCCESSOR_QUESTION} answer in the response`, retryable: true, usage };
  }
  const options = successorOptions(bundle);
  const option = options.get(answer.choice);
  if (!option && answer.choice !== REMOVED) {
    return { error: `Jev chose ${JSON.stringify(answer.choice)}, which is not an option`, retryable: false, usage };
  }
  const model = typeof response.model === 'string' ? response.model : JEV_MODEL;
  const probabilities = numbers(answer.probabilities);
  const checked = validateAnswer({
    choice: option ? option.token : null,
    confidence: answer.confidence,
    reason: jevReason(model, probabilities, options, answer.choice),
  });
  if ('error' in checked) return { error: checked.error, retryable: false, usage };
  return { ...checked.value, probabilities, model, usage };
}

/**
 * Reads the Score answers of a ranking response, best first.
 */
export function parseJevScores(response: any, bundle: Bundle): { scores: JevScore[] } | { error: string } {
  const scores: JevScore[] = [];
  for (const option of successorOptions(bundle).values()) {
    const answer = response?.answers?.[`candidate_${option.candidate}`];
    if (typeof answer?.score !== 'number' || !Number.isFinite(answer.score)) continue;
    const confidence = typeof answer.confidence === 'number' ? round(answer.confidence, 2) : 0;
    scores.push({
      candidate: option.candidate,
      choice: option.token,
      decl: option.decl,
      score: round(answer.score, 2),
      confidence,
    });
  }
  if (!scores.length) return { error: 'no score answers in the response' };
  return { scores: scores.sort((a, b) => b.score - a.score || a.candidate - b.candidate) };
}

/** The message of an error body: `error.message`, `message` or `detail`, else the text. */
function errorDetail(text: string) {
  let detail = text;
  try {
    const body = JSON.parse(text);
    const found = body?.error?.message ?? body?.message ?? body?.detail ?? body?.error;
    if (found !== undefined) detail = typeof found === 'string' ? found : JSON.stringify(found);
  } catch {
    // not JSON: the text is the detail
  }
  const flat = detail.replace(/\s+/g, ' ').trim();
  return flat.length > 300 ? `${flat.slice(0, 300)}...` : flat;
}

function retryAfterMs(headers: JevResponse['headers']) {
  const value = headers?.get('retry-after');
  const seconds = Number(value);
  return value && Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds * 1000, MAX_WAIT_MS) : null;
}

/**
 * Sends one request body: `POST <endpoint>` with the key as a bearer token. 408, 429, 529 and
 * other 5xx statuses and network failures are retried with exponential backoff, or after the
 * `retry-after` the response names; 401 and 403 throw, since every later request would fail the
 * same way; any other status is this request's error. No message carries the key.
 */
export async function postJev(
  body: object,
  options: JevOptions
): Promise<{ json: unknown } | { error: string; retryable: boolean }> {
  const {
    fetch,
    apiKey,
    endpoint = JEV_ENDPOINT,
    retries = RETRIES,
    backoffMs = BACKOFF_MS,
    timeoutMs = TIMEOUT_MS,
    sleep = delay,
    log = () => {},
  } = options;
  const scrub = (text: string) => (apiKey ? text.split(apiKey).join(`$${JEV_KEY}`) : text);
  for (let attempt = 0; ; attempt++) {
    let failure = '';
    let status = 0;
    let text = '';
    let headers: JevResponse['headers'] = null;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      status = response.status;
      headers = response.headers ?? null;
      text = await response.text();
    } catch (error) {
      failure = `request failed: ${scrub(error instanceof Error ? error.message : String(error))}`;
    }
    if (!failure) {
      if (status >= 200 && status < 300) {
        try {
          return { json: JSON.parse(text) };
        } catch {
          return { error: `HTTP ${status} with a body that is not JSON`, retryable: true };
        }
      }
      const detail = scrub(errorDetail(text));
      failure = `HTTP ${status}${detail ? `: ${detail}` : ''}`;
      if (status === 401 || status === 403) {
        throw new InputError(`judge: Jev refused the request (${failure}); check ${JEV_KEY}`);
      }
      if (status !== 408 && status !== 429 && status < 500) return { error: failure, retryable: false };
    }
    if (attempt >= retries) return { error: failure, retryable: true };
    const wait = retryAfterMs(headers) ?? Math.min(backoffMs * 2 ** attempt, MAX_WAIT_MS);
    log(`judge: Jev ${failure}; retrying in ${Math.ceil(wait / 1000)} s`);
    await sleep(wait);
  }
}

/**
 * Asks Jev which candidate continues each bundle's declaration, one request at a time (the rate
 * limit is 40 requests per second, and there is no batch endpoint to use instead).
 */
export async function askJev(bundles: Bundle[], options: JevOptions): Promise<JevAnswer[]> {
  if (typeof options?.fetch !== 'function' || !options.apiKey) throw new Error('askJev needs fetch and apiKey');
  const { model = JEV_MODEL } = options;
  const answers: JevAnswer[] = [];
  for (const bundle of bundles) {
    const body = jevRequestFor(bundle, { model });
    const result = body ? await postJev(body, options) : { error: NO_CANDIDATES, retryable: false };
    const fields = 'json' in result ? parseJevChoice(result.json, bundle) : result;
    answers.push({ decl: bundle.decl, id: bundle.id, ...fields });
  }
  return answers;
}

/**
 * Scores every candidate of each bundle with a second request (one Score per candidate). A
 * failure, a refused key included, is recorded for that declaration and never thrown.
 * @returns by declaration id
 */
export async function rankWithJev(
  bundles: Bundle[],
  options: JevOptions
): Promise<Map<string, { scores: JevScore[] } | { error: string }>> {
  const { model = JEV_MODEL } = options;
  const ranked = new Map<string, { scores: JevScore[] } | { error: string }>();
  for (const bundle of bundles) {
    const body = jevRankRequestFor(bundle, { model });
    if (!body) continue;
    try {
      const result = await postJev(body, options);
      ranked.set(bundle.decl, 'json' in result ? parseJevScores(result.json, bundle) : { error: result.error });
    } catch (error) {
      ranked.set(bundle.decl, { error: error instanceof Error ? error.message : String(error) });
    }
  }
  return ranked;
}
