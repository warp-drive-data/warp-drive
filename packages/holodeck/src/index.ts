/**
 * @summary Test utilities for mocking HTTP requests against the Holodeck mock server, which records responses as
 * fixtures and replays them in later runs.
 * @module
 * @mergeModuleWith <project>
 */
import { SHOULD_RECORD } from '@warp-drive/core/build-config/env';
import type { Handler, NextFn } from '@warp-drive/core/request';
import type { HTTPMethod, RequestContext, RequestInfo, StructuredDataDocument } from '@warp-drive/core/types/request';
import type { MinimumAdapterInterface } from '@warp-drive/legacy/compat';
import type { Store } from '@warp-drive/legacy/store';

import type { LazyScaffold, Scaffold, ScaffoldGenerator } from './mock';

const TEST_IDS = new WeakMap<
  object,
  {
    id: string;
    /**
     * keeps track of the count of calls to record a mock
     */
    mock: {
      /**
       * For each GET, we keep track of the count
       * for a specific URL
       */
      GET: Record<string, number>;
      /**
       * For each PUT, we keep track of the count
       * for a specific URL
       */
      PUT: Record<string, number>;
      /**
       * For each PATCH, we keep track of the count
       * for a specific URL
       */
      PATCH: Record<string, number>;
      /**
       * For each DELETE, we keep track of the count
       * for a specific URL
       */
      DELETE: Record<string, number>;
      /**
       * For each POST, we keep track of the count
       * for a specific URL
       */
      POST: Record<string, number>;
      /**
       * For each OPTIONS, we keep track of the count
       * for a specific URL
       */
      OPTIONS: Record<string, number>;
      /**
       * For each QUERY, we keep track of the count
       * for a specific URL
       */
      QUERY: Record<string, number>;
      /**
       * for each HEAD, we keep track of the count
       * for a specific URL
       */
      HEAD: Record<string, number>;
      /**
       * for each CONNECT, we keep track of the count
       * for a specific URL
       */
      CONNECT: Record<string, number>;
      /**
       * for each TRACE, we keep track of the count
       * for a specific URL
       */
      TRACE: Record<string, number>;
    };
    /**
     * keeps track of the count of calls to make a request
     */
    request: {
      /**
       * For each GET, we keep track of the count
       * for a specific URL
       */
      GET: Record<string, number>;
      /**
       * For each PUT, we keep track of the count
       * for a specific URL
       */
      PUT: Record<string, number>;
      /**
       * For each PATCH, we keep track of the count
       * for a specific URL
       */
      PATCH: Record<string, number>;
      /**
       * For each DELETE, we keep track of the count
       * for a specific URL
       */
      DELETE: Record<string, number>;
      /**
       * For each POST, we keep track of the count
       * for a specific URL
       */
      POST: Record<string, number>;
      /**
       * For each OPTIONS, we keep track of the count
       * for a specific URL
       */
      OPTIONS: Record<string, number>;
      /**
       * For each QUERY, we keep track of the count
       * for a specific URL
       */
      QUERY: Record<string, number>;
      /**
       * for each HEAD, we keep track of the count
       * for a specific URL
       */
      HEAD: Record<string, number>;
      /**
       * for each CONNECT, we keep track of the count
       * for a specific URL
       */
      CONNECT: Record<string, number>;
      /**
       * for each TRACE, we keep track of the count
       * for a specific URL
       */
      TRACE: Record<string, number>;
    };
  }
>();

/**
 * The shape `setTestId` stores per test context, named so the report below can
 * take one as an argument.
 */
type TestEntry = NonNullable<ReturnType<(typeof TEST_IDS)['get']>>;

let HOST = '/';

/**
 * @summary Sets the host url of the Holodeck mock server that recordings are sent to.
 * @public
 */

export function setConfig({ host }: { host: string }): void {
  HOST = host.endsWith('/') ? host : `${host}/`;
}

/**
 * @summary Assigns a test context its Holodeck test id before a test, or clears it after, reporting an error for any
 * mock the test never requested.
 * @public
 */

