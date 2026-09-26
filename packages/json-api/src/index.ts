/**
 * @summary Legacy entry re-exporting `JSONAPICache` from `@warp-drive/json-api` as its default export.
 * @module
 * @mergeModuleWith <project>
 */
// oxlint-disable-next-line no-unused-vars
import type { Cache } from '@warp-drive/core/types/cache';

export { JSONAPICache as default } from '@warp-drive/json-api';
