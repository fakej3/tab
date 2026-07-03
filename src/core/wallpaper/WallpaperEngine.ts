import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import { h } from '@core/dom/h';
import type { SettingsManager } from '@core/settings/SettingsManager';
import type { SettingsSection } from '@core/settings/SettingsSchema';
import type { StorageService } from '@core/storage/StorageService';
import { StorageKeys } from '@core/storage/StorageKeys';
import { clamp } from '@core/utils/clamp';
import { createId } from '@core/utils/id';
import { createLogger } from '@core/utils/logger';
import type { WallpaperImage, WallpaperMode } from './WallpaperTypes';

const NAMESPACE = 'wallpaper';
const log = createLogger('WallpaperEngine');
const PARALLAX_MAX_PX = 10;
const CROSSFADE_FALLBACK_MS = 900;

const WALLPAPER_SECTION: SettingsSection = {
  namespace: NAMESPACE,
  title: 'Wallpaper',
  description: 'The hero of the workspace. Everything else should get out of its way.',
  order: 0,
  fields: [
    {
      key: 'mode',
      type: 'select',
      label: 'Type',
      default: 'gradient',
      options: [
        { label: 'Color', value: 'color' },
        { label: 'Gradient', value: 'gradient' },
        { label: 'Image', value: 'image' }
      ]
    },
    { key: 'color', type: 'color', label: 'Color', default: '#0b0b10' },
    { key: 'gradientFrom', type: 'color', label: 'Gradient start', default: '#33245c' },
    { key: 'gradientTo', type: 'color', label: 'Gradient end', default: '#0a0912' },
    {
      key: 'gradientAngle',
      type: 'range',
      label: 'Gradient angle',
      default: 145,
      min: 0,
      max: 360,
      step: 1,
      unit: '°'
    },
    { key: 'activeImageId', type: 'string', label: 'Active image', default: '', hiddenInPanel: true },
    {
      key: 'blur',
      type: 'range',
      label: 'Blur',
      default: 0,
      min: 0,
      max: 40,
      step: 1,
      unit: 'px',
      visibleWhen: (values) => values.mode === 'image'
    },
    {
      key: 'brightness',
      type: 'range',
      label: 'Brightness',
      default: 1,
      min: 0.4,
      max: 1.3,
      step: 0.01,
      visibleWhen: (values) => values.mode === 'image'
    },
    {
      key: 'tintColor',
      type: 'color',
      label: 'Tint',
      default: '#000000',
      visibleWhen: (values) => values.mode === 'image'
    },
    {
      key: 'tintOpacity',
      type: 'range',
      label: 'Tint opacity',
      default: 0,
      min: 0,
      max: 0.8,
      step: 0.01,
      visibleWhen: (values) => values.mode === 'image'
    },
    {
      key: 'parallax',
      type: 'boolean',
      label: 'Cursor parallax',
      description: 'A very subtle shift as the cursor moves. Off when reduced motion is on.',
      default: true
    }
  ]
};

type WallpaperSettingsValues = {
  mode: WallpaperMode;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  activeImageId: string;
  blur: number;
  brightness: number;
  tintColor: string;
  tintOpacity: number;
  parallax: boolean;
};

/**
 * Owns the wallpaper — and only the wallpaper. Nothing else in the app is
 * allowed to touch the background layer. Renders directly into a container
 * handed to it by the Shell and re-renders whenever wallpaper settings
 * change.
 *
 * Wallpaper changes crossfade: the new layer is built (and, for images,
 * fully decoded) off-screen first, then faded in on top of the previous
 * layer, which is removed once the transition completes. Nothing ever
 * "pops."
 */
export class WallpaperEngine {
  private container: HTMLElement | null = null;
  private currentLayer: HTMLElement | null = null;
  private library: WallpaperImage[] = [];
  private renderToken = 0;
  private prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor(
    private settings: SettingsManager,
    private storage: StorageService,
    private bus: EventBus<WorkspaceEvents>
  ) {}

  async init(): Promise<void> {
    this.settings.registerSection(WALLPAPER_SECTION);
    this.library = await this.storage.get<WallpaperImage[]>(StorageKeys.wallpaperLibrary, []);
    this.settings.subscribeNamespace(NAMESPACE, () => void this.render());
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.attachParallax(container);
    void this.render();
  }

  listImages(): WallpaperImage[] {
    return this.library;
  }

