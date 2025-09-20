import { findRecord } from '@warp-drive/legacy/compat/builders';
const { content: validPost } = await store.request(findRecord({ type: 'post', id: '1' }));
const invalidPost = await store.findRecord(
  { type: 'post', id: '1' },
  {
    preload: {},
  }
);
