import type { CommandPalette } from '@core/command-palette/CommandPalette';
import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import type { SettingsManager } from '@core/settings/SettingsManager';
import type { SettingsSection } from '@core/settings/SettingsSchema';
import type { StorageService } from '@core/storage/StorageService';
import { createLogger } from '@core/utils/logger';
import type { Plugin, PluginContext } from './Plugin';

const log = createLogger('PluginManager');

/**
 * Owns the full lifecycle of every plugin. The core never knows what a
 * plugin *does* — it only calls the four lifecycle hooks (`init`, `mount`,
 * `unmount`, `destroy`) and hands each plugin a sandboxed `PluginContext`.
 * Removing a plugin is always just `unregister(id)`.
 */
export class PluginManager {
  private plugins = new Map<string, Plugin>();
  private contexts = new Map<string, PluginContext>();
  private mountedContainers = new Map<string, HTMLElement>();
  private commandUnsubscribers = new Map<string, Array<() => void>>();

  constructor(
    private bus: EventBus<WorkspaceEvents>,
    private settings: SettingsManager,
    private storage: StorageService,
    private commandPalette: CommandPalette
  ) {}

  async register(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      log.warn(`Plugin "${plugin.id}" is already registered — skipping.`);
      return;
    }

    this.commandUnsubscribers.set(plugin.id, []);

    const context: PluginContext = {
      id: plugin.id,
      bus: this.bus,
      storage: this.storage.namespaced(`plugin:${plugin.id}`),
      logger: createLogger(`plugin:${plugin.id}`),
      settings: {
        registerSection: (section) =>
          this.settings.registerSection({ ...section, namespace: `plugin.${plugin.id}` } as SettingsSection),
        get: (key) => this.settings.get(`plugin.${plugin.id}`, key),
        set: (key, value) => this.settings.set(`plugin.${plugin.id}`, key, value),
        subscribe: (listener) => this.settings.subscribeNamespace(`plugin.${plugin.id}`, listener)
      },
      commands: {
        register: (command) => {
          const unsubscribe = this.commandPalette.registry.register({ ...command, id: `plugin:${plugin.id}:${command.id}` });
          this.commandUnsubscribers.get(plugin.id)?.push(unsubscribe);
          return unsubscribe;
        }
      }
    };

    this.plugins.set(plugin.id, plugin);
    this.contexts.set(plugin.id, context);

    try {
      await plugin.init(context);
      this.bus.emit('plugin:registered', { id: plugin.id });
    } catch (error) {
      log.error(`Failed to initialize plugin "${plugin.id}"`, error);
      this.bus.emit('app:error', { source: `plugin:${plugin.id}`, error });
    }
  }

  mount(id: string, container: HTMLElement): void {
    const plugin = this.plugins.get(id);
    if (!plugin?.mount) return;
    plugin.mount(container);
    this.mountedContainers.set(id, container);
    this.bus.emit('plugin:mounted', { id });
  }

  unmount(id: string): void {
    const plugin = this.plugins.get(id);
    plugin?.unmount?.();
    this.mountedContainers.delete(id);
  }

  async unregister(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) return;
    plugin.destroy();
    for (const unsubscribe of this.commandUnsubscribers.get(id) ?? []) unsubscribe();
    this.commandUnsubscribers.delete(id);
    this.plugins.delete(id);
    this.contexts.delete(id);
    this.mountedContainers.delete(id);
    this.bus.emit('plugin:destroyed', { id });
  }

  get(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  list(): Plugin[] {
    return [...this.plugins.values()];
  }

  listWidgets(): Plugin[] {
    return this.list().filter((plugin) => plugin.widget);
  }
}