export function setTestId(context: object, str: string | null): void {
  if (str && TEST_IDS.has(context)) {
    throw new Error(`MockServerHandler is already configured with a testId.`);
  }
  if (str) {
    TEST_IDS.set(context, {
      id: str,
      mock: {
        GET: {},
        PUT: {},
        PATCH: {},
        DELETE: {},
        POST: {},
        QUERY: {},
        OPTIONS: {},
        HEAD: {},
        CONNECT: {},
        TRACE: {},
      },
      request: {
        GET: {},
        PUT: {},
        PATCH: {},
        DELETE: {},
        POST: {},
        QUERY: {},
        OPTIONS: {},
        HEAD: {},
        CONNECT: {},
        TRACE: {},
      },
    });
  } else {
    const test = TEST_IDS.get(context);
    TEST_IDS.delete(context);

    if (test) {
      reportUnrequestedMocks(test);
    }
  }
}

/**
 * A mock is declared relative to the mock server (`users/1`) while the request
 * carries the absolute url the code under test built
 * (`https://localhost:7358/users/1`). The mock server reconciles the two by
 * keying a fixture on the request's path, so compare them the same way.
 */
function normalizeUrlKey(url: string): string {
  const withoutOrigin = url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '');
  return withoutOrigin.startsWith('/') ? withoutOrigin.slice(1) : withoutOrigin;
}

/**
 * A mock the test never requested proves nothing: the test passes whether or
 * not the code under test would have made that request. Nothing compared the
 * two counters holodeck already keeps, so report the difference here, from the
 * `afterEach` every suite runs, which fails the test that leaked.
 *
 * The original assertions are not masked by this: a framework reports an
 * `afterEach` throw alongside the results the test body already recorded
 * rather than in place of them.
 */
function reportUnrequestedMocks(test: TestEntry): void {
  const unrequested: string[] = [];

  for (const method of Object.keys(test.mock) as HTTPMethod[]) {
    const mocked = test.mock[method];
    const requested = test.request[method] ?? {};
    const requestCounts = new Map<string, number>();

    for (const url of Object.keys(requested)) {
      const key = normalizeUrlKey(url);
      requestCounts.set(key, (requestCounts.get(key) ?? 0) + requested[url]);
    }

    for (const url of Object.keys(mocked)) {
      const mockCount = mocked[url];
      const requestCount = requestCounts.get(normalizeUrlKey(url)) ?? 0;

      if (mockCount > requestCount) {
        unrequested.push(`\t${method} ${url} (mocked ${mockCount}, requested ${requestCount})`);
      }
    }
  }

  if (unrequested.length) {
    throw new Error(
      `Holodeck: this test declared mocks it never requested.\n\n${unrequested.join('\n')}\n\n` +
        `A mock that is never requested proves nothing. Remove it, or make the request it describes.`
    );
  }
}

const shouldRecord = SHOULD_RECORD ? true : false;
let IS_RECORDING: boolean | null = null;

/**
 * @summary Overrides at runtime whether Holodeck mocks are recorded to fixtures, in place of the build-time
 * `SHOULD_RECORD` flag.
 * @public
 */
export function setIsRecording(value: boolean): void {
  IS_RECORDING = value === null ? value : Boolean(value);
}

/**
 * @summary Reports whether Holodeck mocks are recorded to fixtures, using the `setIsRecording` override when set or the
 * build-time `SHOULD_RECORD` flag otherwise.
 * @public
 */
export function getIsRecording(): boolean {
  return IS_RECORDING === null ? shouldRecord : IS_RECORDING;
}

/**
 * A request handler that intercepts requests and routes them through
 * the Holodeck mock server.
 *
 * This handler modifies the request URL to include test identifiers
 * and manages request counts for accurate mocking.
 *
 * Requires that the test context be configured with a testId using `setTestId`.
 *
 * @summary RequestManager handler that routes requests to the Holodeck mock server by tagging each url with the test id
 * and request count.
 * @param owner - the test context object used to retrieve the test ID.
 */
