import type { Plugin, PluginContext } from '@core/plugins/Plugin';
import './styles.css';
import { AI_PLUGIN_ID } from './constants';
import { AI_SETTINGS } from './settings';
import { createAiPlaceholder } from './view';

/**
 * Intentionally unimplemented against a live model provider — see
 * README.md. Settings (API key storage) are real and already namespaced
 * per-plugin so wiring up a provider later doesn't touch the rest of the app.
 */
export function createAiPlugin(): Plugin {
  let context: PluginContext | null = null;
  let element: HTMLElement | null = null;

  return {
    id: AI_PLUGIN_ID,
    name: 'AI',
    version: '0.1.0',
    description: 'AI assistant widget — awaiting a model provider integration.',
    widget: {
      defaultSize: { w: 4, h: 3 },
      minSize: { w: 3, h: 2 },
      maxSize: { w: 8, h: 6 }
    },

    init(pluginContext: PluginContext) {
      pluginContext.settings.registerSection(AI_SETTINGS);
      context = pluginContext;
    },

    mount(container: HTMLElement) {
      const hasKey = Boolean(context?.settings.get<string>('apiKey'));
      element = createAiPlaceholder(hasKey);
      container.append(element);
    },

    unmount() {
      element?.remove();
      element = null;
    },

    destroy() {
      element?.remove();
      element = null;
      context = null;
    }
  };
}
