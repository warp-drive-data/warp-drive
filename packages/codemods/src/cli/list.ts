import type { Command } from 'commander';

interface CodemodConfig {
  name: string;
  description: string;
}

const codemods: CodemodConfig[] = [
  {
    name: 'legacy-compat-builders',
    description:
      'Updates legacy store methods to use `store.request` and `@ember-data/legacy-compat/builders` instead.',
  },
  {
    name: 'migrate-to-schema',
    description: 'Migrates both EmberData models and mixins to WarpDrive schemas in batch.',
  },
];

export function createListCommand(program: Command) {
  program
    .command('list')
    .description('list available codemods')
    .action(() => {
      const maxNameLength = Math.max(...codemods.map((config) => config.name.length));
      for (const codemod of codemods) {
        const paddedName = codemod.name.padEnd(maxNameLength, ' ');
        // eslint-disable-next-line no-console
        console.log(`${paddedName} - ${codemod.description}`);
      }
    });
}
