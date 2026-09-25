import {
  API_ROOT,
  type ErrorDocument,
  type ErrorObject,
  TODO_TYPE,
  type TodoAttributes,
  type TodoPageDocument,
  type TodoResource,
} from './contract.ts';
import type { TodoDb } from './db.ts';

/**
 * The API as a plain `(Request) => Promise<Response>` function. It has no
 * knowledge of service workers, so it can be tested directly and reused by any
 * host that speaks fetch.
 */
export type Router = (request: Request) => Promise<Response>;

const JSON_API = 'application/vnd.api+json';
const TODO_PATH = `${API_ROOT}/todo`;

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly errors: ErrorObject[]
  ) {
    super(errors[0]?.title);
  }
}

function invalid(detail: string, pointer: string): HttpError {
  return new HttpError(422, [{ status: '422', title: 'Invalid Attribute', detail, source: { pointer } }]);
}

function conflict(detail: string, pointer: string): HttpError {
  return new HttpError(409, [{ status: '409', title: 'Conflict', detail, source: { pointer } }]);
}

function forbidden(detail: string, pointer: string): HttpError {
  return new HttpError(403, [{ status: '403', title: 'Forbidden', detail, source: { pointer } }]);
}

function notFound(detail: string): HttpError {
  return new HttpError(404, [{ status: '404', title: 'Not Found', detail }]);
}

function document(status: number, body: unknown): Response {
  if (body === null) return new Response(null, { status });
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': JSON_API } });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, [{ status: '400', title: 'Bad Request', detail: 'Body must be valid JSON' }]);
  }
  if (!isRecord(body)) throw invalid('Body must be a JSON:API document', '');
  return body;
}

function parseAttributes(value: unknown, pointer: string): Partial<TodoAttributes> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw invalid('attributes must be an object', pointer);

  const attributes: Partial<TodoAttributes> = {};
  if ('title' in value) {
    if (typeof value.title !== 'string' || value.title.trim() === '') {
      throw invalid('title must be a non-empty string', `${pointer}/title`);
    }
    attributes.title = value.title.trim();
  }
  if ('completed' in value) {
    if (typeof value.completed !== 'boolean') {
      throw invalid('completed must be a boolean', `${pointer}/completed`);
    }
    attributes.completed = value.completed;
  }
  return attributes;
}

function badParameter(parameter: string, detail: string): HttpError {
  return new HttpError(400, [{ status: '400', title: 'Invalid Query Parameter', detail, source: { parameter } }]);
}

/** Applies `?filter[completed]=true|false`, if given. */
function applyFilter(todos: TodoResource[], params: URLSearchParams): TodoResource[] {
  const completed = params.get('filter[completed]');
  if (completed === null) return todos;
  if (completed !== 'true' && completed !== 'false') {
    throw badParameter('filter[completed]', 'filter[completed] must be true or false');
  }
  const wanted = completed === 'true';
  return todos.filter((todo) => todo.attributes.completed === wanted);
}

function parseInteger(params: URLSearchParams, name: string, min: number, max: number): number | null {
  const raw = params.get(name);
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw badParameter(name, `${name} must be an integer from ${min} to ${max}`);
  }
  return value;
}

/** Reads `page[limit]` and `page[offset]`; returns null when neither is given. */
function parsePage(params: URLSearchParams): { limit: number; offset: number } | null {
  const limit = parseInteger(params, 'page[limit]', 1, 100);
  const offset = parseInteger(params, 'page[offset]', 0, Number.MAX_SAFE_INTEGER);
  if (limit === null && offset === null) return null;
  return { limit: limit ?? 25, offset: offset ?? 0 };
}

/**
 * One page of todos, with links to its neighbours. Links keep the request's
 * other query parameters (such as the filter) so every page lists the same set.
 */
function paginate(
  url: URL,
  todos: TodoResource[],
  { limit, offset }: { limit: number; offset: number }
): TodoPageDocument {
  const total = todos.length;
  const totalPages = Math.ceil(total / limit);
  const lastOffset = Math.max(0, (totalPages - 1) * limit);

  const link = (pageOffset: number) => {
    const params = new URLSearchParams(url.search);
    params.set('page[limit]', String(limit));
    params.set('page[offset]', String(pageOffset));
    return `${url.pathname}?${params}`;
  };

  return {
    data: todos.slice(offset, offset + limit),
    links: {
      self: `${url.pathname}${url.search}`,
      first: link(0),
      last: link(lastOffset),
      ...(offset > 0 && { prev: link(Math.min(Math.max(0, offset - limit), lastOffset)) }),
      ...(offset + limit < total && { next: link(Math.min(offset + limit, lastOffset)) }),
    },
    meta: { currentPage: Math.floor(offset / limit) + 1, totalPages },
  };
}

