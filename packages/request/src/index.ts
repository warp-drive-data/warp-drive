/**
 * @module
 * @mergeModuleWith <project>
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
