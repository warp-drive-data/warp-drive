'use strict';

module.exports = function (environment) {
  var ENV = {
    modulePrefix: 'main-test-app',
    podModulePrefix: 'main-test-app',
    environment: environment,
    rootURL: '/',
    locationType: 'history',
    EmberENV: {
      RAISE_ON_DEPRECATION: false,
      // Classic ember-cli merges config/optional-features.json into these
      // EmberENV flags at build time. That merge doesn't happen under the
      // native (non-compat) @embroider/vite pipeline, so it's replicated
      // here by hand -- keep these in sync with optional-features.json.
      _APPLICATION_TEMPLATE_WRAPPER: false,
      _TEMPLATE_ONLY_GLIMMER_COMPONENTS: true,
      _JQUERY_INTEGRATION: false,
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  return ENV;
};
