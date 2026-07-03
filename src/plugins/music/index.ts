import type { Plugin, PluginContext } from '@core/plugins/Plugin';
import './styles.css';
import { MusicController } from './controller';
import { MUSIC_PLUGIN_ID } from './constants';
import { MUSIC_SETTINGS } from './settings';

export function createMusicPlugin(): Plugin {
  let controller: MusicController | null = null;

  return {
    id: MUSIC_PLUGIN_ID,
    name: 'Music',
    version: '1.0.0',
    description: 'A minimal local audio player with a configurable visualizer and Media Session integration.',
    widget: {
      defaultSize: { w: 5, h: 4 },
      minSize: { w: 3, h: 3 },
      maxSize: { w: 10, h: 8 }
    },

    init(context: PluginContext) {
      context.settings.registerSection(MUSIC_SETTINGS);
      controller = new MusicController(context);
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
