import { DEBUG } from '@warp-drive/core/build-config/env';
import { skip, test as diagnosticTest } from '@warp-drive/diagnostic';

export default function testInDebug(label, callback) {
  if (DEBUG) {
    diagnosticTest(`[DEBUG-ONLY] ${label}`, callback);
  } else {
    skip(`[DEBUG-ONLY] ${label}`, callback);
  }
}
