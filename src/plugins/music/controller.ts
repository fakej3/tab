import type { PluginContext } from '@core/plugins/Plugin';
import type { MediaLayout, VisualizerType } from './constants';
import { MediaEngine } from './MediaEngine';
import { BrowserMediaSessionProvider } from './providers/BrowserMediaSessionProvider';
import { createPlaceholderProvider, PLACEHOLDER_PROVIDERS } from './providers/PlaceholderProvider';
import type { MediaState } from './types';
import { createMediaView, type MediaView } from './view';
import { Visualizer } from './visualizer';

export class MusicController {
  private view: MediaView | null = null;
  private engine: MediaEngine | null = null;
  private visualizer: Visualizer | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;
  private lastStatus: MediaState['status'] | null = null;
  // Settings.subscribe here only ever fires for the music namespace, so a
  // live reduce-motion toggle (a different namespace entirely) wouldn't
  // otherwise reach applySettings() until something in Media Hub's own
  // settings happened to change too. Watching the class directly is the
  // same source of truth every other engine reduces to anyway.
  private motionObserver: MutationObserver | null = null;

  constructor(private context: PluginContext) {}

  mount(container: HTMLElement): void {
    this.engine = new MediaEngine(this.context.logger);
    this.engine.register(new BrowserMediaSessionProvider());
    for (const placeholder of PLACEHOLDER_PROVIDERS) this.engine.register(createPlaceholderProvider(placeholder.id, placeholder.name));

    this.view = createMediaView({
      onPickFiles: (files) => this.engine?.loadFiles(files),
      onPlayPause: () => this.engine?.togglePlay(),
      onSkip: (direction) => (direction === 1 ? this.engine?.next() : this.engine?.previous()),
      onSeek: (ratio) => this.engine?.seek(ratio),
      onVolumeChange: (volume) => {
        this.engine?.setVolume(volume);
        this.context.settings.set('volume', volume);
      }
    });
    container.append(this.view.root);

    this.visualizer = new Visualizer(this.view.canvas, this.readVisualizerConfig());

    this.unsubscribeState = this.engine.state.subscribe((state) => this.handleState(state));
    this.handleState(this.engine.state.peek());

    this.unsubscribeSettings = this.context.settings.subscribe(() => this.applySettings());
    this.applySettings();

    this.motionObserver = new MutationObserver(() => this.applySettings());
    this.motionObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  unmount(): void {
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
    this.unsubscribeState?.();
    this.unsubscribeState = null;
    this.motionObserver?.disconnect();
    this.motionObserver = null;
    this.visualizer?.stop();
    this.visualizer = null;
    for (const provider of this.engine?.getProviders() ?? []) provider.dispose();
    this.engine = null;
    this.view?.root.remove();
    this.view = null;
  }

  private handleState(state: MediaState): void {
    this.view?.render(state);
    this.context.bus.emit('music:playback-changed', { playing: state.status === 'playing' });
    if (state.track) this.context.bus.emit('music:track-changed', { title: state.track.title, artist: state.track.artist, artworkUrl: state.track.artworkUrl });
    this.view?.setVolumeSlider(state.volume);
    this.lastStatus = state.status;
    this.syncVisualizerRunning();
  }

  /** The visualizer should only ever be painting while a track is actually
   *  playing AND the user hasn't turned it off — checked from both the
   *  playback-state stream and the settings stream so toggling either one
   *  mid-playback take effect immediately instead of on the next track
   *  change. */
  private syncVisualizerRunning(): void {
    const showVisualizer = this.context.settings.get<boolean>('showVisualizer');
    if (this.lastStatus === 'playing' && showVisualizer) {
      const analyser = this.engine?.getAnalyser() ?? null;
      if (analyser) this.visualizer?.attach(analyser);
      this.visualizer?.start();
    } else {
      this.visualizer?.stop();
    }
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
    if (!this.view) return;
    const showVisualizer = this.context.settings.get<boolean>('showVisualizer');
    this.visualizer?.updateConfig(this.readVisualizerConfig());
    this.view.setVisualizerVisible(showVisualizer);
    this.view.setLayout(this.context.settings.get<MediaLayout>('layout'));
    this.view.setShowProviderName(this.context.settings.get<boolean>('showProviderName'));
    this.view.setShowTimeline(this.context.settings.get<boolean>('showTimeline'));
    this.view.setShowTransportControls(this.context.settings.get<boolean>('showTransportControls'));
    this.view.setAutoHide(this.context.settings.get<boolean>('autoHideControls'));
    this.view.setArtworkScale(this.context.settings.get<number>('artworkScale'));
    // The "animation intensity" dial only ever turns motion down further —
    // reduced-motion (OS-level or the in-app toggle, both surfaced as the
    // same `is-reduced-motion` class) always wins, the same rule every
    // other engine in the app follows. Since --ws-music-motion is set as an
    // inline style below, a CSS override for the reduced-motion case would
    // silently lose to it — the clamp has to happen here, at the source.
    const reducedMotion = document.documentElement.classList.contains('is-reduced-motion');
    this.view.setMotionIntensity(reducedMotion ? 0 : this.context.settings.get<number>('motionIntensity'));
    const volume = this.context.settings.get<number>('volume');
    this.engine?.setVolume(volume);
    this.syncVisualizerRunning();
  }
}
