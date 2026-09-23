// ember-cli only discovers blueprints in installed addons, so this package re-exports the @warp-drive/legacy blueprint with its own import path.
module.exports = { ...require('@warp-drive/legacy/blueprints/adapter/index'), packageName: '@ember-data/adapter', importStyle: 'default' };
