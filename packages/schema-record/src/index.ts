/**
 * @summary Legacy entry re-exporting `SchemaService`, `withDefaults`, `registerDerivations`, `Checkout`, and the
 * schema-driven record hooks from `@warp-drive/core/reactive`.
 * @module
 * @mergeModuleWith <project>
 */
export {
  instantiateRecord,
  teardownRecord,
  type Transformation,
  SchemaService,
  withDefaults,
  fromIdentity,
  registerDerivations,
  type ReactiveResource as SchemaRecord,
  Checkout,
} from '@warp-drive/core/reactive';
