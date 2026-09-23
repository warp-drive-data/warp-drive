// oxfmt-ignore
import '@warp-drive/ember/install';

import configureAsserts from '@ember-data/unpublished-test-infra/test-support/asserts/index';
import { setupGlobalHooks } from '@warp-drive/diagnostic';
import { configure } from '@warp-drive/diagnostic/ember';
import { start } from '@warp-drive/diagnostic/runners/dom';
import { setConfig, setTestId } from '@warp-drive/holodeck';
import { setBuildURLConfig } from '@warp-drive/utilities';

import.meta.glob('./tests/**/*-test.{js,ts,gjs,gts}', { eager: true });

const MockHost = `https://${window.location.hostname}:${Number(window.location.port) + 1}`;
setBuildURLConfig({
  host: MockHost,
  namespace: '',
});
setConfig({ host: MockHost });
setupGlobalHooks((hooks) => {
  // the deprecation sweep adds a passing assertion to every test, which turns this app's empty
  // `todo` placeholders into failures; the notification asserts are what json-api needs
  configureAsserts(hooks, { assertAllDeprecations: false });

  hooks.beforeEach(function (assert) {
    setTestId(this, (assert as unknown as { test: { testId: string } }).test.testId);
  });
  hooks.afterEach(function () {
    setTestId(this, null);
  });
});

configure();

void start({
  org: '@warp-drive/',
  package: 'json-api',
});
