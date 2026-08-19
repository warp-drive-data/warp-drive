import { useRecommendedStore } from '@warp-drive/core';
import { PRODUCTION } from '@warp-drive/core/build-config/env';
import { module, skip, test as runTest } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

import { captureLoggedReport } from './utils';

const test = PRODUCTION ? skip : runTest;

// The reporter renders every line of the document, pushing two color args per line
// and four more per finding. It emits at most `Reporter.maxLines` rendered lines per
// console.log call, so the arg count of any one call is bounded by the chunk size.
const MAX_LINES = 500;
const MAX_ARGS_PER_CALL = 1 + 4 * MAX_LINES;
const HEADER = 'found in the {json:api} document returned by';

function widgetSchema() {
  return {
    type: 'widget',
    legacy: true,
    identity: { kind: '@id' as const, name: 'id' },
    fields: [{ kind: 'field' as const, name: 'name' }],
  };
}

function storeWithResponse(data: unknown) {
  const Store = useRecommendedStore({
    cache: JSONAPICache,
    handlers: [
      {
        request<T>() {
          return Promise.resolve({ data }) as Promise<T>;
        },
      },
    ],
  });
  const store = new Store();
  store.schema.registerResources([widgetSchema()]);
  return store;
}

// the report begins at the call carrying the context header; joining from there
// keeps the assertions immune to anything else that logged during the request
function reportText(seen: unknown[][]) {
  const start = seen.findIndex((args) => typeof args[0] === 'string' && args[0].includes(HEADER));
  return start === -1
    ? ''
    : seen
        .slice(start)
        .map((args) => (typeof args[0] === 'string' ? args[0] : ''))
        .join('\n');
}

function headerCalls(seen: unknown[][]) {
  return seen.filter((args) => typeof args[0] === 'string' && args[0].includes(HEADER));
}

module('Validator | Report Chunking', function () {
  test('it emits a large report in bounded chunks rather than one unbounded console.log call', async function (assert) {
    const TOTAL = 600;
    const data = Array.from({ length: TOTAL }, (_, i) => ({
      type: 'widget',
      id: String(i),
      attributes: { name: `Widget ${i}`, bogus: true },
    }));

    const capture = captureLoggedReport();
    const store = storeWithResponse(data);
    await store.request({ url: '/widgets' });
    capture.restore();

    const argCounts = capture.seen.map((args) => args.length);
    const largest = Math.max(...argCounts);

    // the regression guard: before chunking this was a single call carrying two args
    // per line of the whole document, which overflows the engine's argument limit
    assert.true(
      largest <= MAX_ARGS_PER_CALL,
      `no single console.log call receives more than ${MAX_ARGS_PER_CALL} args (largest was ${largest})`
    );
    assert.true(
      argCounts.filter((count) => count > 1).length > 1,
      'the colorized report is spread across more than one call'
    );

    const text = reportText(capture.seen);
    assert.equal(headerCalls(capture.seen).length, 1, 'the context header is printed once, on the first chunk');
    assert.true(text.startsWith(`${TOTAL} errors and 0 warnings found`), 'the header still counts every finding');
    assert.true(text.includes(`Widget ${TOTAL - 1}`), 'the tail of the document is still reported');
    assert.equal((text.match(/❌/g) ?? []).length, TOTAL, 'every finding is still annotated');
  });

  test('it still emits a report that fits within maxLines as a single call', async function (assert) {
    const data = [{ type: 'widget', id: '1', attributes: { name: 'Widget 1', bogus: true } }];

    const capture = captureLoggedReport();
    const store = storeWithResponse(data);
    await store.request({ url: '/widgets' });
    capture.restore();

    const headers = headerCalls(capture.seen);
    assert.equal(headers.length, 1, 'the report is printed in one call');

    const text = typeof headers[0]?.[0] === 'string' ? headers[0][0] : '';
    assert.true(text.startsWith('1 errors and 0 warnings found'), 'the header is present');
    assert.true(text.includes('❌'), 'the finding is annotated in that same call');
    assert.true(text.includes('Widget 1'), 'the whole document is in that same call');
  });
});
