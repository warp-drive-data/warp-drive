import { findRecord } from '@warp-drive/legacy/compat/builders';
await store.request(findRecord('user', '1'));
await store.findAll('user');
