import { createEmptyState, EMPTY_CAPABILITIES, type MediaProvider, type MediaState } from '../types';

/**
 * Proves the provider architecture without pretending to be real. Each of
 * these represents a source that would need actual integration work
 * (Spotify/Apple Music: OAuth + a playback SDK; YouTube Music/SoundCloud:
 * no public now-playing API at all) — wiring one up for real is a
 * self-contained follow-up, not a rewrite of the Media Hub, because the
 * engine already treats every provider identically.
 *
 * `isSupported()` returning false is what keeps MediaEngine from ever
 * activating one of these automatically; they only exist so
 * `engine.getProviders()` can list them as "not connected yet" sources
 * instead of the UI hardcoding a single source's name.
 */
export function createPlaceholderProvider(id: string, name: string): MediaProvider {
  const state: MediaState = createEmptyState(id, name, 'unsupported');
  state.capabilities = EMPTY_CAPABILITIES;

  return {
    id,
    name,
    isSupported: () => false,
    init: () => {},
    dispose: () => {},
    getState: () => state,
    play: () => {},
    pause: () => {},
    next: () => {},
    previous: () => {},
    seek: () => {},
    setVolume: () => {},
    setShuffle: () => {},
    setRepeat: () => {}
  };
}

export const PLACEHOLDER_PROVIDERS = [
  { id: 'spotify', name: 'Spotify' },
  { id: 'youtube-music', name: 'YouTube Music' },
  { id: 'apple-music', name: 'Apple Music' },
  { id: 'soundcloud', name: 'SoundCloud' }
] as const;
