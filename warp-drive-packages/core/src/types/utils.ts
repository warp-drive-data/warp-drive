/**
 * Makes the properties named in `K` optional on `T`, leaving the rest as-is.
 *
 * @summary Utility type that makes only the named properties of an object type optional.
 * @example
 * ```ts
 * interface User { id: string; name: string; }
 * type PartialName = WithPartial<User, 'name'>; // { id: string; name?: string }
 * ```
 */
export type WithPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Removes `readonly` from every property of `T`.
 *
 * @summary Utility type that strips `readonly` from every property of an object type.
 * @example
 * ```ts
 * interface Config { readonly host: string; }
 * type MutableConfig = Mutable<Config>; // { host: string }
 * ```
 */
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };
