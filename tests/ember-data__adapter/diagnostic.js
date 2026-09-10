import { launch } from '@warp-drive/diagnostic/server';

await launch({
  entry: './dist-test/index.html',
});
