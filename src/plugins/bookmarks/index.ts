import type { Plugin, PluginContext } from '@core/plugins/Plugin';
import './styles.css';
import { BookmarksController } from './controller';
import { BOOKMARKS_PLUGIN_ID } from './constants';
import { BOOKMARKS_SETTINGS } from './settings';

export function createBookmarksPlugin(): Plugin {
  let controller: BookmarksController | null = null;

  return {
    id: BOOKMARKS_PLUGIN_ID,
    name: 'Bookmarks',
    version: '1.0.0',
    description: 'Quick access to your bookmarks bar.',
    widget: {
      defaultSize: { w: 3, h: 5 },
      minSize: { w: 2, h: 3 },
      maxSize: { w: 5, h: 10 }
    },

    init(context: PluginContext) {
      context.settings.registerSection(BOOKMARKS_SETTINGS);
      controller = new BookmarksController(context);
    },

    mount(container: HTMLElement) {
      void controller?.mount(container);
    },

    unmount() {
      controller?.unmount();
    },

    destroy() {
      controller?.unmount();
      controller = null;
    }
  };
}
