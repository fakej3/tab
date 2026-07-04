import type { Application } from '@app/Application';
import { h } from '@core/dom/h';
import { icons } from '@core/dom/icons';
import { gridRectToPixels, pixelsToGridDelta } from '@core/layout/grid';
import type { WidgetLayout } from '@core/layout/LayoutTypes';

interface WidgetHandle {
  wrapper: HTMLElement;
  mountPoint: HTMLElement;
  overlay: HTMLElement;
}

/**
 * Renders the active workspace's widgets on a CSS-pixel-positioned grid and
 * translates pointer drags into `LayoutEngine.moveWidget`/`resizeWidget`
 * calls. This is the only place in the app that touches pointer events for
 * layout — plugins never know they're draggable.
 */
// Per-widget stagger step and cap for the first-load entrance below — kept
// small enough that even a full grid of widgets finishes settling well
// under a second alongside their own ~400ms reveal transition.
const ENTRANCE_STAGGER_STEP_MS = 35;
const ENTRANCE_STAGGER_MAX_MS = 280;

export class LayoutCanvas {
  private container: HTMLElement;
  private handles = new Map<string, WidgetHandle>();
  private unsubscribeLayout: () => void;
  private unsubscribeEditMode: () => void;
  private resizeObserver: ResizeObserver;
  private entranceWidgetCount = 0;

  constructor(
    container: HTMLElement,
    private app: Application,
    private playEntrance = false
  ) {
    this.container = container;
    this.container.classList.add('ws-layout-canvas');
    this.unsubscribeLayout = app.layout.subscribe(() => this.render());
    this.unsubscribeEditMode = app.layout.subscribeEditMode((enabled) => {
      this.container.classList.toggle('is-edit-mode', enabled);
      this.render();
    });
    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(this.container);
    this.render();
    // Only the widgets present at that very first render get staggered —
    // anything added later (enabling a plugin, editing layout) should just
    // appear normally, not replay a "grand entrance" for one new widget.
    this.playEntrance = false;
  }

  destroy(): void {
    this.unsubscribeLayout();
    this.unsubscribeEditMode();
    this.resizeObserver.disconnect();
  }

  private columnWidthPx(): number {
    const { columns, gapPx } = this.app.layout.gridConfig;
    const containerWidth = this.container.clientWidth;
    return (containerWidth - gapPx * (columns - 1)) / columns;
  }

  private render(): void {
    const workspace = this.app.layout.getActiveWorkspace();
    const editMode = this.app.layout.isEditMode();
    const visibleWidgets = workspace.widgets.filter((widget) => !widget.hidden || editMode);
    const seen = new Set<string>();

    for (const widget of visibleWidgets) {
      seen.add(widget.instanceId);
      let handle = this.handles.get(widget.instanceId);
      if (!handle) {
        handle = this.createHandle(widget);
        this.handles.set(widget.instanceId, handle);
        this.app.plugins.mount(widget.pluginId, handle.mountPoint);
      }
      this.positionHandle(handle, widget);
      this.updateOverlay(handle, widget, editMode);
    }

    for (const [instanceId, handle] of this.handles) {
      if (!seen.has(instanceId)) {
        const widget = workspace.widgets.find((w) => w.instanceId === instanceId);
        if (widget) this.app.plugins.unmount(widget.pluginId);
        handle.wrapper.remove();
        this.handles.delete(instanceId);
      }
    }
  }

  private createHandle(widget: WidgetLayout): WidgetHandle {
    const allowOverflow = this.app.plugins.get(widget.pluginId)?.widget?.allowOverflow;
    const mountPoint = h('div', { class: `ws-widget__content ws-glass${allowOverflow ? ' ws-widget__content--overflow-visible' : ''}` });
    const overlay = h('div', { class: 'ws-widget__overlay' });
    const wrapper = h('div', { class: 'ws-widget', 'data-plugin-id': widget.pluginId }, [mountPoint, overlay]);

    if (this.playEntrance) {
      const delay = Math.min(this.entranceWidgetCount * ENTRANCE_STAGGER_STEP_MS, ENTRANCE_STAGGER_MAX_MS);
      wrapper.style.setProperty('--ws-entrance-delay', `${delay}ms`);
      this.entranceWidgetCount += 1;
      // The delay only matters for that first reveal — clearing it once the
      // entrance transition has had time to finish means every later change
      // (hide/show, drag, resize) transitions immediately like normal.
      window.setTimeout(() => wrapper.style.removeProperty('--ws-entrance-delay'), delay + 500);
    }

    this.container.append(wrapper);
    return { wrapper, mountPoint, overlay };
  }

