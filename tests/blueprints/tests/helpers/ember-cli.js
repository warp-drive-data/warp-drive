'use strict';

const path = require('node:path');
const Blueprint = require('@ember-tooling/blueprint-model');

function stubProject(root) {
  return {
    root,
    name: () => 'my-app',
    config: () => ({ modulePrefix: 'my-app' }),
    isEmberCLIAddon: () => false,
    isEmberCLIProject: () => true,
    addons: [],
  };
}

function stubUi() {
  return {
    writeLine() {},
    write() {},
    prompt() {
      throw new Error('unexpected prompt');
    },
  };
}

/**
 * Runs `ember generate <kind> post title:string` the way ember-cli does: loads
 * the blueprint directory `pkg` ships and installs it into `target`.
 */
async function installBlueprint(pkg, kind, target) {
  const dir = path.dirname(require.resolve(`${pkg}/blueprints/${kind}/index`));
  const ui = stubUi();
  const blueprint = Blueprint.load(dir, { ui });

  await blueprint.install({
    target,
    entity: { name: 'post', options: { title: 'string' } },
    project: stubProject(target),
    ui,
    rawArgs: [],
    dryRun: false,
  });
}

module.exports = { installBlueprint };
