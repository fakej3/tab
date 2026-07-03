import type { SettingsSection } from '@core/settings/SettingsSchema';

export const QUOTES_SETTINGS: Omit<SettingsSection, 'namespace'> = {
  title: 'Quotes',
  description: 'A little perspective on every tab.',
  order: 120,
  fields: [
    { key: 'source', type: 'select', label: 'Source', default: 'all', options: [
      { label: 'All quotes', value: 'all' },
      { label: 'Favorites only', value: 'favorites' },
      { label: 'My quotes only', value: 'custom' }
    ] },
    { key: 'rotateEveryNewTab', type: 'boolean', label: 'New quote every tab', default: true },
    {
      key: 'rotateIntervalMinutes',
      type: 'range',
      label: 'Rotate every',
      default: 30,
      min: 5,
      max: 180,
      step: 5,
      unit: 'min',
      visibleWhen: (values) => values.rotateEveryNewTab === false
    },
    { key: 'showAuthor', type: 'boolean', label: 'Show author', default: true }
  ]
};
