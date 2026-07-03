import type { PluginContext } from '@core/plugins/Plugin';
import { debounce } from '@core/utils/debounce';
import { createNotesView, type NotesView } from './view';

export class NotesController {
  private view: NotesView | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  private persist = debounce((value: string) => void this.context.storage.set('content', value), 300);

  constructor(private context: PluginContext) {}

  async mount(container: HTMLElement): Promise<void> {
    this.view = createNotesView((value) => this.persist(value));
    container.append(this.view.root);

    this.view.textarea.value = await this.context.storage.get<string>('content', '');
    this.applySettings();
    this.unsubscribeSettings = this.context.settings.subscribe(() => this.applySettings());
  }

  unmount(): void {
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
    this.view?.root.remove();
    this.view = null;
  }

  private applySettings(): void {
    this.view?.setFont(this.context.settings.get<string>('fontStyle'));
  }
}
