import type { Application } from '@app/Application';
import { h, clearChildren } from '@core/dom/h';
import { icons } from '@core/dom/icons';
import type { Command } from '@core/command-palette/CommandRegistry';
import './styles.css';

const LIST_ID = 'ws-palette-list';

/**
 * Renders the ⌘K overlay. Purely a view over `CommandPalette` +
 * `CommandRegistry` — it has no idea what commands exist or where they came
 * from (core engine or plugin).
 */
export class CommandPaletteView {
  private root: HTMLElement;
  private input: HTMLInputElement;
  private list: HTMLElement;
  private activeIndex = 0;
  private results: Command[] = [];

  constructor(private app: Application) {
    this.input = h('input', {
      class: 'ws-palette__input',
      type: 'text',
      placeholder: 'Type a command…',
      autocomplete: 'off',
      role: 'combobox',
      'aria-expanded': 'true',
      'aria-controls': LIST_ID,
      'aria-autocomplete': 'list',
      oninput: () => this.updateResults()
    }) as HTMLInputElement;

    this.list = h('div', { class: 'ws-palette__list', role: 'listbox', id: LIST_ID, 'aria-label': 'Commands' });

    const panel = h('div', { class: 'ws-palette ws-glass' }, [h('div', { class: 'ws-palette__input-row' }, [icons.search(), this.input]), this.list]);
    panel.addEventListener('click', (event) => event.stopPropagation());

    this.root = h('div', { class: 'ws-palette-backdrop', onclick: () => this.app.commandPalette.close() }, [panel]);
    // Fading out via opacity/pointer-events leaves every control inside
    // still reachable by Tab — `inert` is what actually pulls the palette
    // out of the tab order and accessibility tree while closed.
    this.root.inert = true;

    this.root.addEventListener('keydown', (event) => this.handleKeydown(event as KeyboardEvent));
  }

  mount(container: HTMLElement): void {
    container.append(this.root);
    this.app.commandPalette.subscribe((open) => {
      this.root.classList.toggle('is-open', open);
      this.root.inert = !open;
      if (open) {
        this.input.value = '';
        this.activeIndex = 0;
        this.updateResults();
        requestAnimationFrame(() => this.input.focus());
      }
    });
  }

  private updateResults(): void {
    this.results = this.app.commandPalette.registry.search(this.input.value);
    this.activeIndex = 0;
    this.renderList();
  }

  private renderList(): void {
    clearChildren(this.list);
    if (this.results.length === 0) {
      this.input.removeAttribute('aria-activedescendant');
      this.list.append(h('div', { class: 'ws-palette__empty' }, ['No matching commands']));
      return;
    }
    this.results.forEach((command, index) => {
      const item = h(
        'button',
        {
          id: `${LIST_ID}-${index}`,
          class: `ws-palette__item ws-motion-shimmer${index === this.activeIndex ? ' is-active' : ''}`,
          type: 'button',
          role: 'option',
          'aria-selected': String(index === this.activeIndex),
          onmouseenter: () => this.setActiveIndex(index, false),
          onclick: () => this.run(command)
        },
        [
          h('span', { class: 'ws-palette__item-title' }, [command.title]),
          h('span', { class: 'ws-palette__item-group ws-label' }, [command.group])
        ]
      );
      this.list.append(item);
    });
    this.input.setAttribute('aria-activedescendant', `${LIST_ID}-${this.activeIndex}`);
  }

  /** Re-highlights the active row without rebuilding the list — arrow-key navigation shouldn't reset hover/shimmer state or thrash the DOM. */
  private setActiveIndex(index: number, scrollIntoView: boolean): void {
    this.activeIndex = index;
    const items = this.list.querySelectorAll('.ws-palette__item');
    items.forEach((item, itemIndex) => {
      const isActive = itemIndex === index;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-selected', String(isActive));
    });
    this.input.setAttribute('aria-activedescendant', `${LIST_ID}-${index}`);
    if (scrollIntoView) items[index]?.scrollIntoView({ block: 'nearest' });
  }

  private run(command: Command): void {
    this.app.commandPalette.close();
    command.perform();
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.setActiveIndex(Math.min(this.activeIndex + 1, this.results.length - 1), true);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.setActiveIndex(Math.max(this.activeIndex - 1, 0), true);
    } else if (event.key === 'Enter') {
      const command = this.results[this.activeIndex];
      if (command) this.run(command);
    }
  }
}
