import type { TOC } from '@ember/component/template-only';

import { Request } from '@warp-drive/ember';

import { HandleError } from '#app/components/design-system/error.gts';

/** Ensures all Todos are loaded before displaying the footer elements. */
export const MaybeFooter = <template>
  {{! TODO (chapter 3): show the footer once there are todos }}
</template> satisfies TOC<{ Blocks: { default: [] } }>;
