import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

import { TodoSchema } from './schemas/todo.ts';

export default class Store extends useRecommendedStore({
  cache: JSONAPICache,
  schemas: [TodoSchema],
  handlers: [
    // TODO (chapter 3): add the JSON:API handler
  ],
}) {}
