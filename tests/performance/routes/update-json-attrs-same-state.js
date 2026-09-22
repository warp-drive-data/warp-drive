import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class extends Route {
  @service store;

  async model() {
    performance.mark('start-data-generation');

    const initialPayload = await fetch('./fixtures/json-records.json').then((r) => r.json());
    const initialPayload2 = structuredClone(initialPayload);

    performance.mark('start-push-initial-payload');
    this.store.push(initialPayload);

    performance.mark('start-peek-records');
    const peekedRecords = this.store.peekAll('json-record');

    performance.mark('start-record-materialization');
    const records = peekedRecords.slice();
    for (const record of records) {
      // oxlint-disable-next-line no-unused-expressions
      record.name;
    }

    performance.mark('start-push-same-state-payload');
    this.store.push(initialPayload2);

    performance.mark('end-push-same-state-payload');
  }
}
