import EmberRouter from '@ember/routing/router';

import Application from 'ember-strict-application-resolver';

import '@warp-drive/ember/install';

class Router extends EmberRouter {
  location = 'history';
  rootURL = '/';
}

Router.map(function () {
  this.route('basic-record-materialization');
  this.route('complex-record-materialization');
  this.route('complex-record-materialization-with-relationship-materialization');
  this.route('relationship-materialization-simple');
  this.route('relationship-materialization-complex');
  this.route('add-children');
  this.route('add-children-then-materialize');
  this.route('add-children-to-materialized');
  this.route('unload');
  this.route('unload-all');
  this.route('destroy');
  this.route('unused-relationships');
  this.route('update-with-same-state');
  this.route('update-with-same-state-m2m');
});

class App extends Application {
  modules = {
    './router': { default: Router },
    ...import.meta.glob('./models/*.js', { eager: true }),
    ...import.meta.glob('./mixins/*.js', { eager: true }),
    ...import.meta.glob('./routes/*.js', { eager: true }),
    ...import.meta.glob('./services/*.ts', { eager: true }),
    ...import.meta.glob('./templates/*.hbs', { eager: true }),
  };
}

export default App;
