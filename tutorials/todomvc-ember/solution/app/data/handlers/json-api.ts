import type { Future, Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext } from '@warp-drive/core/types/request';

const JSON_API = 'application/vnd.api+json';

/** Adds the JSON:API content negotiation headers to every request. */
export const JsonApiHandler: Handler = {
  request<T>(context: RequestContext, next: NextFn<T>): Future<T> {
    const headers = new Headers(context.request.headers);
    headers.set('Accept', JSON_API);
    headers.set('Content-Type', JSON_API);
    return next(Object.assign({}, context.request, { headers }));
  },
};
