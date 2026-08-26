import type { SharedCodemodOptions } from '../cli/index.ts';
import type { LegacyStoreMethod } from './config.ts';

export interface Options extends SharedCodemodOptions {
  storeNames: string[];
  methods?: LegacyStoreMethod[];
}
