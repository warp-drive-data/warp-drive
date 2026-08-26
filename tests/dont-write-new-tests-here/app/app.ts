import '@warp-drive/ember/install';

import Application from 'ember-strict-application-resolver';

import Router from './router';

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

  modules = {
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
