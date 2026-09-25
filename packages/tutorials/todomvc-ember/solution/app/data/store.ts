import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

// #remove-from-starter
import { JsonApiHandler } from './handlers/json-api.ts';
// #end-remove-from-starter
import { TodoSchema } from './schemas/todo.ts';

export default class Store extends useRecommendedStore({
  cache: JSONAPICache,
  schemas: [TodoSchema],
  handlers: [
    // #replace-in-starter TODO (chapter 3): add the JSON:API handler
    JsonApiHandler,
    // #end-replace-in-starter
  ],
}) {}
