import type { PluginContext } from '@core/plugins/Plugin';
import quotesData from './data/quotes.json';
import type { Quote } from './constants';
import { createQuoteView, type QuoteView } from './view';

const LOCAL_QUOTES = quotesData as Quote[];

interface QuotesStorageState {
  favoriteIds: string[];
  customQuotes: Quote[];
  currentQuoteId: string | null;
  lastRotatedAt: number;
}

export class QuotesController {
  private view: QuoteView | null = null;
  private state: QuotesStorageState = { favoriteIds: [], customQuotes: [], currentQuoteId: null, lastRotatedAt: 0 };
  private unsubscribeSettings: (() => void) | null = null;

  constructor(private context: PluginContext) {}

  async mount(container: HTMLElement): Promise<void> {
    this.state = await this.context.storage.get<QuotesStorageState>('state', this.state);

    this.view = createQuoteView({
      onToggleFavorite: () => this.toggleFavorite(),
      onAddCustom: (text, author) => this.addCustom(text, author)
    });
    container.append(this.view.root);

    this.maybeRotate();
    this.renderCurrent();

    this.unsubscribeSettings = this.context.settings.subscribe(() => this.renderCurrent());
  }

  unmount(): void {
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = null;
    this.view?.root.remove();
    this.view = null;
  }

  private pool(): Quote[] {
    const source = this.context.settings.get<string>('source');
    const all = [...LOCAL_QUOTES, ...this.state.customQuotes];
    if (source === 'favorites') return all.filter((quote) => this.state.favoriteIds.includes(quote.id));
    if (source === 'custom') return this.state.customQuotes;
    return all;
  }

  private maybeRotate(): void {
    const rotateEveryNewTab = this.context.settings.get<boolean>('rotateEveryNewTab');
    const intervalMinutes = this.context.settings.get<number>('rotateIntervalMinutes');
    const elapsedMs = Date.now() - this.state.lastRotatedAt;
    const shouldRotate = rotateEveryNewTab || elapsedMs > intervalMinutes * 60_000 || !this.state.currentQuoteId;
    if (!shouldRotate) return;

    const pool = this.pool();
    if (pool.length === 0) {
      this.state.currentQuoteId = null;
    } else {
      const others = pool.filter((quote) => quote.id !== this.state.currentQuoteId);
      const candidates = others.length > 0 ? others : pool;
      this.state.currentQuoteId = candidates[Math.floor(Math.random() * candidates.length)]!.id;
    }
    this.state.lastRotatedAt = Date.now();
    this.persist();
  }

  private currentQuote(): Quote | null {
    return this.pool().find((quote) => quote.id === this.state.currentQuoteId) ?? this.pool()[0] ?? null;
  }

  private renderCurrent(): void {
    if (!this.view) return;
    const quote = this.currentQuote();
    const showAuthor = this.context.settings.get<boolean>('showAuthor');
    this.view.render(quote, quote ? this.state.favoriteIds.includes(quote.id) : false, showAuthor);
  }

  private toggleFavorite(): void {
    const quote = this.currentQuote();
    if (!quote) return;
    this.state.favoriteIds = this.state.favoriteIds.includes(quote.id)
      ? this.state.favoriteIds.filter((id) => id !== quote.id)
      : [...this.state.favoriteIds, quote.id];
    this.persist();
    this.renderCurrent();
  }

  private addCustom(text: string, author: string): void {
    const quote: Quote = { id: `custom_${Date.now()}`, text, author };
    this.state.customQuotes = [...this.state.customQuotes, quote];
    this.state.currentQuoteId = quote.id;
    this.state.lastRotatedAt = Date.now();
    this.persist();
    this.renderCurrent();
  }

  private persist(): void {
    void this.context.storage.set('state', this.state);
  }
}
