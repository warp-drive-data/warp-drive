import { Converter, CommentTag } from 'typedoc';

/**
 * `@decorator` and `@classDecorator` mark a function as a field-level or
 * class-level decorator respectively. This maps that modifier tag onto
 * synthesized `@category` and `@badge` tags — as long as the reflection
 * doesn't already declare its own, which always wins:
 *
 * - `@category` defaults decorators into a "Field Decorators" / "Class
 *   Decorators" section on the module's index page instead of a flat
 *   "Functions" list. This has to be `@category`, not `@group`: TypeDoc
 *   renders a module's index page by `@group` only when nothing in that
 *   module uses `@category` at all — the moment any symbol does, the whole
 *   page switches to category-based rendering and every un-categorized
 *   symbol (including anything only tagged via `@group`) falls into a
 *   generic "Other" bucket instead.
 * - `@badge` shows "Decorator" / "Class Decorator" as the symbol's kind
 *   badge on its own page instead of the default "Function".
 */
const DEFAULTS_BY_MODIFIER_TAG = {
  '@classDecorator': { category: 'Class Decorators', badge: 'Class Decorator' },
  '@decorator': { category: 'Field Decorators', badge: 'Decorator' },
};

function pushTagIfAbsent(comment, tag, text) {
  if (comment.blockTags.some((t) => t.tag === tag)) return;
  comment.blockTags.push(new CommentTag(tag, [{ kind: 'text', text }]));
}

function assignDefaultsFromModifierTag(_context, reflection) {
  const comment = reflection.comment;
  if (!comment) return;

  for (const [modifierTag, defaults] of Object.entries(DEFAULTS_BY_MODIFIER_TAG)) {
    if (!comment.modifierTags.has(modifierTag)) continue;
    pushTagIfAbsent(comment, '@category', defaults.category);
    pushTagIfAbsent(comment, '@badge', defaults.badge);
    return;
  }
}

/** @param {import('typedoc').Application} app */
export function load(app) {
  app.converter.on(Converter.EVENT_CREATE_DECLARATION, assignDefaultsFromModifierTag);
  app.converter.on(Converter.EVENT_CREATE_SIGNATURE, assignDefaultsFromModifierTag);
}
