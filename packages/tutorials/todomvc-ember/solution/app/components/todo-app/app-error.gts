import { service } from '@ember/service';
import Component from '@glimmer/component';

import { HandleError } from '#app/components/design-system/error.gts';
import type AppState from '#app/services/app-state.ts';

/** Displays a generic error message when the application is in an error state. */
export class AppError extends Component {
  <template>
    <span class="app-state-error">⚠</span>
    <HandleError @error={{this.appState.error}}>
      <h2 class="error-message">Something went wrong.</h2>
      <p class="error-cta">Please contact TodoMVC support.</p>
    </HandleError>
  </template>

  @service declare private readonly appState: AppState;
}
