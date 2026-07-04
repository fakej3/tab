import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import type { Command } from '@core/command-palette/CommandRegistry';
import type { Logger } from '@core/utils/logger';
import type { SettingsSection } from '@core/settings/SettingsSchema';
import type { StorageService } from '@core/storage/StorageService';

/** Scoped settings API handed to a plugin — reads/writes are pre-namespaced to `plugin.<id>`. */
export interface PluginSettingsApi {
  registerSection(section: Omit<SettingsSection, 'namespace'>): void;
  get<T>(key: string): T;
  set(key: string, value: unknown): void;
  subscribe(listener: (values: Record<string, unknown>) => void): () => void;
}

/** Scoped command palette API — registered commands are auto-prefixed so plugin ids can never collide. */
export interface PluginCommandsApi {
  register(command: Command): () => void;
}

/** Everything a plugin is allowed to touch. No plugin ever imports another plugin or reaches into core internals. */
export interface PluginContext {
  id: string;
  bus: EventBus<WorkspaceEvents>;
  settings: PluginSettingsApi;
  storage: StorageService;
  commands: PluginCommandsApi;
  logger: Logger;
}

/** Declares how a plugin's widget behaves in the LayoutEngine grid. Omit entirely for non-widget plugins. */
export interface WidgetDescriptor {
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
  resizable?: boolean;
  /** Opts out of the default content clipping — for widgets that need to render a popover/dropdown (e.g. search suggestions) beyond their own bounds. */
  allowOverflow?: boolean;
  /** Widget starts hidden the first time it's auto-placed (still reachable via the layout editor's show/hide toggle) — for plugins with nothing to show until configured. */
  defaultHidden?: boolean;
  /** Preferred grid cell for a widget's very first placement (e.g. so the home composition reads as intentional rather than whatever the free-slot packer finds first). Falls back to auto-placement if the cell is already taken or omitted; has no effect after the widget's first registration. */
  defaultPosition?: { x: number; y: number };
  /** The shared glass card is the default so every widget looks consistent
   *  out of the box, but it isn't the only valid surface — a widget that's
   *  pure typography sitting directly on the wallpaper (the clock, a quiet
   *  quote line) should opt out with 'none' rather than be forced into a
   *  rectangle it doesn't need. */
  surface?: 'glass' | 'none';
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  /** Widget placement metadata; absent means the plugin has no on-canvas presence (e.g. a command-palette-only plugin). */
  widget?: WidgetDescriptor;

  /** Called once when the plugin is registered. Register settings schema and event listeners here. */
  init(context: PluginContext): void | Promise<void>;
  /** Render into the given container. Called whenever the layout engine places this plugin's widget. */
  mount?(container: HTMLElement): void;
  /** Remove DOM/listeners created in `mount`, but keep the plugin registered (e.g. widget hidden/resized away). */
  unmount?(): void;
  /** Full teardown — plugin is being unregistered entirely. */
  destroy(): void;
}

export abstract class BasePlugin implements Plugin {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  abstract description: string;
  widget?: WidgetDescriptor;
  unmount?(): void;
  protected context!: PluginContext;

  init(context: PluginContext): void | Promise<void> {
    this.context = context;
  }

  destroy(): void {
    this.unmount?.();
  }
}
