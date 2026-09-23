import { pageTitle } from 'ember-page-title';

import { TodoApp } from '#app/components/todo-app/index.gts';
import type CompletedTodos from '#app/routes/completed.ts';
import type { RouteComponent } from '#app/types/route-component.ts';

<template>
  {{pageTitle "Completed"}}

  <TodoApp @todoFuture={{@model.todos}} />
</template> satisfies RouteComponent<CompletedTodos>;
