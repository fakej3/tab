import type { Plugin, PluginContext } from '@core/plugins/Plugin';
import './styles.css';
import { NotesController } from './controller';
import { NOTES_PLUGIN_ID } from './constants';
import { NOTES_SETTINGS } from './settings';

export function createNotesPlugin(): Plugin {
  let controller: NotesController | null = null;

  return {
    id: NOTES_PLUGIN_ID,
    name: 'Notes',
    version: '1.0.0',
    description: 'A quick scratchpad that autosaves.',
    widget: {
      defaultSize: { w: 4, h: 4 },
      minSize: { w: 2, h: 2 },
      maxSize: { w: 8, h: 10 },
      // The home screen defaults to just clock/search/quote so it reads as
      // calm and intentional rather than a wall of widgets — every other
      // widget is a click away in edit mode, never removed.
      defaultHidden: true
    },

    init(context: PluginContext) {
      context.settings.registerSection(NOTES_SETTINGS);
      controller = new NotesController(context);
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
