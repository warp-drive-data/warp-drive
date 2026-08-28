import Component from '@glimmer/component';

import type {
  PagedPaginationState,
  PaginationLinks,
  PaginationLinksSubscription,
} from '@warp-drive/core/signals/-leaked';
import { createPaginationLinksSubscription, DISPOSE } from '@warp-drive/core/signals/-leaked';

interface EachLinkSignature<RT, E> {
  Args: {
    /**
     * The paged pagination state (yielded by `<Paginate />`) to derive the
     * navigation links from.
     */
    pages: PagedPaginationState<RT, E>;
  };
  Blocks: {
    /**
     * Receives the {@link PaginationLinks} for the pagination state: the
     * numbered `links` (with placeholders for gaps) and the relational
     * `prev`/`next` links. The consumer renders them — in whatever markup
     * and order it wants.
     */
    default: [state: Readonly<PaginationLinks<RT, E>>];
  };
}

/**
 * The `<EachLink />` component yields the navigation links for a paginated
 * collection, derived from the {@link PagedPaginationState} a `<Paginate />`
 * component yields to its `content` block.
 *
 * It renders no markup of its own: it yields a single {@link PaginationLinks}
 * object, and the consumer decides which links to render, with what markup,
 * and in what order.
 *
 * The yielded state provides:
 *
 * - `links` — the numbered links, with {@link PlaceholderPaginationLink}
 *   placeholders standing in for gaps of not-yet-loaded pages. Discriminate
 *   with `isReal`. Empty for cursor-based collections, which have no page
 *   numbers to render.
 * - `prev` / `next` — the relational links for the active page, or `null` at
 *   the collection's edges. Available in both numbered and cursor-based
 *   pagination, and the only navigation a cursor-based collection has.
 * - `first` / `last` — the relational links to the collection's edges, when
 *   the response exposes them. Usually present on every page — including the
 *   edge page itself, where the link's `isCurrent` is `true` (useful for
 *   disabling the control).
 *
 * Every link exposes `setActive` to load its page and make it the active page
 * of the pagination state, keeping every component reading that state in sync.
 *
 * ```gts
 * import { Paginate, EachLink } from '@warp-drive/ember/experiments';
 *
 * <template>
 *   <Paginate @request={{@request}}>
 *     <:content as |pages|>
 *       ...
 *       <EachLink @pages={{pages}} as |state|>
 *         {{#if state.prev}}
 *           <button {{on "click" state.prev.setActive}}>Previous</button>
 *         {{/if}}
 *
 *         {{#each state.links as |link|}}
 *           {{#if link.isReal}}
 *             <button
 *               class={{if link.isCurrent "active"}}
 *               {{on "click" link.setActive}}
 *             >{{link.text}}</button>
 *           {{else}}
 *             <span title="{{link.rangeSize}} more pages">…</span>
 *           {{/if}}
 *         {{/each}}
 *
 *         {{#if state.next}}
 *           <button {{on "click" state.next.setActive}}>Next</button>
 *         {{/if}}
 *       </EachLink>
 *     </:content>
 *   </Paginate>
 * </template>
 * ```
 *
 * Since the links all read from the shared page graph, they update as pages
 * load and as the active page changes.
 *
 * @class <EachLink />
 * @public
 */
export class EachLink<RT, E> extends Component<EachLinkSignature<RT, E>> {
  /** @internal */
  _state: PaginationLinksSubscription<RT, E> | null = null;
  /** @internal */
  get state(): PaginationLinksSubscription<RT, E> {
    let { _state } = this;
    if (!_state) {
      this._state = _state = createPaginationLinksSubscription(this.args);
    }

    return _state;
  }

  willDestroy(): void {
    if (this._state) {
      this._state[DISPOSE]();
      this._state = null;
    }
  }

  <template>{{yield this.state.paginationLinks}}</template>
}
