// Compile-only type tests for the `<Paginate>` component's `@mode` arg.
// Deliberately NOT named `*-test.gts`: the runtime suite eagerly globs that
// pattern and this module is never meant to evaluate. `ember-tsc --noEmit` checks
// that each mode narrows the yielded state/features to one navigation surface
// and that mixing the paged and infinite APIs is a type error.
import type { Future } from '@warp-drive/core/request';
import type {
  InfinitePaginationContentFeatures,
  InfinitePaginationState,
  PagedPaginationContentFeatures,
  PagedPaginationState,
} from '@warp-drive/ember';
import { EachLink, Paginate } from '@warp-drive/ember';

const request = null as unknown as Future<unknown>;

// Sinks that force expression-level typechecking without rendering concerns.
const use = (...args: unknown[]): string => (args.length ? '' : '');

// Literal-inference canaries: if a Glint regression ever widens the inferred
// mode back to the union, these parameter types stop matching and fail loudly.
const expectPaged = (state: PagedPaginationState): string => (state ? '' : '');
const expectInfinite = (state: InfinitePaginationState): string => (state ? '' : '');
const expectPagedFeatures = (features: PagedPaginationContentFeatures<unknown>): string => (features ? '' : '');
const expectInfiniteFeatures = (features: InfinitePaginationContentFeatures<unknown>): string => (features ? '' : '');

export const OmittedModeIsPaged = <template>
  <Paginate @request={{request}}>
    <:content as |pages features|>
      {{expectPaged pages}}
      {{expectPagedFeatures features}}
      {{use pages.pages pages.totalPages pages.activePage pages.activePageRequest pages.loadPage}}
      {{use features.refresh features.reload features.isOnline features.loadPage}}
      <EachLink @pages={{pages}} />
      {{! @glint-expect-error `data` is infinite-only }}
      {{use pages.data}}
      {{! @glint-expect-error `loadNext` is infinite-only }}
      {{use pages.loadNext}}
      {{! @glint-expect-error `hasNext` is infinite-only }}
      {{use pages.hasNext}}
      {{! @glint-expect-error `nextRequest` is infinite-only }}
      {{use pages.nextRequest}}
      {{! @glint-expect-error `loadNext` feature is infinite-only }}
      {{use features.loadNext}}
    </:content>
  </Paginate>
</template>;

export const ExplicitPagedMode = <template>
  <Paginate @request={{request}} @mode="paged">
    <:content as |pages features|>
      {{expectPaged pages}}
      {{use pages.activePageRequest features.loadPage}}
      <EachLink @pages={{pages}} />
      {{! @glint-expect-error `data` is infinite-only }}
      {{use pages.data}}
    </:content>
  </Paginate>
</template>;

export const InfiniteMode = <template>
  <Paginate @request={{request}} @mode="infinite">
    <:content as |pages features|>
      {{expectInfinite pages}}
      {{expectInfiniteFeatures features}}
      {{use pages.pages pages.totalPages pages.data pages.hasNext pages.hasPrevious}}
      {{use pages.nextRequest pages.previousRequest pages.loadNext pages.loadPrev}}
      {{use features.refresh features.loadNext features.loadPrev}}
      {{! @glint-expect-error `activePageRequest` is paged-only }}
      {{use pages.activePageRequest}}
      {{! @glint-expect-error `activePage` is paged-only }}
      {{use pages.activePage}}
      {{! @glint-expect-error `loadPage` is paged-only }}
      {{use pages.loadPage}}
      {{! @glint-expect-error `loadPage` feature is paged-only }}
      {{use features.loadPage}}
      {{! @glint-expect-error EachLink renders numbered links — paged-only }}
      <EachLink @pages={{pages}} />
    </:content>
  </Paginate>
</template>;

export const InfiniteModeDefaultBlock = <template>
  <Paginate @request={{request}} @mode="infinite" as |pages features|>
    {{expectInfinite pages}}
    {{use pages.data features.loadNext}}
    {{! @glint-expect-error `loadPage` feature is paged-only }}
    {{use features.loadPage}}
  </Paginate>
</template>;

export const BogusModeRejected = <template>
  {{! @glint-expect-error only 'paged' | 'infinite' are valid modes }}
  <Paginate @request={{request}} @mode="bogus"></Paginate>
</template>;
