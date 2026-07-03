# Weather Plugin (stub)

Registers real settings (`city`, `units`) and a real widget slot, but does
not call a live weather API. Why: any provider (OpenWeather, Open-Meteo,
etc.) needs a `connect-src` entry in `manifest.json`'s CSP and, for most
providers, a user-supplied API key — both are product/security decisions
that shouldn't be made silently inside a "New Tab" extension.

## To wire up a provider

1. Add the provider's host to `content_security_policy.extension_pages`
   (`connect-src`) in `manifest.json`.
2. Add an `apiKey` field to `settings.ts` (type `'string'`) if the provider
   requires one — never hardcode a key in source.
3. In `index.ts` `mount()`, fetch from the provider using `city`/`units`
   from `context.settings.get(...)` and render real data instead of
   `createWeatherPlaceholder()`.
4. Consider caching (the plugin's own namespaced `context.storage`) so a new
   tab doesn't trigger a network request every time.
