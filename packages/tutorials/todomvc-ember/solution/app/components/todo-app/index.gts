import type { Future } from '@warp-drive/core/request';

import { ClearCompletedTodos } from '#app/components/todo-app/clear-completed-todos.gts';
import { CreateTodo } from '#app/components/todo-app/create-todo.gts';
import { MaybeFooter } from '#app/components/todo-app/footer.gts';
import { Nav } from '#app/components/todo-app/nav.gts';
import { TodoAppState } from '#app/components/todo-app/state.gts';
import { TodoCount } from '#app/components/todo-app/todo-count.gts';
import { TodoList } from '#app/components/todo-app/todo-list.gts';
import { TodoProvider } from '#app/components/todo-app/todo-provider.gts';
import { ToggleAllTodos } from '#app/components/todo-app/toggle-all-todos.gts';
import type { TodosDocument } from '#app/data/schemas/todo.ts';
import type { TOC } from '@ember/component/template-only';

export const TodoApp = <template>
  <TodoAppState>

    <:header>
      <CreateTodo />
    </:header>

    <:main>
      <TodoProvider @todoFuture={{@todoFuture}}>

        <:toggle as |todos|>
          <ToggleAllTodos @todos={{todos}} />
        </:toggle>

        <:list as |todos|>
          <TodoList @todos={{todos}} />
        </:list>

      </TodoProvider>
    </:main>

    <:footer>
      <MaybeFooter>

        <TodoCount />
        <Nav />
        <ClearCompletedTodos />

      </MaybeFooter>
    </:footer>

  </TodoAppState>
</template> satisfies TOC<{ Args: { todoFuture: Future<TodosDocument> } }>;
