import { queryRecord } from '@warp-drive/legacy/compat/builders';
const { content: post } = await store.request(
  queryRecord<Post>(
    'post',
    { id: '1' },
    {
      reload: true,
      backgroundReload: false,
      include: 'author,comments',
      adapterOptions: {},
    }
  )
);
