/** @typedef {`${number}.${number}`} Minor */

/**
 * @typedef {object} Token
 * @property {string} module
 * @property {string} export
 * @property {boolean} typeOnly  true when the token is importable only as a type
 */

/** @typedef {`${string}::${string}`} TokenKey */

/**
 * @param {string} module
 * @param {string} name
 * @param {boolean} typeOnly
 * @returns {Token}
 */
export function token(module, name, typeOnly) {
  return { module, export: name, typeOnly };
}

/**
 * @param {Pick<Token, 'module' | 'export'>} t
 * @returns {TokenKey}
 */
export function keyOf(t) {
  return `${t.module}::${t.export}`;
}

/**
 * @param {Token | null} a
 * @param {Token | null} b
 * @returns {boolean}
 */
export function sameToken(a, b) {
  if (a === null || b === null) return a === b;
  return a.module === b.module && a.export === b.export && a.typeOnly === b.typeOnly;
}

const rank = (name) => (name === 'default' ? 0 : name === '*' ? 1 : 2);

/**
 * @param {Pick<Token, 'module' | 'export' | 'typeOnly'>} a
 * @param {Pick<Token, 'module' | 'export' | 'typeOnly'>} b
 * @returns {number}
 */
export function compareTokens(a, b) {
  if (a.module !== b.module) return a.module < b.module ? -1 : 1;
  if (rank(a.export) !== rank(b.export)) return rank(a.export) - rank(b.export);
  if (a.export !== b.export) return a.export < b.export ? -1 : 1;
  return Number(a.typeOnly) - Number(b.typeOnly);
}

/**
 * @param {string} module
 * @returns {string}
 */
export function packageOf(module) {
  const parts = module.split('/');
  return parts.slice(0, module.startsWith('@') ? 2 : 1).join('/');
}

/**
 * @param {Minor} a
 * @param {Minor} b
 * @returns {number}
 */
export function compareMinors(a, b) {
  const [aMajor, aMinor] = a.split('.').map(Number);
  const [bMajor, bMinor] = b.split('.').map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}
