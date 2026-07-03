# Roadmap

What's deliberately not built, and why — so it reads as scoped decisions,
not gaps nobody noticed.

## Local/imported fonts

`TypographyEngine` (added in the design system pass) covers presets and
manual overrides of size/tracking/line-height/weight, all system-font-based.
Local Font Access API integration (letting a user pick an arbitrary
installed font) is the natural next step — `docs/THEMING.md` covers the
token recipe; this is additive, not a redesign.

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

## Wallpaper brightness vs. theme contrast

Theme presets set surface/text pairs that stay legible against *any*
wallpaper by keeping glass opacity high enough that the surface color
dominates the composite (this is what was broken — and fixed — in
Daybreak: a dark glass surface paired with dark text, invisible once
composited over the default dark wallpaper). The built-in presets are dark
end-to-end or light end-to-end for exactly this reason. What's still
unsolved: a *dark* theme with a user-chosen *bright* wallpaper and low
glass opacity can still end up with reduced contrast, since text color
doesn't adapt to what's actually behind a given widget. The real fix is
the wallpaper-color-extraction-driven theming described above (auto-nudge
the theme when the wallpaper changes) rather than per-widget contrast
detection, which would be expensive and fragile.

## Accessibility

Keyboard nav (Tab), focus-visible styling, a skip link, live-region
announcements for search's inline calculator/conversion result, and
`prefers-reduced-motion` (both the CSS blanket rule and JS-driven motion
like wallpaper parallax and WAAPI transitions) are implemented. The command
palette uses a real `combobox`/`listbox`/`aria-activedescendant` pattern.
Not yet done: the recent-searches dropdown is plain focusable buttons
rather than a full listbox pattern (deliberately — a half-implemented
roving-focus listbox is worse than a simple one), and a full contrast
audit against WCAG AA across every theme preset × wallpaper combination.
