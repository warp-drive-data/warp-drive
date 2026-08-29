import { styleText } from 'node:util';

import { getCharLength, getPadding } from '../../../help/-utils.ts';
import { TYPE_STRATEGY } from '../../../utils/channel.ts';
import { AppliedStrategy } from './generate-strategy.ts';

export const COLORS_BY_STRATEGY: Record<TYPE_STRATEGY, 'red' | 'yellow' | 'green' | 'cyan'> = {
  private: 'red',
  alpha: 'yellow',
  beta: 'cyan',
  stable: 'green',
};

export function convertToLabel(name: string) {
  if (name === 'N/A') {
    return styleText('grey', name);
  }
  return '✅';
}

export function colorName(name: string) {
  if (name.startsWith('@warp-drive-types/')) {
    return styleText('greenBright', '@warp-drive-types/') + styleText('magentaBright', name.substring(18));
  } else if (name.startsWith('@warp-drive-mirror/')) {
    return styleText('greenBright', '@warp-drive-mirror/') + styleText('magentaBright', name.substring(19));
  } else if (name.startsWith('@warp-drive/')) {
    return styleText('greenBright', '@warp-drive/') + styleText('magentaBright', name.substring(12));
  } else if (name.startsWith('@ember-data-types/')) {
    return styleText('cyanBright', '@ember-data-types/') + styleText('yellow', name.substring(18));
  } else if (name.startsWith('@ember-data-mirror/')) {
    return styleText('cyanBright', '@ember-data-mirror/') + styleText('yellow', name.substring(19));
  } else if (name.startsWith('@ember-data/')) {
    return styleText('cyanBright', '@ember-data/') + styleText('yellow', name.substring(12));
  } else if (name === 'N/A') {
    return styleText('grey', name);
  }
  return styleText('cyan', name);
}

function getPaddedString(str: string, targetWidth: number) {
  const width = targetWidth + (str.length - getCharLength(str));
  return str.padEnd(width);
}

const TABLE_SECTION = Object.freeze([]) as unknown as string[];

function printTable(title: string, rows: string[][]) {
  const widths = rows[0].map((_, i) => Math.max(...rows.map((row) => getCharLength(row[i]))));
  const totalWidth = widths.reduce((acc, width) => acc + width + 3, 1);
  const line = getPadding(totalWidth, '-');
  rows.forEach((row, index) => {
    if (row === TABLE_SECTION) {
      row = rows[index] = [];
      widths.forEach((width) => {
        row.push(getPadding(width, '-'));
      });
    }
  });
  const paddedRows = rows.map((row) => row.map((cell, i) => getPaddedString(cell, widths[i])));
  const rowLines = paddedRows.map((row) => `| ${row.join(' | ')} |`);
  rowLines.splice(1, 0, line);
  const finalRows =
    `\n\t${styleText('white', styleText('bold', title))}\n\t${line}\n\t` + rowLines.join('\n\t') + `\n\t${line}\n\n`;

  console.log(finalRows);
}

export async function printStrategy(config: Map<string, string | number | boolean | null>, applied: AppliedStrategy) {
  const tableRows = [
    [
      '    ',
      'Name',
      'Mirror',
      'Types',
      'From Version',
      'To Version',
      'Stage',
      'Types',
      'NPM Dist Tag',
      'Status',
      'Location',
    ],
  ];
  applied.public_pks.forEach((applied, name) => {
    tableRows.push([
      applied.new ? styleText('magentaBright', 'New!') : '',
      colorName(name),
      convertToLabel(applied.mirrorPublishTo),
      convertToLabel(applied.typesPublishTo),
      styleText('grey', applied.fromVersion),
      styleText(COLORS_BY_STRATEGY[applied.stage], applied.toVersion),
      styleText(COLORS_BY_STRATEGY[applied.stage], applied.stage),
      styleText(COLORS_BY_STRATEGY[applied.types], applied.types),
      styleText('magentaBright', applied.distTag),
      styleText('cyanBright', 'public'),
      styleText('grey', applied.pkgDir),
    ]);
  });
  const groups = new Map<string, string[][]>();
  applied.private_pkgs.forEach((applied, name) => {
    let group = groups.get(applied.pkgDir);
    if (!group) {
      group = [];
      groups.set(applied.pkgDir, group);
    }
    group.push([
      applied.new ? styleText('magentaBright', 'New!') : '',
      colorName(name),
      colorName(applied.mirrorPublishTo),
      colorName(applied.typesPublishTo),
      styleText('grey', applied.fromVersion),
      styleText(COLORS_BY_STRATEGY[applied.stage], applied.toVersion),
      styleText(COLORS_BY_STRATEGY[applied.stage], applied.stage),
      styleText(COLORS_BY_STRATEGY[applied.types], applied.types),
      styleText('grey', 'N/A'),
      styleText('yellow', 'private'),
      styleText('grey', applied.pkgDir),
    ]);
  });
  groups.forEach((group) => {
    tableRows.push(TABLE_SECTION);
    tableRows.push(...group);
  });

  printTable(
    styleText(
      'grey',
      `${styleText('white', 'Release Strategy')} for ${styleText('cyan', config.get('increment'))} bump in ${styleText(
        'cyan',
        config.get('channel')
      )} channel`
    ),
    tableRows
  );
}