  private positionHandle(handle: WidgetHandle, widget: WidgetLayout): void {
    const { left, top, width, height } = gridRectToPixels(widget, this.app.layout.gridConfig, this.columnWidthPx());
    handle.wrapper.style.transform = `translate(${left}px, ${top}px)`;
    handle.wrapper.style.width = `${width}px`;
    handle.wrapper.style.height = `${height}px`;
    handle.wrapper.classList.toggle('is-hidden', widget.hidden);
    handle.wrapper.classList.toggle('is-locked', widget.locked);
  }

  private updateOverlay(handle: WidgetHandle, widget: WidgetLayout, editMode: boolean): void {
    handle.overlay.replaceChildren();
    if (!editMode) return;

    const dragSurface = h('div', { class: 'ws-widget__drag-surface' });
    if (!widget.locked) {
      dragSurface.addEventListener('pointerdown', (event) => this.beginDrag(event, widget));
    }

    const lockBtn = h(
      'button',
      {
        class: 'ws-widget__btn ws-motion-press',
        type: 'button',
        title: widget.locked ? 'Unlock' : 'Lock',
        onclick: () => this.app.layout.toggleLock(widget.instanceId)
      },
      [widget.locked ? icons.lock() : icons.unlock()]
    );
    const hideBtn = h(
      'button',
      {
        class: 'ws-widget__btn ws-motion-press',
        type: 'button',
        title: widget.hidden ? 'Show' : 'Hide',
        onclick: () => this.app.layout.toggleHidden(widget.instanceId)
      },
      [widget.hidden ? icons.eyeOff() : icons.eye()]
    );
    const controls = h('div', { class: 'ws-widget__controls' }, [lockBtn, hideBtn]);

    const resizeHandle = h('div', { class: 'ws-widget__resize-handle' });
    if (!widget.locked) resizeHandle.addEventListener('pointerdown', (event) => this.beginResize(event, widget));

    handle.overlay.append(dragSurface, controls, resizeHandle);
  }

  private beginDrag(event: PointerEvent, widget: WidgetLayout): void {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const columnWidth = this.columnWidthPx();
    const wrapper = this.handles.get(widget.instanceId)?.wrapper;
    wrapper?.classList.add('is-dragging');
    let wasBlocked = false;

    const onMove = (moveEvent: PointerEvent) => {
      const delta = pixelsToGridDelta(
        { x: moveEvent.clientX - startX, y: moveEvent.clientY - startY },
        this.app.layout.gridConfig,
        columnWidth
      );
      const moved = this.app.layout.moveWidget(widget.instanceId, widget.x + delta.x, widget.y + delta.y);
      // A rejected move (colliding with another widget) otherwise looks
      // exactly like the widget just not following the cursor, with no
      // explanation — flash it on the transition into "blocked" so it
      // reads as "that spot's taken," not as the drag being broken.
      if (!moved && !wasBlocked) flashBlocked(wrapper);
      wasBlocked = !moved;
    };
    const onUp = () => {
      wrapper?.classList.remove('is-dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  private beginResize(event: PointerEvent, widget: WidgetLayout): void {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const columnWidth = this.columnWidthPx();
    const wrapper = this.handles.get(widget.instanceId)?.wrapper;
    wrapper?.classList.add('is-dragging');
    let wasBlocked = false;

    const onMove = (moveEvent: PointerEvent) => {
      const delta = pixelsToGridDelta(
        { x: moveEvent.clientX - startX, y: moveEvent.clientY - startY },
        this.app.layout.gridConfig,
        columnWidth
      );
      const resized = this.app.layout.resizeWidget(widget.instanceId, widget.w + delta.x, widget.h + delta.y);
      if (!resized && !wasBlocked) flashBlocked(wrapper);
      wasBlocked = !resized;
    };
    const onUp = () => {
      wrapper?.classList.remove('is-dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }
}

const BLOCKED_FLASH_MS = 220;

/** Brief shake so a rejected move/resize reads as "that spot's taken" rather than the drag silently doing nothing. */
function flashBlocked(wrapper: HTMLElement | undefined): void {
  if (!wrapper) return;
  wrapper.classList.remove('is-drag-blocked');
  // Force a reflow so re-adding the class restarts the animation even if
  // it's still mid-flash from the previous blocked frame.
  void wrapper.offsetWidth;
  wrapper.classList.add('is-drag-blocked');
  window.setTimeout(() => wrapper.classList.remove('is-drag-blocked'), BLOCKED_FLASH_MS);
}
