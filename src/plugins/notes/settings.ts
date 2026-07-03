import type { SettingsSection } from '@core/settings/SettingsSchema';

export const NOTES_SETTINGS: Omit<SettingsSection, 'namespace'> = {
  title: 'Notes',
  description: 'A quick scratchpad, saved automatically.',
  order: 140,
  fields: [
    { key: 'fontStyle', type: 'select', label: 'Font', default: 'sans', options: [
      { label: 'Sans', value: 'sans' },
      { label: 'Mono', value: 'mono' }
    ] }
  ]
};
