import { findAll } from '@warp-drive/legacy/compat/builders';
const { content: post } = await db.request(findAll('post'));
