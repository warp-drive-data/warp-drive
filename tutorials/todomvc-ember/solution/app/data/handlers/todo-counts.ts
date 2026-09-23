import type { Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';

import { invalidateTodoCounts } from '../builders/count.ts';
import type Store from '../store.ts';

/**
 * Refreshes the todo counts after a todo is deleted.
 *
 * A 'deleteRecord' request removes the todo from every cached list, but the
 * counts are separate documents the cache can't update, so we mark them stale.
 * (Creating a todo already invalidates them through `cacheOptions.types`, but
 * the cache policy only does that for 'createRecord'.)
 */
export const TodoCountsHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>): Promise<StructuredDataDocument<T>> {
    const response = await next(context.request);

    const { op, records, store } = context.request;
    if (op === 'deleteRecord' && store && records?.some((key) => key.type === 'todo')) {
      invalidateTodoCounts(store as Store);
    }

    return response;
  },
};
