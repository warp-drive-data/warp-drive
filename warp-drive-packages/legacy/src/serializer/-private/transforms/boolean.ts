import type { TransformName } from '@warp-drive/core/types/symbols';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { attr } from '../../../model';

export interface BooleanTransform {
  /**
   * see {@link TransformName}
   */
  [TransformName]: 'boolean';
}

/**
  The `BooleanTransform` class is used to serialize and deserialize
  boolean attributes on Ember Data record objects. This transform is
  used when `'boolean'` is passed as the type parameter to the
  {@link attr}function.

  Usage

  ```js [app/models/user.js]
  import { Model, attr } from '@warp-drive/legacy/model';

  export default class UserModel extends Model {
    @attr('boolean') isAdmin;
    @attr('string') name;
    @attr('string') email;
  }
  ```

  By default, the boolean transform only allows for values of `true` or
  `false`. You can opt into allowing `null` values for
  boolean attributes via `attr('boolean', { allowNull: true })`

  ```js [app/models/user.js]
  import { Model, attr } from '@warp-drive/legacy/model';

  export default class UserModel extends Model {
    @attr('string') email;
    @attr('string') username;
    @attr('boolean', { allowNull: true }) wantsWeeklyEmail;
  }
  ```

  @public
 */
export class BooleanTransform {
  /**
   * Converts a serialized (raw payload) value into a `boolean` (or `null`
   * when `allowNull` is set and the value is nullish).
   */
  deserialize(serialized: boolean | null | number | string, options?: { allowNull?: boolean }): boolean | null {
    if ((serialized === null || serialized === undefined) && options?.allowNull === true) {
      return null;
    }

    if (typeof serialized === 'boolean') {
      return serialized;
    } else if (typeof serialized === 'string') {
      return /^(true|t|1)$/i.test(serialized);
    } else if (typeof serialized === 'number') {
      return serialized === 1;
    } else {
      return false;
    }
  }

  /**
   * Converts a `boolean` attribute value into its serialized (raw payload) form.
   */
  serialize(deserialized: boolean | null, options?: { allowNull?: boolean }): boolean | null {
    if ((deserialized === null || deserialized === undefined) && options?.allowNull === true) {
      return null;
    }

    return Boolean(deserialized);
  }

  /**
   * Creates a new instance of this transform.
   */
  static create(): BooleanTransform {
    return new this();
  }
}