function findIndex(todos: TodoResource[], id: string): number {
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) throw notFound(`No todo with id '${id}'`);
  return index;
}

export function createRouter(db: TodoDb): Router {
  async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const { method } = request;

    if (pathname === TODO_PATH) {
      if (method === 'GET') {
        const todos = applyFilter(await db.read(), searchParams);
        const page = parsePage(searchParams);
        return document(200, page ? paginate(url, todos, page) : { data: todos });
      }
      if (method === 'POST') {
        const body = await readBody(request);
        const data = body.data;
        if (!isRecord(data)) throw invalid('data must be a resource object', '/data');
        if (data.type !== TODO_TYPE) throw conflict(`data.type must be '${TODO_TYPE}'`, '/data/type');
        if ('id' in data) throw forbidden('Client-generated ids are not supported', '/data/id');
        const attributes = parseAttributes(data.attributes, '/data/attributes');
        if (attributes.title === undefined) throw invalid('title is required', '/data/attributes/title');

        const todo: TodoResource = {
          type: TODO_TYPE,
          id: crypto.randomUUID(),
          attributes: { title: attributes.title, completed: attributes.completed ?? false },
        };
        const todos = await db.read();
        await db.write([...todos, todo]);
        return document(201, { data: todo });
      }
    }

    if (pathname === `${TODO_PATH}/ops.count` && method === 'GET') {
      const todos = applyFilter(await db.read(), searchParams);
      return document(200, { meta: { count: todos.length } });
    }

    if (pathname === `${TODO_PATH}/ops.bulk.patchAll` && method === 'PATCH') {
      const body = await readBody(request);
      const attributes = parseAttributes(body.attributes, '/attributes');
      const todos = await db.read();
      const matching = new Set(applyFilter(todos, searchParams));
      await db.write(
        todos.map((todo) =>
          matching.has(todo) ? { ...todo, attributes: { ...todo.attributes, ...attributes } } : todo
        )
      );
      return document(200, { data: null });
    }

    if (pathname === `${TODO_PATH}/ops.bulk.deleteAll` && method === 'DELETE') {
      const todos = await db.read();
      const matching = new Set(applyFilter(todos, searchParams));
      await db.write(todos.filter((todo) => !matching.has(todo)));
      return document(200, { data: null });
    }

    if (pathname.startsWith(`${TODO_PATH}/`)) {
      const id = decodeURIComponent(pathname.slice(TODO_PATH.length + 1));
      const todos = await db.read();
      const index = findIndex(todos, id);

      if (method === 'GET') {
        return document(200, { data: todos[index] });
      }
      if (method === 'PATCH') {
        const body = await readBody(request);
        const data = body.data;
        if (!isRecord(data)) throw invalid('data must be a resource object', '/data');
        if (data.type !== TODO_TYPE) throw conflict(`data.type must be '${TODO_TYPE}'`, '/data/type');
        if (data.id !== id) throw conflict(`data.id must be '${id}'`, '/data/id');
        const attributes = parseAttributes(data.attributes, '/data/attributes');
        const todo = todos[index];
        const patched: TodoResource = { ...todo, attributes: { ...todo.attributes, ...attributes } };
        todos[index] = patched;
        await db.write(todos);
        return document(200, { data: patched });
      }
      if (method === 'DELETE') {
        todos.splice(index, 1);
        await db.write(todos);
        return document(204, null);
      }
    }

    throw notFound(`No route for ${method} ${pathname}`);
  }

  async function respond(request: Request): Promise<Response> {
    try {
      return await handle(request);
    } catch (error) {
      if (error instanceof HttpError) {
        const body: ErrorDocument = { errors: error.errors };
        return document(error.status, body);
      }
      const body: ErrorDocument = {
        errors: [{ status: '500', title: 'Internal Server Error', detail: String(error) }],
      };
      return document(500, body);
    }
  }

  // Writes replace the whole list, so run requests one at a time to avoid lost updates.
  let queue: Promise<unknown> = Promise.resolve();
  return (request) => {
    const response = queue.then(() => respond(request));
    queue = response;
    return response;
  };
}
