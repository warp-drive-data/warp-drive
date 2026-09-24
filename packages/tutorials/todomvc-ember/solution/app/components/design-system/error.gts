import Component from '@glimmer/component';

import { reportError } from '#app/helpers/error.ts';
import { toast } from '#app/helpers/toast.ts';

interface Signature<E> {
  Element: HTMLDivElement;
  Args: { error: E; toast?: string };
  Blocks: { default?: [error: E] };
}

export class HandleError<E> extends Component<Signature<E>> {
  <template>
    {{reportError @error}}

    {{#if (has-block)}}
      <div class="error">
        {{yield @error}}
      </div>
    {{/if}}

    {{#if @toast}}{{toast "error" @toast}}{{/if}}
  </template>
}
