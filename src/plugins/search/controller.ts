import type { PluginContext } from '@core/plugins/Plugin';
import { evaluateExpression, formatCalculatorResult } from './calculator';
import { buildSearchUrl, resolveProviderForQuery, SEARCH_PROVIDERS, type SearchProvider } from './providers';
import { convertUnits, formatConversionResult } from './unitConversion';
import { createSearchView, type SearchView } from './view';

const MAX_RECENT = 6;

export class SearchController {
  private view: SearchView | null = null;
  private unsubscribeSettings: (() => void) | null = null;
  private recent: string[] = [];
  private inlineResultText: string | null = null;

  constructor(private context: PluginContext) {}

  async mount(container: HTMLElement): Promise<void> {
    this.recent = await this.context.storage.get<string[]>('recent', []);

    this.view = createSearchView({
      onSubmit: (query) => this.submit(query),
      onCopyResult: () => this.copyInlineResult(),
      onPickRecent: (query) => this.submit(query)
    });
    this.view.input.addEventListener('input', () => this.updateHint());
    this.view.input.addEventListener('focus', () => this.context.bus.emit('search:focus', undefined));
    this.view.input.addEventListener('blur', () => this.context.bus.emit('search:blur', undefined));
    container.append(this.view.root);
    this.applySettings();
    this.view.setRecent(this.recent);

    this.unsubscribeSettings = this.context.settings.subscribe(() => this.applySettings());
  }

  unmount(): void {
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
    this.view?.root.remove();
    this.view = null;
  }

  focus(): void {
    this.view?.input.focus();
  }

  private getProviders(): SearchProvider[] {
    const customTemplate = this.context.settings.get<string>('customUrlTemplate');
    if (!customTemplate) return SEARCH_PROVIDERS;
    return [...SEARCH_PROVIDERS, { id: 'custom', name: 'Custom', urlTemplate: customTemplate, shortcut: 'c' }];
  }

  private getDefaultProvider(): SearchProvider {
    const id = this.context.settings.get<string>('defaultProvider');
    return this.getProviders().find((provider) => provider.id === id) ?? SEARCH_PROVIDERS[0]!;
  }

  private applySettings(): void {
    if (!this.view) return;
    this.view.setPlaceholder(this.context.settings.get<string>('placeholder'));
    this.updateHint();
  }

  /** Checks the raw input for a calculator expression or unit conversion before falling back to provider routing. */
  private updateHint(): void {
    if (!this.view) return;
    const raw = this.view.input.value.trim();
    if (!raw) {
      this.view.setInlineResult(null);
      this.view.setProviderHint(null);
      this.inlineResultText = null;
      return;
    }

    const calc = evaluateExpression(raw);
    if (calc !== null) {
      this.inlineResultText = formatCalculatorResult(calc);
      this.view.setInlineResult(`= ${this.inlineResultText}`);
      return;
    }

    const conversion = convertUnits(raw);
    if (conversion !== null) {
      this.inlineResultText = formatConversionResult(conversion);
      this.view.setInlineResult(`= ${this.inlineResultText}`);
      return;
    }

    this.inlineResultText = null;
    this.view.setInlineResult(null);
    const { provider } = resolveProviderForQuery(raw, this.getProviders(), this.getDefaultProvider());
    this.view.setProviderHint(provider.name);
  }

  private async copyInlineResult(): Promise<void> {
    if (!this.inlineResultText || !this.view) return;
    try {
      await navigator.clipboard.writeText(this.inlineResultText);
      this.view.flashCopied();
    } catch {
      this.context.logger.warn('Clipboard write failed — clipboard-write permission unavailable.');
    }
  }

  private submit(raw: string): void {
    const { provider, query } = resolveProviderForQuery(raw, this.getProviders(), this.getDefaultProvider());
    if (!query.trim()) return;

    const url = buildSearchUrl(provider, query.trim());
    this.context.bus.emit('search:submit', { query: query.trim(), providerId: provider.id });
    this.rememberRecent(raw.trim());

    if (this.context.settings.get<boolean>('openInNewTab')) {
      window.open(url, '_blank', 'noopener');
    } else {
      window.location.href = url;
    }
  }

  private rememberRecent(query: string): void {
    this.recent = [query, ...this.recent.filter((entry) => entry.toLowerCase() !== query.toLowerCase())].slice(0, MAX_RECENT);
    void this.context.storage.set('recent', this.recent);
    this.view?.setRecent(this.recent);
  }
}
