// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Includes } from './record.ts';

/**
 * A JSON-serializable primitive value, suitable for use as a single
 * query parameter value.
 */
export type SerializablePrimitive = string | number | boolean | null;

/**
 * A JSON-serializable value suitable for use as a query parameter value:
 * either a {@link SerializablePrimitive} or an array of them.
 */
export type Serializable = SerializablePrimitive | SerializablePrimitive[];

/**
 * Options for controlling how {@link QueryParamsSource} values are
 * serialized into a URL query string.
 */
export type QueryParamsSerializationOptions = {
  /**
   * How array values should be serialized:
   *
   * - `'bracket'` - `key[]=1&key[]=2`
   * - `'indices'` - `key[0]=1&key[1]=2`
   * - `'repeat'` - `key=1&key=2`
   * - `'comma'` - `key=1,2`
   */
  arrayFormat?: 'bracket' | 'indices' | 'repeat' | 'comma';
};

/**
 * The query parameters to serialize for a request: either a
 * dictionary of {@link Serializable} values (with an optional
 * `include` member for specifying relationships to sideload),
 * or a native `URLSearchParams` instance.
 */
export type QueryParamsSource =
  | ({
      /**
       * the relationship paths to sideload, see {@link Includes}
       */
      include?: string | string[];
    } & Record<Exclude<string, 'include'>, Serializable>)
  | URLSearchParams;
