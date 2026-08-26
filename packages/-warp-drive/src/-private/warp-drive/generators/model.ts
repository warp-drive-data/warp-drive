import { pluralize, singularize } from 'inflection';

import { camelize, classify, dasherize } from './strings.ts';

interface ParsedAttr {
  name: string;
  type: string;
  propertyName: string;
}

/**
 * Parses the `name:type` / `name:has-many:model` / `name:belongs-to:model`
 * positional args a `model` generator call is given (e.g.
 * `warp-drive generate model taco filling:belongs-to:protein price:number`)
 * into the pieces needed to render a Model class body.
 */
function parseAttrs(rawAttrs: string[]): { attrs: ParsedAttr[]; importedModules: string[] } {
  const attrs: ParsedAttr[] = [];
  const importedModulesSet = new Set<string>();

  for (const rawAttr of rawAttrs) {
    const [name, ...rest] = rawAttr.split(':');
    let type = rest[0] ?? '';
    let foreignModel = name;

    if (type.includes(':')) {
      // not expected from CLI splitting on ':' but kept for parity with
      // the historical `name:type:model` triple-part form
      [type, foreignModel] = type.split(':');
    } else if (rest.length > 1) {
      foreignModel = rest[1];
    }

    const dasherizedType = dasherize(type);

    if (/has-many/.test(dasherizedType)) {
      importedModulesSet.add('hasMany');
      attrs.push({
        name: singularize(dasherize(foreignModel)),
        type: dasherizedType,
        propertyName: pluralize(camelize(name)),
      });
    } else if (/belongs-to/.test(dasherizedType)) {
      importedModulesSet.add('belongsTo');
      attrs.push({
        name: dasherize(foreignModel),
        type: dasherizedType,
        propertyName: camelize(name),
      });
    } else {
      importedModulesSet.add('attr');
      attrs.push({
        name: dasherize(name),
        type: dasherizedType,
        propertyName: camelize(name),
      });
    }
  }

  return { attrs, importedModules: Array.from(importedModulesSet) };
}

function renderAttr(attr: ParsedAttr): string {
  const { name, type, propertyName } = attr;
  if (type === 'belongs-to') {
    return `  @belongsTo('${name}', { async: false, inverse: null }) ${propertyName};`;
  } else if (type === 'has-many') {
    return `  @hasMany('${name}', { async: false, inverse: null }) ${propertyName};`;
  } else if (type === '') {
    return `  @attr ${propertyName};`;
  }
  return `  @attr('${type}') ${propertyName};`;
}

/**
 * Generates the source for an `@ember-data/model` Model class.
 */
export function generateModelSource(name: string, rawAttrs: string[]): string {
  const { attrs, importedModules } = parseAttrs(rawAttrs);
  const className = classify(name);
  const importClause = importedModules.length ? `, { ${importedModules.join(', ')} }` : '';
  const body = attrs.map(renderAttr).join('\n');

  return `import Model${importClause} from '@ember-data/model';

export default class ${className}Model extends Model {
${body}
}
`;
}
