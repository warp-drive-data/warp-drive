// oxfmt-ignore
import '@warp-drive/ember/install';

import EmberRouter from '@ember/routing/router';
import { setApplication } from '@ember/test-helpers';

import EmberApp from 'ember-strict-application-resolver';

import { SHOULD_RECORD } from '@warp-drive/core/build-config/env';
import { setupGlobalHooks } from '@warp-drive/diagnostic';
import { configure } from '@warp-drive/diagnostic/ember';
import { start } from '@warp-drive/diagnostic/runners/dom';
import { setIsRecording, setTestId } from '@warp-drive/holodeck';

import.meta.glob('./tests/**/*-test.{js,ts,gjs,gts}', { eager: true });

if (SHOULD_RECORD) {
  // eslint-disable-next-line no-console
  console.info('Holodeck Recording Enabled\n=========================');
  setIsRecording(true);
} else {
  // eslint-disable-next-line no-console
  console.info('Holodeck Recording Disabled\n=========================');
}

// Requests are proxied same-origin through the diagnostic server (see
// diagnostic.js's `proxy` config) instead of pointing the URL builder at
// holodeck's own host/port directly, so no setBuildURLConfig/setConfig call
// is needed here.

configure();

setupGlobalHooks((hooks) => {
  hooks.beforeEach(function (assert) {
    setTestId(this, (assert as unknown as { test: { testId: string } }).test.testId);
  });
  hooks.afterEach(function () {
    setTestId(this, null);
  });
});

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

class TestApp extends EmberApp {
  modules = {
    './router': { default: Router },
    //...import.meta.glob('./services/**/*.js', { eager: true }),
    // add any custom services here
  };
}

setApplication(
  TestApp.create({
    autoboot: false,
  })
);

void start({
  org: '@warp-drive/',
  package: 'ember',
  concurrency: 2,
});
