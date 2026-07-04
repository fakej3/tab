import type { Plugin, PluginContext } from '@core/plugins/Plugin';
import './styles.css';
import { ClockController } from './controller';
import { CLOCK_PLUGIN_ID } from './constants';
import { CLOCK_SETTINGS } from './settings';

export function createClockPlugin(): Plugin {
  let controller: ClockController | null = null;

  return {
    id: CLOCK_PLUGIN_ID,
    name: 'Clock',
    version: '1.0.0',
    description: 'An elegant, highly customizable clock.',
    widget: {
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 2, h: 2 },
      maxSize: { w: 8, h: 8 },
      // Centered, upper-third hero position — the clock is the first thing
      // a new tab should read as, not one tile among several.
      defaultPosition: { x: 3, y: 1 },
      // Pure typography sitting on the wallpaper, not a glass card — the
      // clock is artwork, not a widget.
      surface: 'none'
    },

    init(context: PluginContext) {
      context.settings.registerSection(CLOCK_SETTINGS);
      controller = new ClockController(context);
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
