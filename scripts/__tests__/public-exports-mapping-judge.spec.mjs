/**
 * The judge, area E of the public exports mapping pipeline. Nothing here runs git or reaches the
 * network. fixtures/public-exports-mapping/judge/data is a contract-shaped data directory for
 * three releases (its diffs carry only `declarations`, the one section the judge reads), and
 * fixtures/public-exports-mapping/judge/git stands in for the repository: `v<version>/` holds what
 * `git show v<version>:<path>` prints, `log.json` the `git log -S` answers, and `commits/` what
 * `git show <commit>` prints. Claude is a fake Message Batches client and Jev a fake `fetch` that
 * answers in the shapes https://docs.typesafe.ai/api.md documents.
 */
import assert from 'node:assert/strict';
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { canonical } from '../public-exports-mapping/artifacts.mjs';
import { run } from '../public-exports-mapping/commands/judge.mjs';
import {
  JEV_ENDPOINT,
  NO_CANDIDATES,
  SCORE_LEVELS,
  askJev,
  jevRankRequestFor,
  jevRequestFor,
  parseJevChoice,
  postJev,
  rankWithJev,
} from '../public-exports-mapping/jev.mjs';
import {
  InputError,
  JUDGE_MODEL,
  SUCCESSOR_TOOL,
  TOOL_NAME,
  agreementReport,
  askClaude,
  buildContext,
  calibrationBundles,
  candidatesFor,
  chainDecl,
  customIdFor,
  decide,
  declarationText,
  evidenceFor,
  indexSurface,
  loadInputs,
  parseResult,
  renderBundle,
  renderEvidence,
  requestFor,
  residueOf,
  settledBy,
  shimFor,
  shimFromDiff,
  staleDecisions,
} from '../public-exports-mapping/judge.mjs';
import { tempDir } from './-run-script.mjs';

const FIXTURES = path.join(import.meta.dirname, 'fixtures', 'public-exports-mapping', 'judge');
const DATA = path.join(FIXTURES, 'data');
const GIT = path.join(FIXTURES, 'git');
const VERSIONS = ['1.0.0', '2.0.0', '3.0.0', 'head'];

const ERRORS_ARRAY_TO_HASH = 'packages/adapter/src/error.js#errorsArrayToHash';
const FETCH_MANAGER = 'packages/store/src/fetch-manager.ts#fetchManager';
const IDENTIFIER_ARRAY = 'packages/store/src/identifier-array.ts#IdentifierArray';
const STORE_REQUEST_INPUT = 'packages/store/src/types.ts#StoreRequestInput';
const NORMALIZE_MODEL_NAME = 'packages/store/src/utils.ts#normalizeModelName';
const PEEK_RECORDS = 'packages/store/src/utils.ts#peekRecords';
const RESIDUE = [
  ERRORS_ARRAY_TO_HASH,
  FETCH_MANAGER,
  IDENTIFIER_ARRAY,
  STORE_REQUEST_INPUT,
  NORMALIZE_MODEL_NAME,
  PEEK_RECORDS,
];

/** @param {string} rel */
const fixture = (rel) => readFileSync(path.join(FIXTURES, rel), 'utf8');

/**
 * A `git` that answers from the fixtures and records every call; anything else throws.
 */
function fakeGit() {
  const log = JSON.parse(fixture('git/log.json'));
  /** @type {string[][]} */
  const calls = [];
  /** @param {string} file @param {string} what */
  const read = (file, what) => {
    if (!existsSync(file)) throw new Error(`fatal: ${what} does not exist`);
    return readFileSync(file, 'utf8');
  };
  /** @param {string[]} args */
  const git = (args) => {
    calls.push(args);
    const [command, ...rest] = args;
    if (command === 'show' && rest[0] === '--format=') {
      return read(path.join(GIT, 'commits', `${rest[1]}.diff`), rest[1]);
    }
    if (command === 'show') {
      const colon = rest[0].indexOf(':');
      return read(path.join(GIT, rest[0].slice(0, colon), rest[0].slice(colon + 1)), rest[0]);
    }
    if (command === 'log') {
      const [pickaxe, , range, , file] = rest;
      const hit = log[`${pickaxe.slice('-S'.length)} ${range} ${file}`];
      return hit ? `${hit}\n` : '';
    }
    throw new Error(`unexpected git ${args.join(' ')}`);
  };
  return Object.assign(git, { calls });
}

function fixtureContext(git = fakeGit()) {
  const inputs = loadInputs({ from: '1.0.0', to: '3.0.0', versions: VERSIONS, dataRoot: DATA });
  return { inputs, ctx: buildContext({ ...inputs, git }), git };
}

/** @param {any} ctx @param {string} decl */
function itemOf(ctx, decl) {
  return ctx.residue.find((/** @type {any} */ item) => item.decl === decl) ?? assert.fail(`${decl} is not residue`);
}

/** A copy of the fixture data directory, with a scratch output directory beside it. */
function copyData(/** @type {any} */ t) {
  const cwd = tempDir(t, 'warp-drive-judge-');
  const dataRoot = path.join(cwd, 'data');
  cpSync(DATA, dataRoot, { recursive: true });
  return { cwd, dataRoot, out: path.join(cwd, 'out'), decisions: path.join(dataRoot, 'decisions', '1.0.0.json') };
}

/** Collects console output for one test. */
function capture(/** @type {any} */ t) {
  const out = { log: /** @type {string[]} */ ([]), error: /** @type {string[]} */ ([]) };
  t.mock.method(console, 'log', (/** @type {unknown[]} */ ...args) => out.log.push(args.join(' ')));
  t.mock.method(console, 'error', (/** @type {unknown[]} */ ...args) => out.error.push(args.join(' ')));
  return out;
}

