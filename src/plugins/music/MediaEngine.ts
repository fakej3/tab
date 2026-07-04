import { signal } from '@core/state/signal';
import type { Logger } from '@core/utils/logger';
import { createEmptyState, type MediaProvider, type MediaState, type RepeatMode } from './types';

/**
 * Registry + single source of truth for the Media Hub. Owns no playback
 * logic itself — every provider fully owns its own state and MediaEngine
 * just forwards transport commands to whichever one is active and
 * republishes its state as one unified signal. The widget only ever talks
 * to this class, never to a provider directly, so swapping which source is
 * active (or adding a new one) never touches UI code.
 */
export class MediaEngine {
  private providers = new Map<string, MediaProvider>();
  private activeId: string | null = null;
  private unsubscribeActive: (() => void) | null = null;
  readonly state = signal<MediaState>(createEmptyState('none', 'No provider', 'no-provider'));

  constructor(private logger: Logger) {}

  register(provider: MediaProvider): void {
    this.providers.set(provider.id, provider);
    // First supported provider registered becomes active by default — today
    // that's always the local/media-session one, since every other
    // registered provider reports isSupported() === false. Wiring the
    // selection through a real map (rather than hardcoding "the one
    // provider") is what makes a second real source a registration, not a
    // rewrite.
    if (this.activeId === null && provider.isSupported()) this.activate(provider.id);
  }

  getProviders(): MediaProvider[] {
    return [...this.providers.values()];
  }

  private activate(id: string): void {
    const provider = this.providers.get(id);
    if (!provider) return;
    this.unsubscribeActive?.();
    this.activeId = id;
    provider.init((state) => this.state.set(state));
    this.state.set(provider.getState());
    this.unsubscribeActive = () => provider.dispose();
  }

  dispose(): void {
    this.unsubscribeActive?.();
    this.unsubscribeActive = null;
    this.activeId = null;
  }

  private active(): MediaProvider | null {
    return this.activeId ? (this.providers.get(this.activeId) ?? null) : null;
  }

  play(): void {
    this.active()?.play();
  }

  pause(): void {
    this.active()?.pause();
  }

  togglePlay(): void {
    const status = this.state.peek().status;
    if (status === 'playing') this.pause();
    else this.play();
  }

  next(): void {
    this.active()?.next();
  }

  previous(): void {
    this.active()?.previous();
  }

  seek(ratio: number): void {
    this.active()?.seek(ratio);
  }

  setVolume(volume: number): void {
    this.active()?.setVolume(volume);
  }

  setShuffle(on: boolean): void {
    this.active()?.setShuffle(on);
  }

  setRepeat(mode: RepeatMode): void {
    this.active()?.setRepeat(mode);
  }

  getAnalyser(): AnalyserNode | null {
    return this.active()?.getAnalyser?.() ?? null;
  }

  /** No-ops (with a log line) on any provider that isn't the local file player — the widget calls this unconditionally and lets the engine decide whether it means anything. */
  loadFiles(files: FileList): void {
    const provider = this.active();
    if (provider?.loadFiles) provider.loadFiles(files);
    else this.logger.warn(`Active media provider "${provider?.name ?? 'none'}" does not support loading local files.`);
  }
}
