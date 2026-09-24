import { findAll } from '@warp-drive/legacy/compat/builders';
const { content: post } = await this.store.request(findAll('post'));
