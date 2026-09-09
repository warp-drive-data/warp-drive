import { findRecord, query } from '@ember-data/json-api/request';
import { query as restQuery } from '@ember-data/rest/request';
import type { ReactiveDataDocument, ReactiveDocument, ReactiveErrorDocument } from '@warp-drive/core/reactive';
import { withReactiveResponse } from '@warp-drive/core/request';
import type { ApiError } from '@warp-drive/core/types/spec/error';
import type { Meta } from '@warp-drive/core/types/spec/json-api-raw';
import type { RequestSignature, Type } from '@warp-drive/core/types/symbols';
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

/** The response type a builder brands onto the request options it returns. */
type ContentOf<X> = NonNullable<X[typeof RequestSignature & keyof X]>;

/**
 * The `errors` member of a document's error arm.
 *
 * `E` never appears on the data arm — `errors` there is `undefined` — so
 * reaching it means going through the union a link-follower resolves with.
 * Comparing the documents directly is not enough: `E` would then only occur in
 * method positions, which TypeScript compares bivariantly, and the assertion
 * passes whatever `E` is.
 */
type ErrorsOf<D extends { next: (...args: never[]) => unknown }> = Extract<
  Awaited<ReturnType<D['next']>>,
  { errors: unknown[] }
>['errors'];

interface User {
  id: string;
  name: string;
  [Type]: 'user';
}

type PageMeta = {
  page: { limit: number; offset: number };
  total?: number;
};

const collection = query<User, PageMeta>('user');
const resource = findRecord<User, PageMeta>('user', '1');
const restCollection = restQuery<User, PageMeta>('user');
const handWritten = withReactiveResponse<User[], PageMeta, ApiError>({ url: '/users' });

/**
 * These assertions are the test: `check:types` fails if `M` stops reaching
 * `meta`, if `E` stops reaching `errors`, or if either default changes.
 */
type DocumentParamsReachTheirMembers = [
  // -- meta ---------------------------------------------------------------
  // the supplied meta reaches `meta` unchanged, on both arms, and is not
  // optional there — declaring the shape is what removes the `?.`
  MustBeTrue<Exact<ReactiveDataDocument<User, PageMeta>['meta'], PageMeta>>,
  MustBeTrue<Exact<ReactiveErrorDocument<User, PageMeta>['meta'], PageMeta>>,
  // omitting it leaves today's behavior in place
  MustBeTrue<Exact<ReactiveDataDocument<User>['meta'], Meta | undefined>>,
  // a meta-only endpoint has no primary data to name — `never` says so, and
  // the meta is still typed
  MustBeTrue<Exact<ReactiveDataDocument<never, PageMeta>['meta'], PageMeta>>,
  MustBeTrue<Exact<ReactiveDataDocument<never, PageMeta>['data'], never>>,

  // -- errors -------------------------------------------------------------
  // the cache stores what the API sent without validating it, so the default
  // promises no shape
  MustBeTrue<Exact<ReactiveErrorDocument<User>['errors'], object[]>>,
  // a request that knows its endpoint can say so
  MustBeTrue<Exact<ReactiveErrorDocument<User, Meta, ApiError>['errors'], ApiError[]>>,
  // `object[]` satisfies the assertion above on its own — every member of
  // ApiError is optional, so `object` is assignable to it — so probe a member
  // too. Reading `status` off `object` is itself the error if `E` stops
  // reaching `errors`.
  MustBeTrue<Exact<ReactiveErrorDocument<User, Meta, ApiError>['errors'][number]['status'], string | undefined>>,

  // -- both, through the builders -----------------------------------------
  // link-following stays on the same endpoint, so it keeps both params
  MustBeTrue<
    Exact<
      ReturnType<ReactiveDataDocument<User[], PageMeta, ApiError>['next']>,
      Promise<ReactiveDocument<User[], PageMeta, ApiError> | null>
    >
  >,
  // the json-api builders know their dialect, so they default `E` to ApiError
  MustBeTrue<Exact<ContentOf<typeof collection>, ReactiveDataDocument<User[], PageMeta, ApiError>>>,
  MustBeTrue<Exact<ContentOf<typeof resource>, ReactiveDataDocument<User, PageMeta, ApiError>>>,
  MustBeTrue<Exact<ContentOf<typeof handWritten>, ReactiveDataDocument<User[], PageMeta, ApiError>>>,
  MustBeTrue<Exact<ErrorsOf<ContentOf<typeof collection>>[number]['status'], string | undefined>>,
  MustBeTrue<Exact<ErrorsOf<ContentOf<typeof resource>>[number]['status'], string | undefined>>,
  // ...while rest and active-record do not, so theirs stays `object`
  MustBeTrue<Exact<ErrorsOf<ContentOf<typeof restCollection>>, object[]>>,
];

const EXPECTED = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true] as const;

module('Unit | Document type params', function () {
  test('the meta and errors params reach the response document', function (assert) {
    // The real assertions are the type above: this case exists so a failure has
    // a home in the suite, and so the type is referenced rather than unused.
    const assertions: DocumentParamsReachTheirMembers = [...EXPECTED];

    assert.deepEqual(assertions, [...EXPECTED], 'both params reach every document member');
    assert.equal(collection.method, 'GET', 'query built a GET request');
    assert.equal(resource.method, 'GET', 'findRecord built a GET request');
    assert.equal(handWritten.url, '/users', 'withReactiveResponse passed the object through');
  });
});
