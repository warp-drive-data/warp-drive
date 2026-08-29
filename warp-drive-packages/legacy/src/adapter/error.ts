/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { RequestManager } from '@warp-drive/core';
import { assert } from '@warp-drive/core/build-config/macros';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Handler } from '@warp-drive/core/request';
import { getOrSetGlobal } from '@warp-drive/core/types/-private';
import type { ApiError } from '@warp-drive/core/types/spec/error';

function _AdapterError(this: AdapterRequestError, errors: ApiError[], message = 'Adapter operation failed') {
  this.isAdapterError = true;
  const error = Error.call(this, message);

  if (error) {
    this.stack = error.stack;
    // @ts-expect-error untyped
    this.description = error.description;
    // @ts-expect-error untyped
    this.fileName = error.fileName;
    // @ts-expect-error untyped
    this.lineNumber = error.lineNumber;
    this.message = error.message;
    this.name = error.name;
    // @ts-expect-error untyped
    this.number = error.number;
  }

  this.errors = errors || [
    {
      title: 'Adapter Error',
      detail: message,
    },
  ];
}

/**
 * The shape of the errors thrown/returned by {@link AdapterError} and its subclasses.
 */
export interface AdapterRequestError<T extends string = string> extends Error {
  /**
   * A property signifying that an Error uses the {@link AdapterRequestError} interface.
   */
  isAdapterError: true;
  /**
   * A short code identifying the kind of error, e.g. `'NotFoundError'`.
   */
  code: T;
  /**
   * The {json:api} formatted errors associated with the request.
   */
  errors: ApiError[];
}
/**
 * The static interface shared by {@link AdapterError} and its subclasses,
 * allowing further subclassing via {@link AdapterRequestErrorConstructor.extend | extend}.
 */
export interface AdapterRequestErrorConstructor<Instance extends AdapterRequestError = AdapterRequestError> {
  new (errors?: unknown[], message?: string): Instance;
  /**
   * Creates a new {@link AdapterRequestErrorConstructor} that inherits from this one.
   */
  extend(options: { message: string }): AdapterRequestErrorConstructor;
}

_AdapterError.prototype = Object.create(Error.prototype);

_AdapterError.prototype.code = 'AdapterError';
_AdapterError.extend = extendFn(_AdapterError as unknown as AdapterRequestErrorConstructor);

/**
 * The {@link AdapterRequestError} shape thrown by the {@link AdapterError} constructor.
 */
export type AdapterError = AdapterRequestError<'AdapterError'>;
/**
 * :::danger
 * ⚠️ **This is LEGACY documentation** for a feature that is no longer encouraged to be used.
 * If starting a new app or thinking of implementing a new adapter, consider writing a
 * {@link Handler} instead to be used with the {@link RequestManager}
 * :::
 *
 * An `AdapterError` is used by an adapter to signal that an error occurred
 * during a request to an external API. It indicates a generic error, and
 * subclasses are used to indicate specific error states.
 *
 * To create a custom error to signal a specific error state in communicating
 * with an external API, extend the `AdapterError`. For example, if the
 * external API exclusively used HTTP `503 Service Unavailable` to indicate
 * it was closed for maintenance:
 *
 * ```js [app/adapters/maintenance-error.js]
 * import AdapterError from '@warp-drive/legacy/adapter/error';
 *
 * export default AdapterError.extend({ message: "Down for maintenance." });
 * ```
 *
 * This error would then be returned by an adapter's `handleResponse` method:
 *
 * ```js [app/adapters/application.js]
 * import JSONAPIAdapter from '@warp-drive/legacy/adapter/json-api';
 * import MaintenanceError from './maintenance-error';
 *
 * export default class ApplicationAdapter extends JSONAPIAdapter {
 *   handleResponse(status) {
 *     if (503 === status) {
 *       return new MaintenanceError();
 *     }
 *
 *     return super.handleResponse(...arguments);
 *   }
 * }
 * ```
 *
 * And can then be detected in an application and used to send the user to an
 * `under-maintenance` route:
 *
 * ```js [app/routes/application.js]
 * import MaintenanceError from '../adapters/maintenance-error';
 *
 * export default class ApplicationRoute extends Route {
 *   actions: {
 *     error(error, transition) {
 *       if (error instanceof MaintenanceError) {
 *         this.transitionTo('under-maintenance');
 *         return;
 *       }
 *
 *       // ...other error handling logic
 *     }
 *   }
 * }
 * ```
 *
 * ### Signaling an Error Without Extending `AdapterError`
 *
 * Extending `AdapterError` (or one of its subclasses) is a convenience, not
 * a requirement. WarpDrive only inspects an error for the {@link AdapterRequestError}
 * shape: an `isAdapterError` flag, a `code`, and an {json:api}-formatted
 * `errors` array. Any object satisfying that shape — including a plain
 * `Error` with those properties attached — will be handled identically to
 * an instance created via `new AdapterError()` or one of its subclasses.
 *
 * This is useful when you'd rather not introduce a class hierarchy, or
 * when the error needs to be constructed from data you don't control
 * (for example, re-throwing an error surfaced by a third-party library):
 *
 * ```js [app/adapters/application.js]
 * import JSONAPIAdapter from '@warp-drive/legacy/adapter/json-api';
 *
 * export default class ApplicationAdapter extends JSONAPIAdapter {
 *   handleResponse(status, headers, payload) {
 *     if (status === 503) {
 *       const error = new Error('Down for maintenance.');
 *       error.isAdapterError = true;
 *       error.code = 'MaintenanceError';
 *       error.errors = [{ title: 'Service Unavailable', detail: 'Down for maintenance.' }];
 *       return error;
 *     }
 *
 *     return super.handleResponse(status, headers, payload);
 *   }
 * }
 * ```
 *
 * Because `code` is just a string you control, `error instanceof AdapterError`
 * checks won't match a plain object built this way — consumers should
 * instead branch on `error.isAdapterError && error.code === 'MaintenanceError'`,
 * or on whichever of the {@link AdapterError} subclasses' `code` values
 * (e.g. `'InvalidError'`, `'NotFoundError'`) the error's `code` matches.
 *
 * @public
 */
