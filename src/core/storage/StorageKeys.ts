/** Top-level storage keys. Plugin data lives under `plugin:<id>:*` via `StorageService.namespaced`. */
export const StorageKeys = {
  settings: 'settings',
  theme: 'theme',
  layouts: 'layouts',
  activeWorkspace: 'activeWorkspace',
  wallpaperLibrary: 'wallpaperLibrary'
} as const;
