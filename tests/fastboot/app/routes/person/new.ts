import Route from '@ember/routing/route';
import * as s from '@ember/service';

import type Person from '../../models/person';
import type Store from '../../services/store';

const service = s.service ?? s.inject;

export default class PersonNewRoute extends Route {
  @service declare store: Store;

  model() {
    return this.store.createRecord<Person>('person', {});
  }
}
