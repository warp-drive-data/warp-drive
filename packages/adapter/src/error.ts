/**
 * Legacy alias of {@link @warp-drive/legacy!adapter/error | @warp-drive/legacy/adapter/error}.
 * This entry re-exports the adapter error classes from that module unchanged so existing
 * `@ember-data/adapter/error` imports keep working; new code should import
 * from `@warp-drive/legacy/adapter/error` directly.
 *
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
