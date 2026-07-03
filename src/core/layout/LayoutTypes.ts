export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetLayout extends GridRect {
  /** Currently 1:1 with a plugin id. Kept distinct from `pluginId` so multi-instance widgets (duplicate) can land later without a data migration. */
  instanceId: string;
  pluginId: string;
  locked: boolean;
  hidden: boolean;
}

export interface WorkspaceLayout {
  id: string;
  name: string;
  icon: string;
  widgets: WidgetLayout[];
}

export interface GridConfig {
  columns: number;
  rowHeightPx: number;
  gapPx: number;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 12,
  rowHeightPx: 32,
  gapPx: 18
};
