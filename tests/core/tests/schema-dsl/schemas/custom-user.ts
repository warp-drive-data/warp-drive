import { Resource, field } from '@warp-drive/schema-dsl';

@Resource('person')
class CustomUser {
  @field declare name: string;
}
