import { assert } from '@warp-drive/core/build-config/macros';

import {
  _createStorageResource,
  getField,
  initMeta,
  installEffect,
  type KeyFn,
  setField,
  setupField,
  useMeta,
  type ValueTransition,
} from './-private/storage-infra.ts';

/**
 * Decorator which transforms a class into a StorageResource
 * persisted in localStorage.
 *
 * LocalResources must either be singletons or expect all instances
 * to share state unless a primary key function is provided.
 *
 * When a primary key function is provided, each instance
 * will have its own persisted data based on the key generated
 * by the function.
 *
 * The function will be called once per instance during
 * initialization to determine the unique ID for that instance.
 */
export function LocalResource(id: string | KeyFn): ClassDecorator {
  return _createStorageResource(id, 'local-resource', null);
}

/**
 * Decorator which transforms a class into a StorageResource
 * persisted in sessionStorage.
 *
 * SessionResources must either be singletons or expect all instances
 * to share state unless a primary key function is provided.
 *
 * When a primary key function is provided, each instance
 * will have its own persisted data based on the key generated
 * by the function.
 *
 * The function will be called once per instance during
 * initialization to determine the unique ID for that instance.
 */
export function SessionResource(id: string | KeyFn): ClassDecorator {
  return _createStorageResource(id, 'session-resource', null);
}

/**
 * Decorator which transforms a class into a StorageResource
 * persisted via the [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache).
 * api and shared across all tabs/windows under the same origin.
 *
 * CacheResources must either be singletons or expect all instances
 * to share state unless a primary key function is provided.
 *
 * When a primary key function is provided, each instance
 * will have its own persisted data based on the key generated
 * by the function.
 *
 * The function will be called once per instance during
 * initialization to determine the unique ID for that instance.
 *
 * All object cached in the same `namespace` share the namespace's storage context,
 * so partitioning can be achieved by using different namespaces for different groups
 * of data.
 */
export function CacheResource(id: string | KeyFn, namespace: string | null = null): ClassDecorator {
  return _createStorageResource(id, 'cache-resource', namespace);
}

/**
 * Decorator which marks a property as a field on
 * a LocalResource or SessionResource
 *
 * The field's value will be initialized from the persisted resource data
 * if available, falling back to the property's default value otherwise.
 *
 * Fields can be of any type that is serializable to and restorable from JSON,
 * but complex types (like objects or arrays) should be handled with care to avoid
 * unintended mutations or reactivity issues.
 *
 * By default, fields are persisted in the storage type defined by the resource decorator
 * (@LocalResource or @SessionResource). However, you can override this behavior
 * by passing 'local' or 'session' as an argument to the decorator.
 *
 * ---
 *
 * **Example:**
 *
 * ```ts
 * @LocalResource('user-settings')
 * class UserSettings {
 *   @field
 *   theme: 'light' | 'dark' = 'light';
 *
 *   @field('session')
 *   sessionToken: string | null = null;
 * }
 * ```
 *
 */
export function field(type: 'local' | 'session' | 'cache'): PropertyDecorator;
export function field(target: object, key: string, descriptor?: PropertyDescriptor): void;
export function field(...args: unknown[]): PropertyDecorator | void {
  if (args.length === 0) {
    assert('field decorator requires at least 1 argument or should be used without parens', true);
    return setupField as PropertyDecorator;
  }
  if (args.length === 1) {
    const type = args[0] as 'local' | 'session' | 'cache';
    return ((target: object, key: string, desc?: PropertyDescriptor) =>
      setupField(target, key, desc, type)) as PropertyDecorator;
  }
  if (args.length === 2 || args.length === 3) {
    const [target, key, descriptor] = args as [object, string, PropertyDescriptor | undefined];
    return setupField(target, key, descriptor);
  }
}
export function input(type: 'number' | 'boolean' | 'float'): PropertyDecorator {
  assert('input decorator requires a valid type argument', ['number', 'boolean', 'float'].includes(type));
  return function (target: object, key: string, desc: PropertyDescriptor): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalSet = desc.set!;
    desc.set = function (this: object, value: unknown) {
      switch (type) {
        case 'number':
          value = Number(value);
          break;
        case 'boolean':
          value =
            value === 'false' ||
            value === '' ||
            value === '0' ||
            value === 'undefined' ||
            value === 'null' ||
            value === false ||
            value === 0 ||
            value === null ||
            value === undefined
              ? 0
              : 1;
          break;
        default:
          assert(`Unsupported input type: ${type}`);
      }
      originalSet.call(this, value);
    };
    return desc as unknown as void;
  } as PropertyDecorator;
}

/**
 * Effects are fields that run a side-effecting function.
 *
 * Effects are intended to enable synchronizing get states between
 * tabs or windows that result in needing to synchronize other
 * non-reactive state.
 *
 * For example, when a user selects a light/dark mode theme preference
 * that differs from the system preference, effects can be used to trigger
 * DOM updates on the documentElement necessary to ensure its state is
 * consistent with the persisted resource state and reactive application state.
 *
 * To do this without an effect would require either setting up your own
 * storage event listeners or consuming the reactive state of the property
 * in another effect-like API such as an Ember modifier or React useEffect,
 *
 * Effects *only* run when the stored value changes due to storage events
 * emitted from other tabs or windows. They do not run when the property
 * is updated in the same context.
 *
 * ---
 *
 * **Example:**
 *
 * ```ts
 * @LocalResource('user-preferences')
 * class UserPreferences {
 *   @effect(syncThemeToDOM)
 *   explicitThemePreference: 'light' | 'dark' | null = null;
 *
 *   @matchMedia('(prefers-color-scheme: dark)')
 *   systemPrefersDarkMode: boolean = false;
 * }
 *
 * function syncThemeToDOM(update: ValueTransition<'light' | 'dark' | null>): void {
 *   const newTheme = update.to;
 *   document.documentElement.style.colorScheme = newTheme ?? 'light dark';
 *
 *   if (newTheme === 'dark') {
 *     document.documentElement.classList.add('dark-theme');
 *     document.documentElement.classList.remove('light-theme');
 *   } else if (newTheme === 'light') {
 *     document.documentElement.classList.add('light-theme');
 *     document.documentElement.classList.remove('dark-theme');
 *   } else {
 *     document.documentElement.classList.remove('light-theme');
 *     document.documentElement.classList.remove('dark-theme');
 *   }
 * }
 * ```
 */
export function effect(fn: <K>(update: ValueTransition<K>) => void, type?: 'local' | 'session'): PropertyDecorator {
  const overrideType = type === 'local' ? 'local-storage' : type === 'session' ? 'session-storage' : null;
  return function effectField(
    target: object,
    key: string,

    _descriptor?: PropertyDescriptor
  ): void {
    const meta = initMeta(target);
    meta.fields.set(key, fn);

    // only install the effect if we are not in a primary-keyed instance context
    if (meta.pkFn === null) void installEffect(meta, key);

    return {
      configurable: true,
      enumerable: true,
      get(this: object): unknown {
        return getField(this, useMeta(meta, this), key, overrideType);
      },
      set(this: object, value: unknown) {
        setField(useMeta(meta, this), key, value as string, overrideType);
      },
    } as unknown as void;
  } as unknown as PropertyDecorator;
}
