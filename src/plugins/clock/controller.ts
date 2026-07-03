import type { PluginContext } from '@core/plugins/Plugin';
import { createClockView, type ClockState, type ClockView } from './view';

export class ClockController {
  private view: ClockView | null = null;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private unsubscribeSettings: (() => void) | null = null;

  constructor(private context: PluginContext) {}

  mount(container: HTMLElement): void {
    this.view = createClockView();
    container.append(this.view.root);
    this.tick();

    this.unsubscribeSettings = this.context.settings.subscribe(() => this.tick());
  }

  unmount(): void {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = null;
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
    this.view?.root.remove();
    this.view = null;
  }

  private readState(): ClockState {
    return {
      use24Hour: this.context.settings.get('use24Hour'),
      showSeconds: this.context.settings.get('showSeconds'),
      showDate: this.context.settings.get('showDate'),
      style: this.context.settings.get('style'),
      sizeScale: this.context.settings.get('sizeScale'),
      uppercaseDate: this.context.settings.get('uppercaseDate')
    };
  }

  private tick = (): void => {
    if (!this.view) return;
    const state = this.readState();
    const now = new Date();
    this.view.update(now, state);

    if (this.timerId) clearTimeout(this.timerId);
    const msToNextTick = state.showSeconds ? 1000 - now.getMilliseconds() : 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    this.timerId = setTimeout(this.tick, msToNextTick);
  };
}
