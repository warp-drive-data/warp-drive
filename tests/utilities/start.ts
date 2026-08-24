import '@warp-drive/ember/install';

import EmberRouter from '@ember/routing/router';
import { setApplication } from '@ember/test-helpers';
import EmberApp from 'ember-strict-application-resolver';

import configureAsserts from '@ember-data/unpublished-test-infra/test-support/asserts/index';
import { setupGlobalHooks } from '@warp-drive/diagnostic';
import { configure } from '@warp-drive/diagnostic/ember';
import { start } from '@warp-drive/diagnostic/runners/dom';

import UserSetting from './models/user-setting';
import AppStore from './services/store';

import.meta.glob('./tests/**/*-test.{js,ts,gjs,gts}', { eager: true });

configure();

setupGlobalHooks((hooks) => {
  configureAsserts(hooks);
});

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

class TestApp extends EmberApp {
  modules = {
    './router': { default: Router },
    './services/store': { default: AppStore },
    './models/user-setting': { default: UserSetting },
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
