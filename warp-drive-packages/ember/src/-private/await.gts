import type Owner from '@ember/owner';
import Component from '@glimmer/component';

import { PRODUCTION } from '@warp-drive/core/build-config/env';
import { getPromiseState, type PromiseState } from '@warp-drive/core/reactive';
import type { Awaitable } from '@warp-drive/core/request';

export const and = (x: unknown, y: unknown): boolean => Boolean(x && y);
interface ThrowSignature<E = Error | string | object> {
  Args: {
    error: E;
  };
}

/**
 * The `<Throw />` component is used to throw an error in a template.
 *
 * That's all it does. So don't use it unless the application should
 * throw an error if it reaches this point in the template.
 *
 * ```gts
 * <Throw @error={{anError}} />
 * ```
 *
 * @category Components
 * @public
 */
export class Throw<T> extends Component<ThrowSignature<T>> {
  constructor(owner: Owner, args: ThrowSignature<T>['Args']) {
    super(owner, args);
    // this error is opaque (user supplied) so we don't validate it
    // as an Error instance.

    if (PRODUCTION) {
      // eslint-disable-next-line no-console
      console.error(this.args.error);
    } else {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw this.args.error;
    }
  }
  <template></template>
}

/**
 * The `<ThrowAsync />` component rethrows the given error a tick later instead of
 * synchronously as `<Throw />` does.
 *
 * It exists specifically for request/promise rejections that reach this point
 * because no `<:error>` block was provided. A synchronous throw here would unwind
 * the current render, which for a runtime failure (as opposed to a static
 * misconfiguration, like a missing required block) is worse than surfacing the
 * error a tick later: the deferred throw still becomes an uncaught exception that
 * global error handlers (`window.onerror`, crash-reporting SDKs, etc.) can observe,
 * without taking down the component tree that was rendering when the rejection
 * arrived.
 *
 * Prefer providing an `<:error>` block over relying on this fallback -- the
 * `template-require-request-error-block` (Ember) and `require-request-error-block`
 * (React) ESLint rules in `eslint-plugin-warp-drive` flag a missing one statically.
 *
 * @category Components
 * @public
 */
export class ThrowAsync<T> extends Component<ThrowSignature<T>> {
  constructor(owner: Owner, args: ThrowSignature<T>['Args']) {
    super(owner, args);
    // this error is opaque (user supplied) so we don't validate it
    // as an Error instance.

    if (PRODUCTION) {
      // eslint-disable-next-line no-console
      console.error(this.args.error);
    } else {
      const error = this.args.error;
      queueMicrotask(() => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw error;
      });
    }
  }
  <template></template>
}

interface AwaitSignature<T, E = Error | string | object> {
  Args: {
    promise: Promise<T> | Awaitable<T, E>;
  };
  Blocks: {
    pending: [];
    error: [error: E];
    success: [value: T];
  };
}

/**
 * The `<Await />` component allow you to utilize reactive control flow
 * for asynchronous states in your application.
 *
 * Await is ideal for handling "boundaries", outside which some state is
 * still allowed to be unresolved and within which it MUST be resolved.
 *
 * ```gts
 * import { Await } from '@warp-drive/ember';
 *
 * <template>
 *   <Await @promise={{@request}}>
 *     <:pending>
 *       <Spinner />
 *     </:pending>
 *
 *     <:error as |error|>
 *       <ErrorForm @error={{error}} />
 *     </:error>
 *
 *     <:success as |result|>
 *       <h1>{{result.title}}</h1>
 *     </:success>
 *   </Await>
 * </template>
 * ```
 *
 * The `<Await />` component requires that error states are properly handled.
 *
 * If no error block is provided and the promise rejects, the error will be
 * rethrown asynchronously (a tick after the render that observed the rejection)
 * instead of crashing the current render. It remains an uncaught error that
 * crash-reporting instrumentation can observe. Prefer providing an `<:error>`
 * block -- the `template-require-request-error-block` ESLint rule flags a missing
 * one statically.
 *
 * @category Components
 * @public
 * @badge Component
 * @title <Await />
 */
export class Await<T, E> extends Component<AwaitSignature<T, E>> {
  /**
   * The reactive {@link PromiseState} for the awaited promise.
   */
  get state(): Readonly<PromiseState<T, E>> {
    return getPromiseState<T, E>(this.args.promise);
  }

  /**
   * The rejection reason, once {@link Await.state | state} has errored.
   */
  get error() {
    return this.state.error as E;
  }

  /**
   * The resolved value, once {@link Await.state | state} has succeeded.
   */
  get result() {
    return this.state.result as T;
  }

  <template>
    {{#if this.state.isPending}}
      {{yield to="pending"}}
    {{else if (and this.state.isError (has-block "error"))}}
      {{yield this.error to="error"}}
    {{else if this.state.isSuccess}}
      {{yield this.result to="success"}}
    {{else}}
      <ThrowAsync @error={{this.error}} />
    {{/if}}
  </template>
}
