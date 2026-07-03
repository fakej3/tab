import type { Application } from '@app/Application';
import { h, clearChildren } from '@core/dom/h';
import { icons } from '@core/dom/icons';
import type { Command } from '@core/command-palette/CommandRegistry';
import './styles.css';

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
      oninput: () => this.updateResults()
    }) as HTMLInputElement;

    this.list = h('div', { class: 'ws-palette__list', role: 'listbox' });

    const panel = h('div', { class: 'ws-palette ws-glass', role: 'combobox', 'aria-expanded': 'true' }, [
      h('div', { class: 'ws-palette__input-row' }, [icons.search(), this.input]),
      this.list
    ]);
    panel.addEventListener('click', (event) => event.stopPropagation());

    this.root = h('div', { class: 'ws-palette-backdrop', onclick: () => this.app.commandPalette.close() }, [panel]);

    this.root.addEventListener('keydown', (event) => this.handleKeydown(event as KeyboardEvent));
  }

  mount(container: HTMLElement): void {
    container.append(this.root);
    this.app.commandPalette.subscribe((open) => {
      this.root.classList.toggle('is-open', open);
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
      this.list.append(h('div', { class: 'ws-palette__empty' }, ['No matching commands']));
      return;
    }
    this.results.forEach((command, index) => {
      const item = h(
        'button',
        {
          class: `ws-palette__item${index === this.activeIndex ? ' is-active' : ''}`,
          type: 'button',
          role: 'option',
          onclick: () => this.run(command)
        },
        [
          h('span', { class: 'ws-palette__item-title' }, [command.title]),
          h('span', { class: 'ws-palette__item-group' }, [command.group])
        ]
      );
      this.list.append(item);
    });
  }

  private run(command: Command): void {
    this.app.commandPalette.close();
    command.perform();
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.results.length - 1);
      this.renderList();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
      this.renderList();
    } else if (event.key === 'Enter') {
      const command = this.results[this.activeIndex];
      if (command) this.run(command);
    }
  }
}
