import type { Application } from '@app/Application';
import { h, clearChildren } from '@core/dom/h';
import { icons } from '@core/dom/icons';
import type { SettingsSection } from '@core/settings/SettingsSchema';
import { renderField } from './renderField';
import { renderWallpaperExtras } from './WallpaperExtras';
import { renderGeneralSection } from './GeneralSection';
import './styles.css';

interface PanelSection {
  id: string;
  title: string;
  description?: string;
  keywords?: string[];
  render: () => HTMLElement;
}

/**
 * The single settings surface for the entire app: a slide-in overlay, no
 * "Save" button, every control writes straight through SettingsManager and
 * takes effect immediately via the reactive subscriptions each engine/plugin
 * already set up. New plugin settings appear automatically — nothing here
 * needs to change when a plugin adds a field.
 */
export class SettingsPanel {
  private root: HTMLElement;
  private backdrop: HTMLElement;
  private sidebar: HTMLElement;
  private content: HTMLElement;
  private activeSectionId = 'general';
  private isOpen = false;
  private searchQuery = '';
  private searchInput: HTMLInputElement;

  constructor(private app: Application) {
    this.content = h('div', { class: 'ws-settings-panel__content' });
    this.sidebar = h('nav', { class: 'ws-settings-panel__sidebar' });
    this.searchInput = h('input', {
      class: 'ws-settings-panel__search-input',
      type: 'text',
      placeholder: 'Search settings…',
      'aria-label': 'Search settings',
      autocomplete: 'off',
      oninput: (event: Event) => {
        this.searchQuery = (event.target as HTMLInputElement).value.trim().toLowerCase();
        this.renderSidebar();
      }
    }) as HTMLInputElement;

    const closeBtn = h(
      'button',
      { class: 'ws-chrome__btn ws-motion-press', type: 'button', 'aria-label': 'Close settings', onclick: () => this.close() },
      [icons.close()]
    );
    const header = h('div', { class: 'ws-settings-panel__header' }, [h('h2', {}, ['Settings']), closeBtn]);
    const searchWrapper = h('div', { class: 'ws-settings-panel__search' }, [this.searchInput]);
    const sidebarColumn = h('div', { class: 'ws-settings-panel__sidebar-column' }, [searchWrapper, this.sidebar]);

    const panel = h('div', { class: 'ws-settings-panel', role: 'dialog', 'aria-label': 'Settings' }, [
      header,
      h('div', { class: 'ws-settings-panel__body' }, [sidebarColumn, this.content])
    ]);

    this.backdrop = h('div', { class: 'ws-settings-backdrop', onclick: () => this.close() }, [panel]);
    panel.addEventListener('click', (event) => event.stopPropagation());
    this.root = this.backdrop;
    // The backdrop only fades out visually (opacity/pointer-events) when
    // closed — `inert` is what actually removes every control inside it
    // (nav items, every setting field, the close button) from the Tab
    // order and the accessibility tree, so a keyboard user tabbing past
    // the panel doesn't land on invisible, unreachable-by-mouse controls.
    this.root.inert = true;
  }

  mount(container: HTMLElement): void {
    container.append(this.root);
    // Listens for open requests from anywhere (e.g. a plugin command jumping
    // straight to its own settings section). Closing never needs to travel
    // through the bus — it's always user-initiated from within this view —
    // so there's no matching 'settings-panel:close' listener here (that
    // would recurse: close() emits the event it listens for).
    this.app.bus.on('settings-panel:open', ({ section }) => this.open(section));

    // Re-render the visible section's fields if something changed a value
    // other than the field currently being interacted with (e.g. picking a
    // theme preset re-seeds several other fields at once) — otherwise
    // sliders/inputs would show stale positions until the section was
    // reopened. We deliberately skip re-rendering the field the user is
    // actively dragging/typing in: rebuilding its DOM node mid-interaction
    // would drop native pointer capture / cursor position.
    this.app.bus.on('settings:changed', ({ key }) => {
      if (!this.isOpen || !key.startsWith(`${this.activeSectionId}.`)) return;
      const fieldKey = key.slice(this.activeSectionId.length + 1);
      const activeId = (document.activeElement as HTMLElement | null)?.id;
      if (activeId === `field-${fieldKey}`) return;
      this.renderContent();
    });
  }

