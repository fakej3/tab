import type { PluginContext } from '@core/plugins/Plugin';
import type { Track, VisualizerType } from './constants';
import { createMusicView, type MusicView } from './view';
import { Visualizer } from './visualizer';

export class MusicController {
  private view: MusicView | null = null;
  private audio = new Audio();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private visualizer: Visualizer | null = null;
  private playlist: Track[] = [];
  private currentIndex = -1;
  private unsubscribeSettings: (() => void) | null = null;

  constructor(private context: PluginContext) {}

  mount(container: HTMLElement): void {
    this.view = createMusicView({
      onPickFiles: (files) => this.addFiles(files),
      onPlayPause: () => this.togglePlay(),
      onSkip: (direction) => this.skip(direction),
      onSeek: (ratio) => this.seek(ratio),
      onVolumeChange: (volume) => this.setVolume(volume, true)
    });
    container.append(this.view.root);
    this.view.showEmpty();

    this.visualizer = new Visualizer(this.view.canvas, this.readVisualizerConfig());
    this.setVolume(this.context.settings.get<number>('volume'), false);

    this.audio.addEventListener('timeupdate', () => this.view?.setProgress(this.audio.currentTime, this.audio.duration || 0));
    this.audio.addEventListener('play', () => {
      this.view?.setPlaying(true);
      this.visualizer?.start();
      this.context.bus.emit('music:playback-changed', { playing: true });
    });
    this.audio.addEventListener('pause', () => {
      this.view?.setPlaying(false);
      this.visualizer?.stop();
      this.context.bus.emit('music:playback-changed', { playing: false });
    });
    this.audio.addEventListener('ended', () => this.skip(1));

    this.unsubscribeSettings = this.context.settings.subscribe(() => this.applySettings());
    this.applySettings();
    this.setupMediaSession();
  }

  unmount(): void {
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
    this.audio.pause();
    this.audio.src = '';
    this.visualizer?.stop();
    for (const track of this.playlist) URL.revokeObjectURL(track.objectUrl);
    this.playlist = [];
    void this.audioContext?.close();
    this.audioContext = null;
    this.view?.root.remove();
    this.view = null;
  }

  private readVisualizerConfig() {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--ws-color-accent').trim() || '#8b7cf6';
    const useAccent = this.context.settings.get<boolean>('visualizerUseAccentColor');
    return {
      type: this.context.settings.get<VisualizerType>('visualizerType'),
      thickness: this.context.settings.get<number>('visualizerThickness'),
      speed: this.context.settings.get<number>('visualizerSpeed'),
      sensitivity: this.context.settings.get<number>('visualizerSensitivity'),
      opacity: this.context.settings.get<number>('visualizerOpacity'),
      color: useAccent ? accent : this.context.settings.get<string>('visualizerColor'),
      glow: this.context.settings.get<boolean>('visualizerGlow')
    };
  }

  private applySettings(): void {
    this.setVolume(this.context.settings.get<number>('volume'), false);
    this.visualizer?.updateConfig(this.readVisualizerConfig());
    if (this.view) this.view.canvas.style.display = this.context.settings.get<boolean>('showVisualizer') ? '' : 'none';
  }

  private ensureAudioGraph(): void {
    if (this.audioContext) return;
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaElementSource(this.audio);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.gainNode = this.audioContext.createGain();
    source.connect(this.analyser).connect(this.gainNode).connect(this.audioContext.destination);
    this.visualizer?.attach(this.analyser);
  }

  private addFiles(files: FileList): void {
    const newTracks: Track[] = Array.from(files).map((file) => ({
      id: `${file.name}_${file.lastModified}`,
      title: stripExtension(file.name),
      artist: 'Local file',
      objectUrl: URL.createObjectURL(file)
    }));
    this.playlist = [...this.playlist, ...newTracks];
    if (this.currentIndex === -1) this.playTrackAt(this.playlist.length - newTracks.length);
  }

  private playTrackAt(index: number): void {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentIndex = index;
    const track = this.playlist[index]!;
    this.ensureAudioGraph();
    this.audio.src = track.objectUrl;
    void this.audio.play();
    this.view?.showPlayer(track);
    this.updateMediaSessionMetadata(track);
    this.context.bus.emit('music:track-changed', { title: track.title, artist: track.artist, artworkUrl: track.artworkUrl });
  }

  private togglePlay(): void {
    if (this.currentIndex === -1) return;
    if (this.audio.paused) void this.audio.play();
    else this.audio.pause();
  }

  private skip(direction: -1 | 1): void {
    if (this.playlist.length === 0) return;
    const next = (this.currentIndex + direction + this.playlist.length) % this.playlist.length;
    this.playTrackAt(next);
  }

  private seek(ratio: number): void {
    if (!Number.isFinite(this.audio.duration)) return;
    this.audio.currentTime = ratio * this.audio.duration;
  }

  private setVolume(volume: number, persist: boolean): void {
    this.audio.volume = volume;
    this.view?.setVolumeSlider(volume);
    if (persist) this.context.settings.set('volume', volume);
  }

  private setupMediaSession(): void {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.skip(-1));
    navigator.mediaSession.setActionHandler('nexttrack', () => this.skip(1));
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) this.audio.currentTime = details.seekTime;
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
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '');
}
