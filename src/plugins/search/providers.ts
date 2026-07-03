export interface SearchProvider {
  id: string;
  name: string;
  /** `%s` is replaced with the URI-encoded query. */
  urlTemplate: string;
  /** Typing this prefix followed by a space routes the query to this provider for one search, regardless of the default. */
  shortcut: string;
}

export const SEARCH_PROVIDERS: SearchProvider[] = [
  { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q=%s', shortcut: 'g' },
  { id: 'duckduckgo', name: 'DuckDuckGo', urlTemplate: 'https://duckduckgo.com/?q=%s', shortcut: 'ddg' },
  { id: 'brave', name: 'Brave', urlTemplate: 'https://search.brave.com/search?q=%s', shortcut: 'br' },
  { id: 'bing', name: 'Bing', urlTemplate: 'https://www.bing.com/search?q=%s', shortcut: 'b' },
  { id: 'youtube', name: 'YouTube', urlTemplate: 'https://www.youtube.com/results?search_query=%s', shortcut: 'yt' },
  { id: 'github', name: 'GitHub', urlTemplate: 'https://github.com/search?q=%s', shortcut: 'gh' },
  { id: 'wikipedia', name: 'Wikipedia', urlTemplate: 'https://en.wikipedia.org/w/index.php?search=%s', shortcut: 'wiki' },
  { id: 'reddit', name: 'Reddit', urlTemplate: 'https://www.reddit.com/search/?q=%s', shortcut: 'r' }
];

export function buildSearchUrl(provider: SearchProvider, query: string): string {
  return provider.urlTemplate.replace('%s', encodeURIComponent(query));
}

export function resolveProviderForQuery(
  query: string,
  providers: SearchProvider[],
  defaultProvider: SearchProvider
): { provider: SearchProvider; query: string } {
  const match = query.match(/^([a-z]{1,6})\s+(.+)$/i);
  if (match) {
    const [, prefix, rest] = match;
    const provider = providers.find((candidate) => candidate.shortcut === prefix?.toLowerCase());
    if (provider) return { provider, query: rest ?? '' };
  }
  return { provider: defaultProvider, query };
}
