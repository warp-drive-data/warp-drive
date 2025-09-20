import { saveRecord } from '@warp-drive/legacy/compat/builders';
const post = store.createRecord<Post>('post', { name: 'Krystan rules, you drool' });
const { content: savedPostWithGeneric } = await store.request(saveRecord(post, { adapterOptions: {} }));
const { content: savedPostNoGeneric } = await store.request(saveRecord(post, { adapterOptions: {} }));
