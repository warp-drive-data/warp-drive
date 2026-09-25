import { assert } from '@ember/debug';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import { service } from '@ember/service';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import type Store from '#app/data/store.ts';
import type { EditableTodo, Todo } from '#app/data/schemas/todo.ts';

import { Form } from '#app/components/design-system/form.gts';
import { reportError } from '#app/helpers/error.ts';
import { autofocus } from '#app/modifiers/autofocus.ts';
import type AppState from '#app/services/app-state.ts';

interface Signature {
  Args: {
    todo: EditableTodo;
    onEditStart: () => void;
    onEditEnd: () => void;
  };
}

/**
 * Renders a single todo item, including:
 * - a checkbox to toggle completion,
 * - the todo title (which can be edited on double-click),
 * - and a button to delete the todo.
 *
 * The component manages its own "editing" state for the title,
 * and uses the provided AppState to manage async save state.
 *
 * The component uses optimistic updates for toggling completion,
 * but pessimistic updates for editing the title and deleting the todo.
 *
 * The component ensures that only one todo can be in editing mode at a time
 * by calling the provided `onEditStart` and `onEditEnd` callbacks.
 */
export class TodoItem extends Component<Signature> {
  <template>
    <li class="{{if @todo.completed 'completed'}} {{if this.isEditingTitle 'editing'}}">
      {{#if this.isEditingTitle}}
        <TitleForm
          class="edit"
          @todo={{@todo}}
          @isSaving={{this.appState.isSaving}}
          @onSaveStart={{this.onSaveStart}}
          @onSaveEnd={{this.onSaveEnd}}
          @onCancel={{this.endEditing}}
          {{autofocus}}
        />
      {{else}}
        <div class="view">
          <CompletedForm
            class="toggle"
            @todo={{@todo}}
            @isSaving={{this.appState.isSaving}}
            @onSaveStart={{this.onSaveStart}}
            @onSaveEnd={{this.onSaveEnd}}
            {{on "keyup" this.onToggleKeyup}}
          >
            {{! This must live within the "completed" form for compat with TodoMVC CSS }}
            <label class="view" {{on "dblclick" this.onTitleDblClick}}>
              {{@todo.title}}
            </label>
          </CompletedForm>

          {{! This must live in the view div for compat with TodoMVC CSS }}
          <DestroyForm
            class="destroy"
            @todo={{@todo}}
            @isSaving={{this.appState.isSaving}}
            @onSaveStart={{this.onSaveStart}}
            @onSaveEnd={{this.onSaveEnd}}
          />
        </div>
      {{/if}}
    </li>
  </template>

  @service declare private readonly appState: AppState;

  /** Whether we are in title-editing mode */
  @tracked private isEditingTitle = false;

  /** Start title-editing mode */
  private readonly startEditing = (): void => {
    this.args.onEditStart();
    this.isEditingTitle = true;
  };

  /** End title-editing mode */
  private readonly endEditing = (): void => {
    this.args.onEditEnd();
    this.isEditingTitle = false;
  };

  /** Start title-editing mode */
  private readonly onSaveStart = (): void => {
    // Ensure we disable upstream async during saves that occur when
    // `this.editing` is false, which happens due to requirements of TodoMVC CSS.
    if (!this.isEditingTitle) {
      this.args.onEditStart();
    }
    this.appState.onSaveStart();
  };

  /** End title-editing mode */
  private readonly onSaveEnd = (): void => {
    this.appState.onSaveEnd();
    this.endEditing();
  };

  /** Start editing on double-click */
  private readonly onTitleDblClick = (event: MouseEvent): void => {
    event.preventDefault();
    this.startEditing();
  };

  /** Start Editing on Enter */
  private readonly onToggleKeyup = (event: KeyboardEvent) => {
    assert('Expected event target to be an HTMLInputElement', event.target instanceof HTMLInputElement);
    if (event.key === 'Enter') {
      this.startEditing();
    }
  };
}

/**
 * Provides a checkbox that toggles the "completed" state of a todo.
 *
 * The update is optimistically applied, but only to the checked out
 * mutable copy of the todo, not the cache or backend. This ensures
 * that the UI in the TodoItem components share the same reactive state,
 * (e.g. the checkbox and the label's strike-through),
 * but this state is _not_ shared with the rest of the app.
 */
class CompletedForm extends Component<{
  Element: HTMLInputElement;
  Args: {
    todo: EditableTodo;
    isSaving: boolean;
    onSaveStart: () => void;
    onSaveEnd: () => void;
  };
  Blocks: { default: [] };
}> {
  <template>
    <input
      ...attributes
      aria-label="Toggle the completion state of this todo"
      name="completed"
      type="checkbox"
      checked={{@todo.completed}}
      {{on "change" (fn this.handleChange @todo)}}
    />

    {{yield}}
  </template>

  @service declare private readonly store: Store;

  private readonly handleChange = async (todo: EditableTodo, event: Event) => {
    if (this.args.isSaving) {
      return;
    }
    this.args.onSaveStart();

    const wasCompleted = todo.completed;
    const completed = !wasCompleted;

    assert('Expected event target to be an HTMLInputElement', event.target instanceof HTMLInputElement);
    assert(`Expected target.checked to match completed ${completed}`, event.target.checked === completed);

    await this.patchTodoToggle(todo);

    this.args.onSaveEnd();
  };

  private readonly patchTodoToggle = async (todo: EditableTodo) => {
    const wasCompleted = todo.completed;
    const completed = !wasCompleted;

    try {
      todo.completed = completed;
      // TODO (chapter 6): save the toggle and move the todo between lists
    } catch (e) {
      reportError(new Error('Could not update todo completion state', { cause: e }), { toast: true });
      todo.completed = wasCompleted;
    }
  };
}

/** Provides a button that deletes the Todo using "pessimistic" deletion. */
class DestroyForm extends Component<{
  Element: HTMLButtonElement;
  Args: {
    todo: EditableTodo;
    isSaving: boolean;
    onSaveStart: () => void;
    onSaveEnd: () => void;
  };
}> {
  <template>
    <button
      ...attributes
      aria-label="Delete this todo"
      name="destroy"
      type="button"
      {{on "click" (fn this.deleteTodo @todo)}}
    />
  </template>

  @service declare private readonly store: Store;

  private readonly deleteTodo = async (todo: EditableTodo) => {
    if (this.args.isSaving) {
      return;
    }
    this.args.onSaveStart();

    try {
      // TODO (chapter 7): delete the todo
    } catch (e) {
      reportError(new Error('Could not delete todo', { cause: e }), { toast: true });
    }

    this.args.onSaveEnd();
  };
}

class TitleForm extends Component<{
  Element: HTMLInputElement;
  Args: {
    todo: EditableTodo;
    isSaving: boolean;
    onSaveStart: () => void;
    onSaveEnd: () => void;
    onCancel: () => void;
  };
}> {
  <template>
    <Form {{on "submit" (fn this.onSubmit @todo)}} as |form|>
      <input
        aria-label="Edit this todo"
        name="title"
        type="text"
        value={{@todo.title}}
        ...attributes
        {{on "keydown" this.onTitleKeydown}}
        {{on "blur" form.dispatchSubmit}}
      />
    </Form>
  </template>

  @service declare private readonly store: Store;

  @tracked private submitDisabled = false;

  /** Cancel on Escape */
  private readonly onTitleKeydown = (event: KeyboardEvent) => {
    assert('Expected event target to be an HTMLInputElement', event.target instanceof HTMLInputElement);
    if (event.key === 'Escape') {
      this.submitDisabled = true;
      this.args.onCancel();
    }
  };

  private readonly onSubmit = async (todo: EditableTodo, event: SubmitEvent) => {
    event.preventDefault();

    if (this.args.isSaving || this.submitDisabled) {
      return;
    }
    // Prevent double-submission
    this.submitDisabled = true;
    this.args.onSaveStart();

    const title = processTitleSubmitEvent(event);
    if (title.length === 0) {
      await this.deleteTodo(todo);
    } else if (title !== todo.title) {
      await this.patchTodoTitle(todo, title);
    }

    this.args.onSaveEnd();
  };

  private readonly deleteTodo = async (todo: EditableTodo) => {
    try {
      // TODO (chapter 7): delete the todo
    } catch (e) {
      reportError(new Error('Could not delete todo', { cause: e }), { toast: true });
    }
  };

  private readonly patchTodoTitle = async (todo: Todo, title: string) => {
    try {
      // TODO (chapter 5): save the new title
    } catch (e) {
      reportError(new Error('Could not update todo title', { cause: e }), { toast: true });
    }
  };
}

function processTitleSubmitEvent(event: SubmitEvent): string {
  const form = event.target;
  assert('Expected event target to be an HTMLFormElement', form instanceof HTMLFormElement);
  const formData = new FormData(form);

  const rawTitle = formData.get('title');
  assert('Expected title to be a string', typeof rawTitle === 'string');
  return rawTitle.trim();
}
