import { query } from '@warp-drive/legacy/compat/builders';
const { content: post } = await store.request(query<Post>('post', { id: '1' }));
