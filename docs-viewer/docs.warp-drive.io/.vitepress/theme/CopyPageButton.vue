<script setup lang="ts">
import { useCopyOrDownloadAsMarkdownButtons } from "vitepress-plugin-llms/vitepress-components";
/**
 * "Copy page" split button rendered above every doc page's title (see Layout.vue).
 *
 * The main button copies the page's LLM-friendly Markdown; the dropdown offers to view that
 * Markdown in a new tab or hand it to Claude. The Markdown itself is produced at build time by
 * vitepress-plugin-llms (registered in config.mts), which writes a `.md` twin of every page next
 * to its `.html`. The plugin's composable resolves that twin's URL from `location.pathname`, so
 * this works unchanged under the `/pr-preview/pr-<n>/` base too.
 *
 * The plugin ships its own button component, but it has no props: it always renders ChatGPT and
 * a download button as well. This component uses the same composable with only the items we want.
 * The icons are inlined because the plugin's `icons/*.svg` files are not in its package exports.
 */
import { onMounted, onUnmounted, ref } from "vue";

const { aiProviders, copied, copyAsMarkdown, openInAI, viewAsMarkdown } = useCopyOrDownloadAsMarkdownButtons({
  aiProviders: [{ name: "Claude", url: "https://claude.ai/new?q=" }],
});

const isOpen = ref(false);
const container = ref<HTMLElement | null>(null);

function closeMenu(): void {
  isOpen.value = false;
}

function toggleMenu(): void {
  isOpen.value = !isOpen.value;
}

async function handleCopy(): Promise<void> {
  await copyAsMarkdown();
  closeMenu();
}

function handleView(): void {
  viewAsMarkdown();
  closeMenu();
}

function handleOpenInClaude(): void {
  openInAI(aiProviders[0]);
  closeMenu();
}

function handleClickOutside(event: MouseEvent): void {
  if (container.value && !container.value.contains(event.target as Node)) {
    closeMenu();
  }
}

function handleEscape(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscape);
});
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscape);
});
</script>

<template>
  <div class="copy-page">
    <div ref="container" class="copy-page-group">
      <div class="copy-page-trigger">
        <button
          type="button"
          class="copy-page-main"
          :title="copied ? 'Copied' : 'Copy page as Markdown for LLMs'"
          @click="handleCopy"
        >
          <svg v-if="copied" class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <svg v-else class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <span>{{ copied ? "Copied" : "Copy page" }}</span>
        </button>
        <span class="copy-page-divider" aria-hidden="true"></span>
        <button
          type="button"
          class="copy-page-chevron"
          aria-label="More options"
          aria-haspopup="menu"
          :aria-expanded="isOpen"
          @click.stop="toggleMenu"
        >
          <svg class="icon" :class="{ open: isOpen }" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      <div v-if="isOpen" class="copy-page-menu" role="menu">
        <button type="button" class="copy-page-item" role="menuitem" @click="handleCopy">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <span class="copy-page-item-text">
            <span class="copy-page-item-title">Copy page</span>
            <span class="copy-page-item-desc">Copy page as Markdown for LLMs</span>
          </span>
        </button>
        <button type="button" class="copy-page-item" role="menuitem" @click="handleView">
          <svg class="icon filled" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill-rule="evenodd"
              d="M0 8a4 4 0 0 1 4-4h16a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4zm4-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm1.684 2.051A1 1 0 0 1 6.8 8.4L9 11.333 11.2 8.4A1 1 0 0 1 13 9v6a1 1 0 1 1-2 0v-3l-1.2 1.6a1 1 0 0 1-1.6 0L7 12v3a1 1 0 1 1-2 0V9a1 1 0 0 1 .684-.949M18 9a1 1 0 1 0-2 0v3.586l-.293-.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l2-2a1 1 0 0 0-1.414-1.414l-.293.293z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="copy-page-item-text">
            <span class="copy-page-item-title"
              >View as Markdown <span class="external" aria-hidden="true">↗</span></span
            >
            <span class="copy-page-item-desc">View this page as plain text</span>
          </span>
        </button>
        <button type="button" class="copy-page-item" role="menuitem" @click="handleOpenInClaude">
          <svg class="icon filled" viewBox="0 0 100 101" aria-hidden="true">
            <path d="m96.138 40.515 3.5 2v1.5l-1 3.5-42.5 10-3.996-9.93zm0 0" />
            <path d="m80.626 11.495 4.894 1.027 1.299 1.6 1.239 3.837-.514 2.447-28.521 39-9.5-9.5 26.3-34.514zm0 0" />
            <path d="m56.537 5.537 3-2 2.5 1 2.5 3.5-6.849 41.162-4.65-3.162-2-5.5 3.5-31zm0 0" />
            <path
              d="m25.058 6.102 3.082-3.937 2.01-.46 3.99.584 1.968 1.54 14.345 31.804 5.19 15.11-6.071 3.376-23.139-41.987zm0 0"
            />
            <path d="m10.766 27.61-1-4.003 3-3.5 3.5.5h1l21 15.5 6.5 5 9 7-5 8.5-4.5-3.5-3-3-29-20.5zm0 0" />
            <path d="m4.856 53-2.263-2.5v-2.224l2.263-.776 25.5 1.5 25 2-.812 4.978L6.856 53.5zm0 0" />
            <path d="M19.428 78.51h-5l-1.988-2.29v-2.737l8.488-6 34.508-21.966 3.492 5.966zm0 0" />
            <path d="m28.59 92.082-2 .5-3-1.5.5-2.5 29.5-39 4 5.5-22 29zm0 0" />
            <path d="m53.09 96.91-1.5 2-3 1-2.5-2-1.5-3 7.5-40.5 4.5.5zm0 0" />
            <path d="M77.985 86.16v4l-.5 1.5-2 1-3.5-.466-24.033-35.77 9.533-7.264 8 14.5.75 5.25zm0 0" />
            <path d="m89.132 80.508.5 2.5-1.5 2-1.5-.5-8.5-6-13-11.5-10-7 3-9.5 5 3 3 5.5zm0 0" />
            <path d="m82.5 55.5 12.5 1 3 2 2 3v2.159L94.5 66l-28-7-11.5-.5L58 48l8 6zm0 0" />
          </svg>
          <span class="copy-page-item-text">
            <span class="copy-page-item-title">Open in Claude <span class="external" aria-hidden="true">↗</span></span>
            <span class="copy-page-item-desc">Ask Claude about this page</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.copy-page {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.copy-page-group {
  position: relative;
}

.copy-page-trigger {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  line-height: 1;
  overflow: hidden;
}

.copy-page-main,
.copy-page-chevron,
.copy-page-item {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
}

.copy-page-main {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  white-space: nowrap;
}

.copy-page-chevron {
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.copy-page-main:hover,
.copy-page-chevron:hover,
.copy-page-item:hover {
  background: var(--vp-c-bg-soft);
}

.copy-page-divider {
  width: 1px;
  background: var(--vp-c-divider);
}

.icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.15s ease;
}

.icon.filled {
  fill: currentColor;
  stroke: none;
}

.icon.open {
  transform: rotate(180deg);
}

.copy-page-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 100;
  min-width: 280px;
  padding: 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
}

.copy-page-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  text-align: left;
}

.copy-page-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.copy-page-item-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.copy-page-item-desc {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.external {
  font-size: 11px;
  color: var(--vp-c-text-3);
}
</style>
