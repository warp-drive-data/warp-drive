import type { TOC } from '@ember/component/template-only';

import { Attribution } from '#app/components/attribution.gts';

interface Signature {
  Blocks: {
    default: [];
  };
}

export const Layout = <template>
  <main class="todoapp">
    <header class="header">
      <h1>todos</h1>
    </header>

    {{yield}}
  </main>

  <footer class="info"><Attribution /></footer>
</template> satisfies TOC<Signature>;
