import type { TOC } from '@ember/component/template-only';
import { service } from '@ember/service';
import Component from '@glimmer/component';

import { importSync, macroCondition, moduleExists } from '@embroider/macros';
import type { ComponentLike } from '@glint/template';

import type { RequestManager, Store } from '@warp-drive/core';
import { assert } from '@warp-drive/core/build-config/macros';
import type { RequestLoadingState } from '@warp-drive/core/reactive';
import type {
  PaginateArgs,
  PaginateMode,
  PaginationContentFeaturesFor,
  PaginationStateFor,
  PaginationSubscription,
  RecoveryFeatures,
} from '@warp-drive/core/signals/-leaked';
import { createPaginationSubscription, DISPOSE, memoized } from '@warp-drive/core/signals/-leaked';
import type { StructuredErrorDocument } from '@warp-drive/core/types/request';

import { and, Throw } from './await.gts';

function notNull(x: null): never;
function notNull<T>(x: T): Exclude<T, null>;
function notNull<T>(x: T | null) {
  assert('Expected a non-null value, but got null', x !== null);
  return x;
}

const not = (x: unknown) => !x;
const IdleBlockMissingError = new Error(
  'No idle block provided for <Paginate> component, and no query or request was provided.'
);

let consume = service;
if (macroCondition(moduleExists('ember-provide-consume-context'))) {
  const { consume: contextConsume } = importSync('ember-provide-consume-context') as { consume: typeof service };
  consume = contextConsume;
}

const DefaultChrome: TOC<{
  Blocks: {
    default: [];
  };
}> = <template>{{yield}}</template>;

export interface EmberPaginateArgs<RT, E, M extends PaginateMode = 'paged'> extends PaginateArgs<RT, E> {
  /**
   * Which navigation surface the component yields: `'paged'` (the default) or
   * `'infinite'`. Type-only — it narrows the state and features yielded to the
   * `content`, `always`, and `default` blocks so the two surfaces cannot be
   * mixed, and is never read at runtime.
   */
  mode?: M;

  chrome?: ComponentLike<{
    Blocks: { default: [] };
    Args: { state: PaginationStateFor<RT, E, M> | null; features: PaginationContentFeaturesFor<RT, M> };
  }>;
}

interface PaginateSignature<RT, E, M extends PaginateMode = 'paged'> {
  Args: EmberPaginateArgs<RT, E, M>;
  Blocks: {
    /**
     * The block to render when the component is idle and waiting to be given a request.
     *
     */
    idle: [];

    /**
     * The block to render when the request is loading.
     *
     */
    loading: [state: RequestLoadingState];

    /**
     * The block to render when the request was cancelled.
     *
     */
    cancelled: [error: StructuredErrorDocument<E>, features: RecoveryFeatures];

    /**
     * The block to render when the request failed. If this block is not provided,
     * the error will be rethrown.
     *
     * Thus it is required to provide an error block and proper error handling if
     * you do not want the error to crash the application.
     *
     */
    error: [error: StructuredErrorDocument<E>, features: RecoveryFeatures];

    /**
     * The block to render when the request succeeded.
     *
     */
    content: [state: PaginationStateFor<RT, E, M>, features: PaginationContentFeaturesFor<RT, M>];
    always: [state: PaginationStateFor<RT, E, M>, features: PaginationContentFeaturesFor<RT, M>];

    /**
     * The fallback block, rendered when no other named blocks are provided.
     * Receives the same params as the `content` block.
     *
     * When this block is provided, none of the other named blocks will ever
     * be utilized — providing it signals that request state management will
     * occur elsewhere, so the block renders regardless of the state of the
     * initiating request.
     *
     */
    default: [state: PaginationStateFor<RT, E, M>, features: PaginationContentFeaturesFor<RT, M>];
  };
}

