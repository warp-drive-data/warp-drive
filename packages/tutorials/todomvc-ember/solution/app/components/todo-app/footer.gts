import type { TOC } from '@ember/component/template-only';

import { Request } from '@warp-drive/ember';

import { HandleError } from '#app/components/design-system/error.gts';
// #remove-from-starter
import { getAllTodos } from '#app/data/builders/query.ts';
// #end-remove-from-starter

/** Ensures all Todos are loaded before displaying the footer elements. */
export const MaybeFooter = <template>
  {{! #replace-in-starter TODO (chapter 3): show the footer once there are todos }}
  <Request @query={{(getAllTodos)}} @autorefresh={{true}} @autorefreshBehavior="refresh">

    {{! On success, render the footer content }}
    <:content as |content|>
      {{#if content.data.length}}
        <footer class="footer">
          {{yield}}
        </footer>
      {{/if}}
    </:content>

    {{! On error, display a toast via HandleError. }}
    <:error as |error|>
      <HandleError @error={{error}} />
    </:error>

  </Request>
  {{! #end-replace-in-starter }}
</template> satisfies TOC<{ Blocks: { default: [] } }>;
