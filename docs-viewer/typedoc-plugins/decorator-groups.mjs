import { Converter, CommentTag } from 'typedoc';

/**
 * `@decorator` and `@classDecorator` mark a function as a field-level or
 * class-level decorator respectively. This maps that modifier tag onto a
 * synthesized `@group` tag so decorators render under a "Field Decorators" /
 * "Class Decorators" heading instead of a flat "Functions" list, with any
 * `@category` tag still sub-dividing within that group as usual.
 */
const GROUP_BY_MODIFIER_TAG = {
  '@classDecorator': 'Class Decorators',
  '@decorator': 'Field Decorators',
};

function assignGroupFromModifierTag(_context, reflection) {
  const comment = reflection.comment;
  if (!comment) return;

  for (const [modifierTag, groupName] of Object.entries(GROUP_BY_MODIFIER_TAG)) {
    if (!comment.modifierTags.has(modifierTag)) continue;
    if (comment.blockTags.some((tag) => tag.tag === '@group')) return;
    comment.blockTags.push(new CommentTag('@group', [{ kind: 'text', text: groupName }]));
    return;
  }
}

/** @param {import('typedoc').Application} app */
export function load(app) {
  app.converter.on(Converter.EVENT_CREATE_DECLARATION, assignGroupFromModifierTag);
  app.converter.on(Converter.EVENT_CREATE_SIGNATURE, assignGroupFromModifierTag);
}
