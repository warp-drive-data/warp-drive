import { assert } from '@ember/debug';
import Component from '@glimmer/component';
import { modifier } from 'ember-modifier';

interface FormPublicAPI {
  element: HTMLFormElement;
  dispatchSubmit: (event: Event) => void;
}

export class Form extends Component<{
  Element: HTMLFormElement;
  Blocks: { default: [publicApi: FormPublicAPI] };
}> {
  <template>
    <form ...attributes {{this.registerForm}}>
      {{yield this.publicApi}}
    </form>
  </template>

  get publicApi(): FormPublicAPI {
    return { element: this.form, dispatchSubmit: this.dispatchSubmit };
  }

  _form: HTMLFormElement | null = null;
  private get form(): HTMLFormElement {
    assert('Cannot access form before registered', this._form);
    return this._form;
  }
  registerForm = modifier((element: HTMLFormElement) => {
    this._form = element;
  });

  /** Submit the form with the relevant Element set as the submitter. */
  private readonly dispatchSubmit = (event: Event): void => {
    assert('Cannot put autoSubmit on non-HTMLElement', event.target instanceof HTMLElement);
    const submitEvent = new SubmitEvent('submit', { submitter: event.target });
    this.form.dispatchEvent(submitEvent);
  };
}
