import { styleText } from 'node:util';

import type { BinConfig, Command, Flag } from './parse-args.ts';
import { color, indent, rebalanceLines, write } from './utils.ts';

function getDefaultValueDescriptor(value: unknown) {
  if (typeof value === 'string') {
    return styleText('green', `"${value}"`);
  } else if (typeof value === 'number') {
    return styleText('green', `${value}`);
  } else if (typeof value === 'boolean') {
    return styleText('green', `${value}`);
  } else if (value === null) {
    return styleText('green', 'null');
  } else if (typeof value === 'function') {
    if (value.name) {
      return styleText('cyan', `Function<${value.name}>`);
    } else {
      return styleText('cyan', `Function`);
    }
  } else {
    return styleText('gray', 'N/A');
  }
}

function buildOptionDoc(flag: Flag, index: number): string {
  const { flag_aliases, flag_mispellings, description, examples } = flag;
  const flag_shape =
    styleText('magentaBright', flag.positional ? `<${flag.flag}>` : `--${flag.flag}`) +
    (flag.required ? styleText('yellow', styleText('italic', ` required`)) : '');
  const flag_aliases_str = styleText('gray', flag_aliases?.join(', ') || 'N/A');
  const flag_mispellings_str = styleText('gray', flag_mispellings?.join(', ') || 'N/A');

  return `${flag_shape} ${styleText('greenBright', flag.name)}
  ${indent(description, 1)}
  ${styleText('yellow', 'default')}: ${getDefaultValueDescriptor(flag.default_value)}
  ${styleText('yellow', 'aliases')}: ${flag_aliases_str}
  ${styleText('yellow', 'alt')}: ${flag_mispellings_str}
  ${styleText('gray', 'Examples')}:
  ${examples
    .map((example) => {
      if (typeof example === 'string') {
        return example;
      } else {
        return `${example.desc}\n\t\t${example.example.join('\n\t\t')}`;
      }
    })
    .join('\n\t')}`;
}

function buildCommandDoc(command: Command, index: number): string {
  const { cmd, description, alt, options, overview, example } = command;
  let xmpl: string | undefined = '';

  if (Array.isArray(example)) {
    xmpl = example.join('\n\t  ');
  } else {
    xmpl = example;
  }

  const lines = [
    `cy<<${styleText('bold', cmd)}>>\n${indent(description, 1)}`,
    alt ? indent(`\nye<<alt>>: gr<<${alt.join(', ')}>>`, 2) : '',
    overview ? `\t${overview}` : '',
    xmpl ? `\n\tgr<<${Array.isArray(example) ? 'Examples' : 'Example'}>>:` : '',
    xmpl ? `\t  ${xmpl}\n` : '',
  ].filter(Boolean);

  const opts = options ? Object.values(options) : [];
  if (opts.length > 0) {
    lines.push(
      `\t${styleText('bold', styleText('yellowBright', 'Options'))}`,
      indent(`${Object.values(opts).map(buildOptionDoc).join('\n\n')}`, 1)
    );
  }

  return color(lines.join('\n'));
}

export function printDocs(config: BinConfig): void {
  const commands = Object.values(config.commands);
  const Help = `

ye<<#>> ${styleText('bold', 'Usage')}
$ ${config.name} ${styleText('magentaBright', '<command>')} [options]

===

ye<<#>> ${styleText('bold', 'Commands')}
  ${commands.map(buildCommandDoc).join('\n  ')}

---
`;

  write(indent(rebalanceLines(color(Help)), 1));
}
