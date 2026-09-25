import { type ReactiveDataDocument, withDefaults } from '@warp-drive/core/reactive';
import type { Type } from '@warp-drive/core/types/symbols';

export const TodoSchema = withDefaults({
  type: 'todo',
  fields: [
    { name: 'title', kind: 'field' },
    { name: 'completed', kind: 'field' },
  ],
});

export interface TodoAttributes {
  title: string;
  completed: boolean;
}

/** Base type extended by all Todo resource instances */
export interface BaseTodo {
  /** Type-only brand */
  readonly [Type]: 'todo';
  /** $type attribute managed by the store */
  readonly $type: 'todo';
}

export interface Todo extends BaseTodo {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
}

/** A mutable copy of a Todo, returned by `checkout()` */
export interface EditableTodo extends BaseTodo {
  id: string;
  title: string;
  completed: boolean;
}

/** The response to a request for a list of todos */
export type TodosDocument = ReactiveDataDocument<Todo[]>;
