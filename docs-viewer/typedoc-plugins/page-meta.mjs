import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ReflectionKind, Renderer } from 'typedoc';
import { MarkdownPageEvent } from 'typedoc-plugin-markdown';

/**
 * Records a plain-text `title` and one-sentence `description` for every rendered API page,
 * read from the reflection itself, into `_page-meta.json` next to the markdown output.
 * `postProcessApiDocs` (docs-viewer/src/site-utils.ts) stamps them into each page's
 * frontmatter, where vitepress-plugin-llms turns them into the page's `llms.txt` entry:
 * `- [title](url): description`.
 *
 * Reading the comment here, rather than scraping the rendered page later, means the text is
 * the author's own markdown, before TypeDoc adds links, escapes, badges, and signature blocks
 * that would have to be undone. The description is the symbol's `@summary` tag when it has
 * one, otherwise the first sentence of the first prose paragraph of its comment (or, for a
 * package landing page, of its readme). See "The First Sentence Stands Alone" in
 * guides/contributing/writing-documentation/writing-api-docs.md.
 */

const META_FILE = '_page-meta.json';
const MAX_LENGTH = 200;
// abbreviations whose trailing period does not end a sentence
const ABBREVIATION_RE = /(?:^|[\s(])(?:e\.g|i\.e|etc|vs|cf)$/i;
// a paragraph that opens with one of these is not prose: a heading, an HTML or Vue tag such as
// `<Badge ... />`, a blockquote or `> [!CAUTION]` alert, an image or badge link, a table, or a list
const NON_PROSE_RE = /^(?:#|<|>|!\[|\[!\[|\||-\s|\*\s|\d+\.\s)/;

/** Source markdown for display parts. Inline tags such as `{@link X | text}` become their text. */
function partsToMarkdown(parts) {
  return parts.map((part) => part.text).join('');
}

/** One line of plain text: links become their text and emphasis markers go, outside code spans. */
function toPlainText(markdown) {
  return markdown
    .split(/(`[^`]*`)/)
    .map((segment, i) =>
      i % 2 === 1
        ? segment
        : segment
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/\*+/g, '')
            // only a matched `_emphasis_` pair, so identifiers such as `_fetchRequest` keep their underscore
            .replace(/(^|[\s(])_(\S(?:[^_]*?\S)?)_(?=[\s.,;:!?)]|$)/g, '$1$2')
            // markdown backslash escapes the author wrote, e.g. `lower\_case`
            .replace(/\\([\\`*_{}[\]()#+\-.!<>|])/g, '$1')
    )
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The first prose paragraph of a comment or readme, skipping fenced code, `:::` callouts, and
 * paragraphs that open with a heading, a tag, an image, a table, or a list. Comments in this repo
 * routinely open with an `import` example, a `<Badge />`, or a `# Heading`.
 */
function firstProseParagraph(markdown) {
  let inFence = false;
  let inContainer = false;
  for (const raw of markdown.split(/\n\s*\n/)) {
    const block = raw.trim();
    if (inFence) {
      if (/```\s*$/.test(block)) inFence = false;
      continue;
    }
    if (inContainer) {
      if (/^\s*:::\s*$/m.test(block)) inContainer = false;
      continue;
    }
    if (block.startsWith('```')) {
      inFence = !/```\s*$/.test(block.slice(3));
      continue;
    }
    if (block.startsWith(':::')) {
      // the closing `:::` may be indented, and may share the opening's paragraph
      inContainer = !/\n\s*:::\s*$/.test(block);
      continue;
    }
    if (!block || NON_PROSE_RE.test(block)) continue;
    return block;
  }
  return undefined;
}

/** Keeps the first sentence (a `.` outside a code span, followed by a capital, a code span, or the end), capped. */
function firstSentence(text) {
  let inCode = false;
  let end = text.length;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '`') inCode = !inCode;
    if (inCode || ch !== '.' || ABBREVIATION_RE.test(text.slice(0, i))) continue;
    const rest = text.slice(i + 1);
    if (rest === '' || /^\s+[A-Z`]/.test(rest)) {
      end = i + 1;
      break;
    }
  }
  let sentence = text.slice(0, end);
  if (sentence.length > MAX_LENGTH) {
    const cut = sentence.lastIndexOf(' ', MAX_LENGTH);
    sentence = `${sentence.slice(0, cut > 0 ? cut : MAX_LENGTH).replace(/[\s,;:]+$/, '')}…`;
  }
  return sentence;
}

/**
 * The comment that documents `model`. A function's lives on its first signature and an
 * accessor's on its getter, and a declaration can carry an empty comment of its own (e.g. only
 * a modifier tag) while the real summary sits on the signature, so take the first one that has
 * something to say.
 */
function commentFor(model) {
  const candidates = [model.comment, model.signatures?.[0]?.comment, model.getSignature?.comment];
  return candidates.find((c) => c && (c.summary.length || c.getTag('@summary'))) ?? candidates.find(Boolean);
}

function descriptionFor(model) {
  const comment = commentFor(model);
  // an explicit `@summary` is used as written, not trimmed to its first sentence
  const summaryTag = comment?.getTag('@summary');
  if (summaryTag) return toPlainText(partsToMarkdown(summaryTag.content)) || undefined;

  const paragraph =
    (comment && firstProseParagraph(partsToMarkdown(comment.summary))) ??
    // a package landing page has no doc comment; TypeDoc reads it from the package's readme
    (model.readme?.length ? firstProseParagraph(partsToMarkdown(model.readme)) : undefined);
  if (!paragraph) return undefined;
  return firstSentence(toPlainText(paragraph)) || undefined;
}

/**
 * The bare symbol name (a function keeps TypeDoc's trailing `()`), or a module's full import
 * path: with the `packages` entry point strategy a submodule's name is relative to its package
 * (`types/cache` under `@warp-drive/core`). A `@title` tag, which already replaces the page's H1
 * in `postProcessApiDocs`, wins here too.
 */
function titleFor(model) {
  if (model.kindOf(ReflectionKind.Project)) return undefined;
  if (model.kindOf(ReflectionKind.SomeModule)) {
    const names = [];
    for (let r = model; r?.kindOf(ReflectionKind.SomeModule); r = r.parent) names.unshift(r.name);
    return names.join('/');
  }
  const override = commentFor(model)?.getTag('@title');
  if (override) return toPlainText(partsToMarkdown(override.content));
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
