import { findAll } from '@warp-drive/legacy/compat/builders';
async function foo() {
  await store.request(findAll<Post>('post'));
  return (await store.request(findAll<Post>('post'))).content;
}
