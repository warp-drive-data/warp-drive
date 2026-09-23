import type { TOC } from '@ember/component/template-only';

import { Request } from '@warp-drive/ember';

import { HandleError } from '#app/components/design-system/error.gts';
// #remove-region-from-starter
// #region import-query
import { getAllTodos } from '#app/data/builders/query.ts';
// #endregion import-query

/** Ensures all Todos are loaded before displaying the footer elements. */
export const MaybeFooter = <template>
  {{! #replace-region-in-starter TODO (chapter 3): show the footer once there are todos }}
  <!-- #region footer-request -->
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
  <!-- #endregion footer-request -->
</template> satisfies TOC<{ Blocks: { default: [] } }>;
