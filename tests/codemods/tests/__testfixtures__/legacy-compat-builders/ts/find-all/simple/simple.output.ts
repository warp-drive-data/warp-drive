import { findAll } from '@warp-drive/legacy/compat/builders';
const { content: post } = await store.request(findAll<Post>('post'));
