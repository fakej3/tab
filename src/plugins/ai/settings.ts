import type { SettingsSection } from '@core/settings/SettingsSchema';

export const AI_SETTINGS: Omit<SettingsSection, 'namespace'> = {
  title: 'AI',
  description: 'Not connected to a provider yet — see the plugin README.',
  order: 180,
  fields: [
    {
      key: 'apiKey',
      type: 'string',
      label: 'API key',
      description: 'Stored only in this browser via chrome.storage.local. Never sent anywhere but your chosen provider.',
      default: '',
      placeholder: 'sk-…'
    }
  ]
};
