import type { Track } from '../constants';
import type { MediaCapabilities, MediaProvider, MediaState, MediaTrackInfo, PlaybackStatus, RepeatMode } from '../types';

const CAPABILITIES: MediaCapabilities = {
  play: true,
  pause: true,
  next: true,
  previous: true,
  seek: true,
  volume: true,
  shuffle: true,
  repeat: true,
  visualize: true
};

/**
 * The one real, working provider. It plays local audio files picked from
 * disk and — this is the actual, correct use of the Media Session API —
 * publishes that playback to `navigator.mediaSession` so the OS/hardware
 * media keys, the lock screen, and the browser's own media overlay all
 * control it.
 *
 * What this is NOT: a way to read Spotify/YouTube/Apple Music's *own*
 * now-playing state from another tab. The web platform has no such API —
 * `navigator.mediaSession` lets a page describe *its own* media to the OS,
 * it is not a cross-tab or cross-origin read channel. A New Tab page
 * cannot observe another tab's Media Session. That's why every other
 * source in this folder is a placeholder (see PlaceholderProvider.ts) — an
 * honest one, not a stub pretending to be real.
 */
export class BrowserMediaSessionProvider implements MediaProvider {
  readonly id = 'media-session';
  readonly name = 'This Device';

  private audio = new Audio();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private playlist: Track[] = [];
  private currentIndex = -1;
  private repeatMode: RepeatMode = 'off';
  private shuffleOn = false;
  private errorMessage: string | undefined;
  private onChange: ((state: MediaState) => void) | null = null;

  isSupported(): boolean {
    return typeof Audio !== 'undefined';
  }

  init(onChange: (state: MediaState) => void): void {
    this.onChange = onChange;
    this.audio.addEventListener('timeupdate', () => this.publish());
    this.audio.addEventListener('durationchange', () => this.publish());
    this.audio.addEventListener('play', () => this.publish());
    this.audio.addEventListener('pause', () => this.publish());
    this.audio.addEventListener('waiting', () => this.publish());
    this.audio.addEventListener('canplay', () => this.publish());
    this.audio.addEventListener('ended', () => this.handleEnded());
    this.audio.addEventListener('error', () => {
      this.errorMessage = 'This file could not be played.';
      this.publish();
    });
    this.setupMediaSessionActions();
    this.publish();
  }

  dispose(): void {
    this.audio.pause();
    this.audio.src = '';
    for (const track of this.playlist) URL.revokeObjectURL(track.objectUrl);
    this.playlist = [];
    void this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.onChange = null;
  }

  getState(): MediaState {
    return {
      status: this.computeStatus(),
      track: this.currentTrack(),
      position: Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0,
      volume: this.audio.volume,
      shuffle: this.shuffleOn,
      repeat: this.repeatMode,
      providerId: this.id,
      providerName: this.name,
      capabilities: CAPABILITIES,
      errorMessage: this.errorMessage
    };
  }

  play(): void {
    if (this.currentIndex === -1) return;
    void this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  next(): void {
    this.advance(1);
  }

  previous(): void {
    this.advance(-1);
  }

  seek(ratio: number): void {
    if (!Number.isFinite(this.audio.duration)) return;
    this.audio.currentTime = ratio * this.audio.duration;
    this.publish();
  }

  setVolume(volume: number): void {
    this.audio.volume = volume;
    this.publish();
  }

  setShuffle(on: boolean): void {
    this.shuffleOn = on;
    this.publish();
  }

  setRepeat(mode: RepeatMode): void {
    this.repeatMode = mode;
    this.publish();
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  loadFiles(files: FileList): void {
    const newTracks: Track[] = Array.from(files).map((file) => ({
      id: `${file.name}_${file.lastModified}`,
      title: stripExtension(file.name),
      artist: 'Local file',
      objectUrl: URL.createObjectURL(file)
    }));
    this.playlist = [...this.playlist, ...newTracks];
    this.errorMessage = undefined;
    if (this.currentIndex === -1) this.playAt(this.playlist.length - newTracks.length);
    else this.publish();
  }

  private currentTrack(): MediaTrackInfo | null {
    const track = this.currentIndex >= 0 ? (this.playlist[this.currentIndex] ?? null) : null;
    if (!track) return null;
    return { ...track, duration: Number.isFinite(this.audio.duration) ? this.audio.duration : 0 };
  }

  private computeStatus(): PlaybackStatus {
    if (this.errorMessage) return 'error';
    if (this.currentIndex === -1) return 'idle';
    if (!this.audio.paused && this.audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) return 'loading';
    return this.audio.paused ? 'paused' : 'playing';
  }

  private playAt(index: number): void {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentIndex = index;
    const track = this.playlist[index]!;
    this.ensureAudioGraph();
    this.errorMessage = undefined;
    this.audio.src = track.objectUrl;
    void this.audio.play();
    this.updateMediaSessionMetadata(track);
    this.publish();
  }

  private advance(direction: -1 | 1): void {
    if (this.playlist.length === 0) return;
    if (this.shuffleOn) {
      const next = Math.floor(Math.random() * this.playlist.length);
      this.playAt(next);
      return;
    }
    const atEdge = this.currentIndex + direction < 0 || this.currentIndex + direction >= this.playlist.length;
    if (atEdge && this.repeatMode === 'off' && direction === 1) return;
    const next = (this.currentIndex + direction + this.playlist.length) % this.playlist.length;
    this.playAt(next);
  }

  private handleEnded(): void {
    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      void this.audio.play();
      return;
    }
    this.advance(1);
  }

  private ensureAudioGraph(): void {
    if (this.audioContext) return;
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaElementSource(this.audio);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.gainNode = this.audioContext.createGain();
    source.connect(this.analyser).connect(this.gainNode).connect(this.audioContext.destination);
  }

  private setupMediaSessionActions(): void {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => this.play());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        this.audio.currentTime = details.seekTime;
        this.publish();
      }
    });
  }

  private updateMediaSessionMetadata(track: Track): void {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      artwork: track.artworkUrl ? [{ src: track.artworkUrl }] : []
    });
  }

  private publish(): void {
    this.onChange?.(this.getState());
  }
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}
