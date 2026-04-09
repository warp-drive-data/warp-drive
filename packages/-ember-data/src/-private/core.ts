import Namespace from '@ember/application/namespace';

import VERSION from '../version';

export interface DS extends Namespace {
  VERSION: string;
  name: string;
}

type CreateArgs = { VERSION: string; name: string };

export const DS: DS = (Namespace as unknown as { create(args: CreateArgs): DS }).create({
  VERSION: VERSION,
  name: 'DS',
});

export default DS;
