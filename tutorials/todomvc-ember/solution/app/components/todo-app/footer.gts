import type { TOC } from '@ember/component/template-only';

import { Request } from '@warp-drive/ember';

import { HandleError } from '#app/components/design-system/error.gts';
import { getAllTodosCount } from '#app/data/builders/count.ts';

/** Ensures all Todos are loaded before displaying the footer elements. */
export const MaybeFooter = <template>
  <Request @query={{(getAllTodosCount)}} @autorefresh={{true}} @autorefreshBehavior="refresh">

    {{! On success, render the footer content }}
    <:content as |content|>
      {{#if content.meta.count}}
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
</template> satisfies TOC<{ Blocks: { default: [] } }>;