/**
 * The `<Paginate />` component provides declarative, reactive control-flow for
 * rendering a paginated collection: it monitors the request that loads the
 * collection's entry page and yields a pagination state for navigating and
 * rendering the collection's pages.
 *
 * ## Blocks
 *
 * Five states, only one of which renders at a time:
 *
 * - `idle`: no request to monitor yet. If the component is idle and no idle
 *   block is provided, an error is thrown.
 * - `loading`: the collection is blocking-loading — only the very first page
 *   load (or the reset to a different collection) enters this state. Receives
 *   the request's `RequestLoadingState` for progress UIs. Navigating with
 *   `loadPage`/`loadNext`/`loadPrev` does not re-enter it; those surface
 *   through the individual page requests instead.
 * - `cancelled`: the initial request was aborted. Falls through to the `error`
 *   block when no cancelled block is provided; if neither block exists the
 *   cancellation is swallowed.
 * - `error`: the initial request rejected. If no error block is provided, the
 *   error is rethrown — provide one if the failure should not crash the app.
 *   Both `cancelled` and `error` receive the error and recovery features
 *   (`retry`, `isOnline`, `isHidden`).
 * - `content`: the collection is ready. Receives the pagination state
 *   (`pages`) and the content features.
 *
 * Two additional blocks sit outside the state machine: `always` renders in
 * every state, and providing a `default` block replaces all named blocks —
 * it renders regardless of the request's state, for consumers managing
 * control-flow themselves. Both receive the same params as `content`.
 *
 * ## Modes
 *
 * The `@mode` arg (`'paged'`, the default, or `'infinite'`) narrows the state
 * and features yielded to `content`/`always`/`default` to one of the two
 * navigation surfaces so the APIs cannot be mixed. It is type-only and never
 * read at runtime.
 *
 * **Paged** — render the active page via its request, navigate with `loadPage`
 * or the links yielded by `<EachLink />`:
 *
 * ```gts
 * import { Request } from '@warp-drive/ember';
 * import { EachLink, Paginate } from '@warp-drive/ember/experiments';
 *
 * <template>
 *   <Paginate @request={{@request}}>
 *     <:loading><Spinner /></:loading>
 *
 *     <:content as |pages|>
 *       <Request @request={{pages.activePageRequest}}>
 *         <:loading><Spinner /></:loading>
 *         <:error as |error|><ErrorForm @error={{error}} /></:error>
 *         <:content as |result|>
 *           {{#each result.data as |item|}}...{{/each}}
 *         </:content>
 *       </Request>
 *
 *       <EachLink @pages={{pages}} as |state|>
 *         {{#each state.links as |link|}}
 *           {{#if link.isReal}}
 *             <button
 *               class={{if link.isCurrent "active"}}
 *               {{on "click" link.setActive}}
 *             >{{link.text}}</button>
 *           {{else}}
 *             <span>…</span>
 *           {{/if}}
 *         {{/each}}
 *       </EachLink>
 *     </:content>
 *
 *     <:error as |error state|>
 *       <ErrorForm @error={{error}} />
 *       <button {{on "click" state.retry}}>Retry</button>
 *     </:error>
 *   </Paginate>
 * </template>
 * ```
 *
 * **Infinite** — render the accumulated `data`, grow it with
 * `loadNext`/`loadPrev`:
 *
 * ```gts
 * <template>
 *   <Paginate @request={{@request}} @mode="infinite">
 *     <:loading><Spinner /></:loading>
 *
 *     <:content as |pages features|>
 *       {{#each pages.data as |item|}}...{{/each}}
 *       {{#if pages.hasNext}}
 *         <button {{on "click" features.loadNext}}>Load more</button>
 *       {{/if}}
 *     </:content>
 *   </Paginate>
 * </template>
 * ```
 *
 * ## Shared collection state
 *
 * Loaded pages live in a cache shared by every component paginating the same
 * collection (identified by its `first` — or `self` — link), while each
 * `<Paginate />` keeps its own local navigation state (active page, loaded
 * run). The `@pageHints` arg supplies `currentPage`/`totalPages` when the
 * response does not expose them in the default `meta` locations; because the
 * hints attach to the shared cache, every component sharing a collection must
 * pass the same function reference.
 *
 * ## Route-driven navigation
 *
 * A changed `@request` arg does not tear the component down. The existing
 * content stays rendered — with `features.isNavigating` set to `true` — while
 * the new request resolves: a request that resolves to a page of the same
 * collection is adopted as the new active page (for example the browser back
 * button changing a `?page=` query param the route turns into a request); one
 * that resolves to a different collection resets the pagination like a fresh
 * start.
 *
 * ## Request lifecycle
 *
 * The content features expose the same `refresh`/`reload` controls as
 * `<Request />`, applied to the collection's initiating request, and the
 * component accepts the same `@autorefresh`, `@autorefreshThreshold` and
 * `@autorefreshBehavior` args (see the `<Request />` component's
 * documentation). To manage the lifecycle externally, create the subscription
 * with `createPaginationSubscription` and pass it via `@subscription` — the
 * component then uses it instead of creating and disposing its own.
 *
 * @class <Paginate />
 * @public
 */
