import {
  API_ROOT,
  type ErrorDocument,
  type ErrorObject,
  TODO_TYPE,
  type TodoAttributes,
  type TodoIdentifier,
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

function parseIdentifiers(value: unknown): TodoIdentifier[] {
  if (!Array.isArray(value)) throw invalid('data must be an array of identifiers', '/data');
  return value.map((item: unknown, index) => {
    if (!isRecord(item) || item.type !== TODO_TYPE || typeof item.id !== 'string') {
      throw invalid(`data[${index}] must be a todo identifier`, `/data/${index}`);
    }
    return { type: TODO_TYPE, id: item.id };
  });
}

function findIndex(todos: TodoResource[], id: string): number {
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) throw notFound(`No todo with id '${id}'`);
  return index;
}

function requireAll(todos: TodoResource[], identifiers: TodoIdentifier[]): Set<string> {
  const ids = new Set(identifiers.map((identifier) => identifier.id));
  for (const id of ids) findIndex(todos, id);
  return ids;
}

export function createRouter(db: TodoDb): Router {
  async function handle(request: Request): Promise<Response> {
    const { pathname, searchParams } = new URL(request.url);
    const { method } = request;

    if (pathname === TODO_PATH) {
      if (method === 'GET') {
        const todos = await db.read();
        const completed = searchParams.get('filter[completed]');
        if (completed === null) return document(200, { data: todos });
        if (completed !== 'true' && completed !== 'false') {
          throw new HttpError(400, [
            {
              status: '400',
              title: 'Invalid Query Parameter',
              detail: 'filter[completed] must be true or false',
              source: { parameter: 'filter[completed]' },
            },
          ]);
        }
        const wanted = completed === 'true';
        return document(200, { data: todos.filter((todo) => todo.attributes.completed === wanted) });
      }
      if (method === 'POST') {
        const body = await readBody(request);
        const data = body.data;
        if (!isRecord(data) || data.type !== TODO_TYPE) throw invalid(`data.type must be '${TODO_TYPE}'`, '/data/type');
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

    if (pathname === `${TODO_PATH}/ops.bulk.patch` && method === 'PATCH') {
      const body = await readBody(request);
      const attributes = parseAttributes(body.attributes, '/attributes');
      const todos = await db.read();
      const ids = requireAll(todos, parseIdentifiers(body.data));

      const updated: TodoResource[] = [];
      const next = todos.map((todo) => {
        if (!ids.has(todo.id)) return todo;
        const patched = { ...todo, attributes: { ...todo.attributes, ...attributes } };
        updated.push(patched);
        return patched;
      });
      await db.write(next);
      return document(200, { data: updated });
    }

    if (pathname === `${TODO_PATH}/ops.bulk.delete` && method === 'DELETE') {
      const body = await readBody(request);
      const todos = await db.read();
      const ids = requireAll(todos, parseIdentifiers(body.data));
      await db.write(todos.filter((todo) => !ids.has(todo.id)));
      return document(204, null);
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
        if (!isRecord(data) || data.type !== TODO_TYPE || data.id !== id) {
          throw invalid(`data must identify todo '${id}'`, '/data');
        }
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