  open(section?: string): void {
    this.isOpen = true;
    this.activeSectionId = section ?? this.activeSectionId;
    this.searchQuery = '';
    this.searchInput.value = '';
    this.renderSidebar();
    this.renderContent();
    this.root.inert = false;
    // A pure CSS transition (see styles.css) rather than a one-shot WAAPI
    // call — keeps this overlay's entrance driven by the same `.is-open`
    // class pattern as the command palette instead of a second mechanism.
    this.root.classList.add('is-open');
  }

  close(): void {
    this.isOpen = false;
    this.root.classList.remove('is-open');
    this.root.inert = true;
    this.app.bus.emit('settings-panel:close', undefined);
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  private getPanelSections(): PanelSection[] {
    const general: PanelSection = {
      id: 'general',
      title: 'General',
      keywords: ['workspace', 'export', 'import', 'reset', 'layout'],
      render: () => renderGeneralSection(this.app)
    };

    const schemaSections: PanelSection[] = this.app.settings.getSections().map((section) => ({
      id: section.namespace,
      title: section.title,
      description: section.description,
      keywords: section.fields.map((field) => field.label),
      render: () => this.renderSchemaSection(section)
    }));

    return [general, ...schemaSections];
  }

  private getMatchingSections(): PanelSection[] {
    if (!this.searchQuery) return this.getPanelSections();
    return this.getPanelSections().filter((section) => {
      const haystack = [section.title, section.description ?? '', ...(section.keywords ?? [])].join(' ').toLowerCase();
      return haystack.includes(this.searchQuery);
    });
  }

  private renderSchemaSection(section: SettingsSection): HTMLElement {
    const wrapper = h('div', { class: 'ws-settings-section' });
    const ctx = {
      getValue: (key: string) => this.app.settings.get(section.namespace, key),
      setValue: (key: string, value: unknown) => this.app.settings.set(section.namespace, key, value),
      allValues: () => this.app.settings.getNamespace(section.namespace)
    };
    for (const field of section.fields) {
      if (field.hiddenInPanel) continue;
      wrapper.append(renderField(field, ctx));
    }
    if (section.namespace === 'wallpaper') wrapper.append(renderWallpaperExtras(this.app));
    return wrapper;
  }

  private renderSidebar(): void {
    clearChildren(this.sidebar);
    const matches = this.getMatchingSections();

    if (matches.length === 0) {
      this.sidebar.append(h('p', { class: 'ws-settings-panel__no-matches' }, ['No matches']));
      return;
    }

    // Search can filter the currently active section right out of the
    // list — jump to the first match so the content pane never shows a
    // section that isn't even visible in the nav beside it.
    if (!matches.some((section) => section.id === this.activeSectionId)) {
      this.activeSectionId = matches[0]!.id;
      this.renderContent();
    }

    for (const section of matches) {
      const btn = h(
        'button',
        {
          class: `ws-settings-panel__nav-item ws-motion-shimmer${section.id === this.activeSectionId ? ' is-active' : ''}`,
          type: 'button',
          onclick: () => {
            this.activeSectionId = section.id;
            this.renderSidebar();
            this.renderContent();
          }
        },
        [section.title]
      );
      this.sidebar.append(btn);
    }
  }

  private renderContent(): void {
    clearChildren(this.content);
    const section = this.getPanelSections().find((entry) => entry.id === this.activeSectionId) ?? this.getPanelSections()[0]!;
    const heading = h('div', { class: 'ws-settings-panel__section-heading' }, [
      h('h3', {}, [section.title]),
      section.description ? h('p', {}, [section.description]) : null
    ]);
    const inner = h('div', { class: 'ws-settings-panel__content-inner' }, [heading, section.render()]);
    this.content.append(inner);
  }
}
