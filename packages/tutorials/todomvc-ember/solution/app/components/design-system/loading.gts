import type { TOC } from '@ember/component/template-only';

export const LoadingSpinner = <template>
  <span class="loading-spinner" ...attributes></span>
</template> satisfies TOC<{ Element: HTMLSpanElement }>;

export const LoadingDots = <template>
  <div class="loading-dots" ...attributes>
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  </div>
</template> satisfies TOC<{ Element: HTMLDivElement }>;
