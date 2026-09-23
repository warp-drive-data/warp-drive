import type { TOC } from '@ember/component/template-only';

export const Button = <template>
  <button type="button" ...attributes>{{yield}}</button>
</template> satisfies TOC<{
  Element: HTMLButtonElement;
  Blocks: { default: [] };
}>;
