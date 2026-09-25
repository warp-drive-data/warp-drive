import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ReflectionKind, Renderer } from 'typedoc';
import { MarkdownPageEvent } from 'typedoc-plugin-markdown';

/**
 * Records a `title` and `description` for every rendered API page, read from the reflection
 * itself, into `_page-meta.json` next to the markdown output. `postProcessApiDocs`
 * (docs-viewer/src/site-utils.ts) stamps them into each page's frontmatter, where
 * vitepress-plugin-llms turns them into the page's `llms.txt` entry:
 * `- [title](url): description`.
 *
 * The description is the symbol's `@summary` tag, exactly as written, and nothing else. A
 * symbol without one gets a title-only entry: guessing a sentence out of the comment's prose
 * means parsing markdown, which is what this deliberately does not do. See "Summarize Every
 * Public Symbol With `@summary`" in guides/contributing/writing-documentation/writing-api-docs.md.
 */

const META_FILE = '_page-meta.json';

/**
 * The comment that documents `model`. A function's lives on its first signature and an
 * accessor's on its getter, and a declaration can carry an empty comment of its own (e.g. only
 * a modifier tag) while the real one sits on the signature, so prefer one that has content.
 */
function commentFor(model) {
  const candidates = [model.comment, model.signatures?.[0]?.comment, model.getSignature?.comment];
  return candidates.find((c) => c && (c.summary.length || c.blockTags.length)) ?? candidates.find(Boolean);
}

/**
 * A tag's content as one line of text. Inline tags such as `{@link Store}` contribute their
 * link text; the tag may span several comment lines, and frontmatter needs a single line.
 */
function tagText(tag) {
  return tag.content
    .map((part) => part.text)
    .join('')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
}

function descriptionFor(model) {
  const summary = commentFor(model)?.getTag('@summary');
  return summary ? tagText(summary) || undefined : undefined;
}

/**
 * The symbol's name (a function keeps TypeDoc's trailing `()`), or a module's full import path:
 * with the `packages` entry point strategy a submodule's name is relative to its package
 * (`types/cache` under `@warp-drive/core`). A `@title` tag, which already replaces the page's
 * H1 in `postProcessApiDocs`, wins here too.
 */
function titleFor(model) {
  if (model.kindOf(ReflectionKind.Project)) return undefined;
  if (model.kindOf(ReflectionKind.SomeModule)) {
    const names = [];
    for (let r = model; r?.kindOf(ReflectionKind.SomeModule); r = r.parent) names.unshift(r.name);
    return names.join('/');
  }
  const override = commentFor(model)?.getTag('@title');
  if (override) return tagText(override);
  return model.kindOf(ReflectionKind.Function) ? `${model.name}()` : model.name;
}

/** @param {import('typedoc').Application} app */
export function load(app) {
  const meta = {};

  app.renderer.on(MarkdownPageEvent.BEGIN, (page) => {
    const title = titleFor(page.model);
    const description = descriptionFor(page.model);
    if (title || description) meta[page.url] = { title, description };
  });

  app.renderer.on(Renderer.EVENT_END, (event) => {
    writeFileSync(join(event.outputDirectory, META_FILE), JSON.stringify(meta, null, 2), 'utf-8');
  });
}
