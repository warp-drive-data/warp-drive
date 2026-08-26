module.exports = {
  description: 'Generates an ember-data Model.',

  anonymousOptions: ['name', 'attr:type'],

  root: __dirname,

  async locals(options) {
    const { generateModelSource } = await import('warp-drive/generators/model');

    const entityOptions = options.entity.options;
    const rawAttrs = Object.keys(entityOptions).map((name) => {
      const type = entityOptions[name];
      return type ? `${name}:${type}` : name;
    });

    return {
      content: generateModelSource(options.entity.name, rawAttrs),
    };
  },
};
