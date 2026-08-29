import { DEPRECATE_COMPUTED_CHAINS } from '@warp-drive/core/build-config/deprecations';
import { assert } from '@warp-drive/core/build-config/macros';
import { defineSignal, memoized } from '@warp-drive/core/signals/-leaked';
import type { RelatedCollection as ManyArray } from '@warp-drive/core/store/-private';
import type { BaseFinderOptions } from '@warp-drive/core/types';
import type { Links } from '@warp-drive/core/types/spec/json-api-raw';

import { LegacyPromiseProxy } from './promise-belongs-to.ts';

export interface HasManyProxyCreateArgs<T = unknown> {
  promise: Promise<ManyArray<T>>;
  content?: ManyArray<T>;
}

export interface PromiseManyArray<T> {
  /**
   * A property signifying that this object implements the classic Ember
   * `PromiseProxyMixin`-like API. See {@link LegacyPromiseProxy}.
   */
  [LegacyPromiseProxy]: true;
}

/**
  This class is returned as the result of accessing an async hasMany relationship
  on an instance of a Model extending from `@warp-drive/legacy/model`.

  A PromiseManyArray is an iterable proxy that allows templates to consume related
  ManyArrays and update once their contents are no longer pending.

  In your JS code you should resolve the promise first.

  ```js
  const comments = await post.comments;
  ```

  @public
*/
export class PromiseManyArray<T = unknown> {
  /**
   * The promise for the relationship's content, or `null` once
   * {@link PromiseManyArray.destroy | destroy} has been called.
   */
  declare promise: Promise<ManyArray<T>> | null;
  /**
   * Whether {@link PromiseManyArray.destroy | destroy} has been called.
   */
  declare isDestroyed: boolean;
  /**
   * The resolved `ManyArray` for the relationship, if the promise has
   * resolved, else `null`.
   */
  declare content: ManyArray<T> | null;

  constructor(promise: Promise<ManyArray<T>>, content?: ManyArray<T>) {
    this._update(promise, content);
    this.isDestroyed = false;
    this[LegacyPromiseProxy] = true;
  }

  /**
   * Retrieve the length of the content
   * @public
   */
  @memoized
  get length(): number {
    // shouldn't be needed, but ends up being needed
    // for computed chains even in 4.x
    if (DEPRECATE_COMPUTED_CHAINS) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this['[]'];
    }
    return this.content ? this.content.length : 0;
  }

  /**
   * @private
   */
  // this will error if someone tries to call
  // A(identifierArray) since it is not configurable
  // which is preferrable to the `meta` override we used
  // before which required importing all of Ember
  @memoized
  get '[]'(): 0 | ManyArray<T> | undefined {
    // ember-source < 3.23 (e.g. 3.20 lts)
    // requires that the tag `'[]'` be notified
    // on the ArrayProxy in order for `{{#each}}`
    // to recompute. We entangle content.
    return this.content?.length && this.content;
  }

  /**
   * Iterate the proxied content. Called by the glimmer iterator in #each
   * We do not guarantee that forEach will always be available. This
   * may eventually be made to use Symbol.Iterator once glimmer supports it.
   *
   * @param cb
   * @return
   * @private
   */
  forEach(cb: (item: T, index: number, array: T[]) => void): void {
    if (this.content && this.length) {
      this.content.forEach(cb);
    }
  }

  /**
   * Reload the relationship
   * @public
   */
  reload(options: Omit<BaseFinderOptions, ''>): this {
    assert('You are trying to reload an async manyArray before it has been created', this.content);
    void this.content.reload(options);
    return this;
  }

  //----  Properties/Methods from the PromiseProxyMixin that we will keep as our API

  /**
   * Whether the loading promise is still pending
   *
   * @public
   */
  declare isPending: boolean;
  /**
   * Whether the loading promise rejected
   *
   * @public
   */
  declare isRejected: boolean;
  /**
   * Whether the loading promise succeeded
   *
   * @public
   */
  declare isFulfilled: boolean;
  /**
   * Whether the loading promise completed (resolved or rejected)
   *
   * @public
   */
  declare isSettled: boolean;

  /**
   * chain this promise
   *
   * @public
   */
  then(
    success: Parameters<Promise<ManyArray<T>>['then']>[0],
    rejected?: Parameters<Promise<ManyArray<T>>['then']>[1]
  ): Promise<unknown> {
    return this.promise!.then(success, rejected);
  }

  /**
   * catch errors thrown by this promise
   * @public
   */
  catch(cb: Parameters<Promise<ManyArray<T>>['catch']>[0]): Promise<unknown> {
    return this.promise!.catch(cb);
  }

  /**
   * run cleanup after this promise completes
   *
   * @public
   */
  finally(cb: Parameters<Promise<ManyArray<T>>['finally']>[0]): Promise<unknown> {
    return this.promise!.finally(cb);
  }

  //---- Methods on EmberObject that we should keep

  /**
   * Tears down this proxy, releasing its {@link PromiseManyArray.content | content} and
   * {@link PromiseManyArray.promise | promise} and marking it as {@link PromiseManyArray.isDestroyed | destroyed}.
   *
   * @public
   */
  destroy(): void {
    this.isDestroyed = true;
    this.content = null;
    this.promise = null;
  }

  //---- Methods/Properties on ManyArray that we own and proxy to

  /**
   * Retrieve the links for this relationship
   * @public
   */
  @memoized
  get links(): Links | null | undefined {
    return this.content ? this.content.links : undefined;
  }

  /**
   * Retrieve the meta for this relationship
   * @public
   */
  @memoized
  get meta(): Record<string, unknown> | null | undefined {
    return this.content ? this.content.meta : undefined;
  }

  //---- Our own stuff

  /** @internal */
  _update(promise: Promise<ManyArray<T>>, content?: ManyArray<T>): void {
    if (content !== undefined) {
      this.content = content;
    }

    this.promise = tapPromise(this, promise);
  }

  static create<T>({ promise, content }: HasManyProxyCreateArgs<T>): PromiseManyArray<T> {
    return new this(promise, content);
  }
}
defineSignal(PromiseManyArray.prototype, 'content', null);
defineSignal(PromiseManyArray.prototype, 'isPending', false);
defineSignal(PromiseManyArray.prototype, 'isRejected', false);
defineSignal(PromiseManyArray.prototype, 'isFulfilled', false);
defineSignal(PromiseManyArray.prototype, 'isSettled', false);

function tapPromise<T>(proxy: PromiseManyArray<T>, promise: Promise<ManyArray<T>>) {
  proxy.isPending = true;
  proxy.isSettled = false;
  proxy.isFulfilled = false;
  proxy.isRejected = false;
  return Promise.resolve(promise).then(
    (content) => {
      proxy.isPending = false;
      proxy.isFulfilled = true;
      proxy.isSettled = true;
      proxy.content = content;
      return content;
    },
    (error) => {
      proxy.isPending = false;
      proxy.isFulfilled = false;
      proxy.isRejected = true;
      proxy.isSettled = true;
      throw error;
    }
  );
}
