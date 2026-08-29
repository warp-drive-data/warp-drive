import type { TransformName } from '@warp-drive/core/types/symbols';

// oxlint-disable-next-line no-unused-vars
import type { attr } from '../../../model';

function isNumber(value: number) {
  return value === value && value !== Infinity && value !== -Infinity;
}

export interface NumberTransform {
  /**
   * see {@link TransformName}
   */
  [TransformName]: 'number';
}

/**
  The `NumberTransform` class is used to serialize and deserialize
  numeric attributes on Ember Data record objects. This transform is
  used when `number` is passed as the type parameter to the
  {@link attr} function.

  Usage

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
export class NumberTransform {
  /**
   * Converts a serialized (raw payload) value into a `number`, or `null`
   * if the value is empty, nullish, or not a valid number.
   */
  deserialize(serialized: string | number | null | undefined, _options?: Record<string, unknown>): number | null {
    if (serialized === '' || serialized === null || serialized === undefined) {
      return null;
    } else {
      const transformed = Number(serialized);

      return isNumber(transformed) ? transformed : null;
    }
  }

  /**
   * Converts a `number` attribute value into its serialized (raw payload) form.
   */
  serialize(deserialized: string | number | null | undefined, _options?: Record<string, unknown>): number | null {
    if (deserialized === '' || deserialized === null || deserialized === undefined) {
      return null;
    } else {
      const transformed = Number(deserialized);

      return isNumber(transformed) ? transformed : null;
    }
  }

  /**
   * Creates a new instance of this transform.
   */
  static create(): NumberTransform {
    return new this();
  }
}
