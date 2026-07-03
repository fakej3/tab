import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import { signal } from '@core/state/signal';
import type { StorageService } from '@core/storage/StorageService';
import { StorageKeys } from '@core/storage/StorageKeys';
import { debounce } from '@core/utils/debounce';
import { defaultsFromSection, type SettingsSection } from './SettingsSchema';

type SettingsValues = Record<string, Record<string, unknown>>;

const PERSIST_DEBOUNCE_MS = 250;

/**
 * Single source of truth for every customizable value in the app.
 *
 * - Core engines and plugins call `registerSection` once at init to declare
 *   their schema + defaults. This is what makes new customization additive:
 *   no central file to edit, no migration to write for unrelated features.
 * - Values live in one reactive store keyed by `namespace.fieldKey` and are
 *   persisted to StorageService (debounced) — there is no explicit "Save".
 */
export class SettingsManager {
  private sections = new Map<string, SettingsSection>();
  private values = signal<SettingsValues>({});
  private loaded = false;
  private persist = debounce(() => {
    void this.storage.set(StorageKeys.settings, this.values.peek());
  }, PERSIST_DEBOUNCE_MS);

  constructor(
    private storage: StorageService,
    private bus: EventBus<WorkspaceEvents>
  ) {}

  async load(): Promise<void> {
    const persisted = await this.storage.get<SettingsValues>(StorageKeys.settings, {});
    this.values.set(persisted);
    this.loaded = true;
  }

  /** Register a section's schema and seed any missing keys with defaults. Idempotent. */
  registerSection(section: SettingsSection): void {
    this.sections.set(section.namespace, section);
    const defaults = defaultsFromSection(section);
    this.values.set((prev) => {
      const existing = prev[section.namespace] ?? {};
      const merged = { ...defaults, ...existing };
      if (shallowEqual(existing, merged)) return prev;
      return { ...prev, [section.namespace]: merged };
    });
  }

  getSections(): SettingsSection[] {
    return [...this.sections.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  getSection(namespace: string): SettingsSection | undefined {
    return this.sections.get(namespace);
  }

  get<T>(namespace: string, key: string): T {
    const section = this.values.peek()[namespace];
    return section?.[key] as T;
  }

  getNamespace(namespace: string): Record<string, unknown> {
    return this.values.peek()[namespace] ?? {};
  }

  set(namespace: string, key: string, value: unknown): void {
    this.values.set((prev) => ({
      ...prev,
      [namespace]: { ...prev[namespace], [key]: value }
    }));
    if (this.loaded) this.persist();
    this.bus.emit('settings:changed', { key: `${namespace}.${key}`, value });
  }

  /** Subscribe to changes within one namespace (used by engines like Theme/Animation to react live). */
  subscribeNamespace(namespace: string, listener: (values: Record<string, unknown>) => void): () => void {
    let previous = this.values.peek()[namespace];
    return this.values.subscribe((all) => {
      const next = all[namespace];
      if (next !== previous) {
        previous = next;
        listener(next ?? {});
      }
    });
  }

  async resetSection(namespace: string): Promise<void> {
    const section = this.sections.get(namespace);
    if (!section) return;
    this.values.set((prev) => ({ ...prev, [namespace]: defaultsFromSection(section) }));
    this.persist();
  }

  async resetAll(): Promise<void> {
    const defaults: SettingsValues = {};
    for (const section of this.sections.values()) defaults[section.namespace] = defaultsFromSection(section);
    this.values.set(defaults);
    await this.storage.set(StorageKeys.settings, defaults);
    this.bus.emit('settings:reset', undefined);
  }

  export(): string {
    return JSON.stringify(this.values.peek(), null, 2);
  }

  async import(json: string): Promise<void> {
    const parsed = JSON.parse(json) as SettingsValues;
    this.values.set(parsed);
    await this.storage.set(StorageKeys.settings, parsed);
  }
}

function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
}
