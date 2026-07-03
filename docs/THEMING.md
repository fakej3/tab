# Theming, typography, motion, layout — the token system

Nothing in this app hardcodes a color, spacing value, radius, blur amount,
duration, or easing curve. Everything resolves through a CSS custom
property (`--ws-*`), and every one of those properties is written by
exactly one engine.

| Concern | Engine | CSS vars |
|---|---|---|
| Color, glass, radius, shadow | `ThemeEngine` | `--ws-color-*`, `--ws-radius-*`, `--ws-glass-*`, `--ws-shadow-*` |
| Duration, easing | `AnimationEngine` | `--ws-duration-*`, `--ws-ease-*` |
| Wallpaper (image/gradient/color, blur/tint) | `WallpaperEngine` | renders its own DOM layer directly, not tokens |
| Spacing, typography, z-index defaults | static (`styles/tokens.css`) | `--ws-space-*`, `--ws-font-*`, `--ws-z-*` |

## How a token gets from a slider to the screen

1. An engine registers a `SettingsSection` (see `core/theme/ThemeEngine.ts`).
2. The Settings panel renders that section generically (`ui/settings-panel/renderField.ts`) — no per-field UI code anywhere.
3. A field's `oninput` calls `SettingsManager.set(namespace, key, value)`, which updates the reactive store and persists (debounced).
4. The engine's `subscribeNamespace` callback fires, recomputes its token set, and calls `ThemeEngine.applyVariables({...})` — the one method in the app that calls `document.documentElement.style.setProperty`.
5. Every plugin's CSS already reads `var(--ws-color-accent)` etc., so the whole UI updates in the same frame. No plugin re-renders; the browser's cascade does the work.

## Adding a new customizable token

Say you want a "widget gap" the user can control:

1. Add it to `ThemeTokens` (or a more appropriate engine) in `core/theme/tokens.ts`, with a default and a `TOKEN_CSS_VARS` entry.
2. Add a `range`/`color`/etc. field to that engine's `SettingsSection`.
3. Reference `var(--ws-widget-gap)` wherever it should apply.

That's the whole change. You do not touch the Settings panel, the
persistence layer, or any plugin.

## Presets vs. individual fields

A theme preset (`core/theme/presets.ts`) is a *starting point*, not a
locked mode: individual fields like `accent` or `radius` are their own
independently-stored settings so users can fine-tune them after picking a
preset. Switching presets re-seeds those fields from the new preset's
values (see the `PRESET_SEEDED_KEYS` re-seed logic in `ThemeEngine`) —
otherwise a manual tweak under one preset would silently "leak" into every
future preset forever.

## Motion

`AnimationEngine` exposes `animate(element, preset, options)` on top of the
Web Animations API — see `core/animation/motion.ts` for the preset list
(fade, scale, slide, blur, ripple, spring). This is the only sanctioned way
to animate; there are no ad-hoc `@keyframes` in plugin stylesheets. It
automatically collapses to a fast opacity-only transition when the user (or
the OS `prefers-reduced-motion`) requests reduced motion.

## Layout

`LayoutEngine` doesn't use CSS tokens — position/size are grid units
persisted per-workspace. It's still "everything customizable" in spirit:
move, resize, hide, and lock are all first-class operations on the same
data model, multiple named workspaces exist, and layouts export/import as
JSON from the Settings panel's General section.

## What's static (by design, for now)

`styles/tokens.css` defines spacing, typography, and z-index defaults that
aren't yet wired to a settings section. They're already CSS variables — the
day a "Typography" or "Spacing" settings section is worth adding, it's the
same three-step recipe above, not a rewrite.
