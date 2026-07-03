# Clock Plugin

Renders the current time/date as a workspace widget.

- `constants.ts` — plugin id, clock style list.
- `settings.ts` — declarative settings schema (24h, seconds, date, style, size).
- `view.ts` — pure DOM builder + `update(now, state)`.
- `controller.ts` — owns the tick timer (aligned to the next second/minute boundary, not a naive `setInterval(1000)`) and settings subscription.
- `index.ts` — the `Plugin` object PluginManager registers.

## Extending

Add a new clock face by adding an entry to `CLOCK_STYLES` in `constants.ts`,
a `[data-style="..."]` rule in `styles.css`, and nothing else — the settings
panel picks it up automatically.
