const path = require('path');

module.exports = {
  description: 'Generates an ember-data Model.',

  anonymousOptions: ['name', 'attr:type'],

  async locals(options) {
    const { generateModelSource } = await import('warp-drive/generators/model');

    const entityOptions = options.entity.options;
    const rawAttrs = Object.keys(entityOptions).map((name) => {
      const type = entityOptions[name];
      return type ? `${name}:${type}` : name;
    });

    return {
      content: generateModelSource(options.entity.name, rawAttrs, {
        packageName: this.packageName ?? '@warp-drive/legacy/model',
      }),
    };
  },

  filesPath() {
    return path.join(__dirname, 'files');
  },
};
