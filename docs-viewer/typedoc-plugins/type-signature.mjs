import { ReflectionKind, ReflectionType } from 'typedoc';

/**
 * typedoc-plugin-markdown's `someType` partial returns markdown (backticked type names, and
 * `[Name](url)` links for cross-referenced types) meant for prose, not for embedding inside a
 * fenced code block — a link written literally inside a ```ts block would render as raw
 * `[Name](url)` text instead of code, since code fences don't parse markdown. This strips that
 * formatting back down to plain type text: pulling link/backtick text back out, and undoing the
 * backslash-escaping `escapeChars` (in typedoc-plugin-markdown's own markdown utils) applies to
 * `> < { } _ \` | [ ]` for safe use outside of code fences.
 */
function toPlainTypeText(markdown) {
  return markdown
    .replace(/\[`([^`]*)`\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\([><{}_`|[\]])/g, '$1')
    .replace(/`/g, '');
}

/**
 * A nested object-literal type (e.g. a property typed `{ a: string; [key: string]: unknown }`)
 * is rendered as its own flat, single-line shape here rather than through typedoc-plugin-markdown's
 * `someType`/`declarationType`, which — once `expandObjects` is on — indents an index signature
 * differently than its sibling properties, producing broken indentation once that multi-line text
 * is spliced into a line we build ourselves. Building it inline sidesteps that entirely and keeps
 * every line of the code block we emit at a predictable, single-line-per-member indent.
 */
function objectTypeText(context, declaration) {
  const parts = [];
  for (const indexSignature of declaration.indexSignatures ?? []) {
    const key = renderParameters(context, indexSignature.parameters).slice(1, -1);
    parts.push(`[${key}]: ${renderReturnType(context, indexSignature)}`);
  }
  for (const member of declaration.children ?? []) {
    const optional = member.flags?.isOptional ? '?' : '';
    if (member.kind === ReflectionKind.Method) {
      for (const signature of member.signatures ?? []) {
        parts.push(
          `${member.name}${optional}${renderParameters(context, signature.parameters)}: ${renderReturnType(context, signature)}`
        );
      }
      continue;
    }
    const readonly = member.flags?.isReadonly ? 'readonly ' : '';
    parts.push(`${readonly}${member.name}${optional}: ${someTypeText(context, member.type)}`);
  }
  for (const signature of declaration.signatures ?? []) {
    parts.push(`${renderParameters(context, signature.parameters)}: ${renderReturnType(context, signature)}`);
  }
  return parts.length ? `{ ${parts.join('; ')} }` : '{}';
}

function someTypeText(context, type) {
  if (!type) return 'unknown';
  if (type instanceof ReflectionType) {
    const declaration = type.declaration;
    // A pure function type (e.g. a callback parameter's `(item: T) => boolean`) is one call
    // signature and nothing else — render it as an arrow type, not as `{ (item: T): boolean }`,
    // matching how typedoc-plugin-markdown's own `reflectionType` partial special-cases it.
    if (declaration.signatures?.length === 1 && !declaration.children && !declaration.indexSignatures?.length) {
      const signature = declaration.signatures[0];
      return `${renderTypeParameters(context, signature.typeParameters)}${renderParameters(context, signature.parameters)} => ${renderReturnType(context, signature)}`;
    }
    return objectTypeText(context, declaration);
  }
  return toPlainTypeText(context.partials.someType(type));
}

function renderTypeParameters(context, typeParameters) {
  if (!typeParameters?.length) return '';
  const parts = typeParameters.map((typeParameter) => {
    let text = typeParameter.varianceModifier
      ? `${typeParameter.varianceModifier} ${typeParameter.name}`
      : typeParameter.name;
    if (typeParameter.type) text += ` extends ${someTypeText(context, typeParameter.type)}`;
    if (typeParameter.default) text += ` = ${someTypeText(context, typeParameter.default)}`;
    return text;
  });
  return `<${parts.join(', ')}>`;
}

function renderParameters(context, parameters) {
  const parts = (parameters ?? []).map((parameter) => {
    const rest = parameter.flags?.isRest ? '...' : '';
    const optional = parameter.flags?.isOptional || parameter.defaultValue !== undefined ? '?' : '';
    return `${rest}${parameter.name}${optional}: ${someTypeText(context, parameter.type)}`;
  });
  return `(${parts.join(', ')})`;
}

function renderReturnType(context, signature) {
  return signature.type ? someTypeText(context, signature.type) : 'void';
}

/** Renders one member (property, method, or accessor) as a line inside an interface's type body. */
function renderMemberLine(context, member) {
  const optional = member.flags?.isOptional ? '?' : '';
  if (member.kind === ReflectionKind.Method) {
    return (member.signatures ?? [])
      .map(
        (signature) =>
          `  ${member.name}${optional}${renderTypeParameters(context, signature.typeParameters)}${renderParameters(context, signature.parameters)}: ${renderReturnType(context, signature)};`
      )
      .join('\n');
  }
  if (member.kind === ReflectionKind.Accessor) {
    const lines = [];
    if (member.getSignature) lines.push(`  get ${member.name}(): ${renderReturnType(context, member.getSignature)};`);
    if (member.setSignature)
      lines.push(`  set ${member.name}${renderParameters(context, member.setSignature.parameters)};`);
    return lines.join('\n');
  }
  const readonly = member.flags?.isReadonly ? 'readonly ' : '';
  return `  ${readonly}${member.name}${optional}: ${someTypeText(context, member.type)};`;
}

/** The full interface shape — its own declared members (inherited ones are already pruned from
 * `children` by typedoc-plugin-no-inherit) plus an `extends` clause naming what it inherits from. */
function interfaceSignature(context, model) {
  const typeParameters = renderTypeParameters(context, model.typeParameters);
  const heritage = model.extendedTypes?.length
    ? ` extends ${model.extendedTypes.map((type) => someTypeText(context, type)).join(', ')}`
    : '';
  const lines = [];
  for (const indexSignature of model.indexSignatures ?? []) {
    const key = renderParameters(context, indexSignature.parameters).slice(1, -1);
    lines.push(`  [${key}]: ${renderReturnType(context, indexSignature)};`);
  }
  for (const member of model.children ?? []) {
    lines.push(renderMemberLine(context, member));
  }
  const body = lines.length ? `\n${lines.join('\n')}\n` : '';
  return `interface ${model.name}${typeParameters}${heritage} {${body}}`;
}

/**
 * Interfaces are the one page kind typedoc-plugin-markdown never gives a leading type signature
 * to — it renders straight into grouped member sections (Properties, Methods, ...) with nothing
 * summarizing the shape as a whole. Type Aliases already get one for free from their own
 * `declarationTitle` partial (see `expandObjects`/`expandParameters` in typedoc.config.mjs for
 * why it now shows the full type instead of a placeholder); this fills the same gap for
 * Interfaces by hooking typedoc-plugin-markdown's `content.begin`, which fires right after a
 * page's own H1 and before its body — exactly where the badges `postProcessApiDocs` later
 * attaches to that H1 are visually "underneath".
 *
 * Classes, Functions, Variables, and Enumerations are implementations rather than types, so they
 * don't get a synthesized signature block here (a class's methods/properties are already
 * documented in full further down its page; a function's/variable's own leading code block is
 * typedoc-plugin-markdown's native rendering, unrelated to this plugin). Overloaded functions and
 * methods still get every signature consolidated into one block, in `postProcessApiDocs` in
 * site-utils.ts.
 */
export function load(app) {
  app.renderer.markdownHooks.on('content.begin', (context) => {
    const model = context.page.model;
    if (model.kind !== ReflectionKind.Interface) return '';
    return '```ts\n' + interfaceSignature(context, model) + '\n```';
  });
}
