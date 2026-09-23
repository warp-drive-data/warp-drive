import EmberRouter from '@ember/routing/router';

import Application from 'ember-strict-application-resolver';

import '@warp-drive/ember/install';

import config from '#config';

class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {});

export default class App extends Application {
  modules = {
    './router': Router,
    ...import.meta.glob('./services/*', { eager: true }),
    ...import.meta.glob('./templates/*', { eager: true }),
  };
}
