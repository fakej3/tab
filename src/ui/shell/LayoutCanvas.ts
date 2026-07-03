import type { Application } from '@app/Application';
import { h } from '@core/dom/h';
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
export class LayoutCanvas {
  private container: HTMLElement;
  private handles = new Map<string, WidgetHandle>();
  private unsubscribeLayout: () => void;
  private unsubscribeEditMode: () => void;
  private resizeObserver: ResizeObserver;

  constructor(
    container: HTMLElement,
    private app: Application
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
      [widget.locked ? '🔒' : '🔓']
    );
    const hideBtn = h(
      'button',
      {
        class: 'ws-widget__btn ws-motion-press',
        type: 'button',
        title: widget.hidden ? 'Show' : 'Hide',
        onclick: () => this.app.layout.toggleHidden(widget.instanceId)
      },
      [widget.hidden ? '🙈' : '👁']
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

    const onMove = (moveEvent: PointerEvent) => {
      const delta = pixelsToGridDelta(
        { x: moveEvent.clientX - startX, y: moveEvent.clientY - startY },
        this.app.layout.gridConfig,
        columnWidth
      );
      this.app.layout.moveWidget(widget.instanceId, widget.x + delta.x, widget.y + delta.y);
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

    const onMove = (moveEvent: PointerEvent) => {
      const delta = pixelsToGridDelta(
        { x: moveEvent.clientX - startX, y: moveEvent.clientY - startY },
        this.app.layout.gridConfig,
        columnWidth
      );
      this.app.layout.resizeWidget(widget.instanceId, widget.w + delta.x, widget.h + delta.y);
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
