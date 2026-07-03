import type { PluginContext } from '@core/plugins/Plugin';
import { createBookmarksView, type BookmarkEntry, type BookmarksView } from './view';

export class BookmarksController {
  private view: BookmarksView | null = null;
  private unsubscribeSettings: (() => void) | null = null;

  constructor(private context: PluginContext) {}

  async mount(container: HTMLElement): Promise<void> {
    this.view = createBookmarksView();
    container.append(this.view.root);
    await this.load();
    this.unsubscribeSettings = this.context.settings.subscribe(() => this.load());
  }

  unmount(): void {
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
    this.view?.root.remove();
    this.view = null;
  }

  private async load(): Promise<void> {
    if (!this.view) return;
    if (typeof chrome === 'undefined' || !chrome.bookmarks) {
      this.view.showMessage('Bookmarks are available once installed as an extension.');
      return;
    }

    const tree = await chrome.bookmarks.getTree();
    const bar = findBookmarksBar(tree);
    const entries: BookmarkEntry[] = (bar?.children ?? []).map((node) => ({ id: node.id, title: node.title, url: node.url }));
    this.view.render(entries, this.context.settings.get<boolean>('showFavicons'), (url) => this.open(url));
  }

  private open(url: string): void {
    const openInNewTab = this.context.settings.get<boolean>('openInNewTab');
    if (openInNewTab) window.open(url, '_blank', 'noopener');
    else window.location.href = url;
  }
}

function findBookmarksBar(nodes: chrome.bookmarks.BookmarkTreeNode[]): chrome.bookmarks.BookmarkTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === '1') return node;
    if (node.children) {
      const found = findBookmarksBar(node.children);
      if (found) return found;
    }
  }
  return undefined;
}
