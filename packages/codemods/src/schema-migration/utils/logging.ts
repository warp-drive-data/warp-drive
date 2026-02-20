import type { TransformOptions } from '../config.js';

/**
 * Shared debug logging utility for transforms
 */
export function debugLog(options: TransformOptions | undefined, ...args: unknown[]): void {
  if (options?.debug) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

/**
 * Shared error logging utility for transforms
 */
export function errorLog(options: TransformOptions | undefined, ...args: unknown[]): void {
  if (options?.verbose) {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}
