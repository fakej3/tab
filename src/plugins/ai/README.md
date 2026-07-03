# AI Plugin (stub)

Registers a real, encrypted-at-rest-by-Chrome `apiKey` setting (stored via
`chrome.storage.local`, namespaced to this plugin — never synced, never sent
anywhere but whichever provider you wire up) and a real widget slot. No
network calls are made.

## To wire up a provider

1. Add the provider's API host to `content_security_policy.extension_pages`
   (`connect-src`) in `manifest.json`.
2. In `index.ts` `mount()`, replace `createAiPlaceholder()` with a real chat/
   command view; read the key via `context.settings.get<string>('apiKey')`.
3. Consider routing through the Command Palette (`context.bus` +
   `CommandRegistry`) for a "ask AI" command rather than only a widget.
4. Rate limiting / cost guardrails are a product decision — don't skip them.