export class MockServerHandler implements Handler {
  declare owner: object;
  constructor(owner: object) {
    this.owner = owner;
  }
  async request<T>(context: RequestContext, next: NextFn<T>): Promise<StructuredDataDocument<T>> {
    const { request, queryForTest } = setupHolodeckFetch(this.owner, Object.assign({}, context.request));

    try {
      const future = next(request);
      context.setStream(future.getStream());
      return await future;
    } catch (e) {
      if (e instanceof Error && !(e instanceof DOMException)) {
        const explanation = getHolodeckExplanation(e);
        if (explanation) {
          e.message = `${e.message}\n\n${explanation}`;
        }
        e.message = e.message.split(queryForTest).join('');
      }
      throw e;
    }
  }
}

const HOLODECK_ERROR_CODES = new Set([
  'MOCK_NOT_FOUND',
  'MISSING_X_TEST_ID_HEADER',
  'MISSING_X_TEST_REQUEST_NUMBER_HEADER',
]);

/**
 * The mock server explains itself in the response body, which the thrown
 * error only carries as data. Lift that explanation into the message so it
 * reaches a terminal and a CI log.
 */
function getHolodeckExplanation(e: Error): string | null {
  const { content } = e as Error & { content?: unknown };
  if (!content || typeof content !== 'object') {
    return null;
  }
  const { errors } = content as { errors?: unknown };
  if (!Array.isArray(errors)) {
    return null;
  }

  return (
    errors
      .filter((error): error is { code: string; detail?: string } => {
        return (
          !!error && typeof error === 'object' && HOLODECK_ERROR_CODES.has((error as { code?: unknown }).code as string)
        );
      })
      .map((error) => error.detail)
      .filter((detail): detail is string => typeof detail === 'string')
      .join('\n\n') || null
  );
}

function setupHolodeckFetch(owner: object, request: RequestInfo): { request: RequestInfo; queryForTest: string } {
  const test = TEST_IDS.get(owner);
  if (!test) {
    throw new Error(`MockServerHandler is not configured with a testId. Use setTestId to set the testId for each test`);
  }

  const url = request.url!;
  const firstChar = url.includes('?') ? '&' : '?';
  const method = (request.method?.toUpperCase() ?? 'GET') as HTTPMethod;

  // enable custom methods
  if (!test.request[method]) {
    // oxlint-disable-next-line no-console
    console.log(`⚠️ Using custom HTTP method ${method} for response to request ${url}`);

    test.request[method] = {};
  }
  if (!(url in test.request[method])) {
    test.request[method][url] = 0;
  }

  const queryForTest = `${firstChar}__xTestId=${test.id}&__xTestRequestNumber=${test.request[method][url]++}`;
  request.url = url + queryForTest;
  request.method = method;

  request.mode = 'cors';
  request.credentials = 'omit';
  request.referrerPolicy = '';

  // since holodeck currently runs on a separate port
  // and we don't want to trigger cors pre-flight
  // we convert PUT to POST to keep the request in the
  // "simple" cors category.
  // if (request.method === 'PUT') {
  //   request.method = 'POST';
  // }

  const headers = new Headers(request.headers);
  if (headers.has('Content-Type')) {
    // under the rules of simple-cors, content-type can only be
    // one of three things, none of which are what folks typically
    // set this to. Since holodeck always expects body to be JSON
    // this "just works".
    headers.set('Content-Type', 'text/plain');
    request.headers = headers;
  }

  return { request, queryForTest };
}

interface HasAdapterForFn {
  adapterFor(this: Store, modelName: string): MinimumAdapterInterface;
  adapterFor(this: Store, modelName: string, _allowMissing?: true): MinimumAdapterInterface | undefined;
}

/*
  _fetchRequest(options: FetchRequestInit): Promise<Response> {
    const fetchFunction = fetch();

    return fetchFunction(options.url, options);
  }
*/
interface PrivateAdapter {
  _fetchRequest(options: RequestInfo): Promise<Response>;
  hasOverriddenFetch: boolean;
  useFetch: boolean;
}

function upgradeAdapter(adapter: unknown): asserts adapter is PrivateAdapter {}
function upgradeStore(store: Store): asserts store is Store & { adapterFor: HasAdapterForFn['adapterFor'] } {
  if (typeof store.adapterFor !== 'function') {
    throw new Error('Store is not compatible with Holodeck. Missing adapterFor method.');
  }
}

