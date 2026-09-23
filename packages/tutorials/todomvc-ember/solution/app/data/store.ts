import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

// #remove-region-from-starter
// #region import-json-api-handler
import { JsonApiHandler } from './handlers/json-api.ts';
// #endregion import-json-api-handler
import { TodoSchema } from './schemas/todo.ts';

export default class Store extends useRecommendedStore({
  cache: JSONAPICache,
  schemas: [TodoSchema],
  handlers: [
    // #replace-region-in-starter TODO (chapter 3): add the JSON:API handler
    // #region handlers
    JsonApiHandler,
    // #endregion handlers
  ],
}) {}
