import { info } from '@actions/core';
import fs from 'fs-extra';
import path from 'path';
import { cacheDir } from './constants';

export function printServerLogs() {
  info('Server logs:');
  info(
    fs.readFileSync(path.join(cacheDir, 'out.log'), {
      encoding: 'utf8',
      flag: 'r',
    })
  );
}
