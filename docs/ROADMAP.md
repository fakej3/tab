# Roadmap

What's deliberately not built, and why — so it reads as scoped decisions,
not gaps nobody noticed.

## Typography settings section

Fonts are already fully tokenized (`--ws-font-family`, `--ws-font-size-base`,
`--ws-letter-spacing-base`, `--ws-line-height-base` in `styles/tokens.css`),
but there's no Settings UI for them yet and no Local Font Access API
integration. Adding it is the standard "engine + SettingsSection" recipe in
`docs/THEMING.md` — it wasn't skipped for architectural reasons, just
sequencing.

## Multi-instance / duplicate widgets

`WidgetLayout` already separates `instanceId` from `pluginId` specifically
to leave room for this, but `PluginManager.mount/unmount` currently assume
one DOM mount per plugin. Supporting true duplicates means a plugin's
`mount()` needs to accept an instance id and keep independent state per
instance (relevant for Notes, Clock, Quotes). Worth doing once a real
multi-instance use case shows up rather than speculatively.

## Weather and AI

Both plugins register real settings (city/units; API key) and a real widget
slot, and intentionally don't call a live API. Both require a CSP
`connect-src` change (a security-relevant decision) and, for AI in
particular, real product decisions (rate limiting, cost, which provider).
See `src/plugins/weather/README.md` and `src/plugins/ai/README.md` for the
exact wiring steps.

## Music: streaming / Spotify

The player is local-file-only because the extension's CSP restricts
`media-src` to `'self' data: blob:`. Spotify specifically needs OAuth + the
Web Playback SDK — a meaningfully bigger integration than "add a URL field."
See `src/plugins/music/README.md`.

## Wallpaper: video, slideshow, particles/rain/snow

`WallpaperMode` is `'color' | 'gradient' | 'image'` today. The engine
already owns its own DOM layer and re-renders reactively from settings, so
adding `'video'` is a new case in `WallpaperEngine.render()` plus a
`<video>` element; a slideshow is a timer that rotates `activeImageId`
through the library. Left out to keep the wallpaper surface area honest
rather than half-implemented.

## Wallpaper color extraction driving the theme automatically

`core/theme/colorExtraction.ts` implements dominant/average color
extraction from an image and is fully functional
(`extractPaletteFromImage`), but nothing calls it yet — `ThemeEngine`
exposes `applyPaletteOverride()` for exactly this purpose. Wiring it up is
one call in `WallpaperEngine` after an image is selected, gated behind a
"match wallpaper" toggle so it doesn't silently override a user's manual
theme choice.

## Community/importable theme presets

`ThemePreset` is already a plain serializable object
(`core/theme/presets.ts`); `SettingsManager.export()`/`import()` already
round-trip full settings as JSON. A "browse community themes" UI is a
fetch + a preset picker, not a new persistence mechanism.

## Command palette natural-language routing

`search:submit` is emitted on the bus before navigation, and
`CommandRegistry.search()` already does simple scored matching. Routing
free text to actions/AI is additive on top of both, not a redesign.

## Accessibility

Keyboard nav (Tab), focus-visible styling, a skip link, and
`prefers-reduced-motion` are implemented. Full screen-reader pass (ARIA
live regions for the rotating quote/clock, palette listbox roving
`aria-activedescendant` instead of rebuilding the list on every keypress)
is the next accessibility increment.
