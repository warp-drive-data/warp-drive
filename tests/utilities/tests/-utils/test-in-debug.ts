import { DEBUG } from '@warp-drive/core/build-config/env';
import { skip, test as diagnosticTest } from '@warp-drive/diagnostic';

type DebugTestCallback = Parameters<typeof diagnosticTest>[1];

export function test(label: string, callback: DebugTestCallback): void {
  if (DEBUG) {
    diagnosticTest(`[DEBUG-ONLY] ${label}`, callback);
  } else {
    skip(`[DEBUG-ONLY] ${label}`, callback);
  }
}

export default test;
