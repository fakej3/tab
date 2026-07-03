import type { PluginManager } from '@core/plugins/PluginManager';
import { createClockPlugin } from '@plugins/clock';
import { createSearchPlugin } from '@plugins/search';
import { createQuotesPlugin } from '@plugins/quotes';
import { createMusicPlugin } from '@plugins/music';
import { createNotesPlugin } from '@plugins/notes';
import { createCalendarPlugin } from '@plugins/calendar';
import { createBookmarksPlugin } from '@plugins/bookmarks';
import { createWeatherPlugin } from '@plugins/weather';
import { createAiPlugin } from '@plugins/ai';

/**
 * The single place that knows every plugin the app ships with. Disabling a
 * plugin entirely is deleting one line here (plus its folder); nothing else
 * in the app references plugins by name.
 */
export async function registerBuiltinPlugins(plugins: PluginManager): Promise<void> {
  const factories = [
    createSearchPlugin,
    createClockPlugin,
    createQuotesPlugin,
    createMusicPlugin,
    createNotesPlugin,
    createCalendarPlugin,
    createBookmarksPlugin,
    createWeatherPlugin,
    createAiPlugin
  ];

  for (const factory of factories) {
    await plugins.register(factory());
  }
}
