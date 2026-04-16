import type { SharedCodemodOptions } from '../cli/index.js';
import type { LegacyStoreMethod } from './config.js';

export interface Options extends SharedCodemodOptions {
  storeNames: string[];
  methods?: LegacyStoreMethod[];
}
