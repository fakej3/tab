import type { Plugin, PluginContext } from '@core/plugins/Plugin';
import './styles.css';
import { MusicController } from './controller';
import { MUSIC_PLUGIN_ID } from './constants';
import { MUSIC_SETTINGS } from './settings';

export function createMusicPlugin(): Plugin {
  let controller: MusicController | null = null;

  return {
    id: MUSIC_PLUGIN_ID,
    name: 'Media Hub',
    version: '2.0.0',
    description: 'A provider-based media player — local files today, pluggable sources tomorrow — with a configurable visualizer and OS Media Session integration.',
    widget: {
      defaultSize: { w: 5, h: 4 },
      minSize: { w: 3, h: 3 },
      maxSize: { w: 10, h: 8 },
      defaultHidden: true
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
