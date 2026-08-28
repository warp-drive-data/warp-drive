import { Converter, CommentTag } from 'typedoc';

/**
 * `@decorator` and `@classDecorator` mark a function as a field-level or
 * class-level decorator respectively. This maps that modifier tag onto
 * synthesized `@group` and `@badge` tags — as long as the reflection
 * doesn't already declare its own, which always wins:
 *
 * - `@group` defaults decorators into a "Field Decorators" / "Class
 *   Decorators" section on the module's index page instead of a flat
 *   "Functions" list.
 * - `@badge` shows "Decorator" / "Class Decorator" as the symbol's kind
 *   badge on its own page instead of the default "Function".
 *
 * Every reflection in a module must use the same mechanism (`@group` or
 * `@category`) for its index page to render sections consistently: TypeDoc
 * renders a module's index page by `@category` the moment *any* symbol in
 * it has one, dumping everything else (including anything only tagged via
 * `@group`) into a generic "Other" bucket instead. Symbols that need a
 * different bucket than the default (e.g. schema-dsl's entity-level
 * decorators) should override with their own `@group`, not `@category`.
 */
const DEFAULTS_BY_MODIFIER_TAG = {
  '@classDecorator': { group: 'Class Decorators', badge: 'Class Decorator' },
  '@decorator': { group: 'Field Decorators', badge: 'Decorator' },
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
    pushTagIfAbsent(comment, '@group', defaults.group);
    pushTagIfAbsent(comment, '@badge', defaults.badge);
    return;
  }
}

/** @param {import('typedoc').Application} app */
export function load(app) {
  app.converter.on(Converter.EVENT_CREATE_DECLARATION, assignDefaultsFromModifierTag);
  app.converter.on(Converter.EVENT_CREATE_SIGNATURE, assignDefaultsFromModifierTag);
}