export const AdapterError: AdapterRequestErrorConstructor<AdapterError> = getOrSetGlobal(
  'AdapterError',
  _AdapterError as unknown as AdapterRequestErrorConstructor<AdapterError>
);
type ErrorExtender = (opts: { message?: string }) => AdapterRequestErrorConstructor;
function extendFn(ErrorClass: AdapterRequestErrorConstructor): ErrorExtender {
  return function ({ message: defaultMessage }: { message?: string } = {}) {
    return extend(ErrorClass, defaultMessage);
  };
}

function extend<Final extends AdapterRequestError>(
  ParentErrorClass: AdapterRequestErrorConstructor,
  defaultMessage?: string
): AdapterRequestErrorConstructor<Final> {
  const ErrorClass = function (this: AdapterRequestError, errors: ApiError[], message?: string) {
    assert('`AdapterError` expects json-api formatted errors array.', Array.isArray(errors || []));
    ParentErrorClass.call(this, errors, message || defaultMessage);
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  ErrorClass.prototype = Object.create(ParentErrorClass.prototype);
  ErrorClass.extend = extendFn(ErrorClass as unknown as AdapterRequestErrorConstructor);

  return ErrorClass as unknown as AdapterRequestErrorConstructor<Final>;
}

/**
 * The {@link AdapterRequestError} shape thrown by the {@link InvalidError} constructor.
 */
// TODO @deprecate extractError documentation
export type InvalidError = AdapterRequestError<'InvalidError'>;
/**
 * An `InvalidError` is used by an adapter to signal that the external API
 * was unable to process a request because the content was not semantically
 * correct or meaningful per the API. Usually, this means a record failed
 * some form of server-side validation. When a promise from an adapter is
 * rejected with an `InvalidError` the record will transition to the
 * `invalid` state and the errors will be set to the `errors` property on
 * the record.
 *
 * For WarpDrive to correctly map errors to their corresponding properties
 * on the model, WarpDrive expects each error to be a valid {json:api} error
 * object with a `source.pointer` that matches the property name. For
 * example, if you had a `Post` model that looked like this:
 *
 * ```js [app/models/post.js]
 * import { Model, attr } from '@warp-drive/legacy/model';
 *
 * export default class PostModel extends Model {
 *   @attr('string') title;
 *   @attr('string') content;
 * }
 * ```
 *
 * To show an error from the server related to the `title` and `content`
 * properties your adapter could return a promise that rejects with an
 * `InvalidError` that looks like this:
 *
 * ```js [app/adapters/post.js]
 * import RSVP from 'RSVP';
 * import RESTAdapter from '@warp-drive/legacy/adapter/rest';
 * import { InvalidError } from '@warp-drive/legacy/adapter/error';
 *
 * export default class ApplicationAdapter extends RESTAdapter {
 *   updateRecord() {
 *     // Fictional adapter that always rejects
 *     return RSVP.reject(new InvalidError([
 *       {
 *         detail: 'Must be unique',
 *         source: { pointer: '/data/attributes/title' }
 *       },
 *       {
 *         detail: 'Must not be blank',
 *         source: { pointer: '/data/attributes/content' }
 *       }
 *     ]));
 *   }
 * }
 * ```
 *
 * Your backend may use different property names for your records; the
 * store will attempt to extract and normalize the errors using the
 * serializer's `extractErrors` method before the errors get added to the
 * model. As a result, it is safe for the `InvalidError` to wrap the error
 * payload unaltered.
 *
 * @public
 */
export const InvalidError: AdapterRequestErrorConstructor<InvalidError> = getOrSetGlobal(
  'InvalidError',
  extend<InvalidError>(AdapterError, 'The adapter rejected the commit because it was invalid')
);
InvalidError.prototype.code = 'InvalidError';

/**
 * The {@link AdapterRequestError} shape thrown by the {@link TimeoutError} constructor.
 */
export type TimeoutError = AdapterRequestError<'TimeoutError'>;
/**
 * A `TimeoutError` is used by an adapter to signal that a request to the
 * external API has timed out, i.e. no response was received from the
 * external API within an allowed time period.
 *
 * An example use case would be to warn the user to check their internet
 * connection if an adapter operation has timed out:
 *
 * ```js [app/routes/application.js]
 * import { TimeoutError } from '@warp-drive/legacy/adapter/error';
 *
 * export default class ApplicationRoute extends Route {
 *   @action
 *   error(error, transition) {
 *     if (error instanceof TimeoutError) {
 *       // alert the user
 *       alert('Are you still connected to the Internet?');
 *       return;
 *     }
 *
 *     // ...other error handling logic
 *   }
 * }
 * ```
 *
 * @public
 */
export const TimeoutError: AdapterRequestErrorConstructor<TimeoutError> = getOrSetGlobal(
  'TimeoutError',
  extend(AdapterError, 'The adapter operation timed out')
);
TimeoutError.prototype.code = 'TimeoutError';

/**
 * The {@link AdapterRequestError} shape thrown by the {@link AbortError} constructor.
 */
export type AbortError = AdapterRequestError<'AbortError'>;
/**
 * An `AbortError` is used by an adapter to signal that a request to the
 * external API was aborted. For example, this can occur if the user
 * navigates away from the current page after a request to the external API
 * has been initiated but before a response has been received.
 *
 * Because an aborted request is typically expected (the user chose to
 * navigate away, or a newer request superseded this one) rather than
 * exceptional, an example use case would be to silently ignore it instead
 * of surfacing an error to the user:
 *
 * ```js [app/routes/application.js]
 * import { AbortError } from '@warp-drive/legacy/adapter/error';
 *
 * export default class ApplicationRoute extends Route {
 *   @action
 *   error(error, transition) {
 *     if (error instanceof AbortError) {
 *       // the request was aborted, nothing to report
 *       return;
 *     }
 *
 *     // ...other error handling logic
 *   }
 * }
 * ```
 *
 * @public
 */
export const AbortError: AdapterRequestErrorConstructor<AbortError> = getOrSetGlobal(
  'AbortError',
  extend(AdapterError, 'The adapter operation was aborted')
);
AbortError.prototype.code = 'AbortError';

/**
 * The {@link AdapterRequestError} shape thrown by the {@link UnauthorizedError} constructor.
 */
export type UnauthorizedError = AdapterRequestError<'UnauthorizedError'>;
/**
 * A `UnauthorizedError` equates to an HTTP `401 Unauthorized` response
 * status. It is used by an adapter to signal that a request to the external
 * API was rejected because authorization is required and has failed or has
 * not yet been provided.
 *
 * An example use case would be to redirect the user to a login route if a
 * request is unauthorized:
 *
 * ```js [app/routes/application.js]
 * import { UnauthorizedError } from '@warp-drive/legacy/adapter/error';
 *
 * export default class ApplicationRoute extends Route {
 *   @action
 *   error(error, transition) {
 *     if (error instanceof UnauthorizedError) {
 *       // go to the login route
 *       this.transitionTo('login');
 *       return;
 *     }
 *
 *     // ...other error handling logic
 *   }
 * }
 * ```
 *
 * @public
 */
export const UnauthorizedError: AdapterRequestErrorConstructor<UnauthorizedError> = getOrSetGlobal(
  'UnauthorizedError',
  extend(AdapterError, 'The adapter operation is unauthorized')
);
UnauthorizedError.prototype.code = 'UnauthorizedError';

/**
 * The {@link AdapterRequestError} shape thrown by the {@link ForbiddenError} constructor.
 */
export type ForbiddenError = AdapterRequestError<'ForbiddenError'>;
/**
 * A `ForbiddenError` equates to an HTTP `403 Forbidden` response status.
 * It is used by an adapter to signal that a request to the external API was
 * valid but the server is refusing to respond to it. If authorization was
 * provided and is valid, then the authenticated user does not have the
 * necessary permissions for the request.
 *
 * Unlike an {@link UnauthorizedError}, retrying the request with different
 * credentials will not help; the currently authenticated user simply lacks
 * permission. An example use case would be to show the user a "you don't
 * have access to this" message rather than redirecting them to log in:
 *
 * ```js [app/routes/application.js]
 * import { ForbiddenError } from '@warp-drive/legacy/adapter/error';
 *
 * export default class ApplicationRoute extends Route {
 *   @action
 *   error(error, transition) {
 *     if (error instanceof ForbiddenError) {
 *       this.transitionTo('forbidden');
 *       return;
 *     }
 *
 *     // ...other error handling logic
 *   }
 * }
 * ```
 *
 * @public
 */
export const ForbiddenError: AdapterRequestErrorConstructor<ForbiddenError> = getOrSetGlobal(
  'ForbiddenError',
  extend(AdapterError, 'The adapter operation is forbidden')
);
ForbiddenError.prototype.code = 'ForbiddenError';

/**
 * The {@link AdapterRequestError} shape thrown by the {@link NotFoundError} constructor.
 */
export type NotFoundError = AdapterRequestError<'NotFoundError'>;
/**
 * A `NotFoundError` equates to an HTTP `404 Not Found` response status.
 * It is used by an adapter to signal that a request to the external API
 * was rejected because the resource could not be found on the API.
 *
 * An example use case would be to detect if the user has entered a route
 * for a specific model that does not exist. For example:
 *
 * ```js [app/routes/post.js]
 * import { NotFoundError } from '@warp-drive/legacy/adapter/error';
 *
 * export default class PostRoute extends Route {
 *   @service store;
 *   model(params) {
 *     return this.store.findRecord('post', params.post_id);
 *   }
 *   @action
 *   error(error, transition) {
 *     if (error instanceof NotFoundError) {
 *       // redirect to a list of all posts instead
 *       this.transitionTo('posts');
 *     } else {
 *       // otherwise let the error bubble
 *       return true;
 *     }
 *   }
 * }
 * ```
 *
 * @public
 */
export const NotFoundError: AdapterRequestErrorConstructor<NotFoundError> = getOrSetGlobal(
  'NotFoundError',
  extend(AdapterError, 'The adapter could not find the resource')
);
NotFoundError.prototype.code = 'NotFoundError';

/**
 * The {@link AdapterRequestError} shape thrown by the {@link ConflictError} constructor.
 */
export type ConflictError = AdapterRequestError<'ConflictError'>;
/**
 * A `ConflictError` equates to an HTTP `409 Conflict` response status.
 * It is used by an adapter to indicate that the request could not be
 * processed because of a conflict in the request. An example scenario
 * would be when creating a record with a client-generated ID but that ID
 * is already known to the external API.
 *
 * An example use case would be to surface a conflict-specific message so
 * the user can retry with different input:
 *
 * ```js [app/routes/application.js]
 * import { ConflictError } from '@warp-drive/legacy/adapter/error';
 *
 * export default class ApplicationRoute extends Route {
 *   @action
 *   error(error, transition) {
 *     if (error instanceof ConflictError) {
 *       alert('That identifier is already in use, please choose another.');
 *       return;
 *     }
 *
 *     // ...other error handling logic
 *   }
 * }
 * ```
 *
 * @public
 */
export const ConflictError: AdapterRequestErrorConstructor<ConflictError> = getOrSetGlobal(
  'ConflictError',
  extend(AdapterError, 'The adapter operation failed due to a conflict')
);
ConflictError.prototype.code = 'ConflictError';

/**
 * The {@link AdapterRequestError} shape thrown by the {@link ServerError} constructor.
 */
export type ServerError = AdapterRequestError<'ServerError'>;
/**
 * A `ServerError` equates to an HTTP `500 Internal Server Error` response
 * status. It is used by the adapter to indicate that a request has failed
 * because of an error in the external API, and is unlikely to succeed if
 * retried immediately.
 *
 * An example use case would be to show a generic "something went wrong on
 * our end" message rather than one implying the user made a mistake:
 *
 * ```js [app/routes/application.js]
 * import { ServerError } from '@warp-drive/legacy/adapter/error';
 *
 * export default class ApplicationRoute extends Route {
 *   @action
 *   error(error, transition) {
 *     if (error instanceof ServerError) {
 *       alert('Something went wrong on our end. Please try again later.');
 *       return;
 *     }
 *
 *     // ...other error handling logic
 *   }
 * }
 * ```
 *
 * @public
 */
export const ServerError: AdapterRequestErrorConstructor<ServerError> = getOrSetGlobal(
  'ServerError',
  extend(AdapterError, 'The adapter operation failed due to a server error')
);
ServerError.prototype.code = 'ServerError';
