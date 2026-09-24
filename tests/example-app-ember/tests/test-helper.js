import { setApplication } from '@ember/test-helpers';

import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';

import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';

import Application from '#app/app';
import config, { enterTestMode } from '#config';

export function start() {
  enterTestMode();

  setApplication(Application.create(config.APP));

  setup(QUnit.assert);
  setupEmberOnerrorValidation();

  qunitStart();
}
