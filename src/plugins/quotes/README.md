# Quotes Plugin

Local quote bank + favorites + user-added custom quotes, rotating per new
tab or on an interval.

- `data/quotes.json` — bundled local quotes (id/text/author).
- `settings.ts` — source (all/favorites/custom), rotation, author visibility.
- `controller.ts` — owns rotation logic and plugin-scoped storage (`favoriteIds`, `customQuotes`, `currentQuoteId`, `lastRotatedAt`).

## Roadmap hooks

A future API-backed or AI-generated quote provider only needs to add another
`source` option and populate `pool()` in `controller.ts` from a fetch instead
of `quotes.json` — the view and favoriting logic are already source-agnostic.
