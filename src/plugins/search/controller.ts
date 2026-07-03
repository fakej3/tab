import type { PluginContext } from '@core/plugins/Plugin';
import { buildSearchUrl, resolveProviderForQuery, SEARCH_PROVIDERS, type SearchProvider } from './providers';
import { createSearchView, type SearchView } from './view';

export class SearchController {
  private view: SearchView | null = null;
  private unsubscribeSettings: (() => void) | null = null;

  constructor(private context: PluginContext) {}

  mount(container: HTMLElement): void {
    this.view = createSearchView((query) => this.submit(query));
    this.view.input.addEventListener('input', () => this.updateHint());
    container.append(this.view.root);
    this.applySettings();

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

  private updateHint(): void {
    if (!this.view) return;
    const raw = this.view.input.value.trim();
    if (!raw) {
      this.view.setProviderHint(null);
      return;
    }
    const { provider } = resolveProviderForQuery(raw, this.getProviders(), this.getDefaultProvider());
    this.view.setProviderHint(provider.name);
  }

  private submit(raw: string): void {
    const { provider, query } = resolveProviderForQuery(raw, this.getProviders(), this.getDefaultProvider());
    if (!query.trim()) return;

    const url = buildSearchUrl(provider, query.trim());
    this.context.bus.emit('search:submit', { query: query.trim(), providerId: provider.id });

    if (this.context.settings.get<boolean>('openInNewTab')) {
      window.open(url, '_blank', 'noopener');
    } else {
      window.location.href = url;
    }
  }
}
