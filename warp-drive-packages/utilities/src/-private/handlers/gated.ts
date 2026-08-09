import type { Future, Handler, NextFn } from '@warp-drive/core/request';
import type { RequestContext, StructuredDataDocument } from '@warp-drive/core/types/request';

/**
 * If CheckFn returns true, the wrapped handler will be used.
 * If CheckFn returns false, the wrapped handler will be skipped.
 */
type CheckFn = (context: RequestContext) => boolean;

/**
 *
 * @group Handlers
 * @public
 */
export class Gate implements Handler {
  /**
   * The wrapped handler to invoke when {@link Gate.checkFn | checkFn} returns `true`.
   */
  declare handler: Handler;
  /**
   * The predicate used to decide whether {@link Gate.handler | handler} should run for a given request.
   */
  declare checkFn: CheckFn;

  constructor(handler: Handler, checkFn: CheckFn) {
    this.handler = handler;
    this.checkFn = checkFn;
  }

  request<T = unknown>(context: RequestContext, next: NextFn<T>): Promise<T | StructuredDataDocument<T>> | Future<T> {
    if (this.checkFn(context)) {
      return this.handler.request(context, next);
    }
    return next(context.request);
  }
}
