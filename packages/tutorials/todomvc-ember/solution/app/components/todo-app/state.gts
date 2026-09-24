import { service } from '@ember/service';
import Component from '@glimmer/component';

import { AppError } from '#app/components/todo-app/app-error.gts';
import type AppState from '#app/services/app-state.ts';

interface Signature {
  Blocks: {
    header: [];
    main: [];
    footer: [];
  };
}

/**
 * The overall state container for the Todo App.
 *
 * This component is responsible for displaying:
 * - unrecoverable errors,
 * - the main app,
 * - the header,
 * - and the footer.
 */
export class TodoAppState extends Component<Signature> {
  <template>
    <section>
      {{#if this.appState.error}}
        <div class="new-todo">OH NO</div>
      {{else}}
        {{yield to="header"}}
      {{/if}}
    </section>
    <section class="main">
      {{#if this.appState.error}}
        <AppError />
      {{else}}
        {{yield to="main"}}
      {{/if}}
    </section>

    {{#unless this.appState.error}}
      {{yield to="footer"}}
    {{/unless}}
  </template>

  @service declare private readonly appState: AppState;
}
