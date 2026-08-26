/**
 * Small, self-contained string-casing helpers used by the file generators.
 *
 * These intentionally duplicate (rather than depend on) `ember-cli-string-utils`,
 * `ember-cli-path-utils`, and `ember-cli-test-info` -- all three are plain string
 * utilities with zero real coupling to ember-cli itself, so there's no reason for
 * this package (or any consumer of its generators) to pull in ember-cli's org
 * namespace as a dependency just for `dasherize`/`classify`/etc.
 */

const DECAMELIZE_REGEXP = /([a-z\d])([A-Z])/g;
const DASHERIZE_REGEXP = /[ _]/g;
const CAMELIZE_REGEXP = /(-|_|\.|\s)+(.)?/g;

export function decamelize(str: string): string {
  return str.replace(DECAMELIZE_REGEXP, '$1_$2').toLowerCase();
}

export function dasherize(str: string): string {
  return decamelize(str).replace(DASHERIZE_REGEXP, '-');
}

export function camelize(str: string): string {
  return str
    .replace(CAMELIZE_REGEXP, (_match, _separator, chr: string | undefined) => (chr ? chr.toUpperCase() : ''))
    .replace(/^([A-Z])/, (match) => match.toLowerCase());
}

export function classify(str: string): string {
  return str
    .split('.')
    .map((part) => {
      const camelized = camelize(part);
      return camelized.charAt(0).toUpperCase() + camelized.slice(1);
    })
    .join('.');
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Given a slash-separated entity name (e.g. `foo/bar`), returns the relative
 * path prefix needed to reach the root of the generated-into directory
 * (e.g. `../`). Used to resolve `--base-class` paths that are given relative
 * to the entity being generated.
 */
export function getRelativePath(entityPath: string): string {
  const depth = entityPath.split('/').length - 1;
  return depth > 0 ? '../'.repeat(depth) : './';
}

const SEPARATOR = ' | ';

/**
 * Builds a friendly qunit module description, e.g. `Unit | Model | foo`.
 */
export function friendlyTestDescription(name: string, testType: string, blueprintType?: string): string {
  let ret = testType + SEPARATOR;
  if (blueprintType) {
    ret += blueprintType + SEPARATOR;
  }
  ret += dasherize(name).replace(/-/g, ' ');
  return ret;
}
