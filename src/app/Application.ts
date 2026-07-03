import { AnimationEngine } from '@core/animation/AnimationEngine';
import { CommandPalette } from '@core/command-palette/CommandPalette';
import { createEventBus, type EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import { LayoutEngine } from '@core/layout/LayoutEngine';
import { PluginManager } from '@core/plugins/PluginManager';
import { SettingsManager } from '@core/settings/SettingsManager';
import { storageService, type StorageService } from '@core/storage/StorageService';
import { ThemeEngine } from '@core/theme/ThemeEngine';
import { TypographyEngine } from '@core/typography/TypographyEngine';
import { WallpaperEngine } from '@core/wallpaper/WallpaperEngine';
import { createLogger } from '@core/utils/logger';
import { registerBuiltinPlugins } from './registerBuiltinPlugins';

const log = createLogger('Application');

/**
 * The composition root. Nothing here contains business logic — it only
 * constructs core services in dependency order, wires the few cross-service
 * connections that must exist (e.g. "a plugin's widget descriptor becomes a
 * layout entry"), and boots plugins. Every service below is independently
 * portable to a future non-extension shell; this file is the one piece that
 * is Chrome-newtab-specific.
 */
export class Application {
  readonly bus: EventBus<WorkspaceEvents> = createEventBus();
  readonly storage: StorageService = storageService;
  readonly settings: SettingsManager;
  readonly theme: ThemeEngine;
  readonly typography: TypographyEngine;
  readonly animation: AnimationEngine;
  readonly wallpaper: WallpaperEngine;
  readonly layout: LayoutEngine;
  readonly plugins: PluginManager;
  readonly commandPalette: CommandPalette;

  constructor() {
    this.settings = new SettingsManager(this.storage, this.bus);
    this.theme = new ThemeEngine(this.settings, this.bus);
    this.typography = new TypographyEngine(this.settings, this.theme, this.bus);
    this.animation = new AnimationEngine(this.settings, this.theme, this.bus);
    this.wallpaper = new WallpaperEngine(this.settings, this.storage, this.bus);
    this.layout = new LayoutEngine(this.storage, this.bus);
    this.commandPalette = new CommandPalette(this.bus);
    this.plugins = new PluginManager(this.bus, this.settings, this.storage, this.commandPalette);
  }

  async bootstrap(): Promise<void> {
    await this.settings.load();
    this.theme.init();
    this.typography.init();
    this.animation.init();
    await this.wallpaper.init();
    await this.layout.load();
    this.commandPalette.init();

    // The only cross-service wiring in the app: a registered plugin's widget
    // descriptor becomes a layout entry. Routed through the bus so
    // PluginManager and LayoutEngine never reference each other directly.
    this.bus.on('plugin:registered', ({ id }) => {
      const plugin = this.plugins.get(id);
      if (plugin?.widget) this.layout.registerWidget(id, plugin.widget);
    });

    await registerBuiltinPlugins(this.plugins);

    this.bus.emit('app:ready', undefined);
    log.info('Workspace ready.');
  }
}
