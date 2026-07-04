import { h } from '@core/dom/h';
import { icons } from '@core/dom/icons';

export interface BookmarkEntry {
  id: string;
  title: string;
  url?: string;
}

export interface BookmarksView {
  root: HTMLElement;
  render(entries: BookmarkEntry[], showFavicons: boolean, onOpen: (url: string) => void): void;
  showMessage(message: string): void;
}

export function createBookmarksView(): BookmarksView {
  const list = h('div', { class: 'ws-bookmarks__list' });
  const root = h('div', { class: 'ws-bookmarks' }, [list]);

  function render(entries: BookmarkEntry[], showFavicons: boolean, onOpen: (url: string) => void): void {
    list.replaceChildren();
    for (const entry of entries) {
      if (!entry.url) continue;
      const icon = faviconUrl(entry.url);
      const favicon = showFavicons && icon ? h('img', { class: 'ws-bookmarks__favicon', src: icon, alt: '' }) : null;
      const item = h(
        'button',
        {
          class: 'ws-bookmarks__item ws-motion-shimmer',
          type: 'button',
          title: entry.title,
          onclick: () => onOpen(entry.url!)
        },
        [favicon, h('span', { class: 'ws-bookmarks__label' }, [entry.title])]
      );
      list.append(item);
    }
    if (entries.filter((entry) => entry.url).length === 0) showMessage('No bookmarks in your bar yet.');
  }

  function showMessage(message: string): void {
    list.replaceChildren(
      h('div', { class: 'ws-empty-state' }, [
        h('div', { class: 'ws-empty-state__icon' }, [icons.bookmark()]),
        h('p', { class: 'ws-empty-state__title' }, [message])
      ])
    );
  }

  return { root, render, showMessage };
}

function faviconUrl(pageUrl: string): string {
  if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return '';
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', '32');
  return url.toString();
}
