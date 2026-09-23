import type { Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';

import { invalidateAllTodoQueries } from '../builders/query.ts';
import type Store from '../store.ts';

/**
 * Refreshes the todo lists and counts after a todo is deleted.
 *
 * A 'deleteRecord' request removes the todo from every cached list, but that
 * leaves a paginated list one short: the cache can't pull the next todo up
 * from a page it hasn't loaded. The counts are separate documents the cache
 * can't update either. So we mark every 'todo' query stale and let them
 * refetch. (Creating a todo already does this through `cacheOptions.types`,
 * but the cache policy only does that for 'createRecord'.)
 */
export const TodoInvalidationHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>): Promise<StructuredDataDocument<T>> {
    const response = await next(context.request);

    const { op, records, store } = context.request;
    if (op === 'deleteRecord' && store && records?.some((key) => key.type === 'todo')) {
      invalidateAllTodoQueries(store as Store);
    }

    return response;
  },
};