  async addImage(file: File): Promise<WallpaperImage> {
    const dataUrl = await readFileAsDataUrl(file);
    const image: WallpaperImage = { id: createId('wallpaper'), name: file.name, dataUrl, addedAt: Date.now() };
    this.library = [...this.library, image];
    await this.storage.set(StorageKeys.wallpaperLibrary, this.library);
    this.settings.set(NAMESPACE, 'mode', 'image' satisfies WallpaperMode);
    this.settings.set(NAMESPACE, 'activeImageId', image.id);
    return image;
  }

  async removeImage(id: string): Promise<void> {
    this.library = this.library.filter((image) => image.id !== id);
    await this.storage.set(StorageKeys.wallpaperLibrary, this.library);
    if (this.settings.get<string>(NAMESPACE, 'activeImageId') === id) {
      this.settings.set(NAMESPACE, 'activeImageId', '');
      this.settings.set(NAMESPACE, 'mode', 'gradient' satisfies WallpaperMode);
    }
  }

  private async render(): Promise<void> {
    if (!this.container) return;
    const token = ++this.renderToken;
    const values = this.settings.getNamespace(NAMESPACE) as WallpaperSettingsValues;

    const newLayer = await this.buildLayer(values);
    // If settings changed again while we were awaiting image decode, this
    // render is stale — drop it rather than crossfading to an outdated frame.
    if (token !== this.renderToken || !this.container) return;

    const previousLayer = this.currentLayer;
    this.container.appendChild(newLayer);

    requestAnimationFrame(() => newLayer.classList.add('is-visible'));

    if (previousLayer) {
      const removePrevious = () => previousLayer.remove();
      newLayer.addEventListener('transitionend', removePrevious, { once: true });
      window.setTimeout(removePrevious, CROSSFADE_FALLBACK_MS);
    }

    this.currentLayer = newLayer;
    this.bus.emit('wallpaper:changed', { wallpaperId: values.activeImageId || values.mode });
  }

  private async buildLayer(values: WallpaperSettingsValues): Promise<HTMLElement> {
    if (values.mode === 'color') {
      return h('div', { class: 'ws-wallpaper-layer', style: `background:${values.color}` });
    }

    if (values.mode === 'gradient') {
      return h('div', {
        class: 'ws-wallpaper-layer',
        style: `background:linear-gradient(${values.gradientAngle}deg, ${values.gradientFrom}, ${values.gradientTo})`
      });
    }

    const image = this.library.find((entry) => entry.id === values.activeImageId) ?? this.library[0];
    if (!image) {
      log.warn('No wallpaper image available — falling back to gradient.');
      return h('div', {
        class: 'ws-wallpaper-layer',
        style: `background:linear-gradient(${values.gradientAngle}deg, ${values.gradientFrom}, ${values.gradientTo})`
      });
    }

    const img = h('img', {
      class: 'ws-wallpaper-image',
      src: image.dataUrl,
      alt: '',
      style: `filter:blur(${values.blur}px) brightness(${values.brightness})`
    }) as HTMLImageElement;
    await decodeImage(img);

    const tint = h('div', {
      class: 'ws-wallpaper-tint',
      style: `background:${values.tintColor};opacity:${values.tintOpacity}`
    });
    return h('div', { class: 'ws-wallpaper-layer' }, [img, tint]);
  }

  /** A very subtle cursor-follow shift — off entirely under reduced motion or when the user disables it. */
  private attachParallax(container: HTMLElement): void {
    let raf = 0;
    window.addEventListener('pointermove', (event) => {
      if (this.prefersReducedMotion.matches) return;
      if (!this.settings.get<boolean>(NAMESPACE, 'parallax')) return;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const nx = clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1);
        const ny = clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1);
        container.style.setProperty('--ws-parallax-x', `${(nx * PARALLAX_MAX_PX).toFixed(2)}px`);
        container.style.setProperty('--ws-parallax-y', `${(ny * PARALLAX_MAX_PX).toFixed(2)}px`);
      });
    });
  }
}

function decodeImage(img: HTMLImageElement): Promise<void> {
  if (typeof img.decode === 'function') {
    return img.decode().catch(() => waitForLoadEvent(img));
  }
  return waitForLoadEvent(img);
}

function waitForLoadEvent(img: HTMLImageElement): Promise<void> {
  if (img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
