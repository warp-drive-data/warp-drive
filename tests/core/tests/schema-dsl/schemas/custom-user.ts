import { field, Resource } from '@warp-drive/schema-dsl';

@Resource('person')
export class CustomUser {
  @field declare name: string;
}
