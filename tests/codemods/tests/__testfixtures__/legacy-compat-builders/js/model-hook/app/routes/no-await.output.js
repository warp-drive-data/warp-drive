import { findAll } from '@warp-drive/legacy/compat/builders';
class Route {
  async model() {
    return (await this.store.request(findAll('post'))).content;
  }
}
