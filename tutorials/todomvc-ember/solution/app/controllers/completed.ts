import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class CompletedController extends Controller {
  queryParams = ['page'];

  @tracked page = 1;
}
