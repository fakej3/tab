import type { SettingsSection } from '@core/settings/SettingsSchema';

export const BOOKMARKS_SETTINGS: Omit<SettingsSection, 'namespace'> = {
  title: 'Bookmarks',
  description: 'Quick links from your bookmarks bar.',
  order: 160,
  fields: [
    { key: 'showFavicons', type: 'boolean', label: 'Show favicons', default: true },
    { key: 'openInNewTab', type: 'boolean', label: 'Open in a new tab', default: false }
  ]
};
