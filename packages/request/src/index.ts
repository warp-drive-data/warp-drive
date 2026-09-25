/**
 * @summary Legacy entry re-exporting `RequestManager` as its default, plus the request pipeline utilities and
 * request/response types from `@warp-drive/core/request`.
 * @module
 * @mergeModuleWith <project>
 */

// oxlint-disable-next-line no-unused-vars
import type { RequestManager, Store } from '@warp-drive/core';

export * from '@warp-drive/core/request';
export { RequestManager as default } from '@warp-drive/core';
export type {
  RequestContext,
  ImmutableRequestInfo,
  RequestInfo,
  ResponseInfo,
  StructuredDocument,
  StructuredErrorDocument,
  StructuredDataDocument,
} from '@warp-drive/core/types/request';
