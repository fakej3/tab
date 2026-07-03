import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import { h } from '@core/dom/h';
import type { SettingsManager } from '@core/settings/SettingsManager';
import type { SettingsSection } from '@core/settings/SettingsSchema';
import type { StorageService } from '@core/storage/StorageService';
import { StorageKeys } from '@core/storage/StorageKeys';
import { createId } from '@core/utils/id';
import { createLogger } from '@core/utils/logger';
import type { WallpaperImage, WallpaperMode } from './WallpaperTypes';

const NAMESPACE = 'wallpaper';
const log = createLogger('WallpaperEngine');

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
    }
  ]
};

/**
 * Owns the wallpaper — and only the wallpaper. Nothing else in the app is
 * allowed to touch the background layer. Renders directly into a container
 * handed to it by the Shell and re-renders whenever wallpaper settings
 * change, so it needs no framework diffing to stay cheap.
 */
export class WallpaperEngine {
  private container: HTMLElement | null = null;
  private layerEl: HTMLElement | null = null;
  private library: WallpaperImage[] = [];

  constructor(
    private settings: SettingsManager,
    private storage: StorageService,
    private bus: EventBus<WorkspaceEvents>
  ) {}

  async init(): Promise<void> {
    this.settings.registerSection(WALLPAPER_SECTION);
    this.library = await this.storage.get<WallpaperImage[]>(StorageKeys.wallpaperLibrary, []);
    this.settings.subscribeNamespace(NAMESPACE, () => this.render());
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
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

  private render(): void {
    if (!this.container) return;
    const values = this.settings.getNamespace(NAMESPACE) as {
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
    };

    this.layerEl?.remove();

    if (values.mode === 'color') {
      this.layerEl = h('div', { class: 'ws-wallpaper-layer', style: `background:${values.color}` });
    } else if (values.mode === 'gradient') {
      this.layerEl = h('div', {
        class: 'ws-wallpaper-layer',
        style: `background:linear-gradient(${values.gradientAngle}deg, ${values.gradientFrom}, ${values.gradientTo})`
      });
    } else {
      const image = this.library.find((entry) => entry.id === values.activeImageId) ?? this.library[0];
      if (!image) {
        log.warn('No wallpaper image available — falling back to gradient.');
        this.layerEl = h('div', {
          class: 'ws-wallpaper-layer',
          style: `background:linear-gradient(${values.gradientAngle}deg, ${values.gradientFrom}, ${values.gradientTo})`
        });
      } else {
        const img = h('img', {
          class: 'ws-wallpaper-image',
          src: image.dataUrl,
          alt: '',
          style: `filter:blur(${values.blur}px) brightness(${values.brightness})`
        });
        const tint = h('div', {
          class: 'ws-wallpaper-tint',
          style: `background:${values.tintColor};opacity:${values.tintOpacity}`
        });
        this.layerEl = h('div', { class: 'ws-wallpaper-layer' }, [img, tint]);
      }
    }

    this.container.prepend(this.layerEl);
    this.bus.emit('wallpaper:changed', { wallpaperId: values.activeImageId || values.mode });
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
