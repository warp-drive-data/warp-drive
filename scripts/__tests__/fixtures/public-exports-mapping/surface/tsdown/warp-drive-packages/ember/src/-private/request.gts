import Component from '@glimmer/component';

export interface RequestArgs {
  url: string;
}

/**
 * Renders a request, for example:
 *
 * <template><Request @url="/users" /></template>
 */
export class Request extends Component<{ Args: RequestArgs }> {
  get label(): string {
    return `request to ${this.args.url}`;
  }

  <template>{{this.label}}</template>
}