/**
 * Creates an adapterFor function that wraps the provided adapterFor function
 * to override the adapter's _fetchRequest method to route requests through
 * the Holodeck mock server.
 *
 * @summary Patches a legacy store so its adapters send `_fetchRequest` calls through the Holodeck mock server for the
 * given test context.
 * @param owner - The test context object used to retrieve the test ID.
 */
export function installAdapterFor(owner: object, store: Store): void {
  upgradeStore(store);
  const fn = store.adapterFor;
  function holodeckAdapterFor(
    this: Store,
    modelName: string,
    _allowMissing?: true
  ): MinimumAdapterInterface | undefined {
    const adapter = fn.call(this, modelName, _allowMissing);

    if (adapter) {
      upgradeAdapter(adapter);

      if (!adapter.hasOverriddenFetch) {
        adapter.hasOverriddenFetch = true;
        adapter.useFetch = true;
        const originalFetch = adapter._fetchRequest?.bind(adapter);

        adapter._fetchRequest = function (options: RequestInfo) {
          if (!originalFetch) {
            throw new Error(`Adapter ${String(modelName)} does not implement _fetchRequest`);
          }
          const { request } = setupHolodeckFetch(owner, options);

          return originalFetch(request);
        };
      }
    }

    return adapter;
  }
  store.adapterFor = holodeckAdapterFor as HasAdapterForFn['adapterFor'];
}

/**
 * Mock a request by sending the scaffold to the mock server.
 *
 * @summary Registers a mock response with the Holodeck server for the current test, recording it as a fixture when
 * recording and only counting it when replaying.
 * @public
 */
export async function mock(
  owner: object,
  generate: ScaffoldGenerator | LazyScaffold,
  isRecording?: boolean
): Promise<void> {
  const test = TEST_IDS.get(owner);
  if (!test) {
    throw new Error(`Cannot call "mock" before configuring a testId. Use setTestId to set the testId for each test`);
  }

  // A LazyScaffold carries its identity, so its body is built only when
  // recording. A bare generator is the only source of its own identity, so it
  // has to run either way; the helpers in ./mock never pass one.
  let method: string;
  let mockUrl: string;
  let buildScaffold: () => Scaffold;
  if (typeof generate === 'function') {
    const scaffold = generate();
    ({ method, url: mockUrl } = scaffold);
    buildScaffold = () => scaffold;
  } else {
    ({ method, url: mockUrl } = generate);
    buildScaffold = generate.scaffold;
  }
  if (!mockUrl || !method) {
    throw new Error(`MockError: Cannot mock a request without providing a URL and Method`);
  }
  const mockMethod = (method.toUpperCase() ?? 'GET') as HTTPMethod;

  // enable custom methods
  if (!test.mock[mockMethod]) {
    // oxlint-disable-next-line no-console
    console.log(`⚠️ Using custom HTTP method ${mockMethod} for response to request ${mockUrl}`);
    test.mock[mockMethod] = {};
  }
  if (!(mockUrl in test.mock[mockMethod])) {
    test.mock[mockMethod][mockUrl] = 0;
  }
  // counted whether or not we are recording, so that a mock the test never
  // requests is reported in replay runs too, not only while recording.
  const testMockNum = test.mock[mockMethod][mockUrl]++;

  // `isRecording` is the per-request RECORD override, which records even when
  // the suite as a whole is replaying.
  if (!getIsRecording() && !isRecording) {
    return;
  }

  const requestToMock = buildScaffold();
  const url = `${HOST}__record?__xTestId=${test.id}&__xTestRequestNumber=${testMockNum}`;
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(requestToMock),
    mode: 'cors',
    credentials: 'omit',
    referrerPolicy: '',
  });

  if (!response.ok) {
    throw new Error(
      `MockError: Holodeck failed to record ${mockMethod} ${mockUrl} (${response.status} ${response.statusText}). ${await getRecordFailureDetail(response)}`
    );
  }
}

/**
 * A failed recording is otherwise invisible until the next replay run fails
 * with a missing fixture, so report what the server said at the point of
 * failure.
 */
async function getRecordFailureDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { errors?: { detail?: string }[] };
    const detail = body.errors?.[0]?.detail;
    return detail ?? 'The mock server gave no explanation.';
  } catch {
    return 'The mock server gave no explanation.';
  }
}
