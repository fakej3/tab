import { h, clearChildren } from '@core/dom/h';
import type { MediaLayout } from './constants';
import type { MediaState, PlaybackStatus } from './types';

export interface MediaViewCallbacks {
  onPickFiles(files: FileList): void;
  onPlayPause(): void;
  onSkip(direction: -1 | 1): void;
  onSeek(ratio: number): void;
  onVolumeChange(volume: number): void;
}

export interface MediaView {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  render(state: MediaState): void;
  setLayout(layout: MediaLayout): void;
  setShowProviderName(show: boolean): void;
  setShowTimeline(show: boolean): void;
  setShowTransportControls(show: boolean): void;
  setAutoHide(auto: boolean): void;
  setArtworkScale(scale: number): void;
  setMotionIntensity(intensity: number): void;
  setVisualizerVisible(visible: boolean): void;
  setVolumeSlider(volume: number): void;
}

/**
 * Purely a view over `MediaState` — it never asks which provider is active
 * or why. `render()` is the one entry point: it reads `state.status` to
 * decide whether to show the status screen (no track exists yet, in any of
 * several flavors) or the player, and everything else follows from the
 * unified model. A future provider changes what shows up here without this
 * file changing at all.
 */
export function createMediaView(callbacks: MediaViewCallbacks): MediaView {
  const fileInput = h('input', {
    type: 'file',
    accept: 'audio/*',
    multiple: true,
    class: 'ws-visually-hidden',
    tabindex: -1,
    onchange: (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) callbacks.onPickFiles(files);
    }
  }) as HTMLInputElement;

  const statusIcon = h('div', { class: 'ws-empty-state__icon' });
  const statusTitle = h('p', { class: 'ws-empty-state__title' });
  const statusHint = h('p', { class: 'ws-empty-state__hint' });
  const statusView = h('button', { class: 'ws-music__status ws-empty-state ws-motion-hover-lift', type: 'button' }, [
    statusIcon,
    statusTitle,
    statusHint
  ]);
  let statusClickable = false;
  statusView.addEventListener('click', () => {
    if (statusClickable) fileInput.click();
  });

  const canvas = h('canvas', { class: 'ws-music__visualizer' }) as HTMLCanvasElement;
  const artwork = h('div', { class: 'ws-music__artwork' });

  const providerDot = h('span', { class: 'ws-music__provider-dot' });
  const providerLabel = h('span', { class: 'ws-music__provider-label' });
  const badge = h('div', { class: 'ws-music__badge' }, [providerDot, providerLabel]);

  const title = h('div', { class: 'ws-music__title ws-music__fade' });
  const artist = h('div', { class: 'ws-music__artist ws-music__fade' });
  const meta = h('div', { class: 'ws-music__meta' }, [badge, title, artist]);

  const progressFill = h('div', { class: 'ws-music__progress-fill' });
  const progressKnob = h('div', { class: 'ws-music__progress-knob' });
  const progressTrack = h('div', { class: 'ws-music__progress-track' }, [progressFill, progressKnob]);
  progressTrack.addEventListener('click', (event) => {
    const rect = progressTrack.getBoundingClientRect();
    callbacks.onSeek((event.clientX - rect.left) / rect.width);
  });

  const playPauseBtn = h('button', {
    class: 'ws-music__play ws-motion-press',
    type: 'button',
    'aria-label': 'Play/Pause',
    onclick: () => callbacks.onPlayPause()
  });
  playPauseBtn.append(playSvg());

  const prevBtn = h(
    'button',
    { class: 'ws-music__skip ws-motion-press', type: 'button', 'aria-label': 'Previous', onclick: () => callbacks.onSkip(-1) },
    [skipSvg(true)]
  );
  const nextBtn = h(
    'button',
    { class: 'ws-music__skip ws-motion-press', type: 'button', 'aria-label': 'Next', onclick: () => callbacks.onSkip(1) },
    [skipSvg(false)]
  );

  const volumeSlider = h('input', {
    class: 'ws-music__volume',
    type: 'range',
    min: '0',
    max: '1',
    step: '0.01',
    'aria-label': 'Volume',
    oninput: (event: Event) => {
      const el = event.target as HTMLInputElement;
      updateVolumeFill(el);
      callbacks.onVolumeChange(Number(el.value));
    }
  }) as HTMLInputElement;

  function updateVolumeFill(el: HTMLInputElement): void {
    const min = Number(el.min) || 0;
    const max = Number(el.max) || 1;
    const pct = max > min ? ((Number(el.value) - min) / (max - min)) * 100 : 0;
    el.style.setProperty('--ws-range-fill', `${pct}%`);
  }

  const transport = h('div', { class: 'ws-music__transport' }, [prevBtn, playPauseBtn, nextBtn, volumeSlider]);
  const player = h('div', { class: 'ws-music__player', hidden: true }, [canvas, artwork, meta, progressTrack, transport]);

  const root = h('div', { class: 'ws-music', 'data-layout': 'expanded' }, [statusView, player, fileInput]);

  let lastTrackId: string | null = null;

  function playIcon(playing: boolean): SVGSVGElement {
    return playing ? pauseSvg() : playSvg();
  }

  function render(state: MediaState): void {
    const hasTrack = state.track !== null;
    statusView.hidden = hasTrack;
    player.hidden = !hasTrack;

    if (!hasTrack) {
      renderStatus(state.status);
      return;
    }

    const track = state.track!;
    artwork.style.backgroundImage = track.artworkUrl ? `url(${track.artworkUrl})` : 'none';
    root.classList.toggle('is-loading', state.status === 'loading');
    root.classList.toggle('is-error', state.status === 'error');

    const changed = track.id !== lastTrackId;
    lastTrackId = track.id;
    const paint = () => {
      title.textContent = track.title;
      artist.textContent = state.status === 'error' ? (state.errorMessage ?? 'Playback error') : track.artist;
      artist.classList.toggle('ws-music__artist--error', state.status === 'error');
    };
    if (changed) {
      title.classList.add('is-fading');
      artist.classList.add('is-fading');
      window.setTimeout(() => {
        paint();
        title.classList.remove('is-fading');
        artist.classList.remove('is-fading');
      }, 220); // must match --ws-duration-base in .ws-music__fade's transition
    } else {
      paint();
    }

    providerLabel.textContent = state.providerName;
    root.classList.toggle('is-playing', state.status === 'playing');
    playPauseBtn.replaceChildren(playIcon(state.status === 'playing'));
    playPauseBtn.disabled = !state.capabilities.play && !state.capabilities.pause;
    prevBtn.disabled = !state.capabilities.previous;
    nextBtn.disabled = !state.capabilities.next;
    progressTrack.classList.toggle('is-disabled', !state.capabilities.seek);

    const ratio = track.duration > 0 ? state.position / track.duration : 0;
    progressFill.style.width = `${ratio * 100}%`;
    progressKnob.style.left = `${ratio * 100}%`;
  }

  function renderStatus(status: PlaybackStatus): void {
    statusClickable = status === 'idle';
    statusView.classList.toggle('ws-motion-hover-lift', statusClickable);
    statusView.disabled = !statusClickable;

    const copy = STATUS_COPY[status];
    clearChildren(statusIcon);
    statusIcon.append(copy.icon());
    statusIcon.classList.toggle('ws-motion-breathe', status === 'idle' || status === 'connecting' || status === 'loading');
    statusTitle.textContent = copy.title;
    statusHint.textContent = copy.hint;
  }

  return {
    root,
    canvas,
    render,
    setLayout(layout) {
      root.dataset.layout = layout;
    },
    setShowProviderName(show) {
      badge.hidden = !show;
    },
    setShowTimeline(show) {
      progressTrack.hidden = !show;
    },
    setShowTransportControls(show) {
      transport.hidden = !show;
    },
    setAutoHide(auto) {
      root.classList.toggle('ws-music--auto-hide', auto);
    },
    setArtworkScale(scale) {
      root.style.setProperty('--ws-music-artwork-scale', String(scale));
    },
    setMotionIntensity(intensity) {
      root.style.setProperty('--ws-music-motion', String(intensity));
    },
    setVisualizerVisible(visible) {
      canvas.style.display = visible ? '' : 'none';
    },
    setVolumeSlider(volume) {
      volumeSlider.value = String(volume);
      updateVolumeFill(volumeSlider);
    }
  };
}

