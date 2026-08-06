import { useRecommendedStore } from '@warp-drive/core';
import { PRODUCTION } from '@warp-drive/core/build-config/env';
import { module, skip, test as runTest } from '@warp-drive/diagnostic';
import { JSONAPICache } from '@warp-drive/json-api';

import { captureLoggedReport } from './utils';

const test = PRODUCTION ? skip : runTest;

function widgetSchema() {
  return {
    type: 'widget',
    legacy: true,
    identity: { kind: '@id' as const, name: 'id' },
    fields: [{ kind: 'field' as const, name: 'name' }],
  };
}

module('Validator | Report Compaction', function () {
  test('it collapses a widely repeated identical error down to a single annotated occurrence with a recurrence note', async function (assert) {
    const capture = captureLoggedReport();
    const TOTAL = 600;
    const data = Array.from({ length: TOTAL }, (_, i) => ({
      type: 'widget',
      id: String(i),
      attributes: { name: `Widget ${i}`, bogus: true },
    }));

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

    await store.request({ url: '/widgets' });
    capture.restore();

    const allText = capture.seen.map((v) => (typeof v[0] === 'string' ? v[0] : '')).join('\n');

    const found = capture.seen.some(
      (v) => typeof v[0] === 'string' && v[0].startsWith(`${TOTAL} errors and 0 warnings found`)
    );
    assert.true(found, `the header reports all ${TOTAL} occurrences even though only one is annotated inline`);

    const recurrenceMatches = allText.match(/\(recurs \d+ more times\)/g) ?? [];
    assert.equal(recurrenceMatches.length, 1, 'exactly one recurrence note is printed for the repeated error');
    assert.true(
      allText.includes(`(recurs ${TOTAL - 1} more times)`),
      'the recurrence note reports the correct number of remaining occurrences'
    );

    const annotationCount = (allText.match(/❌/g) ?? []).length;
    assert.equal(annotationCount, 1, 'only the first occurrence of the repeated error is annotated inline');
  });

  test('it collapses long stretches of error-free source into skip markers', async function (assert) {
    const capture = captureLoggedReport();
    // enough clean resources before and after the single bad one that the
    // gaps are far larger than the default context window
    const data = [
      ...Array.from({ length: 100 }, (_, i) => ({
        type: 'widget',
        id: `before-${i}`,
        attributes: { name: `Widget ${i}` },
      })),
      { type: 'widget', id: 'the-bad-one', attributes: { name: 'Bad Widget', bogus: true } },
      ...Array.from({ length: 100 }, (_, i) => ({
        type: 'widget',
        id: `after-${i}`,
        attributes: { name: `Widget ${i}` },
      })),
    ];

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

    await store.request({ url: '/widgets' });
    capture.restore();

    const allText = capture.seen.map((v) => (typeof v[0] === 'string' ? v[0] : '')).join('\n');

    const skipMatches = [...allText.matchAll(/\.\.\. (\d+) lines? skipped \(no errors\) \.\.\./g)];
    assert.equal(skipMatches.length, 2, 'a skip marker is printed both before and after the single annotated error');

    const annotationCount = (allText.match(/❌/g) ?? []).length;
    assert.equal(annotationCount, 1, 'the single error is still annotated inline despite the surrounding compaction');
  });

  test('it caps the number of distinct issues shown and reports what was omitted', async function (assert) {
    const capture = captureLoggedReport();
    const PAIR_COUNT = 60; // more than the default maxDistinctIssues of 50
    // duplicate-resource messages embed the specific `type:id` and occurrence
    // paths involved, so every occurrence here produces a distinct message
    const data: Array<{ type: string; id: string; attributes: { name: string } }> = [];
    for (let i = 0; i < PAIR_COUNT; i++) {
      data.push({ type: 'widget', id: String(i), attributes: { name: `Widget ${i}` } });
      data.push({ type: 'widget', id: String(i), attributes: { name: `Widget ${i} (duplicate)` } });
    }

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

    await store.request({ url: '/widgets' });
    capture.restore();

    const allText = capture.seen.map((v) => (typeof v[0] === 'string' ? v[0] : '')).join('\n');

    const TOTAL_ERRORS = PAIR_COUNT * 2;
    const found = capture.seen.some(
      (v) => typeof v[0] === 'string' && v[0].startsWith(`${TOTAL_ERRORS} errors and 0 warnings found`)
    );
    assert.true(found, `the header reports all ${TOTAL_ERRORS} occurrences even though most are not shown`);

    const notShownMatch = allText.match(
      /\.\.\. and (\d+) more distinct issues? \((\d+) occurrences?\) not shown \.\.\./
    );
    assert.true(!!notShownMatch, 'a trailing note reports the distinct issues that were omitted');

    if (notShownMatch) {
      const [, hiddenGroups, hiddenOccurrences] = notShownMatch;
      // every duplicate-resource message here is unique, so each hidden
      // group corresponds to exactly one hidden occurrence
      assert.equal(
        hiddenGroups,
        String(TOTAL_ERRORS - 50),
        'the correct number of distinct issues is reported as hidden'
      );
      assert.equal(hiddenOccurrences, hiddenGroups, 'each hidden distinct issue here has exactly one occurrence');
    }
  });
});
