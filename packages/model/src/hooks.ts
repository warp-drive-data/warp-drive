/**
 * Legacy alias of {@link @warp-drive/legacy!model | @warp-drive/legacy/model}.
 * This entry re-exports the model lifecycle hooks from that module unchanged so existing
 * `@ember-data/model/hooks` imports keep working; new code should import
 * from `@warp-drive/legacy/model` directly.
 *
 * @summary Legacy alias that re-exports the `Model` lifecycle hooks `instantiateRecord`, `teardownRecord`, `modelFor`,
 * and `buildSchema` from `@warp-drive/legacy/model`.
 * @module
 */
export { instantiateRecord, teardownRecord, modelFor, buildSchema } from '@warp-drive/legacy/model';
