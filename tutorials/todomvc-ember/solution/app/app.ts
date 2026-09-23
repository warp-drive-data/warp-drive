import EmberRouter from '@ember/routing/router';

import PageTitle from 'ember-page-title/services/page-title';
import Application from 'ember-strict-application-resolver';

import { setBuildURLConfig } from '@warp-drive/utilities';
import '@warp-drive/ember/install';

import config from '#config';

setBuildURLConfig({ host: '/', namespace: 'api' });

class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('active');
  this.route('completed');
});

export default class App extends Application {
  modules = {
    './router': Router,
    './services/page-title': PageTitle,
    ...import.meta.glob('./controllers/*', { eager: true }),
    ...import.meta.glob('./routes/*', { eager: true }),
    ...import.meta.glob('./services/*', { eager: true }),
    ...import.meta.glob('./templates/*', { eager: true }),
  };
}
