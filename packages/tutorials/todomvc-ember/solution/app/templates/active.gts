import { pageTitle } from 'ember-page-title';

import { TodoApp } from '#app/components/todo-app/index.gts';
import type ActiveTodos from '#app/routes/active.ts';
import type { RouteComponent } from '#app/types/route-component.ts';

<template>
  {{pageTitle "Active"}}

  <TodoApp @todoFuture={{@model.todos}} />
</template> satisfies RouteComponent<ActiveTodos>;
