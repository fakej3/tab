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
  { label: 'Wave', value: 'wave' },
  { label: 'Circular', value: 'circular' }
] as const;

export type VisualizerType = (typeof VISUALIZER_TYPES)[number]['value'];
