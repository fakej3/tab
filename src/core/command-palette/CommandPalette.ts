import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import { signal } from '@core/state/signal';
import { CommandRegistry } from './CommandRegistry';

/**
 * Open/close + keyboard-shortcut state for the command palette. Rendering
 * lives in `ui/command-palette` — this class is pure behavior so it stays
 * testable and portable.
 */
export class CommandPalette {
  readonly registry = new CommandRegistry();
  private open = signal(false);

  constructor(private bus: EventBus<WorkspaceEvents>) {}

  init(): void {
    window.addEventListener('keydown', (event) => {
      const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isModK) {
        event.preventDefault();
        this.toggle();
      } else if (event.key === 'Escape' && this.open.peek()) {
        this.close();
      }
    });
  }

  isOpen(): boolean {
    return this.open();
  }

  subscribe(listener: (open: boolean) => void): () => void {
    return this.open.subscribe(listener);
  }

  show(): void {
    this.open.set(true);
    this.bus.emit('command-palette:open', undefined);
  }

  close(): void {
    this.open.set(false);
    this.bus.emit('command-palette:close', undefined);
  }

  toggle(): void {
    if (this.open.peek()) this.close();
    else this.show();
  }
}
