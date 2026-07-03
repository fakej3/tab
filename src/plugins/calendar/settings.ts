import type { SettingsSection } from '@core/settings/SettingsSchema';

export const CALENDAR_SETTINGS: Omit<SettingsSection, 'namespace'> = {
  title: 'Calendar',
  description: 'A minimal month view.',
  order: 150,
  fields: [
    { key: 'startOnMonday', type: 'boolean', label: 'Week starts on Monday', default: true }
  ]
};