// Sizes mirror the shared icon scale (core/dom/icons.ts): 18 ("medium") for
// the primary transport action, 14 ("small") for the secondary skip
// controls — the same size distinction the rest of the app draws between a
// standalone icon and an inline/secondary one.
function svg(paths: { d?: string; tag?: string; attrs?: Record<string, string> }[], size = 18): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const el = document.createElementNS(ns, 'svg');
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('width', String(size));
  el.setAttribute('height', String(size));
  el.setAttribute('fill', 'currentColor');
  for (const item of paths) {
    const node = document.createElementNS(ns, item.tag ?? 'path');
    if (item.d) node.setAttribute('d', item.d);
    for (const [key, value] of Object.entries(item.attrs ?? {})) node.setAttribute(key, value);
    el.append(node);
  }
  return el;
}

const playSvg = () => svg([{ d: 'M8 5v14l11-7z' }]);
const pauseSvg = () => svg([{ d: 'M6 5h4v14H6zM14 5h4v14h-4z' }]);
const skipSvg = (back: boolean) =>
  svg([{ d: back ? 'M6 6h2v12H6zM20 6L10 12l10 6z' : 'M16 6h2v12h-2zM4 6l10 6-10 6z' }], 14);
const musicNoteIcon = () =>
  svg(
    [{ d: 'M9 18V5l12-2v13' }, { tag: 'circle', attrs: { cx: '6', cy: '18', r: '3' } }, { tag: 'circle', attrs: { cx: '18', cy: '16', r: '3' } }],
    24
  );
const plugIcon = () =>
  svg(
    [
      { tag: 'path', attrs: { d: 'M9 2v6M15 2v6', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' } },
      { tag: 'path', attrs: { d: 'M6 8h12v4a6 6 0 01-12 0z', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' } },
      { tag: 'path', attrs: { d: 'M12 18v4', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' } }
    ],
    24
  );
const connectingIcon = () =>
  svg(
    [
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '8', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-dasharray': '10 8' } }
    ],
    24
  );
const errorIcon = () =>
  svg(
    [
      {
        tag: 'path',
        attrs: { d: 'M12 8v5M12 17h.01', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' }
      },
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' } }
    ],
    24
  );

const STATUS_COPY: Record<PlaybackStatus, { icon: () => SVGSVGElement; title: string; hint: string }> = {
  idle: { icon: musicNoteIcon, title: 'Add music', hint: 'Pick local audio files to start playing.' },
  'no-provider': { icon: plugIcon, title: 'No source connected', hint: 'Enable a media source from Settings → Media Hub.' },
  unsupported: { icon: plugIcon, title: 'Not available here', hint: 'This source isn’t supported in this browser yet.' },
  connecting: { icon: connectingIcon, title: 'Connecting…', hint: 'Waiting for the source to respond.' },
  loading: { icon: connectingIcon, title: 'Loading…', hint: 'Preparing the track.' },
  playing: { icon: musicNoteIcon, title: '', hint: '' },
  paused: { icon: musicNoteIcon, title: '', hint: '' },
  error: { icon: errorIcon, title: 'Something went wrong', hint: 'That track could not be played.' }
};