export class Paginate<RT, E, M extends PaginateMode = 'paged'> extends Component<PaginateSignature<RT, E, M>> {
  /**
   * The store instance to use for making requests. If contexts are available, this
   * will be the `store` on the context, else it will be the store service.
   *
   * @internal
   */
  @consume('store') declare _store: Store;

  /** @internal */
  get store(): Store | RequestManager {
    const store = this.args.store || this._store;
    assert(
      moduleExists('ember-provide-consume-context')
        ? `No store was provided to the <Paginate> component. Either provide a store via the @store arg or via the context API provided by ember-provide-consume-context.`
        : `No store was provided to the <Paginate> component. Either provide a store via the @store arg or by registering a store service.`,
      store
    );
    return store;
  }

  /** @internal */
  _state: PaginationSubscription<RT, E> | null = null;
  /** @internal */
  get state(): PaginationSubscription<RT, E> {
    let { _state } = this;
    const { store } = this;
    const { subscription } = this.args;
    if (_state && (_state.store !== store || subscription)) {
      _state[DISPOSE]();
      this._state = _state = null;
    }

    if (subscription) {
      return subscription;
    }

    if (!_state) {
      this._state = _state = createPaginationSubscription(store, this.args);
    }

    return _state;
  }

  /**
   * The chrome component to use for rendering the request.
   *
   * @internal
   */
  @memoized
  get Chrome(): ComponentLike<{
    Blocks: { default: [] };
    Args: { state: PaginationStateFor<RT, E, M> | null; features: PaginationContentFeaturesFor<RT, M> };
  }> {
    return this.args.chrome || DefaultChrome;
  }

  /**
   * The pagination state narrowed to the mode's surface for yielding. The cast
   * is sound: the full state structurally satisfies both surfaces; `M` is just
   * unresolved inside the class body.
   *
   * @internal
   */
  @memoized
  get paginationState(): PaginationStateFor<RT, E, M> {
    return this.state.paginationState as unknown as PaginationStateFor<RT, E, M>;
  }

  /**
   * The content features narrowed to the mode's surface for yielding. See
   * {@link paginationState}.
   *
   * @internal
   */
  @memoized
  get contentFeatures(): PaginationContentFeaturesFor<RT, M> {
    return this.state.contentFeatures as PaginationContentFeaturesFor<RT, M>;
  }

  willDestroy(): void {
    if (this._state) {
      this._state[DISPOSE]();
      this._state = null;
    }
  }

  <template>
    <this.Chrome @state={{if this.state.isIdle null this.paginationState}} @features={{this.contentFeatures}}>
      {{#if (has-block "default")}}
        {{yield this.paginationState this.contentFeatures}}

      {{else if (and this.state.isIdle (has-block "idle"))}}
        {{yield to="idle"}}

      {{else if this.state.isIdle}}
        <Throw @error={{IdleBlockMissingError}} />

      {{else if this.state.isLoading}}
        {{yield this.state.loadingState to="loading"}}

      {{else if (and this.state.isCancelled (has-block "cancelled"))}}
        {{yield (notNull this.state.reason) this.state.errorFeatures to="cancelled"}}

      {{else if (and this.state.isError (has-block "error"))}}
        {{yield (notNull this.state.reason) this.state.errorFeatures to="error"}}

      {{else if this.state.isSuccess}}
        {{yield this.paginationState this.contentFeatures to="content"}}

      {{else if (not this.state.isCancelled)}}
        <Throw @error={{(notNull this.state.reason)}} />
      {{/if}}

      {{yield this.paginationState this.contentFeatures to="always"}}
    </this.Chrome>
  </template>
}
