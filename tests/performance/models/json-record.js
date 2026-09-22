import Model, { attr } from '@warp-drive/legacy/model';

/**
 * A record whose attributes include raw JSON (an object, an array of
 * strings, and an array of nested objects) with no transform, so the
 * cache stores and compares the values as-is.
 */
export default class JsonRecord extends Model {
  @attr name;
  @attr count;
  @attr settings;
  @attr tags;
  @attr items;
}
