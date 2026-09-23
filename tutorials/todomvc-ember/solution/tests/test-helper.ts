import { setApplication } from '@ember/test-helpers';

import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';

import { setupEmberOnerrorValidation, start as qunitStart } from 'ember-qunit';

import Application from '#app/app.ts';
import config, { enterTestMode } from '#config';

export function start() {
  enterTestMode();
  setApplication(Application.create(config.APP));
  setup(QUnit.assert);
  setupEmberOnerrorValidation();
  qunitStart();
}
