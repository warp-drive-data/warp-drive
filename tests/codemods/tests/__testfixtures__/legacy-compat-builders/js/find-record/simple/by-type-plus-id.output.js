import { findRecord } from '@warp-drive/legacy/compat/builders';
const { content: post } = await store.request(findRecord('post', '1'));
