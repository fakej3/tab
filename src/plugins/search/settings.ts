import type { SettingsSection } from '@core/settings/SettingsSchema';
import { SEARCH_PROVIDERS } from './providers';

export const SEARCH_SETTINGS: Omit<SettingsSection, 'namespace'> = {
  title: 'Search',
  description: 'One search bar, every engine.',
  order: 110,
  fields: [
    {
      key: 'defaultProvider',
      type: 'select',
      label: 'Default provider',
      default: 'google',
      options: SEARCH_PROVIDERS.map((provider) => ({ label: provider.name, value: provider.id }))
    },
    {
      key: 'openInNewTab',
      type: 'boolean',
      label: 'Open results in a new tab',
      default: false
    },
    {
      key: 'placeholder',
      type: 'string',
      label: 'Placeholder text',
      default: 'Search, or type a command…',
      placeholder: 'Search, or type a command…'
    },
    {
      key: 'customUrlTemplate',
      type: 'string',
      label: 'Custom provider URL (use %s for query)',
      default: '',
      placeholder: 'https://example.com/search?q=%s'
    }
  ]
};
