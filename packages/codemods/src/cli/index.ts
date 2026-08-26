import { program } from 'commander';

import { version } from '../../package.json' with { type: 'json' };
import { createApplyCommand } from './apply.ts';
import { createListCommand } from './list.ts';

export interface SharedCodemodOptions {
  dry?: boolean;
  ignore?: string[];
  verbose?: '0' | '1' | '2';
  logFile?: string | boolean;
}

program.name('@ember-data/codemods').version(version);

createApplyCommand(program);
createListCommand(program);

program.showHelpAfterError();

await program.parseAsync(process.argv);
