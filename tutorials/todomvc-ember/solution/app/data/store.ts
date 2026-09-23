import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

import { JsonApiHandler } from './handlers/json-api.ts';
import { TodoCountsHandler } from './handlers/todo-counts.ts';
import { TodoSchema } from './schemas/todo.ts';

export default class Store extends useRecommendedStore({
  cache: JSONAPICache,
  schemas: [TodoSchema],
  handlers: [JsonApiHandler, TodoCountsHandler],
}) {}
