import { defineLoader } from 'vitepress';

import { type BlogPost, blogPosts } from '../../../src/site-utils.ts';

export type { BlogPost };

declare const data: BlogPost[];
export { data };

/**
 * Every published blog post, newest first, for theme/BlogPostList.vue. Built from `blogPosts`, the
 * same list the RSS feed (src/emit-blog-feed.ts) is written from, so the blog's pages and its feed
 * never disagree about which posts exist or how they are dated.
 */
export default defineLoader({
  // the synced copies of blog/ that `blogPosts` reads; relative to this file
  watch: ['../../blog/**/*.md', '../../blog/**/_meta.json'],
  load() {
    return blogPosts();
  },
});
