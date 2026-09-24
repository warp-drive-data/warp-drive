import { NPM_DIST_TAG } from '../../utils/channel.ts';
import { getPublishedChannelInfo } from '../../utils/git.ts';

export async function latestFor(args: string[]) {
  const channel = args[0] as NPM_DIST_TAG;
  const version = (await getPublishedChannelInfo({ silent: true }))[channel];
  console.log(version);
}
