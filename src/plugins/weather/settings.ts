import type { SettingsSection } from '@core/settings/SettingsSchema';

export const WEATHER_SETTINGS: Omit<SettingsSection, 'namespace'> = {
  title: 'Weather',
  description: 'Not wired to a live provider yet — see the plugin README.',
  order: 170,
  fields: [
    { key: 'city', type: 'string', label: 'City', default: '', placeholder: 'San Francisco' },
    { key: 'units', type: 'select', label: 'Units', default: 'metric', options: [
      { label: 'Celsius', value: 'metric' },
      { label: 'Fahrenheit', value: 'imperial' }
    ] }
  ]
};
