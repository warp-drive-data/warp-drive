// classic ember-cli addons contribute their own app/initializers/*.js files,
// which get merged into the consuming app's namespace by broccoli's
// addon-tree-merging and auto-run by ember-load-initializers. Neither of
// those mechanisms exist in this native (non-compat) pipeline, so addon
// initializers must be registered explicitly. ember-data's own initializer
// marks serializers/adapters as non-singleton -- without it, `owner.lookup`
// caches one shared instance per registration name, which silently breaks
// any test relying on each store getting its own adapter/serializer.
import EmberDataInitializer from 'ember-data/app/initializers/ember-data';
import Application from 'ember-strict-application-resolver';

import '@warp-drive/ember/install';

import Router from './router';

// ember-data's app/initializers/ember-data.js is a plain, untyped classic
// addon file (no .d.ts), so TypeScript infers its default export as `any`.
// Cast to whatever `Application.initializer` itself actually expects, rather
// than guessing/importing a type name that may not match this resolver's own
// signature.
Application.initializer(EmberDataInitializer as Parameters<typeof Application.initializer>[0]);

const EventConfig = {
  touchstart: null,
  touchmove: null,
  touchend: null,
  touchcancel: null,
  keydown: null,
  keyup: null,
  keypress: null,
  mousedown: null,
  mouseup: null,
  contextmenu: null,
  click: null,
  dblclick: null,
  focusin: null,
  focusout: null,
  submit: null,
  input: null,
  change: null,
  dragstart: null,
  drag: null,
  dragenter: null,
  dragleave: null,
  dragover: null,
  drop: null,
  dragend: null,
};

class App extends Application {
  override customEvents = EventConfig;

  modules: Application['modules'] = {
    './router': Router,
    ...import.meta.glob('./adapters/*', { eager: true }),
    ...import.meta.glob('./models/*', { eager: true }),
    ...import.meta.glob('./routes/*', { eager: true }),
    ...import.meta.glob('./services/*', { eager: true }),
    ...import.meta.glob('./templates/*', { eager: true }),
    ...import.meta.glob('./transforms/*', { eager: true }),
  };
}

export default App;
