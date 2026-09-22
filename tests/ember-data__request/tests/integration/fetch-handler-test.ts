import RequestManager from '@ember-data/request';
import { buildBaseURL } from '@ember-data/request-utils';
import Fetch from '@ember-data/request/fetch';
import { module, test } from '@warp-drive/diagnostic';
import { mock, MockServerHandler, setTestId } from '@warp-drive/holodeck';
import { GET, HEAD } from '@warp-drive/holodeck/mock';

function isNetworkError(e: unknown): asserts e is Error & {
  status: number;
  statusText: string;
  code: number;
  name: string;
  isRequestError: boolean;
  content?: object;
  errors?: object[];
} {
  if (!(e instanceof Error)) {
    throw new Error('Expected a network error');
  }
}

module('RequestManager | Fetch Handler', function (hooks) {
  test('Parses 200 Responses', async function (assert) {
    const manager = new RequestManager();
    manager.use([new MockServerHandler(this), Fetch]);

    await GET(this, 'users/1', () => ({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          name: 'Chris Thoburn',
        },
      },
    }));

    const doc = await manager.request({ url: buildBaseURL({ resourcePath: 'users/1' }) });
    const serialized = JSON.parse(JSON.stringify(doc)) as unknown;
    // @ts-expect-error
    // oxlint-disable-next-line typescript/no-unsafe-member-access
    serialized.response.headers = (serialized.response.headers as [string, string][]).filter((v) => {
      // don't test headers that change every time
      return !['content-length', 'date', 'etag', 'last-modified'].includes(v[0]);
    });

    assert.deepEqual(
      serialized,
      {
        content: {
          data: {
            attributes: {
              name: 'Chris Thoburn',
            },
            id: '1',
            type: 'user',
          },
        },
        request: {
          url: buildBaseURL({ resourcePath: 'users/1' }),
        },
        response: {
          headers: [
            ['cache-control', 'no-store'],
            ['content-type', 'application/vnd.api+json'],
          ],
          ok: true,
          redirected: false,
          status: 200,
          statusText: '',
          type: 'default',
          url: '',
        },
      },
      'The response is processed correctly'
    );
  });

  test('Supports GET requests with search params', async function (assert) {
    const manager = new RequestManager();
    manager.use([new MockServerHandler(this), Fetch]);

    await GET(this, 'users?name=Chris', () => ({
      data: [
        {
          id: '1',
          type: 'user',
          attributes: {
            name: 'Chris Thoburn',
          },
        },
      ],
    }));

    const doc = await manager.request({ url: buildBaseURL({ resourcePath: 'users' }) + '?name=Chris' });
    assert.deepEqual(
      doc.content,
      {
        data: [
          {
            id: '1',
            type: 'user',
            attributes: {
              name: 'Chris Thoburn',
            },
          },
        ],
      },
      'The response is processed correctly'
    );
  });

  test('Supports HEAD requests', async function (assert) {
    const manager = new RequestManager();
    manager.use([new MockServerHandler(this), Fetch]);

    await HEAD(this, 'users/1', () => ({}));

    const doc = await manager.request({ url: buildBaseURL({ resourcePath: 'users/1' }), method: 'HEAD' });
    const serialized = JSON.parse(JSON.stringify(doc)) as unknown;
    // @ts-expect-error
    // oxlint-disable-next-line typescript/no-unsafe-member-access
    serialized.response.headers = (serialized.response.headers as [string, string][]).filter((v) => {
      // don't test headers that change every time
      return !['content-length', 'date', 'etag', 'last-modified'].includes(v[0]);
    });

    assert.deepEqual(
      serialized,
      {
        content: null,
        request: {
          url: buildBaseURL({ resourcePath: 'users/1' }),
          method: 'HEAD',
        },
        response: {
          headers: [
            ['cache-control', 'no-store'],
            ['content-type', 'application/vnd.api+json'],
          ],
          ok: true,
          redirected: false,
          status: 200,
          statusText: '',
          type: 'default',
          url: '',
        },
      },
      'The response is processed correctly'
    );
  });

  test('It provides useful errors', async function (assert) {
    const manager = new RequestManager();
    manager.use([new MockServerHandler(this), Fetch]);

    await mock(this, () => ({
      url: 'users/1',
      status: 404,
      headers: {},
      method: 'GET',
      statusText: 'Not Found',
      body: null,
      response: {
        errors: [
          {
            status: '404',
            title: 'Not Found',
            detail: 'The resource does not exist.',
          },
        ],
      },
    }));

    try {
      await manager.request({ url: buildBaseURL({ resourcePath: 'users/1' }) });
      assert.ok(false, 'Should have thrown');
    } catch (e) {
      isNetworkError(e);
      assert.true(e instanceof AggregateError, 'The error is an AggregateError');
      assert.equal(
        e.message,
        `[404 Not Found] GET (cors) - ${buildBaseURL({ resourcePath: 'users/1' })}`,
        'The error message is correct'
      );
      assert.equal(e.status, 404, 'The error status is correct');
      assert.equal(e.statusText, 'Not Found', 'The error statusText is correct');
      assert.equal(e.code, 404, 'The error code is correct');
      assert.equal(e.name, 'NotFoundError', 'The error code is correct');
      assert.true(e.isRequestError, 'The error is a request error');

      // error.content is present
      assert.deepEqual(
        e.content,
        {
          errors: [
            {
              status: '404',
              title: 'Not Found',
              detail: 'The resource does not exist.',
            },
          ],
        },
        'The error.content is present'
      );

      // error.errors is present
      assert.deepEqual(
        e.errors,
        [
          {
            status: '404',
            title: 'Not Found',
            detail: 'The resource does not exist.',
          },
        ],
        'The error.errors is present'
      );
    }
  });

  test('It explains a missing mock', async function (assert) {
    const manager = new RequestManager();
    manager.use([new MockServerHandler(this), Fetch]);

    try {
      await manager.request({ url: buildBaseURL({ resourcePath: 'users/never-mocked' }) });
      assert.ok(false, 'Should have thrown');
    } catch (e) {
      isNetworkError(e);
      assert.true(
        e.message.includes('No meta was found for'),
        `The error message says the mock is missing. Got: ${e.message}`
      );
      assert.true(
        e.message.includes('You may need to record a mock for this request'),
        'The error message says how to fix it'
      );
      assert.true(e.message.includes('.mock-cache'), 'The error message names the cacheKey it looked for');
      assert.false(e.message.includes('__xTestId'), 'The internal test query is stripped from the message');
    }
  });

  test('It reports a mock the test never requested', async function (assert) {
    // deliberately declared and never requested
    await GET(this, 'users/declared-but-never-requested', () => ({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          name: 'Chris Thoburn',
        },
      },
    }));

    // `setTestId(context, null)` is what every suite calls from `afterEach`, and
    // where the check lives. Drive it here so this test asserts on the report
    // instead of being failed by it.
    try {
      setTestId(this, null);
      assert.ok(false, 'setTestId should have reported the unrequested mock');
    } catch (e) {
      assert.true(e instanceof Error, 'an Error is thrown');
      assert.equal(
        (e as Error).message,
        'Holodeck: this test declared mocks it never requested.\n\n\tGET users/declared-but-never-requested (mocked 1, requested 0)\n\n' +
          'A mock that is never requested proves nothing. Remove it, or make the request it describes.',
        'The error names the method, the url, and both counts'
      );
    }
  });

  test('It provides useful error during abort', async function (assert) {
    const manager = new RequestManager();
    manager.use([new MockServerHandler(this), Fetch]);

    await GET(this, 'users/1', () => ({
      data: {
        id: '1',
        type: 'user',
        attributes: {
          name: 'Chris Thoburn',
        },
      },
    }));

    try {
      const future = manager.request({ url: buildBaseURL({ resourcePath: 'users/1' }) });
      await Promise.resolve();
      future.abort();
      await future;
      assert.ok(false, 'Should have thrown');
    } catch (e) {
      isNetworkError(e);
      assert.true(e instanceof DOMException, 'The error is a DOMException');
      assert.equal(e.message, 'The user aborted a request.', 'The error message is correct');
      assert.equal(e.status, 20, 'The error status is correct');
      assert.equal(e.statusText, 'Aborted', 'The error statusText is correct');
      assert.equal(e.code, 20, 'The error code is correct');
      assert.equal(e.name, 'AbortError', 'The error name is correct');
      assert.true(e.isRequestError, 'The error is a request error');
    }
  });
});
