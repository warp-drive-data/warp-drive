import { field, Trait } from '@warp-drive/schema-dsl';

@Trait
export class Timestamped {
  @field declare createdAt: string;
  @field declare updatedAt: string;
}
