import { findRecord, query } from '@ember-data/json-api/request';
import type { ReactiveDataDocument, ReactiveDocument, ReactiveErrorDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { FindRecordRequestOptions, QueryRequestOptions } from '@warp-drive/core/types/request';
import type { ApiError } from '@warp-drive/core/types/spec/error';
import type { Meta } from '@warp-drive/core/types/spec/json-api-raw';
import type { Type } from '@warp-drive/core/types/symbols';
import { module, test } from '@warp-drive/diagnostic';

/**
 * `true` when `A` and `B` are mutually assignable, `false` otherwise.
 *
 * Wrapping both sides in a tuple defeats the distribution and bivariance that
 * would otherwise make a plain conditional too permissive — `meta` is covariant,
 * so a narrowed document is assignable to the default one in one direction.
 */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

/** Errors on anything but `true`, turning a failed {@link Exact} into a type error. */
type MustBeTrue<T extends true> = T;

interface User {
  id: string;
  name: string;
  [Type]: 'user';
}

type PageMeta = {
  page: { limit: number; offset: number };
  total?: number;
};

/**
 * These assertions are the test: `check:types` fails if the `M` param stops
 * reaching `meta`, or if `errors` stops being {@link ApiError}[].
 */
type DocumentMetaIsParameterized = [
  // the supplied meta reaches `meta` unchanged
  MustBeTrue<Exact<ReactiveDataDocument<User, PageMeta>['meta'], PageMeta | undefined>>,
  MustBeTrue<Exact<ReactiveErrorDocument<User, PageMeta>['meta'], PageMeta | undefined>>,
  // omitting it leaves today's behavior in place
  MustBeTrue<Exact<ReactiveDataDocument<User>['meta'], Meta | undefined>>,
  // link-following stays on the same endpoint, so it keeps the same meta
  MustBeTrue<
    Exact<
      ReturnType<ReactiveDataDocument<User[], PageMeta>['next']>,
      Promise<ReactiveDocument<User[], PageMeta> | null>
    >
  >,
  // errors are the {json:api} error object, not `object`
  MustBeTrue<Exact<ReactiveErrorDocument<User>['errors'], ApiError[]>>,
  // `object[]` satisfies the assertion above — every member of ApiError is
  // optional, so `object` is assignable to it — so probe a member as well.
  // Reading `status` off `object` is itself the error if errors widens back.
  MustBeTrue<Exact<ReactiveErrorDocument<User>['errors'][number]['status'], string | undefined>>,
];

module('Unit | Document meta types', function () {
  test('builders carry the supplied meta type through to the response document', function (assert) {
    // The real assertions are the type above and the annotations below: this
    // case exists so a failure has a home in the suite, and so the type is
    // referenced rather than unused.
    const assertions: DocumentMetaIsParameterized = [true, true, true, true, true, true];

    const collection: QueryRequestOptions<ReactiveDataDocument<User[], PageMeta>> = query<User, PageMeta>('user');
    const resource: FindRecordRequestOptions<ReactiveDataDocument<User, PageMeta>, User> = findRecord<User, PageMeta>(
      'user',
      '1'
    );
    const handWritten = withReactiveResponse<User[], PageMeta>({ url: '/users' });

    assert.deepEqual(assertions, [true, true, true, true, true, true], 'the meta param reaches every document member');
    assert.equal(collection.method, 'GET', 'query built a GET request');
    assert.equal(resource.method, 'GET', 'findRecord built a GET request');
    assert.equal(handWritten.url, '/users', 'withReactiveResponse passed the object through');
  });
});
