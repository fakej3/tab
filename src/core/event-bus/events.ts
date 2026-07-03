/**
 * Central registry of event names/payloads flowing through the EventBus.
 * Plugins should add their own events here (or via declaration merging in
 * their own module) rather than inventing untyped string events.
 */
export interface WorkspaceEvents {
  'app:ready': void;
  'app:error': { source: string; error: unknown };

  'settings:changed': { key: string; value: unknown };
  'settings:reset': void;

  'theme:changed': { themeId: string };
  'theme:tokens-updated': void;

  'wallpaper:changed': { wallpaperId: string };

  'layout:changed': { workspaceId: string };
  'layout:edit-mode': { enabled: boolean };

  'plugin:registered': { id: string };
  'plugin:mounted': { id: string };
  'plugin:destroyed': { id: string };

  'command-palette:open': void;
  'command-palette:close': void;

  'settings-panel:open': { section?: string };
  'settings-panel:close': void;

  'search:submit': { query: string; providerId: string };

  'music:track-changed': { title: string; artist?: string; artworkUrl?: string };
  'music:playback-changed': { playing: boolean };
}

export type WorkspaceEventKey = keyof WorkspaceEvents;
