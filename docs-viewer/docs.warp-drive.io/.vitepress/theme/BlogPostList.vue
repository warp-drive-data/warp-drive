<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { withBase } from 'vitepress';

import { data as allPosts } from '../data/blog.data.ts';

const props = withDefaults(
  defineProps<{
    /** only list posts under `blog/v<version>/` */
    version?: string;
    pageSize?: number;
  }>(),
  { pageSize: 10 }
);

const posts = computed(() =>
  props.version ? allPosts.filter((post) => post.source.startsWith(`blog/v${props.version}/`)) : allPosts
);
const pageCount = computed(() => Math.max(1, Math.ceil(posts.value.length / props.pageSize)));

// The page lives in `?page=N` so a page of the stream can be linked and the back button works.
// The static build renders page 1; the query is read once the page is in the browser.
const page = ref(1);
const visible = computed(() => posts.value.slice((page.value - 1) * props.pageSize, page.value * props.pageSize));
const list = useTemplateRef<HTMLElement>('list');

function pageFromUrl(): number {
  const requested = Number(new URLSearchParams(window.location.search).get('page'));
  return Number.isInteger(requested) && requested >= 1 && requested <= pageCount.value ? requested : 1;
}

function syncFromUrl() {
  page.value = pageFromUrl();
}

function goTo(next: number) {
  if (next === page.value || next < 1 || next > pageCount.value) return;
  page.value = next;
  const url = new URL(window.location.href);
  if (next === 1) url.searchParams.delete('page');
  else url.searchParams.set('page', String(next));
  window.history.pushState(window.history.state, '', url);
  list.value?.scrollIntoView({ block: 'start' });
}

onMounted(() => {
  syncFromUrl();
  window.addEventListener('popstate', syncFromUrl);
});
onBeforeUnmount(() => window.removeEventListener('popstate', syncFromUrl));

const majorVersion = (source: string) => /^blog\/v(\d+)\//.exec(source)?.[1];
const postUrl = (source: string) => withBase(`/${source.replace(/\.md$/, '')}`);
const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
</script>

<template>
  <section ref="list" class="blog-post-list">
    <p v-if="!posts.length">No posts yet.</p>
    <article v-for="post in visible" :key="post.source" class="blog-post">
      <p class="blog-post-meta">
        <time :datetime="post.date">{{ formatDate(post.date) }}</time>
        <template v-if="!version && majorVersion(post.source)">
          &nbsp;·&nbsp;
          <a :href="withBase(`/blog/v${majorVersion(post.source)}/`)">{{ majorVersion(post.source) }}.x</a>
        </template>
      </p>
      <h2 class="blog-post-title">
        <a :href="postUrl(post.source)">{{ post.title }}</a>
      </h2>
      <p v-if="post.description" class="blog-post-description">{{ post.description }}</p>
    </article>

    <nav v-if="pageCount > 1" class="blog-pagination" aria-label="Blog pages">
      <button type="button" :disabled="page === 1" @click="goTo(page - 1)">← Newer</button>
      <span>Page {{ page }} of {{ pageCount }}</span>
      <button type="button" :disabled="page === pageCount" @click="goTo(page + 1)">Older →</button>
    </nav>
  </section>
</template>

<style scoped>
.blog-post-list {
  scroll-margin-top: calc(var(--vp-nav-height) + 24px);
}

.blog-post {
  padding: 24px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.blog-post:first-child {
  padding-top: 0;
}

.blog-post-meta {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

/* .vp-doc styles every h2 as a section heading, with a border and a large top margin */
.vp-doc .blog-post-title {
  margin: 4px 0 0;
  padding: 0;
  border: none;
  font-size: 22px;
}

.vp-doc .blog-post-title a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.vp-doc .blog-post-title a:hover {
  color: var(--vp-c-brand-1);
}

.blog-post-description {
  margin: 8px 0 0;
  color: var(--vp-c-text-2);
}

.blog-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 24px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.blog-pagination button {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.blog-pagination button:disabled {
  color: var(--vp-c-text-3);
  cursor: not-allowed;
}
</style>
