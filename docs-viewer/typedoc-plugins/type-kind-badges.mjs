import { Comment, CommentTag, Converter, ReflectionKind } from 'typedoc';

/**
 * Interfaces and type-aliases share a single `types/` output directory (see
 * `types-router.mjs`) so a symbol's URL survives switching between the two — but that
 * merge means the URL can no longer be used to tell them apart on the page itself.
 * `postProcessApiDocs` (docs-viewer/src/site-utils.ts) already knows how to turn a
 * `@badge` tag into the page's <KindBadge>, so this synthesizes that tag from each
 * reflection's real kind, unless the symbol already declares its own `@badge` — which
 * always wins.
 */
const BADGE_BY_KIND = new Map([
  [ReflectionKind.Interface, 'Interface'],
  [ReflectionKind.TypeAlias, 'Type Alias'],
]);

function assignKindBadge(reflection) {
  const label = BADGE_BY_KIND.get(reflection.kind);
  if (!label) return;

  reflection.comment ??= new Comment();
  if (reflection.comment.blockTags.some((t) => t.tag === '@badge')) return;

  reflection.comment.blockTags.push(new CommentTag('@badge', [{ kind: 'text', text: label }]));
}

/** @param {import('typedoc').Application} app */
export function load(app) {
  app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
    for (const id in context.project.reflections) {
      assignKindBadge(context.project.reflections[id]);
    }
  });
}
