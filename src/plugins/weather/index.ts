import type { Plugin, PluginContext } from '@core/plugins/Plugin';
import { WEATHER_PLUGIN_ID } from './constants';
import { WEATHER_SETTINGS } from './settings';
import { createWeatherPlaceholder } from './view';

/**
 * Intentionally unimplemented against a live API — see README.md. The
 * plugin still registers real settings and a real widget slot so wiring up
 * a provider later is additive (fill in `mount`, nothing else changes).
 */
export function createWeatherPlugin(): Plugin {
  let element: HTMLElement | null = null;

  return {
    id: WEATHER_PLUGIN_ID,
    name: 'Weather',
    version: '0.1.0',
    description: 'Weather widget — awaiting a live data provider.',
    widget: {
      defaultSize: { w: 3, h: 3 },
      minSize: { w: 2, h: 2 },
      maxSize: { w: 5, h: 5 },
      // No live provider is wired up (see README) — showing an apology
      // card by default would undercut the first impression. Reveal it
      // from the layout editor once a provider is connected.
      defaultHidden: true
    },

    init(context: PluginContext) {
      context.settings.registerSection(WEATHER_SETTINGS);
    },

    mount(container: HTMLElement) {
      element = createWeatherPlaceholder();
      container.append(element);
    },

    unmount() {
      element?.remove();
      element = null;
    },

    destroy() {
      element?.remove();
      element = null;
    }
  };
}
