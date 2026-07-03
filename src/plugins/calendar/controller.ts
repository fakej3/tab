import type { PluginContext } from '@core/plugins/Plugin';
import { createCalendarView, type CalendarView } from './view';

export class CalendarController {
  private view: CalendarView | null = null;
  private unsubscribeSettings: (() => void) | null = null;

  constructor(private context: PluginContext) {}

  mount(container: HTMLElement): void {
    this.view = createCalendarView();
    container.append(this.view.root);
    this.render();
    this.unsubscribeSettings = this.context.settings.subscribe(() => this.render());
  }

  unmount(): void {
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
    this.view?.root.remove();
    this.view = null;
  }

  private render(): void {
    this.view?.render(new Date(), this.context.settings.get<boolean>('startOnMonday'));
  }
}
