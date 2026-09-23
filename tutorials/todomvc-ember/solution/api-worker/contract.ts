/**
 * The HTTP contract between the tutorial app and its in-browser API.
 *
 * The API worker implements these routes; the app's request builders call them.
 * Both sides code against this file so neither has to guess the other's shapes.
 *
 * Every request and response body is JSON:API (`application/vnd.api+json`).
 */

export const API_ROOT = '/api';

/** Sent from the page to ask an already-active worker to take control (see register.ts). */
export const CLAIM_MESSAGE = 'todomvc-api:claim';
export const TODO_TYPE = 'todo';

export interface TodoAttributes {
  title: string;
  completed: boolean;
}

export interface TodoResource {
  type: typeof TODO_TYPE;
  id: string;
  attributes: TodoAttributes;
}

export interface TodoIdentifier {
  type: typeof TODO_TYPE;
  id: string;
}

export interface TodoDocument {
  data: TodoResource;
}

export interface TodoCollectionDocument {
  data: TodoResource[];
}

/** Returned by the list route when `page[limit]` or `page[offset]` is given. */
export interface TodoPageDocument extends TodoCollectionDocument {
  links: {
    self: string;
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
  meta: {
    currentPage: number;
    totalPages: number;
  };
}

export interface CountDocument {
  meta: { count: number };
}

export interface EmptyDocument {
  data: null;
}

export interface ErrorObject {
  status: string;
  title: string;
  detail?: string;
  source?: { pointer: string } | { parameter: string };
}

export interface ErrorDocument {
  errors: ErrorObject[];
}

/** POST /api/todo */
export interface CreateTodoBody {
  data: { type: typeof TODO_TYPE; attributes: Pick<TodoAttributes, 'title'> & Partial<TodoAttributes> };
}

/** PATCH /api/todo/:id */
export interface UpdateTodoBody {
  data: TodoIdentifier & { attributes: Partial<TodoAttributes> };
}

/** PATCH /api/todo/ops.bulk.patchAll — toggle-all */
export interface PatchAllBody {
  attributes: Partial<TodoAttributes>;
}

/**
 * Route table. Status codes are the success case; validation failures return
 * 422 with an `ErrorDocument`, unknown ids return 404 with an `ErrorDocument`,
 * and bad query parameters return 400 with an `ErrorDocument`.
 *
 * Routes marked "filterable" accept `?filter[completed]=true|false`.
 */
export const ROUTES = {
  /**
   * Filterable. Returns every matching todo, or one page of them when given
   * `page[limit]` (1–100, default 25) and/or `page[offset]` (default 0).
   */
  list: { method: 'GET', path: `${API_ROOT}/todo`, status: 200 },
  /** Filterable. Counts matching todos without returning them. */
  count: { method: 'GET', path: `${API_ROOT}/todo/ops.count`, status: 200 },
  get: { method: 'GET', path: `${API_ROOT}/todo/:id`, status: 200 },
  create: { method: 'POST', path: `${API_ROOT}/todo`, status: 201 },
  update: { method: 'PATCH', path: `${API_ROOT}/todo/:id`, status: 200 },
  delete: { method: 'DELETE', path: `${API_ROOT}/todo/:id`, status: 204 },
  /** Filterable. Applies the same attributes to every matching todo. */
  patchAll: { method: 'PATCH', path: `${API_ROOT}/todo/ops.bulk.patchAll`, status: 200 },
  /** Filterable. Deletes every matching todo. */
  deleteAll: { method: 'DELETE', path: `${API_ROOT}/todo/ops.bulk.deleteAll`, status: 204 },
} as const;

/** Response body for each route. `null` means no body (204). */
export interface RouteResponses {
  list: TodoCollectionDocument | TodoPageDocument;
  count: CountDocument;
  get: TodoDocument;
  create: TodoDocument;
  update: TodoDocument;
  delete: null;
  patchAll: EmptyDocument;
  deleteAll: null;
}

/** Seeded on first load so the first request in the tutorial shows data. */
export const SEED_TODOS: TodoResource[] = [
  { type: TODO_TYPE, id: '1', attributes: { title: 'Engage the warp drive', completed: true } },
  { type: TODO_TYPE, id: '2', attributes: { title: 'Make your first request', completed: false } },
  { type: TODO_TYPE, id: '3', attributes: { title: 'Build the data layer', completed: false } },
];
