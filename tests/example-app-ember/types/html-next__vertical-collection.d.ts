declare module '@html-next/vertical-collection' {
  import Component from '@glimmer/component';

  export default class VerticalCollection<T = unknown> extends Component<{
    Element: HTMLElement;
    Args: {
      items?: T[];
      estimateHeight?: number;
      bufferSize?: number;
      containerSelector?: string;
      staticHeight?: boolean;
      key?: string;
      tagName?: string;
      firstReached?: () => void;
      lastReached?: () => void;
      firstVisibleChanged?: (item: T, index: number) => void;
      lastVisibleChanged?: (item: T, index: number) => void;
    };
    Blocks: {
      default: [item: T, index: number];
    };
  }> {}
}
