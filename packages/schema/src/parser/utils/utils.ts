import { styleText } from 'node:util';

export function write($text: string) {
  process.stdout.write(styleText('gray', $text));
}
