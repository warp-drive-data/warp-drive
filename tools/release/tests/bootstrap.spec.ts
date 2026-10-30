import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isNotFoundError } from '../core/bootstrap/index.ts';

describe('bootstrap isNotFoundError', () => {
  it('detects a 404 reported on stdout with empty stderr', () => {
    const logText = JSON.stringify({ error: { code: 'E404', summary: 'Not Found - GET registry.npmjs.org/x' } });
    assert.ok(isNotFoundError({ message: 'exit code: 1', errText: '', logText }));
  });

  it('detects a 404 reported on stderr', () => {
    assert.ok(isNotFoundError({ message: 'exit code: 1', errText: 'ERR_PNPM_FETCH_404 GET ...', logText: '' }));
  });

  it('does not treat other failures as not found', () => {
    assert.ok(!isNotFoundError({ message: 'exit code: 1', errText: 'ECONNRESET', logText: '' }));
  });
});
