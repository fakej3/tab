import { h } from '@core/dom/h';
import type { Track } from './constants';

export interface MusicViewCallbacks {
  onPickFiles(files: FileList): void;
  onPlayPause(): void;
  onSkip(direction: -1 | 1): void;
  onSeek(ratio: number): void;
  onVolumeChange(volume: number): void;
}

export interface MusicView {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  showEmpty(): void;
  showPlayer(track: Track): void;
  setPlaying(playing: boolean): void;
  setProgress(currentTime: number, duration: number): void;
  setVolumeSlider(volume: number): void;
}

export function createMusicView(callbacks: MusicViewCallbacks): MusicView {
  const fileInput = h('input', {
    type: 'file',
    accept: 'audio/*',
    multiple: true,
    class: 'ws-visually-hidden',
    onchange: (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) callbacks.onPickFiles(files);
    }
  }) as HTMLInputElement;

  const emptyIcon = musicNoteIcon();
  emptyIcon.classList.add('ws-motion-breathe');
  const emptyState = h('button', { class: 'ws-music__empty ws-motion-hover-lift', type: 'button', onclick: () => fileInput.click() }, [
    emptyIcon,
    h('span', {}, ['Add music'])
  ]);

  const canvas = h('canvas', { class: 'ws-music__visualizer' }) as HTMLCanvasElement;

  const artwork = h('div', { class: 'ws-music__artwork' });
  const title = h('div', { class: 'ws-music__title ws-music__fade' });
  const artist = h('div', { class: 'ws-music__artist ws-music__fade' });

  const progressTrack = h('div', { class: 'ws-music__progress-track' });
  const progressFill = h('div', { class: 'ws-music__progress-fill' });
  const progressKnob = h('div', { class: 'ws-music__progress-knob' });
  progressTrack.append(progressFill, progressKnob);
  progressTrack.addEventListener('click', (event) => {
    const rect = progressTrack.getBoundingClientRect();
    callbacks.onSeek((event.clientX - rect.left) / rect.width);
  });

  const playIcon = () => (playPauseBtn.dataset.playing === 'true' ? pauseSvg() : playSvg());
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
    oninput: (event: Event) => callbacks.onVolumeChange(Number((event.target as HTMLInputElement).value))
  }) as HTMLInputElement;

  const transport = h('div', { class: 'ws-music__transport' }, [prevBtn, playPauseBtn, nextBtn, volumeSlider]);
  const meta = h('div', { class: 'ws-music__meta' }, [title, artist]);
  const player = h('div', { class: 'ws-music__player', hidden: true }, [canvas, artwork, meta, progressTrack, transport]);

  const root = h('div', { class: 'ws-music' }, [emptyState, player, fileInput]);

  let lastTrackId: string | null = null;

  function showEmpty(): void {
    emptyState.hidden = false;
    player.hidden = true;
  }

  function showPlayer(track: Track): void {
    emptyState.hidden = true;
    player.hidden = false;
    artwork.style.backgroundImage = track.artworkUrl ? `url(${track.artworkUrl})` : 'none';

    const changed = track.id !== lastTrackId;
    lastTrackId = track.id;
    const paint = () => {
      title.textContent = track.title;
      artist.textContent = track.artist;
    };
    if (changed) {
      title.classList.add('is-fading');
      artist.classList.add('is-fading');
      window.setTimeout(() => {
        paint();
        title.classList.remove('is-fading');
        artist.classList.remove('is-fading');
      }, 160);
    } else {
      paint();
    }
  }

  function setPlaying(playing: boolean): void {
    playPauseBtn.dataset.playing = String(playing);
    playPauseBtn.replaceChildren(playIcon());
    player.classList.toggle('is-playing', playing);
  }

  function setProgress(currentTime: number, duration: number): void {
    const ratio = duration > 0 ? currentTime / duration : 0;
    progressFill.style.width = `${ratio * 100}%`;
    progressKnob.style.left = `${ratio * 100}%`;
  }

  function setVolumeSlider(volume: number): void {
    volumeSlider.value = String(volume);
  }

  return { root, canvas, showEmpty, showPlayer, setPlaying, setProgress, setVolumeSlider };
}

function svg(paths: { d?: string; tag?: string; attrs?: Record<string, string> }[]): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const el = document.createElementNS(ns, 'svg');
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('width', '16');
  el.setAttribute('height', '16');
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
  svg([{ d: back ? 'M6 6h2v12H6zM20 6L10 12l10 6z' : 'M16 6h2v12h-2zM4 6l10 6-10 6z' }]);
const musicNoteIcon = () =>
  svg([{ d: 'M9 18V5l12-2v13' }, { tag: 'circle', attrs: { cx: '6', cy: '18', r: '3' } }, { tag: 'circle', attrs: { cx: '18', cy: '16', r: '3' } }]);
