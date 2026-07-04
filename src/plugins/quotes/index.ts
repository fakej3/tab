import type { Plugin, PluginContext } from '@core/plugins/Plugin';
import './styles.css';
import { QuotesController } from './controller';
import { QUOTES_PLUGIN_ID } from './constants';
import { QUOTES_SETTINGS } from './settings';

export function createQuotesPlugin(): Plugin {
  let controller: QuotesController | null = null;

  return {
    id: QUOTES_PLUGIN_ID,
    name: 'Quotes',
    version: '1.0.0',
    description: 'Local, favorite, and custom quotes.',
    widget: {
      defaultSize: { w: 4, h: 2 },
      minSize: { w: 3, h: 2 },
      maxSize: { w: 10, h: 6 },
      // A tiny, quiet line beneath search — never a competing block.
      defaultPosition: { x: 4, y: 9 },
      surface: 'none'
    },

    init(context: PluginContext) {
      context.settings.registerSection(QUOTES_SETTINGS);
      controller = new QuotesController(context);
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
