/**
 * Provides a configuration API for the reactivity system
 * that WarpDrive should use.
 *
 * @summary Provides `setupSignals`, which tells WarpDrive which signal and reactivity library to build its
 * reactive values on.
 * @module
 */

export { setupSignals, type HooksOptions, type SignalHooks } from './signals/-private.ts';
