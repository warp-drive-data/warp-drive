/**
 * Legacy alias of {@link @warp-drive/legacy!adapter/error | @warp-drive/legacy/adapter/error}.
 * This entry re-exports the adapter error classes from that module unchanged so existing
 * `@ember-data/adapter/error` imports keep working; new code should import
 * from `@warp-drive/legacy/adapter/error` directly.
 *
 * @summary Legacy alias that re-exports `AdapterError` and its subclasses (invalid, timeout, abort, 401, 403, 404, 409,
 * 5xx) from `@warp-drive/legacy/adapter/error`.
 * @module
 */
export {
  AdapterError as default,
  InvalidError,
  TimeoutError,
  AbortError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  ConflictError,
} from '@warp-drive/legacy/adapter/error';
