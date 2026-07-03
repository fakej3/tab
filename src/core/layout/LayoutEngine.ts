import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import { signal } from '@core/state/signal';
import type { StorageService } from '@core/storage/StorageService';
import { StorageKeys } from '@core/storage/StorageKeys';
import { createId } from '@core/utils/id';
import { debounce } from '@core/utils/debounce';
import { clampRectToGrid, findFreeSlot, hasCollision } from './grid';
import { DEFAULT_GRID_CONFIG, type GridConfig, type WidgetLayout, type WorkspaceLayout } from './LayoutTypes';
import type { WidgetDescriptor } from '@core/plugins/Plugin';

const WORKSPACE_PRESETS: Array<Pick<WorkspaceLayout, 'id' | 'name' | 'icon'>> = [
  { id: 'minimal', name: 'Minimal', icon: 'minimal' },
  { id: 'work', name: 'Work', icon: 'work' },
  { id: 'study', name: 'Study', icon: 'study' },
  { id: 'coding', name: 'Coding', icon: 'coding' },
  { id: 'music', name: 'Music', icon: 'music' }
];

function createEmptyWorkspace(id: string, name: string, icon: string): WorkspaceLayout {
  return { id, name, icon, widgets: [] };
}

const PERSIST_DEBOUNCE_MS = 300;

/**
 * Owns widget placement across one or more named workspaces (Work, Study,
 * Coding, ...). Plugins never know their own screen position — they call
 * `registerWidget` once and the engine decides where they land; the UI layer
 * (LayoutCanvas) is the only thing that turns pointer drags into
 * `moveWidget`/`resizeWidget` calls.
 */
export class LayoutEngine {
  readonly gridConfig: GridConfig = DEFAULT_GRID_CONFIG;
  private workspaces = signal<WorkspaceLayout[]>([]);
  private activeId = signal<string>('minimal');
  private editMode = signal(false);
  private widgetDescriptors = new Map<string, WidgetDescriptor>();
  private persist = debounce(() => {
    void this.storage.set(StorageKeys.layouts, this.workspaces.peek());
    void this.storage.set(StorageKeys.activeWorkspace, this.activeId.peek());
  }, PERSIST_DEBOUNCE_MS);

  constructor(
    private storage: StorageService,
    private bus: EventBus<WorkspaceEvents>
  ) {}

  async load(): Promise<void> {
    const defaults = WORKSPACE_PRESETS.map((preset) => createEmptyWorkspace(preset.id, preset.name, preset.icon));
    const stored = await this.storage.get<WorkspaceLayout[]>(StorageKeys.layouts, defaults);
    this.workspaces.set(stored.length > 0 ? stored : defaults);
    const activeId = await this.storage.get<string>(StorageKeys.activeWorkspace, 'minimal');
    this.activeId.set(activeId);
  }

  /** Called by PluginManager when a widget-bearing plugin registers. Auto-places it if it isn't already laid out. */
  registerWidget(pluginId: string, descriptor: WidgetDescriptor): void {
    this.widgetDescriptors.set(pluginId, descriptor);
    this.workspaces.set((prev) =>
      prev.map((workspace) => {
        if (workspace.widgets.some((widget) => widget.pluginId === pluginId)) return workspace;
        const slot = findFreeSlot(workspace.widgets, descriptor.defaultSize, this.gridConfig.columns);
        const widget: WidgetLayout = {
          instanceId: createId('widget'),
          pluginId,
          locked: false,
          hidden: false,
          ...slot
        };
        return { ...workspace, widgets: [...workspace.widgets, widget] };
      })
    );
    this.persist();
  }

  getActiveWorkspaceId(): string {
    return this.activeId.peek();
  }

  getWorkspaces(): WorkspaceLayout[] {
    return this.workspaces();
  }

  getActiveWorkspace(): WorkspaceLayout {
    const id = this.activeId();
    return this.workspaces().find((workspace) => workspace.id === id) ?? this.workspaces()[0]!;
  }

  subscribe(listener: () => void): () => void {
    const unsubA = this.workspaces.subscribe(() => listener());
    const unsubB = this.activeId.subscribe(() => listener());
    return () => {
      unsubA();
      unsubB();
    };
  }

  setActiveWorkspace(id: string): void {
    this.activeId.set(id);
    this.persist();
    this.bus.emit('layout:changed', { workspaceId: id });
  }

  isEditMode(): boolean {
    return this.editMode();
  }

  subscribeEditMode(listener: (enabled: boolean) => void): () => void {
    return this.editMode.subscribe(listener);
  }

  setEditMode(enabled: boolean): void {
    this.editMode.set(enabled);
    this.bus.emit('layout:edit-mode', { enabled });
  }

  moveWidget(instanceId: string, x: number, y: number): void {
    this.mutateActiveWidget(instanceId, (widget, siblings) => {
      const maxRows = 200;
      const candidate = clampRectToGrid({ ...widget, x, y }, this.gridConfig.columns, maxRows);
      if (hasCollision(candidate, siblings)) return widget;
      return { ...widget, ...candidate };
    });
  }

  resizeWidget(instanceId: string, w: number, h: number): void {
    this.mutateActiveWidget(instanceId, (widget, siblings) => {
      const descriptor = this.widgetDescriptors.get(widget.pluginId);
      const minW = descriptor?.minSize?.w ?? 1;
      const minH = descriptor?.minSize?.h ?? 1;
      const maxW = descriptor?.maxSize?.w ?? this.gridConfig.columns;
      const maxH = descriptor?.maxSize?.h ?? 200;
      const candidate = clampRectToGrid(
        { ...widget, w: Math.max(minW, Math.min(maxW, w)), h: Math.max(minH, Math.min(maxH, h)) },
        this.gridConfig.columns,
        200
      );
      if (hasCollision(candidate, siblings)) return widget;
      return { ...widget, ...candidate };
    });
  }

  toggleLock(instanceId: string): void {
    this.mutateActiveWidget(instanceId, (widget) => ({ ...widget, locked: !widget.locked }));
  }

  toggleHidden(instanceId: string): void {
    this.mutateActiveWidget(instanceId, (widget) => ({ ...widget, hidden: !widget.hidden }));
  }

  private mutateActiveWidget(
    instanceId: string,
    updater: (widget: WidgetLayout, siblings: WidgetLayout[]) => WidgetLayout
  ): void {
    this.workspaces.set((prev) =>
      prev.map((workspace) => {
        if (workspace.id !== this.activeId.peek()) return workspace;
        const index = workspace.widgets.findIndex((widget) => widget.instanceId === instanceId);
        if (index === -1) return workspace;
        const siblings = workspace.widgets.filter((_, i) => i !== index);
        const nextWidget = updater(workspace.widgets[index]!, siblings);
        const widgets = [...workspace.widgets];
        widgets[index] = nextWidget;
        return { ...workspace, widgets };
      })
    );
    this.persist();
    this.bus.emit('layout:changed', { workspaceId: this.activeId.peek() });
  }

  exportLayouts(): string {
    return JSON.stringify({ workspaces: this.workspaces.peek(), activeId: this.activeId.peek() }, null, 2);
  }

  async importLayouts(json: string): Promise<void> {
    const parsed = JSON.parse(json) as { workspaces: WorkspaceLayout[]; activeId: string };
    this.workspaces.set(parsed.workspaces);
    this.activeId.set(parsed.activeId);
    await this.storage.set(StorageKeys.layouts, parsed.workspaces);
    await this.storage.set(StorageKeys.activeWorkspace, parsed.activeId);
  }
}
