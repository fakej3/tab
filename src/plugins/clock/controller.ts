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
      uppercaseDate: this.context.settings.get('uppercaseDate'),
      pulseSeconds: this.context.settings.get('pulseSeconds')
    };
  }

  private tick = (): void => {
    if (!this.view) return;
    const state = this.readState();
    const now = new Date();
    this.view.update(now, state);

    // Always aligned to the next second boundary — even when seconds aren't
    // displayed, the signature colon pulse (see view.ts) still needs a
    // once-a-second heartbeat, and re-formatting a date string every second
    // is negligible cost.
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(this.tick, 1000 - now.getMilliseconds());
  };
}
