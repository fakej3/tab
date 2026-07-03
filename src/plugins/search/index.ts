import type { Plugin, PluginContext } from '@core/plugins/Plugin';
import './styles.css';
import { SearchController } from './controller';
import { SEARCH_PLUGIN_ID } from './constants';
import { SEARCH_SETTINGS } from './settings';

export function createSearchPlugin(): Plugin {
  let controller: SearchController | null = null;

  return {
    id: SEARCH_PLUGIN_ID,
    name: 'Search',
    version: '1.0.0',
    description: 'A single search bar with multiple providers and command shortcuts.',
    widget: {
      defaultSize: { w: 6, h: 2 },
      minSize: { w: 4, h: 2 },
      maxSize: { w: 12, h: 2 }
    },

    init(context: PluginContext) {
      context.settings.registerSection(SEARCH_SETTINGS);
      controller = new SearchController(context);
    },

    mount(container: HTMLElement) {
      controller?.mount(container);
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
