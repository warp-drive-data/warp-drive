import { findAll } from '@ember/test-helpers';
import { findAll as legacyFindAll } from '@warp-drive/legacy/compat/builders';
const { content: post } = await store.request(legacyFindAll('post'));
