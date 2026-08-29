import EmberRouter from '@ember/routing/router';
import { setApplication } from '@ember/test-helpers';

import EmberApp from 'ember-strict-application-resolver';

import '@warp-drive/ember/install';
import configureAsserts from '@ember-data/unpublished-test-infra/test-support/asserts/index';
import { Store } from '@warp-drive/core';
import { setupGlobalHooks } from '@warp-drive/diagnostic';
import { configure } from '@warp-drive/diagnostic/ember';
import { start } from '@warp-drive/diagnostic/runners/dom';
import { Model, restoreDeprecatedModelRequestBehaviors } from '@warp-drive/legacy/model';
import { restoreDeprecatedStoreBehaviors } from '@warp-drive/legacy/store';

import AppStore from './services/store';

import.meta.glob('./tests/**/*-test.{js,ts,gjs,gts}', { eager: true });

restoreDeprecatedStoreBehaviors(Store);
restoreDeprecatedModelRequestBehaviors(Model);

setupGlobalHooks((hooks) => {
  configureAsserts(hooks);
});

configure();

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

class TestApp extends EmberApp {
  modules = {
    './router': { default: Router },
    './services/store': { default: AppStore },
  };
}

setApplication(
  TestApp.create({
    autoboot: false,
  })
);

void start({
  useDiagnostic: true,
});
