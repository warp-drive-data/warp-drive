import { SEED_TODOS, type TodoResource } from './contract.ts';

/**
 * Where the API keeps its todos.
 *
 * The browser stops idle service workers after a few seconds, so anything held
 * only in worker memory disappears. `cacheDb` persists to the Cache API, which
 * is available inside service workers (localStorage is not). `memoryDb` is for
 * tests.
 */
export interface TodoDb {
  read(): Promise<TodoResource[]>;
  write(todos: TodoResource[]): Promise<void>;
}

function seed(): TodoResource[] {
  return structuredClone(SEED_TODOS);
}

export function memoryDb(initial: TodoResource[] = seed()): TodoDb {
  let todos = structuredClone(initial);
  return {
    read: () => Promise.resolve(structuredClone(todos)),
    write: (next) => {
      todos = structuredClone(next);
      return Promise.resolve();
    },
  };
}

export const CACHE_NAME = 'todomvc-api';
const RECORD_URL = '/__todomvc-api/todos.json';

export function cacheDb(): TodoDb {
  return {
    async read() {
      const cache = await caches.open(CACHE_NAME);
      const stored = await cache.match(RECORD_URL);
      if (!stored) return seed();
      return (await stored.json()) as TodoResource[];
    },
    async write(todos) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(RECORD_URL, Response.json(todos));
    },
  };
}
