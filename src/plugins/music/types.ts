/**
 * The unified media model every part of the Media Hub speaks — the widget,
 * the visualizer, and MediaEngine all read/write this shape and nothing
 * provider-specific ever leaks past it. A new provider only needs to
 * produce a MediaState; it never touches the UI.
 */

export type PlaybackStatus =
  | 'no-provider' // nothing registered/active at all
  | 'unsupported' // this provider can't run in this browser/context
  | 'idle' // provider is active but nothing has ever played
  | 'connecting' // provider is establishing a connection (future remote providers)
  | 'loading' // a track is being prepared (decoding, buffering)
  | 'playing'
  | 'paused'
  | 'error';

export type RepeatMode = 'off' | 'all' | 'one';

export interface MediaTrackInfo {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  /** Seconds; 0 when unknown. */
  duration: number;
}

/** What a given provider can actually do — the widget uses this to decide which transport controls to show/enable rather than hardcoding assumptions about any one source. */
export interface MediaCapabilities {
  play: boolean;
  pause: boolean;
  next: boolean;
  previous: boolean;
  seek: boolean;
  volume: boolean;
  shuffle: boolean;
  repeat: boolean;
  /** Can expose real frequency data for the visualizer (only a provider with an actual Web Audio graph can — a remote provider reflecting another tab's playback never will). */
  visualize: boolean;
}

export const EMPTY_CAPABILITIES: MediaCapabilities = {
  play: false,
  pause: false,
  next: false,
  previous: false,
  seek: false,
  volume: false,
  shuffle: false,
  repeat: false,
  visualize: false
};

export interface MediaState {
  status: PlaybackStatus;
  track: MediaTrackInfo | null;
  /** Seconds. */
  position: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  providerId: string;
  providerName: string;
  capabilities: MediaCapabilities;
  errorMessage?: string;
}

export function createEmptyState(providerId: string, providerName: string, status: PlaybackStatus = 'idle'): MediaState {
  return {
    status,
    track: null,
    position: 0,
    volume: 1,
    shuffle: false,
    repeat: 'off',
    providerId,
    providerName,
    capabilities: EMPTY_CAPABILITIES
  };
}

/**
 * One media source. `BrowserMediaSessionProvider` is the only one that can
 * actually produce audio today; the rest are structural placeholders that
 * prove new sources are cheap to add (see providers/PlaceholderProvider.ts)
 * without the UI needing to know they exist.
 */
export interface MediaProvider {
  readonly id: string;
  readonly name: string;
  /** Whether this provider can ever do anything in this environment — false means the engine won't activate it. */
  isSupported(): boolean;
  init(onChange: (state: MediaState) => void): void;
  dispose(): void;
  getState(): MediaState;
  play(): void;
  pause(): void;
  next(): void;
  previous(): void;
  /** Ratio 0-1 of the current track's duration. */
  seek(ratio: number): void;
  setVolume(volume: number): void;
  setShuffle(on: boolean): void;
  setRepeat(mode: RepeatMode): void;
  /** Only meaningful when capabilities.visualize is true. */
  getAnalyser?(): AnalyserNode | null;
  /** Provider-specific escape hatch for local file playback — absent on every provider except the local one; the widget only calls it when the active provider reports it. */
  loadFiles?(files: FileList): void;
}
