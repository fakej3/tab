# Search Plugin

Single search bar, multiple providers, typed shortcut routing (e.g. `yt lofi
beats` searches YouTube regardless of the default provider).

- `providers.ts` — provider list + URL template resolution + shortcut parsing.
- `settings.ts` — default provider, custom provider URL, placeholder, new-tab toggle.
- `view.ts` / `controller.ts` / `index.ts` — standard plugin split.

## Roadmap hooks

- `customUrlTemplate` in settings is a single custom provider today. A future
  "manage providers" settings UI can extend `getProviders()` in
  `controller.ts` to read a list instead of one template without touching
  `providers.ts`'s public API.
- `search:submit` is emitted on the event bus before navigation — a future
  natural-language router or the Command Palette can subscribe to it.
