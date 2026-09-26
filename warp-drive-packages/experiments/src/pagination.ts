/**
 * Experimental reactive pagination primitives.
 *
 * The implementation lives in `@warp-drive/core` alongside the other
 * signal-based subscriptions, but the API is still experimental and is
 * only published from this package. The Ember components that build on
 * it, `<Paginate />` and `<EachLink />`, are published from
 * `@warp-drive/ember/experiments`.
 *
 * See the [Pagination guide](/guides/the-manual/experiments/pagination) for
 * an introduction.
 *
 * @summary Experimental reactive pagination primitives for tracking page state, links, and caches across paginated
 * requests.
 * @module
 */
export {
  createPaginationSubscription,
  createPaginationLinksSubscription,
  getPaginationState,
  getPaginationLinks,
  getPaginationCache,
  clearPaginationCache,
  defaultPageHints,
} from '@warp-drive/core/signals/-leaked';
export type {
  PaginateArgs,
  PaginateMode,
  PaginationSubscription,
  PaginationLinksSubscription,
  PaginationState,
  SharedPaginationState,
  PagedPaginationState,
  InfinitePaginationState,
  PaginationStateFor,
  PaginationContentFeatures,
  SharedPaginationContentFeatures,
  PagedPaginationContentFeatures,
  InfinitePaginationContentFeatures,
  PaginationContentFeaturesFor,
  PaginationCache,
  PageHints,
  PageCache,
  PaginationLinks,
  PaginationLink,
  RealPaginationLink,
  PlaceholderPaginationLink,
  RelationalPaginationLink,
} from '@warp-drive/core/signals/-leaked';
