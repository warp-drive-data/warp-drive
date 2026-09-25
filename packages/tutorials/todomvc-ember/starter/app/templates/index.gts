import { pageTitle } from 'ember-page-title';

import { TodoApp } from '#app/components/todo-app/index.gts';
import type AllTodos from '#app/routes/index.ts';
import type { RouteComponent } from '#app/types/route-component.ts';

<template><TodoApp @todoFuture={{@model.todos}} /></template> satisfies RouteComponent<AllTodos>;
