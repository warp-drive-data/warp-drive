import { setApplication } from '@ember/test-helpers';

import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';

import { setupEmberOnerrorValidation, start as qunitStart } from 'ember-qunit';

import { clearPaginationCache } from '@warp-drive/experiments/pagination';

import { startApiWorker } from '#api-worker/register.ts';
import Application from '#app/app.ts';
import config, { enterTestMode } from '#config';

export async function start() {
  await startApiWorker();
  enterTestMode();
  setApplication(Application.create(config.APP));
  setup(QUnit.assert);
  setupEmberOnerrorValidation();
  // WarpDrive skips autorefresh while the tab is hidden, and headless Chrome
  // sometimes reports the test page as hidden. Keep it visible so refetches
  // after an invalidation run deterministically.
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  // Paginate caches pages by URL for the life of the page, across app instances.
  QUnit.hooks.beforeEach(() => clearPaginationCache());
  qunitStart();
}
