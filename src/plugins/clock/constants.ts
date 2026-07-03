export const CLOCK_PLUGIN_ID = 'clock';

export const CLOCK_STYLES = [
  { label: 'Auto (follows Typography)', value: 'auto' },
  { label: 'Thin', value: 'thin' },
  { label: 'Elegant Serif', value: 'serif' },
  { label: 'Rounded', value: 'rounded' },
  { label: 'Mono', value: 'mono' }
] as const;

export type ClockStyle = (typeof CLOCK_STYLES)[number]['value'];
