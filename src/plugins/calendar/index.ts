import type { Plugin, PluginContext } from '@core/plugins/Plugin';
import './styles.css';
import { CalendarController } from './controller';
import { CALENDAR_PLUGIN_ID } from './constants';
import { CALENDAR_SETTINGS } from './settings';

export function createCalendarPlugin(): Plugin {
  let controller: CalendarController | null = null;

  return {
    id: CALENDAR_PLUGIN_ID,
    name: 'Calendar',
    version: '1.0.0',
    description: 'A minimal, view-only month calendar.',
    widget: {
      defaultSize: { w: 4, h: 4 },
      minSize: { w: 3, h: 3 },
      maxSize: { w: 6, h: 6 },
      defaultHidden: true
    },

    init(context: PluginContext) {
      context.settings.registerSection(CALENDAR_SETTINGS);
      controller = new CalendarController(context);
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
