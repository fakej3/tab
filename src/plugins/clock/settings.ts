import type { SettingsSection } from '@core/settings/SettingsSchema';
import { CLOCK_STYLES } from './constants';

export const CLOCK_SETTINGS: Omit<SettingsSection, 'namespace'> = {
  title: 'Clock',
  description: 'Time, your way.',
  order: 100,
  fields: [
    { key: 'use24Hour', type: 'boolean', label: '24-hour time', default: false },
    { key: 'showSeconds', type: 'boolean', label: 'Show seconds', default: false },
    { key: 'showDate', type: 'boolean', label: 'Show date', default: true },
    {
      key: 'style',
      type: 'select',
      label: 'Style',
      default: 'thin',
      options: CLOCK_STYLES.map((style) => ({ label: style.label, value: style.value }))
    },
    { key: 'sizeScale', type: 'range', label: 'Size', default: 1, min: 0.6, max: 1.8, step: 0.05 },
    { key: 'uppercaseDate', type: 'boolean', label: 'Uppercase date', default: true }
  ]
};
