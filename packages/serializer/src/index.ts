/**
 * @summary Legacy entry re-exporting the base `Serializer` class from `@warp-drive/legacy/serializer`, which normalizes
 * and serializes payloads for the adapter/serializer request path.
 * @module
 * @mergeModuleWith <project>
 */
// oxlint-disable-next-line no-unused-vars
import type { RequestManager } from '@warp-drive/core';
// oxlint-disable-next-line no-unused-vars
import type { Handler } from '@warp-drive/core/request';
// oxlint-disable-next-line no-unused-vars
import type { MinimumSerializerInterface } from '@warp-drive/legacy/compat';

export { Serializer as default } from '@warp-drive/legacy/serializer';