const USAGE = { input_tokens: 1200, output_tokens: 300, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

/** A `succeeded` batch result whose message calls the tool with `input`. @param {unknown} input */
function succeeded(input) {
  return {
    type: 'succeeded',
    message: {
      id: 'msg_1',
      type: 'message',
      role: 'assistant',
      model: JUDGE_MODEL,
      stop_reason: 'tool_use',
      content: [
        { type: 'thinking', thinking: '', signature: 'sig' },
        { type: 'tool_use', id: 'toolu_1', name: TOOL_NAME, input },
      ],
      usage: USAGE,
    },
  };
}

/** A `succeeded` batch result whose message ends without calling the tool. */
function noToolCall() {
  return {
    type: 'succeeded',
    message: { stop_reason: 'end_turn', content: [{ type: 'text', text: 'LiveArray.' }], usage: USAGE },
  };
}

/**
 * The part of the Anthropic client the judge uses. `respond(request, round)` gives one request's
 * `result`. A batch ends on its second status check, and results come back in reverse order,
 * since batches do not keep order.
 * @param {(request: any, round: number) => any} respond
 */
function fakeClient(respond) {
  /** @type {any[][]} */
  const created = [];
  /** @type {string[]} */
  const retrieved = [];
  /** @type {Map<string, { requests: any[], round: number, polls: number }>} */
  const batches = new Map();
  const status = (/** @type {string} */ id) => {
    const batch = /** @type {{ requests: any[], polls: number }} */ (batches.get(id));
    const ended = batch.polls > 1;
    return {
      id,
      processing_status: ended ? 'ended' : 'in_progress',
      request_counts: { processing: ended ? 0 : batch.requests.length, succeeded: 0, errored: 0 },
    };
  };
  return {
    created,
    retrieved,
    /** Registers a batch created earlier, for resuming. @param {string} id @param {any[]} requests */
    seed(id, requests) {
      batches.set(id, { requests, round: 0, polls: 0 });
    },
    messages: {
      batches: {
        async create(/** @type {{ requests: any[] }} */ { requests }) {
          const id = `msgbatch_${created.length + 1}`;
          batches.set(id, { requests, round: created.length, polls: 0 });
          created.push(requests);
          return status(id);
        },
        async retrieve(/** @type {string} */ id) {
          retrieved.push(id);
          /** @type {any} */ (batches.get(id)).polls++;
          return status(id);
        },
        async results(/** @type {string} */ id) {
          const { requests, round } = /** @type {any} */ (batches.get(id));
          const lines = requests.map((/** @type {any} */ r) => ({ custom_id: r.custom_id, result: respond(r, round) }));
          return (async function* () {
            yield* lines.reverse();
          })();
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Residue

test('chainDecl follows ids pair by pair and resumes when a later surface declares a dropped id again', () => {
  const diffs = [
    { from: 'a', to: 'b', declarations: { 'f.ts#x': null, 'f.ts#y': 'g.ts#y', 'f.ts#z': null, 'f.ts#w': null } },
    { from: 'b', to: 'c', declarations: { 'g.ts#y': 'h.ts#y' } },
    { from: 'c', to: 'd', declarations: { 'f.ts#x': 'k.ts#x', 'f.ts#z': null } },
  ];
  const surfaces = {
    c: {
      modules: {
        m: {
          package: 'm',
          exports: { x: { kind: 'value', decl: 'f.ts#x' }, z: { kind: 'value', decl: 'f.ts#z' } },
        },
      },
    },
  };
  assert.deepEqual(chainDecl('f.ts#x', diffs, { surfaces }), {
    id: 'k.ts#x',
    brokeAt: null,
    returned: [{ left: 'a-b', back: 'c' }],
    moves: [{ index: 2, from: 'f.ts#x', to: 'k.ts#x' }],
  });
  assert.deepEqual(chainDecl('f.ts#y', diffs, { surfaces }), {
    id: 'h.ts#y',
    brokeAt: null,
    moves: [
      { index: 0, from: 'f.ts#y', to: 'g.ts#y' },
      { index: 1, from: 'g.ts#y', to: 'h.ts#y' },
    ],
  });
  assert.deepEqual(chainDecl('f.ts#z', diffs, { surfaces }), {
    id: null,
    brokeAt: { index: 2, from: 'c', to: 'd', id: 'f.ts#z' },
    returned: [{ left: 'a-b', back: 'c' }],
  });
  assert.deepEqual(chainDecl('f.ts#w', diffs, { surfaces }), {
    id: null,
    brokeAt: { index: 0, from: 'a', to: 'b', id: 'f.ts#w' },
  });
  assert.deepEqual(chainDecl('f.ts#x', diffs), { id: null, brokeAt: { index: 0, from: 'a', to: 'b', id: 'f.ts#x' } });
  assert.deepEqual(chainDecl('g.ts#y', diffs, { start: 1 }), {
    id: 'h.ts#y',
    brokeAt: null,
    moves: [{ index: 1, from: 'g.ts#y', to: 'h.ts#y' }],
  });
  assert.deepEqual(chainDecl('f.ts#v', diffs), { id: 'f.ts#v', brokeAt: null }, 'an id no diff lists keeps its id');
});

test('residueOf groups the tokens git cannot carry to the target release by declaration', () => {
  const { inputs, ctx } = fixtureContext();
  const residue = residueOf(inputs);
  assert.deepEqual(
    residue.map((item) => item.decl),
    RESIDUE
  );
  assert.deepEqual(
    itemOf(ctx, IDENTIFIER_ARRAY).tokens.map((t) => `${t.module} ${t.export}`),
    ['@ember-data/store IdentifierArray', '@ember-data/store/-private IdentifierArray']
  );
  assert.deepEqual(itemOf(ctx, IDENTIFIER_ARRAY).chain.brokeAt, {
    index: 1,
    from: '2.0.0',
    to: '3.0.0',
    id: IDENTIFIER_ARRAY,
  });
  // git follows it into @warp-drive/core, where nothing exports it
  assert.equal(itemOf(ctx, STORE_REQUEST_INPUT).chain.id, 'warp-drive-packages/core/src/types.ts#StoreRequestInput');
  assert.equal(itemOf(ctx, STORE_REQUEST_INPUT).chain.brokeAt, null);

  const settled = Object.fromEntries(ctx.settled.map((item) => [item.decl, item.chain]));
  assert.deepEqual(Object.keys(settled), [
    'packages/adapter/src/error.js#default',
    'packages/store/src/caches.ts#recordIdentifierFor',
    'packages/store/src/identifiers.ts#setIdentifierGenerationMethod',
    'packages/store/src/store-service.ts#default',
  ]);
  // the first diff does not list it, so it keeps its id there
  assert.equal(
    settled['packages/store/src/caches.ts#recordIdentifierFor'].id,
    'warp-drive-packages/core/src/caches.ts#recordIdentifierFor'
  );
  // gone from 2.0.0, back in 3.0.0 under the same id
  assert.deepEqual(settled['packages/store/src/identifiers.ts#setIdentifierGenerationMethod'], {
    id: 'packages/store/src/identifiers.ts#setIdentifierGenerationMethod',
    brokeAt: null,
    returned: [{ left: '1.0.0-2.0.0', back: '3.0.0' }],
  });
  assert.deepEqual(
    ctx.settled.map((item) => settledBy(item, ctx)),
    ['symbols', 'files', 'same', 'symbols']
  );
});

test('tokens of preferences.ignorePackages are never residue and never candidates', () => {
  const { inputs, ctx } = fixtureContext();
  const rules = 'packages/eslint-plugin-warp-drive/src/index.js#rules';
  assert.ok(!residueOf(inputs).some((item) => item.decl === rules));
  assert.ok(residueOf({ ...inputs, preferences: null }).some((item) => item.decl === rules));

  /** @param {any} context */
  const liveArrays = (context) =>
    candidatesFor(itemOf(context, IDENTIFIER_ARRAY), context)
      .filter((c) => c.export === 'LiveArray')
      .map((c) => c.module);
  assert.deepEqual(liveArrays(ctx), ['@warp-drive/core/types', '@warp-drive/core/store/-private']);
  // without the preference, the umbrella package's shorter module would rank first
  const unfiltered = buildContext({ ...inputs, preferences: null, git: fakeGit() });
  assert.deepEqual(liveArrays(unfiltered), [
    'warp-drive/types',
    '@warp-drive/core/types',
    '@warp-drive/core/store/-private',
  ]);
});

test('loadInputs needs the surface of every release between from and to', (t) => {
  const { dataRoot } = copyData(t);
  rmSync(path.join(dataRoot, 'surfaces', '2.0.0.json'));
  assert.throws(
    () => loadInputs({ from: '1.0.0', to: '3.0.0', versions: VERSIONS, dataRoot }),
    (error) => error instanceof InputError && error.message.includes('surfaces/2.0.0.json')
  );
  assert.throws(
    () => loadInputs({ from: '0.9.0', to: '3.0.0', versions: VERSIONS, dataRoot }),
    /0\.9\.0 is not a covered release/
  );
});

// ---------------------------------------------------------------------------------------------
// Candidates

test('candidatesFor finds successors through history, by name and through file moves', () => {
  const { ctx } = fixtureContext();
  /** @param {string} decl */
  const candidates = (decl) =>
    candidatesFor(itemOf(ctx, decl), ctx).map((c) => `${c.module} ${c.export} [${c.via.join(',')}]`);
  assert.deepEqual(candidates(IDENTIFIER_ARRAY), [
    '@warp-drive/core/store/-private createLiveArray [history,file]',
    '@warp-drive/core/types LiveArray [history,file]',
    '@warp-drive/core/store/-private LiveArray [history,file]',
  ]);
  assert.deepEqual(candidates(NORMALIZE_MODEL_NAME), [
    '@warp-drive/utilities/string normalizeModelName [history,name:exact]',
    '@warp-drive/utilities/string dasherize [history]',
  ]);
  assert.deepEqual(candidates(FETCH_MANAGER), ['@warp-drive/legacy/compat/-private FetchManager [name:case]']);
  assert.deepEqual(candidates(PEEK_RECORDS), ['@warp-drive/core peekRecord [name:edit]']);
  // AdapterError last: git already continues another declaration of 1.0.0 with it
  assert.deepEqual(candidates(ERRORS_ARRAY_TO_HASH), [
    '@warp-drive/legacy/adapter/error InvalidError [file]',
    '@warp-drive/legacy/adapter/error AdapterError [file]',
  ]);
  assert.deepEqual(candidates(STORE_REQUEST_INPUT), []);
});

test('name candidates: exact names before case-insensitive ones; an edit needs six characters', () => {
  const toIndex = indexSurface({
    modules: {
      '@new/pkg': {
        package: '@new/pkg',
        exports: {
          FetchManager: { kind: 'value', decl: 'new/a.ts#FetchManager' },
          fetchManager: { kind: 'value', decl: 'new/b.ts#fetchManager' },
          peak: { kind: 'value', decl: 'new/c.ts#peak' },
        },
      },
    },
  });
  /** @param {string} local */
  const item = (local) => ({
    decl: `old/x.ts#${local}`,
    tokens: [
      {
        module: '@old/pkg',
        export: local,
        kind: /** @type {const} */ ('value'),
        decl: `old/x.ts#${local}`,
        package: '@old/pkg',
      },
    ],
    chain: { id: null, brokeAt: null },
  });
  /** @param {string} local */
  const found = (local) =>
    candidatesFor(item(local), { toIndex, diffs: [] }).map((c) => `${c.export} ${c.via.join(',')}`);
  assert.deepEqual(found('fetchManager'), ['fetchManager name:exact']);
  assert.deepEqual(found('FETCHMANAGER'), ['FetchManager name:case', 'fetchManager name:case']);
  assert.deepEqual(found('fetchManagr'), ['FetchManager name:edit', 'fetchManager name:edit']);
  assert.deepEqual(found('peek'), []);
});

test('a broad commit cannot flood a bundle: each source keeps at most its cap and counts the rest', () => {
  const added = Array.from({ length: 12 }, (_, i) => `new/many.ts#thing${String(i).padStart(2, '0')}`);
  const exports = Object.fromEntries(added.map((decl) => [decl.split('#')[1], { kind: 'value', decl }]));
  const ctx = {
    from: '1.0.0',
    to: '2.0.0',
    toIndex: indexSurface({ modules: { '@new/pkg': { package: '@new/pkg', exports } } }),
    diffs: [{ from: '1.0.0', to: '2.0.0', declarations: { 'old/x.ts#gone': null } }],
    histories: [
      {
        from: '1.0.0',
        to: '2.0.0',
        files: {},
        symbols: { 'old/x.ts#gone': { commit: 'abc1234567', subject: 'refactor: everything (#1)', added } },
      },
    ],
    git: () => {
      throw new Error('fatal: no repository');
    },
  };
  const item = {
    decl: 'old/x.ts#gone',
    tokens: [
      {
        module: '@old/pkg',
        export: 'gone',
        kind: /** @type {const} */ ('value'),
        decl: 'old/x.ts#gone',
        package: '@old/pkg',
      },
    ],
    chain: { id: null, brokeAt: { index: 0, from: '1.0.0', to: '2.0.0', id: 'old/x.ts#gone' } },
  };
  const bundle = evidenceFor(item, ctx);
  assert.equal(bundle.candidates.length, 8);
  assert.deepEqual(bundle.omitted, { history: 4 });
  assert.equal(bundle.source.text, null);
  assert.equal(bundle.source.note, 'old/x.ts does not exist at v1.0.0');
  assert.equal(candidatesFor(item, { ...ctx, caps: { history: 2 } }).length, 2);
  assert.match(renderBundle(bundle), /Not shown, ranked lower: 4 more by history\./);
});

// ---------------------------------------------------------------------------------------------
// Source text

test('declarationText: the declaring statements with their JSDoc, the @deprecated note, the default export name', () => {
  const utils = fixture('git/v1.0.0/packages/store/src/utils.ts');
  const lines = utils.split('\n');
  const normalize = declarationText(utils, 'normalizeModelName', { file: 'packages/store/src/utils.ts' });
  assert.equal(normalize.text, lines.slice(0, 6).join('\n'));
  assert.equal(normalize.deprecated, '@deprecated use dasherize from @ember-data/request-utils/string');
  // every overload and the implementation
  assert.equal(
    declarationText(utils, 'peekRecords', { file: 'packages/store/src/utils.ts' }).text,
    lines.slice(7, 12).join('\n')
  );
  assert.equal(declarationText(utils, 'missing', { file: 'packages/store/src/utils.ts' }).text, null);

  const error = declarationText(fixture('git/v1.0.0/packages/adapter/src/error.js'), 'default', {
    file: 'packages/adapter/src/error.js',
  });
  assert.equal(error.declaredName, 'AdapterError');
  assert.match(error.text, /^\/\*\*\n {2}A base class for the errors an adapter raises\./);
  assert.match(error.text, /\nfunction AdapterError\(errors, message = 'Adapter operation failed'\) \{\n/);
  const store = fixture('git/v1.0.0/packages/store/src/store-service.ts');
  assert.equal(
    declarationText(store, 'default', { file: 'packages/store/src/store-service.ts' }).declaredName,
    'Store'
  );
});

test('declarationText caps a long statement at 120 lines and scans text it cannot parse', () => {
  const long = `export const table = {\n${Array.from({ length: 200 }, (_, i) => `  key${i}: ${i},`).join('\n')}\n};\n`;
  const capped = declarationText(long, 'table', { file: 'table.ts' });
  assert.equal(capped.truncated, 82);
  assert.equal(capped.text.split('\n').length, 121);
  assert.equal(capped.text.split('\n').at(-1), '// … 82 more lines');

  const broken =
    'const = ;\n/** Doc.\n * @deprecated gone soon\n */\nexport function rescued(a: number) {\n  return a;\n}\nexport const other = 1;\n';
  assert.deepEqual(declarationText(broken, 'rescued', { file: 'broken.ts' }), {
    text: '/** Doc.\n * @deprecated gone soon\n */\nexport function rescued(a: number) {\n  return a;\n}',
    truncated: 0,
    deprecated: '@deprecated gone soon',
    declaredName: null,
    scanned: true,
  });
  const gts =
    'import Component from "@glimmer/component";\n\n/** A card. */\nexport default class Card extends Component {\n  <template>{{@title}}</template>\n}\n';
  const card = declarationText(gts, 'default', { file: 'card.gts' });
  assert.equal(card.declaredName, 'Card');
  assert.equal(card.scanned, true);
  assert.match(card.text, /^\/\*\* A card\. \*\/\nexport default class Card/);
});

// ---------------------------------------------------------------------------------------------
// Evidence

test('evidenceFor: source, git history, and per candidate its tokens, text and shape', () => {
  const { ctx, git } = fixtureContext();
  const bundle = evidenceFor(itemOf(ctx, IDENTIFIER_ARRAY), ctx);
  assert.match(bundle.id, /^IdentifierArray-[0-9a-f]{12}$/);
  assert.equal(bundle.id, customIdFor(IDENTIFIER_ARRAY));
  const { source, candidates, ...rest } = bundle;
  assert.deepEqual(rest, {
    id: bundle.id,
    decl: IDENTIFIER_ARRAY,
    from: '1.0.0',
    to: '3.0.0',
    blind: undefined,
    names: ['IdentifierArray'],
    chain: { brokeAt: '2.0.0-3.0.0', dangling: null, returned: undefined },
    files: {
      from: 'packages/store/src/identifier-array.ts',
      to: ['warp-drive-packages/core/src/live-array.ts'],
      moved: true,
    },
    history: {
      pair: '2.0.0-3.0.0',
      id: IDENTIFIER_ARRAY,
      path: 'packages/store/src/identifier-array.ts',
      recorded: true,
      commit: '6666666666',
      subject: 'feat: universal reactivity hooks (#9965)',
      pr: '#9965',
      added: 2,
    },
    removal: null,
    omitted: {},
  });
  assert.deepEqual(source.tokens, [
    {
      module: '@ember-data/store',
      export: 'IdentifierArray',
      kind: 'value',
      package: '@ember-data/store',
      public: true,
      oldContract: true,
      segments: 2,
    },
    {
      module: '@ember-data/store/-private',
      export: 'IdentifierArray',
      kind: 'value',
      package: '@ember-data/store',
      public: false,
      oldContract: true,
      segments: 3,
    },
  ]);
  assert.equal(source.file, 'packages/store/src/identifier-array.ts');
  assert.equal(source.text, fixture('git/v1.0.0/packages/store/src/identifier-array.ts').trimEnd());
  assert.equal(source.deprecated, null);

  assert.deepEqual(
    candidates.map((c) => [c.decl, c.via, c.continues, c.tokens.map((t) => `${t.module} ${t.export} ${t.kind}`)]),
    [
      [
        'warp-drive-packages/core/src/live-array.ts#createLiveArray',
        ['history', 'file'],
        [],
        ['@warp-drive/core/store/-private createLiveArray value'],
      ],
      [
        'warp-drive-packages/core/src/live-array.ts#LiveArray',
        ['history', 'file'],
        [],
        ['@warp-drive/core/types LiveArray type', '@warp-drive/core/store/-private LiveArray value'],
      ],
    ]
  );
  const liveArray = candidates[1];
  assert.match(String(liveArray.shape), /^class LiveArray<T = unknown> \{/);
  assert.match(
    String(liveArray.text),
    /^\/\*\*\n \* A reactive array of the resources of one type\.\n \*\/\nexport class LiveArray/
  );
  assert.doesNotMatch(String(liveArray.text), /createLiveArray/, 'the statement only');
  assert.deepEqual(liveArray.tokens[0], {
    module: '@warp-drive/core/types',
    export: 'LiveArray',
    kind: 'type',
    package: '@warp-drive/core',
    public: true,
    oldContract: false,
    segments: 3,
  });
  // one read per file and version; history named the removing commit, so no git log
  assert.deepEqual(git.calls, [
    ['show', 'v1.0.0:packages/store/src/identifier-array.ts'],
    ['show', 'v3.0.0:warp-drive-packages/core/src/live-array.ts'],
  ]);
});

test('evidenceFor asks git log -S for the removing commit when history has no entry', () => {
  const { ctx, git } = fixtureContext();
  const fetchManager = evidenceFor(itemOf(ctx, FETCH_MANAGER), ctx);
  assert.equal(fetchManager.history?.recorded, false);
  assert.deepEqual(fetchManager.removal, {
    commit: '7777777777',
    subject: 'chore: drop the fetch manager (#8700)',
    pr: '#8700',
    name: 'fetchManager',
    range: 'v1.0.0..v2.0.0',
    path: 'packages/store/src/fetch-manager.ts',
  });
  assert.deepEqual(fetchManager.files, { from: 'packages/store/src/fetch-manager.ts', to: [], moved: true });
  assert.ok(
    git.calls.some(
      (args) =>
        args.join(' ') === 'log -SfetchManager --format=%h%x09%s v1.0.0..v2.0.0 -- packages/store/src/fetch-manager.ts'
    )
  );

  // a declaration git follows to an id nothing exports: searched over the whole range
  const storeRequestInput = evidenceFor(itemOf(ctx, STORE_REQUEST_INPUT), ctx);
  assert.deepEqual(storeRequestInput.chain, {
    brokeAt: null,
    dangling: 'warp-drive-packages/core/src/types.ts#StoreRequestInput',
    returned: undefined,
  });
  assert.equal(storeRequestInput.history, null);
  assert.equal(storeRequestInput.removal?.range, 'v1.0.0..v3.0.0');
  assert.equal(storeRequestInput.removal?.pr, '#9500');
  assert.deepEqual(storeRequestInput.candidates, []);
});

test('evidenceFor shows a candidate git already gives to another declaration by name only', () => {
  const { ctx } = fixtureContext();
  const bundle = evidenceFor(itemOf(ctx, ERRORS_ARRAY_TO_HASH), ctx);
  assert.equal(bundle.source.deprecated, '@deprecated use the errors of the request instead');
  const adapterError = bundle.candidates.find((c) => c.decl.endsWith('#AdapterError'));
  assert.deepEqual(
    adapterError && { text: adapterError.text, note: adapterError.note, continues: adapterError.continues },
    {
      text: null,
      note: 'not shown, git continues another declaration with it',
      continues: ['packages/adapter/src/error.js#default'],
    }
  );
  const prompt = renderBundle(bundle);
  assert.match(
    prompt,
    /Git already continues `packages\/adapter\/src\/error\.js#default` of 1\.0\.0 with this declaration\./
  );
  assert.match(
    prompt,
    /Removed between 1\.0\.0 and 2\.0\.0 by 2222222222 "chore: remove 4\.x deprecations \(#8550\)" \(pull request #8550\)\. That commit added no exported declarations\./
  );
  // the JSDoc example has its own fence, so the source block needs a longer one
  assert.match(prompt, /^````js\n\/\*\*\n {2}Converts an array/m);
  assert.match(prompt, /^ {2}```javascript$/m);
});

// ---------------------------------------------------------------------------------------------
// The question

test('requestFor: claude-opus-5-5, the answer tool, auto tool_choice, the bundle as the user turn', () => {
  const { ctx } = fixtureContext();
  const bundle = evidenceFor(itemOf(ctx, ERRORS_ARRAY_TO_HASH), ctx);
  const request = requestFor(bundle);
  assert.equal(request.custom_id, bundle.id);
  const { params } = request;
  assert.equal(params.model, 'claude-opus-5-5');
  assert.equal(params.max_tokens, 16000);
  assert.deepEqual(params.output_config, { effort: 'medium' });
  assert.deepEqual(params.tools, [SUCCESSOR_TOOL]);
  assert.deepEqual(params.tool_choice, { type: 'auto', disable_parallel_tool_use: true });
  assert.deepEqual(params.messages, [{ role: 'user', content: renderBundle(bundle) }]);
  assert.equal(params.system.length, 1);
  assert.deepEqual(params.system[0].cache_control, { type: 'ephemeral' });
  assert.match(params.system[0].text, /^1\. a public module before a private one/m);
  assert.match(params.system[0].text, /^7\. a module listed here, in this order: @warp-drive\/ember;$/m);
  assert.match(params.system[0].text, /Answer by calling record_successor exactly once\.$/);

  assert.equal(SUCCESSOR_TOOL.name, TOOL_NAME);
  assert.equal(SUCCESSOR_TOOL.strict, true);
  const schema = SUCCESSOR_TOOL.input_schema;
  assert.deepEqual(schema.required, ['choice', 'confidence', 'reason']);
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(
    schema.properties.choice.anyOf.map((s) => s.type),
    ['object', 'null']
  );
  assert.deepEqual(schema.properties.choice.anyOf[0].required, ['module', 'export']);
  assert.equal(schema.properties.choice.anyOf[0].additionalProperties, false);
  assert.equal(schema.properties.confidence.type, 'number');

  const tuned = requestFor(bundle, { effort: 'high', tieBreak: ['@warp-drive/core'] }).params;
  assert.deepEqual(tuned.output_config, { effort: 'high' });
  assert.match(tuned.system[0].text, /in this order: @warp-drive\/core;/);

  const ids = ctx.residue.map((item) => requestFor(evidenceFor(item, ctx)).custom_id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-zA-Z0-9_-]{1,64}$/);
});

test('renderBundle notes a declaration that came back, and hides git entirely in a blind bundle', () => {
  const { ctx } = fixtureContext();
  const bundle = evidenceFor(itemOf(ctx, PEEK_RECORDS), ctx);
  const returned = { ...bundle, chain: { ...bundle.chain, returned: [{ left: '1.0.0-2.0.0', back: '3.0.0' }] } };
  assert.match(
    renderBundle(returned),
    /It was gone in 1\.0\.0 to 2\.0\.0 and came back in 3\.0\.0 under the same id\./
  );

  const blind = renderBundle(calibrationBundles(ctx).bundles[0]);
  assert.doesNotMatch(blind, /# What git knows|Found by|Git already continues/);
  assert.match(blind, /in no particular order/);
});

test('parseResult reads answers, refusals, missing tool calls and errors', () => {
  const input = { choice: { module: '@warp-drive/core', export: 'Store' }, confidence: 1.4, reason: '  Same class.  ' };
  assert.deepEqual(parseResult({ custom_id: 'a', result: succeeded(input) }), {
    custom_id: 'a',
    choice: { module: '@warp-drive/core', export: 'Store' },
    confidence: 1,
    reason: 'Same class.',
    usage: USAGE,
  });
  assert.deepEqual(
    parseResult({
      custom_id: 'b',
      result: {
        type: 'succeeded',
        message: { stop_reason: 'refusal', stop_details: { category: 'cyber' }, content: [], usage: USAGE },
      },
    }),
    { custom_id: 'b', error: 'refusal (cyber)', retryable: false, usage: USAGE }
  );
  assert.deepEqual(parseResult({ custom_id: 'c', result: noToolCall() }), {
    custom_id: 'c',
    error: 'no record_successor call (stop_reason end_turn)',
    retryable: true,
    usage: USAGE,
  });
  assert.deepEqual(
    parseResult({ custom_id: 'd', result: succeeded({ choice: 'Store', confidence: 0.9, reason: 'x' }) }),
    {
      custom_id: 'd',
      error: 'choice is neither null nor { module, export }',
      retryable: true,
      usage: USAGE,
    }
  );
  const errored = (/** @type {string} */ type) => ({
    custom_id: 'e',
    result: { type: 'errored', error: { type: 'error', error: { type, message: 'nope' } } },
  });
  assert.deepEqual(parseResult(errored('invalid_request_error')), {
    custom_id: 'e',
    error: 'invalid_request_error: nope',
    retryable: false,
  });
  assert.equal(parseResult(errored('overloaded_error')).retryable, true);
  assert.deepEqual(parseResult({ custom_id: 'f', result: { type: 'expired' } }), {
    custom_id: 'f',
    error: 'expired',
    retryable: true,
  });
});

test('askClaude creates a batch, polls it, reads the results, and retries what has no answer', async () => {
  const { ctx } = fixtureContext();
  const bundles = [IDENTIFIER_ARRAY, PEEK_RECORDS].map((decl) => evidenceFor(itemOf(ctx, decl), ctx));
  const peekId = customIdFor(PEEK_RECORDS);
  const client = fakeClient((request, round) =>
    request.custom_id === peekId && round === 0
      ? noToolCall()
      : succeeded(
          request.custom_id === peekId
            ? { choice: { module: '@warp-drive/core', export: 'peekRecord' }, confidence: 0.7, reason: 'Close.' }
            : {
                choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
                confidence: 0.93,
                reason: 'Renamed.',
              }
        )
  );
  /** @type {number[]} */
  const sleeps = [];
  /** @type {any[]} */
  const batches = [];
  /** @type {string[]} */
  const lines = [];
  const answers = await askClaude(bundles, {
    client,
    pollIntervalMs: 5,
    sleep: async (ms) => sleeps.push(ms),
    log: (line) => lines.push(line),
    onBatch: (batch, info) => batches.push({ id: batch.id, ...info }),
  });
  assert.deepEqual(answers, [
    {
      decl: IDENTIFIER_ARRAY,
      id: customIdFor(IDENTIFIER_ARRAY),
      choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
      confidence: 0.93,
      reason: 'Renamed.',
      usage: USAGE,
    },
    {
      decl: PEEK_RECORDS,
      id: peekId,
      choice: { module: '@warp-drive/core', export: 'peekRecord' },
      confidence: 0.7,
      reason: 'Close.',
      usage: USAGE,
    },
  ]);
  assert.deepEqual(
    client.created.map((requests) => requests.map((r) => r.custom_id)),
    [[customIdFor(IDENTIFIER_ARRAY), peekId], [peekId]]
  );
  assert.ok(client.created.flat().every((r) => r.params.model === JUDGE_MODEL));
  assert.deepEqual(batches, [
    { id: 'msgbatch_1', round: 0, requests: 2 },
    { id: 'msgbatch_2', round: 1, requests: 1 },
  ]);
  assert.deepEqual(sleeps, [5, 5, 5, 5]);
  assert.equal(lines[0], 'judge: batch msgbatch_1, 2 requests, in_progress');
});

test('askClaude gives up after its retries, resumes a batch by id, and needs a client', async () => {
  const { ctx } = fixtureContext();
  const bundles = [evidenceFor(itemOf(ctx, PEEK_RECORDS), ctx)];
  const stubborn = fakeClient(() => noToolCall());
  const [answer] = await askClaude(bundles, { client: stubborn, sleep: async () => {} });
  assert.equal(stubborn.created.length, 2);
  assert.deepEqual(answer, {
    decl: PEEK_RECORDS,
    id: customIdFor(PEEK_RECORDS),
    error: 'no record_successor call (stop_reason end_turn)',
    retryable: true,
    usage: USAGE,
  });

  const resumed = fakeClient(() => succeeded({ choice: null, confidence: 0.9, reason: 'Removed.' }));
  resumed.seed(
    'msgbatch_earlier',
    bundles.map((b) => requestFor(b))
  );
  const [again] = await askClaude(bundles, { client: resumed, batchId: 'msgbatch_earlier', sleep: async () => {} });
  assert.equal(resumed.created.length, 0);
  assert.equal(resumed.retrieved[0], 'msgbatch_earlier');
  assert.equal(again.choice, null);

  await assert.rejects(askClaude(bundles, { client: null }), /askClaude needs a client/);
});

// ---------------------------------------------------------------------------------------------
// Decisions

test('decide writes confident answers and sends the rest to review', () => {
  const { ctx } = fixtureContext();
  const bundles = ctx.residue.map((item) => evidenceFor(item, ctx));
  const errorsBundle = /** @type {any} */ (bundles.find((b) => b.decl === ERRORS_ARRAY_TO_HASH));
  errorsBundle.shim = 'export function errorsArrayToHash(errors) {}';
  /** @param {string} decl @param {object} fields */
  const answer = (decl, fields) => ({ decl, id: customIdFor(decl), ...fields });
  const { entries, review } = decide({
    residue: bundles,
    toSurface: ctx.toIndex,
    threshold: 0.8,
    answers: [
      answer(IDENTIFIER_ARRAY, {
        choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
        confidence: 0.934,
        reason: 'Renamed in #9965.',
      }),
      answer(ERRORS_ARRAY_TO_HASH, { choice: null, confidence: 0.98, reason: 'Deleted in #8550.' }),
      answer(NORMALIZE_MODEL_NAME, {
        choice: { module: '@warp-drive/utilities/string', export: 'normalizeModelName' },
        confidence: 0.6,
        reason: 'Probably.',
      }),
      answer(FETCH_MANAGER, {
        choice: { module: '@warp-drive/legacy/compat', export: 'FetchManager' },
        confidence: 0.9,
        reason: 'Moved.',
      }),
      answer(PEEK_RECORDS, { error: 'no record_successor call (stop_reason end_turn)', retryable: true }),
    ],
  });
  assert.deepEqual(entries, [
    {
      decl: ERRORS_ARRAY_TO_HASH,
      source: { module: '@ember-data/adapter/error', export: 'errorsArrayToHash' },
      choice: null,
      confidence: 0.98,
      reason: 'Deleted in #8550.',
      judge: 'claude-opus-5-5',
      reviewed: false,
      removedIn: '#8550',
      shim: 'export function errorsArrayToHash(errors) {}',
    },
    {
      decl: IDENTIFIER_ARRAY,
      source: { module: '@ember-data/store', export: 'IdentifierArray' },
      choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
      confidence: 0.93,
      reason: 'Renamed in #9965.',
      judge: 'claude-opus-5-5',
      reviewed: false,
    },
  ]);
  assert.deepEqual(
    review.map((r) => [r.decl, r.why]),
    [
      [FETCH_MANAGER, ['choice-not-in-to']],
      [NORMALIZE_MODEL_NAME, ['below-threshold']],
      [PEEK_RECORDS, ['error']],
    ]
  );
  assert.equal(review[2].error, 'no record_successor call (stop_reason end_turn)');
});

test('decide ranks the source tokens of an evidence bundle like tokens, old contract included', () => {
  const { ctx } = fixtureContext();
  const bundle = evidenceFor(itemOf(ctx, ERRORS_ARRAY_TO_HASH), ctx);
  // ember-data re-exported most of @ember-data/*: two public, old-contract exports of one declaration
  bundle.source.tokens.push({
    ...bundle.source.tokens[0],
    module: 'ember-data/adapters/errors',
    package: 'ember-data',
  });
  const { entries } = decide({
    residue: [bundle],
    answers: [{ decl: ERRORS_ARRAY_TO_HASH, id: bundle.id, choice: null, confidence: 0.9, reason: 'Gone.' }],
    toSurface: ctx.toIndex,
  });
  assert.deepEqual(
    entries.map((e) => e.source),
    [{ module: '@ember-data/adapter/error', export: 'errorsArrayToHash' }]
  );
});

test('staleDecisions: a decl the from surface lacks, a choice the to surface lacks', () => {
  const { inputs } = fixtureContext();
  const entries = [
    { decl: IDENTIFIER_ARRAY, choice: { module: '@warp-drive/core/types', export: 'LiveArray' } },
    { decl: 'packages/store/src/gone.ts#gone', choice: null },
    { decl: FETCH_MANAGER, choice: { module: '@warp-drive/legacy/compat', export: 'FetchManager' } },
  ];
  assert.deepEqual(
    staleDecisions({
      decisions: { from: '1.0.0', to: '3.0.0', entries },
      fromSurface: inputs.surfaces['1.0.0'],
      toSurface: inputs.surfaces['3.0.0'],
    }),
    [
      { decl: 'packages/store/src/gone.ts#gone', problem: 'not a declaration of surfaces/1.0.0.json' },
      {
        decl: FETCH_MANAGER,
        problem: 'choice @warp-drive/legacy/compat FetchManager is not a token of surfaces/3.0.0.json',
      },
    ]
  );
});

// ---------------------------------------------------------------------------------------------
// Shims

test('shimFromDiff restores the removed declaration with its JSDoc from the removing diff', () => {
  const removal = fixture('git/commits/2222222222.diff');
  const source = fixture('git/v1.0.0/packages/adapter/src/error.js');
  const shim = shimFromDiff(removal, ['errorsArrayToHash']);
  assert.equal(shim, source.slice(source.indexOf('/**\n  Converts')).trimEnd());

  const deletion = shimFromDiff(fixture('git/commits/7777777777.diff'), ['fetchManager']);
  assert.equal(
    deletion,
    "/**\n * The store's shared fetch manager.\n */\nexport const fetchManager = new FetchManagerImpl();"
  );

  const unexported = '@@ -1,4 +1,0 @@\n-// keeps ids\n-function helper(a) {\n-  return a;\n-}\n';
  assert.equal(shimFromDiff(unexported, ['helper']), '// keeps ids\nexport function helper(a) {\n  return a;\n}');
  const defaulted = '@@ -1,3 +1,0 @@\n-export default class extends Base {\n-  x = 1;\n-}\n';
  assert.equal(shimFromDiff(defaulted, [], { isDefault: true }), 'export default class extends Base {\n  x = 1;\n}');
  assert.equal(shimFromDiff(removal, ['notThere']), null);
});

test('shimFor drafts from git show of the removing commit', () => {
  const git = fakeGit();
  const expected = shimFromDiff(fixture('git/commits/2222222222.diff'), ['errorsArrayToHash']);
  assert.equal(shimFor(ERRORS_ARRAY_TO_HASH, '2222222222', { git }), expected);
  assert.deepEqual(git.calls, [['show', '--format=', '2222222222', '--', 'packages/adapter/src/error.js']]);
  assert.equal(
    shimFor(FETCH_MANAGER, { commit: '7777777777', path: 'packages/store/src/fetch-manager.ts' }, { git }),
    shimFromDiff(fixture('git/commits/7777777777.diff'), ['fetchManager'])
  );
  assert.equal(shimFor(FETCH_MANAGER, 'ffffffffff', { git }), null, 'an unknown commit drafts nothing');
  assert.equal(shimFor(FETCH_MANAGER, null, { git }), null);
});

// ---------------------------------------------------------------------------------------------
// Calibration

test('calibrationBundles hides the truth among the candidates; agreementReport scores answers', () => {
  const { ctx } = fixtureContext();
  const { bundles, truth } = calibrationBundles(ctx);
  assert.deepEqual(
    bundles.map((b) => b.decl),
    [
      // in turn: symbols, files, same, then the second symbols item
      bundles[0].decl,
      'packages/store/src/caches.ts#recordIdentifierFor',
      'packages/store/src/identifiers.ts#setIdentifierGenerationMethod',
      bundles[3].decl,
    ]
  );
  assert.deepEqual(
    bundles.map((b) => truth[b.id].settledBy),
    ['symbols', 'files', 'same', 'symbols']
  );
  for (const bundle of bundles) {
    assert.equal(bundle.blind, true);
    assert.equal(bundle.history, null);
    assert.ok(bundle.candidates.some((c) => c.decl === truth[bundle.id].decl));
    assert.ok(bundle.candidates.every((c) => c.via === undefined));
  }
  const adapter = /** @type {any} */ (bundles.find((b) => b.decl === 'packages/adapter/src/error.js#default'));
  assert.deepEqual(truth[adapter.id].winner, { module: '@warp-drive/legacy/adapter/error', export: 'AdapterError' });
  // history starts where the symbols entry moved it, so what that commit added is there too
  const store = /** @type {any} */ (bundles.find((b) => b.decl === 'packages/store/src/store-service.ts#default'));
  assert.deepEqual(store.candidates.map((/** @type {any} */ c) => c.decl).sort(), [
    'warp-drive-packages/core/src/peek.ts#peekRecord',
    'warp-drive-packages/core/src/store-service.ts#Store',
  ]);

  const report = agreementReport(
    [
      { decl: 'a', id: 'a', choice: { module: 'm', export: 'Best' }, confidence: 0.96, reason: '' },
      { decl: 'b', id: 'b', choice: { module: 'm2', export: 'Other' }, confidence: 0.85, reason: '' },
      { decl: 'c', id: 'c', choice: { module: 'x', export: 'Wrong' }, confidence: 0.6, reason: '' },
      { decl: 'd', id: 'd', error: 'expired', retryable: true },
    ],
    {
      a: { settledBy: 'symbols', tokens: [{ module: 'm', export: 'Best' }], winner: { module: 'm', export: 'Best' } },
      b: {
        settledBy: 'files',
        tokens: [
          { module: 'm', export: 'Best' },
          { module: 'm2', export: 'Other' },
        ],
        winner: { module: 'm', export: 'Best' },
      },
      c: { settledBy: 'same', tokens: [{ module: 'm', export: 'C' }], winner: { module: 'm', export: 'C' } },
    }
  );
  assert.equal(report.answers, 4);
  assert.equal(report.errors, 1);
  assert.deepEqual(
    report.buckets.map((b) => [b.from, b.to, b.answers, b.sameDeclaration, b.sameExport]),
    [
      [0, 0.5, 0, 0, 0],
      [0.5, 0.7, 1, 0, 0],
      [0.7, 0.8, 0, 0, 0],
      [0.8, 0.9, 1, 1, 0],
      [0.9, 0.95, 0, 0, 0],
      [0.95, 1, 1, 1, 1],
    ]
  );
  assert.deepEqual(
    report.atOrAbove.map((a) => [a.threshold, a.answers, a.sameDeclaration, a.sameExport]),
    [
      [0.5, 3, 2, 1],
      [0.7, 2, 2, 1],
      [0.8, 2, 2, 1],
      [0.9, 1, 1, 1],
      [0.95, 1, 1, 1],
    ]
  );
  assert.deepEqual(report.bySettled, {
    files: { answers: 1, sameDeclaration: 1, sameExport: 0 },
    same: { answers: 1, sameDeclaration: 0, sameExport: 0 },
    symbols: { answers: 1, sameDeclaration: 1, sameExport: 1 },
  });
});

// ---------------------------------------------------------------------------------------------
// Jev

const JEV_SECRET = 'tsk-test-0123456789';

/** The declaration a Jev request is about, from the first line of its state. @param {any} body */
const declOfState = (body) => /** @type {string} */ (/^# Declaration `([^`]+)`/.exec(body.state)?.[1]);

/**
 * Jev's endpoint as a `fetch`: `respond(body, n)` gives the n-th call's `{ status?, body, headers? }`,
 * or throws for a network failure. Every call is recorded with its parsed body.
 * @param {(body: any, n: number) => { status?: number, body: unknown, headers?: Record<string, string> }} respond
 */
function fakeJev(respond) {
  /** @type {Array<{ url: string, method: string, headers: Record<string, string>, body: any }>} */
  const calls = [];
  /** @type {import('../public-exports-mapping/jev.mjs').Fetch} */
  const fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, method: init.method, headers: init.headers, body });
    const reply = respond(body, calls.length);
    const text = typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body);
    return new Response(text, { status: reply.status ?? 200, headers: reply.headers });
  };
  return Object.assign(fetch, { calls });
}

/**
 * A successor answer as the docs show it: probability `p` on `option`, the rest spread evenly.
 * @param {any} body  the request
 * @param {string} option
 * @param {{ p?: number, confidence?: number }} [options]
 */
function choiceAnswer(body, option, { p = 0.94, confidence = 0.9 } = {}) {
  const names = Object.keys(body.questions.successor.criteria);
  const rest = (1 - p) / (names.length - 1);
  const probabilities = Object.fromEntries(names.map((n) => [n, n === option ? p : rest]));
  return {
    body: {
      model: 'jev-1.13.0',
      answers: { successor: { type: 'choice', choice: option, probabilities, confidence } },
      usage: { input_tokens: 3000, output_tokens: 20 },
    },
  };
}

/** Score answers for the questions of a ranking request, in order. @param {any} body @param {number[]} scores */
function scoreAnswer(body, scores) {
  const answers = Object.fromEntries(
    Object.keys(body.questions).map((id, i) => [
      id,
      { type: 'score', score: scores[i] ?? 0, legend: {}, probabilities: {}, confidence: 0.6 },
    ])
  );
  return { body: { model: 'jev-1.13.0', answers, usage: { input_tokens: 3200, output_tokens: 40 } } };
}

test('jevRequestFor: the evidence as the state, one Choice over the candidate declarations and removed', () => {
  const { ctx } = fixtureContext();
  const bundle = evidenceFor(itemOf(ctx, IDENTIFIER_ARRAY), ctx);
  assert.equal(renderBundle(bundle), `${renderEvidence(bundle)}\nCall ${TOOL_NAME} once with your answer.`);
  const body = /** @type {any} */ (jevRequestFor(bundle));
  assert.deepEqual(Object.keys(body), ['model', 'state', 'questions']);
  assert.equal(body.model, 'jev-latest');
  assert.equal(body.state, renderEvidence(bundle).trimEnd());
  assert.doesNotMatch(body.state, new RegExp(TOOL_NAME));
  const { successor, ...others } = body.questions;
  assert.deepEqual(others, {});
  assert.equal(successor.type, 'choice');
  assert.match(
    successor.instructions,
    /^The state describes a declaration that WarpDrive \(formerly EmberData\) 1\.0\.0 exported and that git could not follow into 3\.0\.0, and candidate declarations of 3\.0\.0\. Which candidate continues it:/
  );
  // an option per declaration, named after the export the ranking puts first: public before -private
  assert.deepEqual(Object.entries(successor.criteria).slice(0, 2), [
    [
      'createLiveArray from @warp-drive/core/store/-private',
      'Candidate [1] in the state, declaration `warp-drive-packages/core/src/live-array.ts#createLiveArray`, found by history, file.',
    ],
    [
      'LiveArray from @warp-drive/core/types',
      'Candidate [2] in the state, declaration `warp-drive-packages/core/src/live-array.ts#LiveArray`, found by history, file.',
    ],
  ]);
  assert.deepEqual(Object.keys(successor.criteria).slice(2), ['removed']);
  assert.match(successor.criteria.removed, /^The declaration was removed: none of the candidates is/);

  // without candidates there is nothing to choose from
  assert.equal(jevRequestFor(evidenceFor(itemOf(ctx, STORE_REQUEST_INPUT), ctx)), null);
});

test('parseJevChoice: the export of the chosen declaration, removed as null, a reason from the probabilities', () => {
  const { ctx } = fixtureContext();
  const bundle = evidenceFor(itemOf(ctx, IDENTIFIER_ARRAY), ctx);
  const body = jevRequestFor(bundle);
  assert.deepEqual(
    parseJevChoice(choiceAnswer(body, 'LiveArray from @warp-drive/core/types', { confidence: 0.91 }).body, bundle),
    {
      choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
      confidence: 0.91,
      reason:
        'Jev (jev-1.13.0) put 0.94 on [2] LiveArray from @warp-drive/core/types (found by history, file), 0.03 on [1] createLiveArray from @warp-drive/core/store/-private (found by history, file), 0.03 on removed.',
      probabilities: {
        'createLiveArray from @warp-drive/core/store/-private': 0.03,
        'LiveArray from @warp-drive/core/types': 0.94,
        removed: 0.03,
      },
      model: 'jev-1.13.0',
      usage: { input_tokens: 3000, output_tokens: 20 },
    }
  );
  const removed = parseJevChoice(choiceAnswer(body, 'removed', { p: 1, confidence: 1.4 }).body, bundle);
  assert.deepEqual(
    [removed.choice, removed.confidence, removed.reason],
    [null, 1, 'Jev (jev-1.13.0) put 1.00 on removed.']
  );

  const answer = (/** @type {object} */ fields) => ({ answers: { successor: { type: 'choice', ...fields } } });
  assert.deepEqual(
    parseJevChoice(answer({ choice: 'LiveArray from @warp-drive/core/store/-private', confidence: 0.9 }), bundle),
    {
      error: 'Jev chose "LiveArray from @warp-drive/core/store/-private", which is not an option',
      retryable: false,
      usage: undefined,
    }
  );
  assert.deepEqual(parseJevChoice({ answers: {} }, bundle), {
    error: 'no successor answer in the response',
    retryable: true,
    usage: undefined,
  });
  assert.deepEqual(parseJevChoice(answer({ choice: 'removed', confidence: 'high' }), bundle), {
    error: 'confidence is not a number',
    retryable: false,
    usage: undefined,
  });
});

test('askJev posts one request per declaration with the key as a bearer token and retries what the docs say to retry', async () => {
  const { ctx } = fixtureContext();
  const bundles = [IDENTIFIER_ARRAY, STORE_REQUEST_INPUT, PEEK_RECORDS].map((decl) =>
    evidenceFor(itemOf(ctx, decl), ctx)
  );
  /** @type {number[]} */
  const waits = [];
  /** @type {string[]} */
  const lines = [];
  const fetch = fakeJev((body, n) => {
    if (n === 1) return { status: 429, body: { error: { message: 'slow down' } }, headers: { 'retry-after': '2' } };
    if (n === 2) return { status: 529, body: 'overloaded' };
    if (n === 3) throw new TypeError('fetch failed');
    if (declOfState(body) === IDENTIFIER_ARRAY) return choiceAnswer(body, 'LiveArray from @warp-drive/core/types');
    return { status: 422, body: { detail: [{ loc: ['body', 'questions'], msg: 'bad' }] } };
  });
  const answers = await askJev(bundles, {
    fetch,
    apiKey: JEV_SECRET,
    sleep: async (ms) => {
      waits.push(ms);
    },
    log: (line) => lines.push(line),
  });
  // a 429, a 529 and a network failure for the first declaration, then its answer; the second has
  // no candidates and is not sent; the third gets a 422, which is not retried
  assert.equal(fetch.calls.length, 5);
  for (const call of fetch.calls) {
    assert.deepEqual(
      [call.url, call.method, call.headers],
      [JEV_ENDPOINT, 'POST', { authorization: `Bearer ${JEV_SECRET}`, 'content-type': 'application/json' }]
    );
  }
  assert.deepEqual(waits, [2000, 2000, 4000]);
  assert.deepEqual(lines, [
    'judge: Jev HTTP 429: slow down; retrying in 2 s',
    'judge: Jev HTTP 529: overloaded; retrying in 2 s',
    'judge: Jev request failed: fetch failed; retrying in 4 s',
  ]);
  assert.deepEqual(
    answers.map((a) => [a.decl, a.choice ?? null, a.error ?? null, a.retryable ?? null]),
    [
      [IDENTIFIER_ARRAY, { module: '@warp-drive/core/types', export: 'LiveArray' }, null, null],
      [STORE_REQUEST_INPUT, null, NO_CANDIDATES, false],
      [PEEK_RECORDS, null, 'HTTP 422: [{"loc":["body","questions"],"msg":"bad"}]', false],
    ]
  );
});

test('postJev gives up after its retries; a refused key stops the run and the message hides the key', async () => {
  const sleep = async () => {};
  const busy = fakeJev(() => ({ status: 503, body: 'busy' }));
  assert.deepEqual(await postJev({}, { fetch: busy, apiKey: JEV_SECRET, sleep, retries: 2 }), {
    error: 'HTTP 503: busy',
    retryable: true,
  });
  assert.equal(busy.calls.length, 3);
  const refused = fakeJev(() => ({ status: 401, body: { error: { message: `invalid key ${JEV_SECRET}` } } }));
  await assert.rejects(postJev({}, { fetch: refused, apiKey: JEV_SECRET, sleep }), (error) => {
    assert.ok(error instanceof InputError);
    assert.equal(
      error.message,
      'judge: Jev refused the request (HTTP 401: invalid key $TYPESAFE_API_KEY); check TYPESAFE_API_KEY'
    );
    return true;
  });
  assert.equal(refused.calls.length, 1);
  await assert.rejects(askJev([], /** @type {any} */ ({ apiKey: JEV_SECRET })), /askJev needs fetch and apiKey/);
});

test('rankWithJev scores every candidate, best first, and records a failure instead of throwing', async () => {
  const { ctx } = fixtureContext();
  const [identifierArray, storeRequestInput, normalize] = [
    IDENTIFIER_ARRAY,
    STORE_REQUEST_INPUT,
    NORMALIZE_MODEL_NAME,
  ].map((decl) => evidenceFor(itemOf(ctx, decl), ctx));
  const body = /** @type {any} */ (jevRankRequestFor(identifierArray));
  assert.equal(body.state, renderEvidence(identifierArray).trimEnd());
  assert.deepEqual(Object.keys(body.questions), ['candidate_1', 'candidate_2']);
  assert.deepEqual(body.questions.candidate_2, {
    type: 'score',
    instructions:
      'How well does candidate [2], LiveArray from @warp-drive/core/types (declaration `warp-drive-packages/core/src/live-array.ts#LiveArray`), continue the declaration the state describes?',
    criteria: SCORE_LEVELS,
  });
  assert.equal(jevRankRequestFor(storeRequestInput), null);

  const fetch = fakeJev((request) =>
    declOfState(request) === IDENTIFIER_ARRAY ? scoreAnswer(request, [1.2, 2.84]) : { status: 403, body: 'forbidden' }
  );
  const ranked = await rankWithJev([identifierArray, storeRequestInput, normalize], {
    fetch,
    apiKey: JEV_SECRET,
    sleep: async () => {},
  });
  assert.deepEqual([...ranked.keys()], [IDENTIFIER_ARRAY, NORMALIZE_MODEL_NAME]);
  assert.deepEqual(ranked.get(IDENTIFIER_ARRAY), {
    scores: [
      {
        candidate: 2,
        choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
        decl: 'warp-drive-packages/core/src/live-array.ts#LiveArray',
        score: 2.84,
        confidence: 0.6,
      },
      {
        candidate: 1,
        choice: { module: '@warp-drive/core/store/-private', export: 'createLiveArray' },
        decl: 'warp-drive-packages/core/src/live-array.ts#createLiveArray',
        score: 1.2,
        confidence: 0.6,
      },
    ],
  });
  assert.deepEqual(ranked.get(NORMALIZE_MODEL_NAME), {
    error: 'judge: Jev refused the request (HTTP 403: forbidden); check TYPESAFE_API_KEY',
  });
});

// ---------------------------------------------------------------------------------------------
// The command

/** Answers for the six residue declarations, by declaration. */
const ANSWERS = {
  [ERRORS_ARRAY_TO_HASH]: { choice: null, confidence: 0.97, reason: 'Deleted with the 4.x deprecations in #8550.' },
  [FETCH_MANAGER]: {
    choice: { module: '@warp-drive/legacy/compat/-private', export: 'FetchManager' },
    confidence: 0.85,
    reason: 'The instance became a class in @warp-drive/legacy.',
  },
  [IDENTIFIER_ARRAY]: {
    choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
    confidence: 0.934,
    reason: 'Renamed in #9965; members and constructor match.',
  },
  [STORE_REQUEST_INPUT]: { choice: null, confidence: 0.55, reason: 'No export carries it any more.' },
  [NORMALIZE_MODEL_NAME]: {
    choice: { module: '@warp-drive/utilities/string', export: 'normalizeModelName' },
    confidence: 0.9,
    reason: 'Moved to the string utilities in #9000.',
  },
  [PEEK_RECORDS]: {
    choice: { module: '@warp-drive/core', export: 'peekRecords' },
    confidence: 0.9,
    reason: 'Renamed.',
  },
};
const DECL_BY_ID = Object.fromEntries(RESIDUE.map((decl) => [customIdFor(decl), decl]));
const answering = () =>
  fakeClient((request) => succeeded(ANSWERS[/** @type {keyof typeof ANSWERS} */ (DECL_BY_ID[request.custom_id])]));

test('judge --dry-run writes the bundles and request bodies and prints the summary', async (t) => {
  const { cwd, dataRoot, out, decisions } = copyData(t);
  const before = readFileSync(decisions, 'utf8');
  const output = capture(t);
  const code = await run(['--from', '1.0.0', '--dry-run', '--out', 'out'], { dataRoot, cwd, git: fakeGit(), env: {} });
  assert.equal(code, 0);
  assert.deepEqual(output.error, []);
  const histogram = Object.fromEntries(
    output.log.flatMap((line) => {
      const m = /^ {4}\s*(\d+(?:-\d+|\+)?)\s+(\d+)\s*#*$/.exec(line);
      return m ? [[m[1], Number(m[2])]] : [];
    })
  );
  assert.deepEqual(histogram, { 0: 1, 1: 2, '2-3': 4, '4-7': 0, '8-15': 0, '16-31': 0, '32+': 0 });
  assert.deepEqual(output.log.slice(0, 4), [
    'judge 1.0.0 -> 3.0.0',
    '  residue: 6 declarations (7 tokens); git settles 4',
    '  chains that resumed in a later release: 1',
    '  already decided: 0; open: 6; judged in this run: 6',
  ]);
  assert.deepEqual(output.log.slice(-4, -2), [
    '  tokens with no candidate: 1',
    '    @ember-data/store StoreRequestInput  (packages/store/src/types.ts#StoreRequestInput)',
  ]);
  assert.match(
    output.log.at(-2) ?? '',
    /^ {2}wrote out\/1\.0\.0-3\.0\.0\/bundles\.json and requests\.json \(6 requests, \d+ KB, about \d+k input tokens/
  );
  assert.equal(output.log.at(-1), 'judge: dry run, nothing sent');

  const bundles = JSON.parse(readFileSync(path.join(out, '1.0.0-3.0.0', 'bundles.json'), 'utf8'));
  assert.deepEqual(
    bundles.map((/** @type {any} */ b) => b.decl),
    RESIDUE
  );
  const { requests } = JSON.parse(readFileSync(path.join(out, '1.0.0-3.0.0', 'requests.json'), 'utf8'));
  assert.equal(requests.length, 6);
  assert.deepEqual(requests[2], requestFor(bundles[2]));
  assert.equal(readFileSync(decisions, 'utf8'), before);
});

test('judge asks Claude, writes decisions/<from>.json, and lists what needs review', async (t) => {
  const { cwd, dataRoot, out, decisions } = copyData(t);
  const output = capture(t);
  const git = fakeGit();
  const context = { dataRoot, cwd, git, env: {}, sleep: async () => {} };
  const client = answering();
  assert.equal(await run(['--from', '1.0.0', '--out', out], { ...context, client }), 0);
  assert.equal(client.created.length, 1);
  assert.equal(client.created[0].length, 6);

  const written = readFileSync(decisions, 'utf8');
  const doc = JSON.parse(written);
  assert.equal(written, canonical(doc));
  assert.deepEqual(
    { ...doc, entries: undefined },
    { schema: 1, kind: 'decisions', from: '1.0.0', to: '3.0.0', entries: undefined }
  );
  const shim = shimFromDiff(fixture('git/commits/2222222222.diff'), ['errorsArrayToHash']);
  assert.ok(shim);
  assert.deepEqual(doc.entries, [
    {
      decl: ERRORS_ARRAY_TO_HASH,
      source: { module: '@ember-data/adapter/error', export: 'errorsArrayToHash' },
      choice: null,
      confidence: 0.97,
      reason: 'Deleted with the 4.x deprecations in #8550.',
      judge: 'claude-opus-5-5',
      reviewed: false,
      removedIn: '#8550',
      shim,
    },
    {
      decl: FETCH_MANAGER,
      source: { module: '@ember-data/store/-private', export: 'fetchManager' },
      choice: { module: '@warp-drive/legacy/compat/-private', export: 'FetchManager' },
      confidence: 0.85,
      reason: 'The instance became a class in @warp-drive/legacy.',
      judge: 'claude-opus-5-5',
      reviewed: false,
    },
    {
      decl: IDENTIFIER_ARRAY,
      source: { module: '@ember-data/store', export: 'IdentifierArray' },
      choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
      confidence: 0.93,
      reason: 'Renamed in #9965; members and constructor match.',
      judge: 'claude-opus-5-5',
      reviewed: false,
    },
    {
      decl: NORMALIZE_MODEL_NAME,
      source: { module: '@ember-data/store', export: 'normalizeModelName' },
      choice: { module: '@warp-drive/utilities/string', export: 'normalizeModelName' },
      confidence: 0.9,
      reason: 'Moved to the string utilities in #9000.',
      judge: 'claude-opus-5-5',
      reviewed: false,
    },
  ]);
  const review = JSON.parse(readFileSync(path.join(out, '1.0.0-3.0.0', 'judge-review.json'), 'utf8'));
  assert.deepEqual(
    review.map((/** @type {any} */ r) => [r.decl, r.why, r.removedIn ?? null]),
    [
      [STORE_REQUEST_INPUT, ['below-threshold'], '#9500'],
      [PEEK_RECORDS, ['choice-not-in-to'], null],
    ]
  );
  assert.ok(output.log.includes('judge: 4 decisions at or above 0.8, 2 for review'));
  assert.ok(output.log.includes(`  review ${STORE_REQUEST_INPUT} [below-threshold]: removed at 0.55`));
  assert.ok(output.log.includes(`  review ${PEEK_RECORDS} [choice-not-in-to]: @warp-drive/core peekRecords at 0.9`));
  assert.ok(
    output.log.includes(
      'judge: usage 7200 input, 1800 output, 0 cache read, 0 cache write tokens (batch pricing applies)'
    )
  );
  assert.ok(git.calls.some((args) => args.join(' ') === 'show --format= 2222222222 -- packages/adapter/src/error.js'));
  assert.deepEqual(JSON.parse(readFileSync(path.join(out, '1.0.0-3.0.0', 'batches.json'), 'utf8')), [
    { id: 'msgbatch_1', round: 0, requests: 6 },
  ]);

  assert.equal(await run(['--check'], context), 0);

  // decided declarations are not asked again
  const again = answering();
  assert.equal(await run(['--from', '1.0.0', '--out', out], { ...context, client: again }), 0);
  assert.deepEqual(
    again.created[0].map((r) => DECL_BY_ID[r.custom_id]),
    [STORE_REQUEST_INPUT, PEEK_RECORDS]
  );
  assert.equal(readFileSync(decisions, 'utf8'), written);
});

test('judge --calibrate judges what git settled, blind, and writes no decisions', async (t) => {
  const { cwd, dataRoot, out, decisions } = copyData(t);
  const before = readFileSync(decisions, 'utf8');
  const output = capture(t);
  const context = { dataRoot, cwd, git: fakeGit(), env: {}, sleep: async () => {} };
  assert.equal(await run(['--from', '1.0.0', '--calibrate', '--dry-run', '--out', out], context), 0);
  assert.deepEqual(output.log.slice(0, 2), [
    'judge --calibrate 1.0.0 -> 3.0.0: 4 of the 4 declarations git settles, judged blind',
    '  settled by 2 symbols, 1 files, 1 same (symbols: a history.symbols entry; files: a file move; same: unchanged id)',
  ]);
  assert.ok(existsSync(path.join(out, '1.0.0-3.0.0', 'calibration-requests.json')));

  const { truth } = calibrationBundles(fixtureContext().ctx);
  const client = fakeClient((request) => {
    const { winner, settledBy: kind, decl } = truth[request.custom_id];
    return succeeded(
      decl.endsWith('#AdapterError')
        ? {
            choice: { module: '@warp-drive/legacy/adapter/error', export: 'InvalidError' },
            confidence: 0.6,
            reason: 'A guess.',
          }
        : { choice: winner, confidence: 0.95, reason: `Settled by ${kind}.` }
    );
  });
  assert.equal(await run(['--from', '1.0.0', '--calibrate', '--out', out], { ...context, client }), 0);
  const { report } = JSON.parse(readFileSync(path.join(out, '1.0.0-3.0.0', 'calibration.json'), 'utf8'));
  assert.equal(report.answers, 4);
  assert.deepEqual(report.bySettled, {
    files: { answers: 1, sameDeclaration: 1, sameExport: 1 },
    same: { answers: 1, sameDeclaration: 1, sameExport: 1 },
    symbols: { answers: 2, sameDeclaration: 1, sameExport: 1 },
  });
  assert.ok(output.log.includes('judge --calibrate: 4 answers, 0 errors'));
  assert.equal(readFileSync(decisions, 'utf8'), before);
});

test('judge --check passes valid decisions and fails stale or malformed ones', async (t) => {
  const { cwd, dataRoot, decisions } = copyData(t);
  const output = capture(t);
  const context = { dataRoot, cwd };
  assert.equal(await run(['--check'], context), 0);
  assert.deepEqual(output.log, ['judge --check: 1 decision files, 0 problems']);

  /** @param {object} fields */
  const entry = (fields) => ({
    choice: null,
    confidence: 0.9,
    reason: 'Checked.',
    judge: JUDGE_MODEL,
    reviewed: false,
    ...fields,
  });
  const doc = {
    schema: 1,
    kind: 'decisions',
    from: '1.0.0',
    to: '3.0.0',
    entries: [
      entry({
        decl: FETCH_MANAGER,
        source: { module: '@ember-data/store/-private', export: 'fetchManager' },
        choice: { module: '@warp-drive/legacy/compat', export: 'FetchManager' },
      }),
      entry({
        decl: IDENTIFIER_ARRAY,
        source: { module: '@ember-data/store', export: 'IdentifierArray' },
        choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
      }),
      entry({ decl: 'packages/store/src/gone.ts#gone', source: { module: '@ember-data/store', export: 'gone' } }),
    ],
  };
  writeFileSync(decisions, canonical(doc));
  output.log.length = 0;
  assert.equal(await run(['--check', '--from', '1.0.0'], context), 1);
  assert.deepEqual(output.log, [
    `judge --check: data/decisions/1.0.0.json: ${FETCH_MANAGER}: stale, choice @warp-drive/legacy/compat FetchManager is not a token of surfaces/3.0.0.json`,
    'judge --check: data/decisions/1.0.0.json: packages/store/src/gone.ts#gone: stale, not a declaration of surfaces/1.0.0.json',
    'judge --check: 1 decision files, 2 problems',
  ]);

  const malformed = {
    ...doc,
    entries: [
      entry({
        decl: IDENTIFIER_ARRAY,
        source: { module: '@ember-data/store', export: 'IdentifierArray' },
        choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
        removedIn: '#9965',
      }),
    ],
  };
  writeFileSync(decisions, JSON.stringify(malformed));
  output.log.length = 0;
  assert.equal(await run(['--check'], context), 1);
  assert.deepEqual(output.log, [
    'judge --check: data/decisions/1.0.0.json: not canonical: keys sorted, two-space indent, trailing newline',
    `judge --check: data/decisions/1.0.0.json: ${IDENTIFIER_ARRAY}: removedIn and shim belong to choice: null`,
    'judge --check: 1 decision files, 2 problems',
  ]);

  rmSync(path.join(dataRoot, 'surfaces', '3.0.0.json'));
  writeFileSync(decisions, canonical(doc));
  await assert.rejects(run(['--check'], context), /needs surfaces\/3\.0\.0\.json/);
  await assert.rejects(run(['--check', '--from', '9.9.9'], context), /decisions\/9\.9\.9\.json does not exist/);
});

/** Jev's answer for each residue declaration with candidates: the option and the confidence. */
const JEV_PICKS = {
  [ERRORS_ARRAY_TO_HASH]: ['removed', 0.95],
  [FETCH_MANAGER]: ['FetchManager from @warp-drive/legacy/compat/-private', 0.83],
  [IDENTIFIER_ARRAY]: ['LiveArray from @warp-drive/core/types', 0.91],
  [NORMALIZE_MODEL_NAME]: ['normalizeModelName from @warp-drive/utilities/string', 0.97],
  [PEEK_RECORDS]: ['peekRecord from @warp-drive/core', 0.42],
};
const jevAnswering = () =>
  fakeJev((body) => {
    if (!body.questions.successor) return scoreAnswer(body, [1.3]);
    const [option, confidence] = JEV_PICKS[/** @type {keyof typeof JEV_PICKS} */ (declOfState(body))];
    return choiceAnswer(body, /** @type {string} */ (option), { confidence: /** @type {number} */ (confidence) });
  });

test('judge --judge jev --dry-run writes the Jev request bodies; a live run needs TYPESAFE_API_KEY', async (t) => {
  const { cwd, dataRoot, out, decisions } = copyData(t);
  const before = readFileSync(decisions, 'utf8');
  const output = capture(t);
  const context = { dataRoot, cwd, git: fakeGit(), env: {} };
  assert.equal(await run(['--from', '1.0.0', '--judge', 'jev', '--dry-run', '--out', 'out'], context), 0);
  assert.match(
    output.log.at(-3) ?? '',
    /^ {2}wrote out\/1\.0\.0-3\.0\.0\/bundles\.json and requests\.jev\.json \(5 requests, \d+ KB, about \d+k input tokens/
  );
  assert.deepEqual(output.log.slice(-2), [
    '  declarations without candidates, not sent to Jev and left for review: 1',
    'judge: dry run, nothing sent',
  ]);
  const doc = JSON.parse(readFileSync(path.join(out, '1.0.0-3.0.0', 'requests.jev.json'), 'utf8'));
  assert.deepEqual(
    { ...doc, requests: doc.requests.map((/** @type {any} */ r) => r.decl) },
    {
      method: 'POST',
      endpoint: JEV_ENDPOINT,
      headers: { authorization: 'Bearer $TYPESAFE_API_KEY', 'content-type': 'application/json' },
      requests: [ERRORS_ARRAY_TO_HASH, FETCH_MANAGER, IDENTIFIER_ARRAY, NORMALIZE_MODEL_NAME, PEEK_RECORDS],
      unsent: [STORE_REQUEST_INPUT],
    }
  );
  const bundles = JSON.parse(readFileSync(path.join(out, '1.0.0-3.0.0', 'bundles.json'), 'utf8'));
  assert.deepEqual(doc.requests[2].body, jevRequestFor(bundles[2]));
  assert.equal(readFileSync(decisions, 'utf8'), before);
  await assert.rejects(
    run(['--from', '1.0.0', '--judge', 'jev', '--out', 'out'], context),
    /judge: TYPESAFE_API_KEY is not set; export it for a live --judge jev run, or pass --dry-run$/
  );
});

test('judge --judge jev writes decisions.jev.json beside the committed decisions and scores what goes to review', async (t) => {
  const { cwd, dataRoot, out, decisions } = copyData(t);
  const before = readFileSync(decisions, 'utf8');
  const output = capture(t);
  const fetch = jevAnswering();
  const context = { dataRoot, cwd, git: fakeGit(), env: { TYPESAFE_API_KEY: JEV_SECRET }, sleep: async () => {} };
  assert.equal(await run(['--from', '1.0.0', '--judge', 'jev', '--out', out], { ...context, fetch }), 0);
  assert.equal(readFileSync(decisions, 'utf8'), before, 'decisions/1.0.0.json belongs to claude');
  // five successor questions; then one ranking, for the review entry that has candidates
  assert.deepEqual(
    fetch.calls.map((call) => [declOfState(call.body), Object.keys(call.body.questions).join(' ')]),
    [
      [ERRORS_ARRAY_TO_HASH, 'successor'],
      [FETCH_MANAGER, 'successor'],
      [IDENTIFIER_ARRAY, 'successor'],
      [NORMALIZE_MODEL_NAME, 'successor'],
      [PEEK_RECORDS, 'successor'],
      [PEEK_RECORDS, 'candidate_1'],
    ]
  );
  const dir = path.join(out, '1.0.0-3.0.0');
  const written = JSON.parse(readFileSync(path.join(dir, 'decisions.jev.json'), 'utf8'));
  assert.deepEqual(
    { ...written, entries: undefined },
    { schema: 1, kind: 'decisions', from: '1.0.0', to: '3.0.0', entries: undefined }
  );
  assert.deepEqual(
    written.entries.map((/** @type {any} */ e) => [e.decl, e.choice, e.confidence, e.judge, e.removedIn ?? null]),
    [
      [ERRORS_ARRAY_TO_HASH, null, 0.95, 'jev', '#8550'],
      [FETCH_MANAGER, { module: '@warp-drive/legacy/compat/-private', export: 'FetchManager' }, 0.83, 'jev', null],
      [IDENTIFIER_ARRAY, { module: '@warp-drive/core/types', export: 'LiveArray' }, 0.91, 'jev', null],
      [
        NORMALIZE_MODEL_NAME,
        { module: '@warp-drive/utilities/string', export: 'normalizeModelName' },
        0.97,
        'jev',
        null,
      ],
    ]
  );
  assert.equal(written.entries[0].shim, shimFromDiff(fixture('git/commits/2222222222.diff'), ['errorsArrayToHash']));
  assert.equal(
    written.entries[2].reason,
    'Jev (jev-1.13.0) put 0.94 on [2] LiveArray from @warp-drive/core/types (found by history, file), 0.03 on [1] createLiveArray from @warp-drive/core/store/-private (found by history, file), 0.03 on removed.'
  );
  const review = JSON.parse(readFileSync(path.join(dir, 'judge-review.jev.json'), 'utf8'));
  assert.deepEqual(
    review.map((/** @type {any} */ r) => [r.decl, r.why, r.error ?? null, r.scores ?? null]),
    [
      [STORE_REQUEST_INPUT, ['error'], NO_CANDIDATES, null],
      [
        PEEK_RECORDS,
        ['below-threshold'],
        null,
        [
          {
            candidate: 1,
            choice: { module: '@warp-drive/core', export: 'peekRecord' },
            decl: 'warp-drive-packages/core/src/peek.ts#peekRecord',
            score: 1.3,
            confidence: 0.6,
          },
        ],
      ],
    ]
  );
  assert.ok(existsSync(path.join(dir, 'answers.jev.json')));
  assert.deepEqual(output.log.slice(-7), [
    'judge: Jev ranked the candidates of the review entries: 1 scored, 0 failed',
    'judge: 4 decisions at or above 0.8, 2 for review',
    `  review ${STORE_REQUEST_INPUT} [error]: ${NO_CANDIDATES}`,
    `  review ${PEEK_RECORDS} [below-threshold]: @warp-drive/core peekRecord at 0.42`,
    '  see out/1.0.0-3.0.0/judge-review.jev.json',
    'judge: usage 15000 input, 100 output tokens (Jev bills input tokens only)',
    'judge: wrote out/1.0.0-3.0.0/decisions.jev.json (4 entries); decisions/1.0.0.json belongs to claude (preferences.json "judge")',
  ]);
  // the key goes into the Authorization header and nowhere else
  for (const file of readdirSync(dir)) {
    assert.ok(!readFileSync(path.join(dir, file), 'utf8').includes(JEV_SECRET), file);
  }
  assert.ok(![...output.log, ...output.error].some((line) => line.includes(JEV_SECRET)));

  // a second run asks only about what this judge has not decided
  const again = jevAnswering();
  assert.equal(await run(['--from', '1.0.0', '--judge', 'jev', '--out', out], { ...context, fetch: again }), 0);
  assert.deepEqual(
    again.calls.filter((call) => call.body.questions.successor).map((call) => declOfState(call.body)),
    [PEEK_RECORDS]
  );
});

test('the judge preferences.json names writes decisions/<from>.json; an unknown one is refused', async (t) => {
  const { cwd, dataRoot, out, decisions } = copyData(t);
  const preferencesFile = path.join(dataRoot, 'preferences.json');
  const preferences = JSON.parse(readFileSync(preferencesFile, 'utf8'));
  writeFileSync(preferencesFile, canonical({ ...preferences, judge: 'jev' }));
  capture(t);
  const context = {
    dataRoot,
    cwd,
    git: fakeGit(),
    env: { TYPESAFE_API_KEY: JEV_SECRET },
    fetch: jevAnswering(),
    sleep: async () => {},
  };
  assert.equal(await run(['--from', '1.0.0', '--judge', 'jev', '--out', out], context), 0);
  const doc = JSON.parse(readFileSync(decisions, 'utf8'));
  assert.deepEqual(
    doc.entries.map((/** @type {any} */ e) => [e.decl, e.judge]),
    [ERRORS_ARRAY_TO_HASH, FETCH_MANAGER, IDENTIFIER_ARRAY, NORMALIZE_MODEL_NAME].map((decl) => [decl, 'jev'])
  );
  assert.ok(existsSync(path.join(out, '1.0.0-3.0.0', 'judge-review.json')));
  assert.ok(!existsSync(path.join(out, '1.0.0-3.0.0', 'decisions.jev.json')));
  assert.equal(await run(['--check'], context), 0);

  writeFileSync(preferencesFile, canonical({ ...preferences, judge: 'gpt' }));
  await assert.rejects(
    run(['--from', '1.0.0', '--dry-run', '--out', out], context),
    /judge: preferences\.json names judge gpt; use claude, jev, thread/
  );
});

test('judge --calibrate --judge jev judges what git settled, blind, through Jev', async (t) => {
  const { cwd, dataRoot, out } = copyData(t);
  const output = capture(t);
  const { truth } = calibrationBundles(fixtureContext().ctx);
  const fetch = fakeJev((body) => {
    const { winner } = truth[customIdFor(declOfState(body))];
    return choiceAnswer(body, `${winner.export} from ${winner.module}`);
  });
  const context = { dataRoot, cwd, git: fakeGit(), env: { TYPESAFE_API_KEY: JEV_SECRET }, fetch };
  assert.equal(await run(['--from', '1.0.0', '--calibrate', '--judge', 'jev', '--out', out], context), 0);
  const dir = path.join(out, '1.0.0-3.0.0');
  const { report } = JSON.parse(readFileSync(path.join(dir, 'calibration.jev.json'), 'utf8'));
  assert.deepEqual(report.bySettled, {
    files: { answers: 1, sameDeclaration: 1, sameExport: 1 },
    same: { answers: 1, sameDeclaration: 1, sameExport: 1 },
    symbols: { answers: 2, sameDeclaration: 2, sameExport: 2 },
  });
  assert.ok(existsSync(path.join(dir, 'calibration-requests.jev.json')));
  assert.ok(existsSync(path.join(dir, 'calibration-answers.jev.json')));
  assert.ok(output.log.includes('judge --calibrate: 4 answers, 0 errors'));
  // blind: no option says how its candidate was found
  for (const call of fetch.calls) {
    for (const description of Object.values(call.body.questions.successor.criteria)) {
      assert.doesNotMatch(String(description), /found by/);
    }
  }
});

test('judge --import records the answers of the project thread through the same checks as a model answer', async (t) => {
  const { cwd, dataRoot, out, decisions } = copyData(t);
  const before = readFileSync(decisions, 'utf8');
  const output = capture(t);
  writeFileSync(
    path.join(cwd, 'answers.json'),
    JSON.stringify({
      [ERRORS_ARRAY_TO_HASH]: { choice: null, confidence: 0.9, reason: 'Deleted with the 4.x deprecations in #8550.' },
      [FETCH_MANAGER]: {
        choice: { module: '@warp-drive/legacy/compat/-private', export: 'FetchManager' },
        confidence: 0.85,
        reason: 'The instance became a class.',
      },
      [IDENTIFIER_ARRAY]: {
        choice: { module: '@warp-drive/core/types', export: 'LiveArray' },
        confidence: 0.5,
        reason: 'Probably LiveArray.',
      },
      [NORMALIZE_MODEL_NAME]: { choice: 'normalizeModelName', confidence: 0.9, reason: 'Moved.' },
      [PEEK_RECORDS]: {
        choice: { module: '@warp-drive/core', export: 'peekRecords' },
        confidence: 0.9,
        reason: 'Renamed.',
      },
      'packages/store/src/store-service.ts#default': { choice: null, confidence: 1, reason: 'Git settles it.' },
    })
  );
  const context = { dataRoot, cwd, git: fakeGit(), env: {} };
  const reviewLines = [
    `  review ${IDENTIFIER_ARRAY} [below-threshold]: @warp-drive/core/types LiveArray at 0.5`,
    `  review ${NORMALIZE_MODEL_NAME} [error]: choice is neither null nor { module, export }`,
    `  review ${PEEK_RECORDS} [choice-not-in-to]: @warp-drive/core peekRecords at 0.9`,
  ];
  // a dry run checks and counts, and writes nothing
  assert.equal(await run(['--from', '1.0.0', '--import', 'answers.json', '--dry-run', '--out', out], context), 0);
  assert.deepEqual(output.log, [
    'judge --import: skipped packages/store/src/store-service.ts#default: not residue of this pair',
    'judge --import 1.0.0 -> 3.0.0: 5 answers for 6 open declarations, 1 skipped',
    'judge: 2 decisions at or above 0.8, 3 for review',
    ...reviewLines,
    'judge: dry run, nothing written',
  ]);
  assert.ok(!existsSync(path.join(out, '1.0.0-3.0.0')));

  output.log.length = 0;
  assert.equal(await run(['--from', '1.0.0', '--import', 'answers.json', '--out', out], context), 0);
  assert.equal(readFileSync(decisions, 'utf8'), before, 'decisions/1.0.0.json belongs to claude');
  const dir = path.join(out, '1.0.0-3.0.0');
  const written = JSON.parse(readFileSync(path.join(dir, 'decisions.thread.json'), 'utf8'));
  assert.deepEqual(written.entries, [
    {
      decl: ERRORS_ARRAY_TO_HASH,
      source: { module: '@ember-data/adapter/error', export: 'errorsArrayToHash' },
      choice: null,
      confidence: 0.9,
      reason: 'Deleted with the 4.x deprecations in #8550.',
      judge: 'thread',
      reviewed: false,
      removedIn: '#8550',
      shim: shimFromDiff(fixture('git/commits/2222222222.diff'), ['errorsArrayToHash']),
    },
    {
      decl: FETCH_MANAGER,
      source: { module: '@ember-data/store/-private', export: 'fetchManager' },
      choice: { module: '@warp-drive/legacy/compat/-private', export: 'FetchManager' },
      confidence: 0.85,
      reason: 'The instance became a class.',
      judge: 'thread',
      reviewed: false,
    },
  ]);
  const review = JSON.parse(readFileSync(path.join(dir, 'judge-review.thread.json'), 'utf8'));
  assert.deepEqual(
    review.map((/** @type {any} */ r) => [r.decl, r.why]),
    [
      [IDENTIFIER_ARRAY, ['below-threshold']],
      [NORMALIZE_MODEL_NAME, ['error']],
      [PEEK_RECORDS, ['choice-not-in-to']],
    ]
  );
  assert.deepEqual(output.log.slice(2), [
    'judge: 2 decisions at or above 0.8, 3 for review',
    ...reviewLines,
    '  see out/1.0.0-3.0.0/judge-review.thread.json',
    'judge: wrote out/1.0.0-3.0.0/decisions.thread.json (2 entries); decisions/1.0.0.json belongs to claude (preferences.json "judge")',
  ]);

  // importing again skips what is decided
  output.log.length = 0;
  assert.equal(await run(['--from', '1.0.0', '--import', 'answers.json', '--dry-run', '--out', out], context), 0);
  assert.deepEqual(output.log.slice(0, 4), [
    `judge --import: skipped ${ERRORS_ARRAY_TO_HASH}: already decided; delete its entry to replace it`,
    `judge --import: skipped ${FETCH_MANAGER}: already decided; delete its entry to replace it`,
    'judge --import: skipped packages/store/src/store-service.ts#default: not residue of this pair',
    'judge --import 1.0.0 -> 3.0.0: 3 answers for 4 open declarations, 3 skipped',
  ]);
  await assert.rejects(
    run(['--from', '1.0.0', '--import', 'missing.json'], context),
    /judge: missing\.json does not exist/
  );
  writeFileSync(path.join(cwd, 'list.json'), '[]');
  await assert.rejects(
    run(['--from', '1.0.0', '--import', 'list.json'], context),
    /the answers are not an object keyed by declaration id/
  );
});

test('judge --compare prints agreement, then the disagreements and low-confidence entries for a person', async (t) => {
  const { cwd, dataRoot } = copyData(t);
  const output = capture(t);
  /** @param {string} decl @param {any} choice @param {number} confidence @param {string} judge */
  const entry = (decl, choice, confidence, judge) => ({ decl, choice, confidence, reason: `${judge} says so.`, judge });
  const claude = 'claude-opus-5-5';
  writeFileSync(
    path.join(cwd, 'a.json'),
    canonical({
      schema: 1,
      kind: 'decisions',
      from: '1.0.0',
      to: '3.0.0',
      entries: [
        entry(ERRORS_ARRAY_TO_HASH, null, 0.97, claude),
        entry(FETCH_MANAGER, { module: '@warp-drive/legacy/compat/-private', export: 'FetchManager' }, 0.85, claude),
        entry(IDENTIFIER_ARRAY, { module: '@warp-drive/core/store/-private', export: 'LiveArray' }, 0.93, claude),
        entry(
          NORMALIZE_MODEL_NAME,
          { module: '@warp-drive/utilities/string', export: 'normalizeModelName' },
          0.9,
          claude
        ),
        entry(PEEK_RECORDS, { module: '@warp-drive/core', export: 'peekRecord' }, 0.6, claude),
      ],
    })
  );
  // a review or answers file is a plain list, and an entry with an error is no answer
  writeFileSync(
    path.join(cwd, 'b.json'),
    canonical([
      entry(ERRORS_ARRAY_TO_HASH, null, 0.95, 'jev'),
      entry(FETCH_MANAGER, null, 0.81, 'jev'),
      entry(IDENTIFIER_ARRAY, { module: '@warp-drive/core/types', export: 'LiveArray' }, 0.91, 'jev'),
      entry(NORMALIZE_MODEL_NAME, { module: '@warp-drive/utilities/string', export: 'dasherize' }, 0.7, 'jev'),
      entry(STORE_REQUEST_INPUT, null, 0.85, 'jev'),
      { decl: PEEK_RECORDS, error: NO_CANDIDATES, why: ['error'] },
    ])
  );
  assert.equal(await run(['--compare', 'a.json', 'b.json'], { dataRoot, cwd }), 0);
  assert.deepEqual(output.log, [
    'judge --compare',
    '  A: a.json, 5 entries (claude-opus-5-5)',
    '  B: b.json, 6 entries (jev)',
    '  both answered 4: agree 1 (25%), same declaration through another export 1, disagree 2',
    '  only A answered 1, only B answered 1',
    '  disagreements:',
    `    ${FETCH_MANAGER}`,
    '      A: @warp-drive/legacy/compat/-private FetchManager at 0.85: claude-opus-5-5 says so.',
    '      B: removed at 0.81: jev says so.',
    `    ${NORMALIZE_MODEL_NAME}`,
    '      A: @warp-drive/utilities/string normalizeModelName at 0.9: claude-opus-5-5 says so.',
    '      B: @warp-drive/utilities/string dasherize at 0.7: jev says so.',
    '  same declaration, another export:',
    `    ${IDENTIFIER_ARRAY}`,
    '      A: @warp-drive/core/store/-private LiveArray at 0.93: claude-opus-5-5 says so.',
    '      B: @warp-drive/core/types LiveArray at 0.91: jev says so.',
    '  below 0.8 in either file, not listed above:',
    `    ${PEEK_RECORDS}`,
    '      A: @warp-drive/core peekRecord at 0.6: claude-opus-5-5 says so.',
    `      B: error: ${NO_CANDIDATES}`,
    '  only B answered:',
    `    ${STORE_REQUEST_INPUT}`,
    '      A: no entry',
    '      B: removed at 0.85: jev says so.',
  ]);
  await assert.rejects(run(['--compare', 'a.json'], { dataRoot, cwd }), /--compare takes two files/);
  await assert.rejects(
    run(['--compare', 'a.json', 'nope.json'], { dataRoot, cwd }),
    /judge: nope\.json does not exist/
  );
});

test('judge: usage errors and missing inputs throw', async (t) => {
  const { cwd, dataRoot, out } = copyData(t);
  const output = capture(t);
  const context = { dataRoot, cwd, git: fakeGit(), env: {} };
  await assert.rejects(run(['--bogus'], context), /^Error: judge: Unknown option '--bogus'/);
  await assert.rejects(
    run(['--dry-run'], context),
    /judge: --from is required\nusage: cli\.mjs judge --from <version>/
  );
  await assert.rejects(
    run(['--from', '1.0.0', '--threshold', '1.5'], context),
    /--threshold takes a number from 0 to 1/
  );
  await assert.rejects(
    run(['--from', '1.0.0', '--judge', 'gpt'], context),
    /unknown judge gpt; use claude, jev, thread/
  );
  await assert.rejects(
    run(['--from', '1.0.0', '--judge', 'thread'], context),
    /--judge thread takes its answers from --import <answers\.json>/
  );
  await assert.rejects(
    run(['--from', '1.0.0', '--judge', 'jev', '--import', 'a.json'], context),
    /--import records the answers of a person or the project thread; it takes no --judge jev/
  );
  await assert.rejects(
    run(['--from', '1.0.0', '--import', 'a.json', '--calibrate'], context),
    /--calibrate asks a model: use --judge claude or jev/
  );
  await assert.rejects(
    run(['--from', '1.0.0', '--judge', 'jev', '--effort', 'high'], context),
    /--effort is for --judge claude/
  );
  await assert.rejects(run(['--from', '1.0.0', 'extra'], context), /unexpected argument extra/);
  await assert.rejects(run(['--from', '0.9.0', '--dry-run'], context), /judge: 0\.9\.0 is not a covered release/);
  await assert.rejects(run(['--from', '1.0.0', '--out', out], context), /ANTHROPIC_API_KEY is not set/);
  output.log.length = 0;
  assert.equal(await run(['--help'], context), 0);
  assert.match(output.log[0], /^usage: cli\.mjs judge --from <version>/);
});
