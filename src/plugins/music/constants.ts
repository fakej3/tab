export const MUSIC_PLUGIN_ID = 'music';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  objectUrl: string;
}

export const VISUALIZER_TYPES = [
  { label: 'Bars', value: 'bars' },
  { label: 'Spectrum', value: 'spectrum' },
  { label: 'Wave', value: 'wave' },
  { label: 'Minimal Line', value: 'line' },
  { label: 'Dots', value: 'dots' },
  { label: 'Circular', value: 'circular' },
  { label: 'Breathing', value: 'breathing' },
  { label: 'Aura', value: 'aura' }
] as const;

export type VisualizerType = (typeof VISUALIZER_TYPES)[number]['value'];

export const MEDIA_LAYOUTS = [
  { label: 'Compact', value: 'compact' },
  { label: 'Expanded', value: 'expanded' }
] as const;

export type MediaLayout = (typeof MEDIA_LAYOUTS)[number]['value'];
