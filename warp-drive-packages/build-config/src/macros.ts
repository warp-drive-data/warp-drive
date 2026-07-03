/**
 * Internal functions for instrumenting the library's code with behaviors
 * that are removed from production builds.
 *
 * @hidden
 * @module
 */

/**
 * A type-narrowing assertion function that throws an error with the supplied
 * message if the condition is falsy.
 *
 * Asserts are removed from production builds, making this a "zero cost abstraction"
 * so liberal usage of this function to ensure runtime correctness is encouraged.
 *
 * @private
 */
export function assert(message: string, condition: unknown): asserts condition;
export function assert(message: string): never;
export function assert(message: string, condition?: unknown): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function macrosNotCompiled(usage: string): Error {
  return new Error(
    `The WarpDrive build macro \`${usage}\` was not compiled away. Ensure your babel configuration includes the plugins returned by \`babelPlugin()\` from \`@warp-drive/core/build-config\` (or that \`setConfig\` has been properly configured for your build).`
  );
}

/**
 * A build-time macro that enables branching on configuration and environment.
 *
 * Must be used as the direct condition of an `if` statement or ternary
 * expression. During the build the condition is statically evaluated
 * and the unreachable branch is removed.
 *
 * The predicate must be statically analyzable: boolean logic over
 * {@link getConfig}, {@link dependencySatisfies} and {@link moduleExists}.
 *
 * This is WarpDrive's scoped equivalent of `macroCondition` from
 * [@embroider/macros](https://www.npmjs.com/package/@embroider/macros).
 *
 * @private
 */
export function macroCondition(predicate: boolean): boolean {
  throw macrosNotCompiled(`macroCondition(${String(predicate)})`);
}

/**
 * A build-time macro that returns the finalized WarpDrive build config.
 *
 * Member access on the returned value is resolved statically during the
 * build whenever possible.
 *
 * @private
 */
export function getConfig<T>(): T {
  throw macrosNotCompiled('getConfig');
}

/**
 * A build-time macro that becomes `true` when the named dependency is
 * resolvable from the consuming application and its version satisfies
 * the given semver range, `false` otherwise.
 *
 * @private
 */
export function dependencySatisfies(name: string, range: string): boolean {
  throw macrosNotCompiled(`dependencySatisfies('${name}', '${range}')`);
}

/**
 * A build-time macro that becomes `true` when the named module's package
 * is resolvable from the consuming application, `false` otherwise.
 *
 * @private
 */
export function moduleExists(name: string): boolean {
  throw macrosNotCompiled(`moduleExists('${name}')`);
}

/**
 * A build-time macro that is replaced with a reference to the named module's
 * namespace via a hoisted static import.
 *
 * Use within a stripped branch (see {@link macroCondition}) to conditionally
 * depend on optional packages.
 *
 * @private
 */
export function importSync<T = unknown>(name: string): T {
  throw macrosNotCompiled(`importSync('${name}')`);
}
