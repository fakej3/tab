import type { SettingsSection } from '@core/settings/SettingsSchema';
import { VISUALIZER_TYPES } from './constants';

export const MUSIC_SETTINGS: Omit<SettingsSection, 'namespace'> = {
  title: 'Music',
  description: 'A minimal player with a fully configurable visualizer.',
  order: 130,
  fields: [
    { key: 'volume', type: 'range', label: 'Volume', default: 0.7, min: 0, max: 1, step: 0.01 },
    { key: 'showVisualizer', type: 'boolean', label: 'Show visualizer', default: true },
    {
      key: 'visualizerType',
      type: 'select',
      label: 'Visualizer type',
      default: 'bars',
      options: VISUALIZER_TYPES.map((type) => ({ label: type.label, value: type.value })),
      visibleWhen: (values) => values.showVisualizer === true
    },
    {
      key: 'visualizerThickness',
      type: 'range',
      label: 'Thickness',
      default: 3,
      min: 1,
      max: 10,
      step: 1,
      visibleWhen: (values) => values.showVisualizer === true
    },
    {
      key: 'visualizerSpeed',
      type: 'range',
      label: 'Speed',
      default: 1,
      min: 0.3,
      max: 2.5,
      step: 0.1,
      visibleWhen: (values) => values.showVisualizer === true
    },
    {
      key: 'visualizerSensitivity',
      type: 'range',
      label: 'Sensitivity',
      default: 1,
      min: 0.3,
      max: 3,
      step: 0.1,
      visibleWhen: (values) => values.showVisualizer === true
    },
    {
      key: 'visualizerOpacity',
      type: 'range',
      label: 'Opacity',
      default: 0.8,
      min: 0.1,
      max: 1,
      step: 0.05,
      visibleWhen: (values) => values.showVisualizer === true
    },
    {
      key: 'visualizerUseAccentColor',
      type: 'boolean',
      label: 'Use accent color',
      default: true,
      visibleWhen: (values) => values.showVisualizer === true
    },
    {
      key: 'visualizerColor',
      type: 'color',
      label: 'Visualizer color',
      default: '#8b7cf6',
      visibleWhen: (values) => values.showVisualizer === true && values.visualizerUseAccentColor === false
    },
    {
      key: 'visualizerGlow',
      type: 'boolean',
      label: 'Glow',
      default: true,
      visibleWhen: (values) => values.showVisualizer === true
    }
  ]
};
