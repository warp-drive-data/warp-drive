import type { TransformName } from '@warp-drive/core/types/symbols';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { attr } from '../../../model';

export interface DateTransform {
  /**
   * see {@link TransformName}
   */
  [TransformName]: 'date';
}
/**
 The `DateTransform` class is used to serialize and deserialize
 date attributes on Ember Data record objects. This transform is used
 when `'date'` is passed as the type parameter to the
 {@link attr} function. It uses the [`ISO 8601`](https://en.wikipedia.org/wiki/ISO_8601)
 standard.

 ```js [app/models/score.js]
 import Model, { attr, belongsTo } from '@warp-drive/legacy/model';

 export default class ScoreModel extends Model {
    @attr('number') value;
    @belongsTo('player') player;
    @attr('date') date;
  }
 ```

  @public
 */

export class DateTransform {
  /**
   * Converts a serialized (raw payload) `ISO 8601` string, epoch number,
   * or nullish value into a `Date` (or `null`/`undefined`).
   */
  deserialize(serialized: string | number | null, _options?: Record<string, unknown>): Date | null {
    if (typeof serialized === 'string') {
      let offset = serialized.indexOf('+');

      if (offset !== -1 && serialized.length - 5 === offset) {
        offset += 3;
        return new Date(serialized.slice(0, offset) + ':' + serialized.slice(offset));
      }
      return new Date(serialized);
    } else if (typeof serialized === 'number') {
      return new Date(serialized);
    } else if (serialized === null || serialized === undefined) {
      // if the value is null return null
      // if the value is not present in the data return undefined
      return serialized;
    } else {
      return null;
    }
  }

  /**
   * Converts a `Date` attribute value into an `ISO 8601` string, or `null`
   * if the value is not a valid `Date`.
   */
  serialize(date: Date, _options?: Record<string, unknown>): string | null {
    // @ts-expect-error isNaN accepts date as it is coercible
    if (date instanceof Date && !isNaN(date)) {
      return date.toISOString();
    } else {
      return null;
    }
  }

  /**
   * Creates a new instance of this transform.
   */
  static create(): DateTransform {
    return new this();
  }
}
