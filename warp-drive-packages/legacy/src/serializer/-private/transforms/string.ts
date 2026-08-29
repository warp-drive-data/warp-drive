import type { TransformName } from '@warp-drive/core/types/symbols';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { attr } from '../../../model';

export interface StringTransform {
  /**
   * see {@link TransformName}
   */
  [TransformName]: 'string';
}
/**
  The `StringTransform` class is used to serialize and deserialize
  string attributes on Ember Data record objects. This transform is
  used when `string` is passed as the type parameter to the
  {@link attr} function.

  Usage

  ```js [app/models/user.js]
  import Model, { attr, belongsTo } from '@warp-drive/legacy/model';

  export default class UserModel extends Model {
    @attr('boolean') isAdmin;
    @attr('string') name;
    @attr('string') email;
  }
  ```

  @public
 */
export class StringTransform {
  /**
   * Converts a serialized (raw payload) value into a `string`, or `null`
   * if the value is falsy (and not an empty string).
   */
  deserialize(serialized: unknown, _options?: Record<string, unknown>): string | null {
    return !serialized && serialized !== '' ? null : String(serialized);
  }
  /**
   * Converts a `string` attribute value into its serialized (raw payload) form.
   */
  serialize(deserialized: unknown, _options?: Record<string, unknown>): string | null {
    return !deserialized && deserialized !== '' ? null : String(deserialized);
  }

  /**
   * Creates a new instance of this transform.
   */
  static create(): StringTransform {
    return new this();
  }
}
