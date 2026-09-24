/**
 * Legacy alias of {@link @warp-drive/legacy!serializer/transform | @warp-drive/legacy/serializer/transform}.
 * This entry re-exports the attribute transforms from that module unchanged so existing
 * `@ember-data/serializer/transform` imports keep working; new code should import
 * from `@warp-drive/legacy/serializer/transform` directly.
 *
 * @module
 */
export {
  Transform as default,
  BooleanTransform,
  StringTransform,
  NumberTransform,
  DateTransform,
} from '@warp-drive/legacy/serializer/transform';
