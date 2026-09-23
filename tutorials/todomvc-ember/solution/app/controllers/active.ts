import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class ActiveController extends Controller {
  queryParams = ['page'];

  @tracked page = 1;
}
