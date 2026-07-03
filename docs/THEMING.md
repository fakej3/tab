# Theming, typography, motion, layout — the token system

Nothing in this app hardcodes a color, spacing value, radius, blur amount,
duration, easing curve, or font. Everything resolves through a CSS custom
property (`--ws-*`), and every one of those properties is written by
exactly one engine.

| Concern | Engine | CSS vars |
|---|---|---|
| Color, glass, radius, shadow, elevation | `ThemeEngine` | `--ws-color-*`, `--ws-radius-*`, `--ws-glass-*`, `--ws-blur-*`, `--ws-elevation-*`, `--ws-shadow-*` |
| Typography (family, size, weight, tracking, line-height) | `TypographyEngine` | `--ws-font-*`, `--ws-letter-spacing-*`, `--ws-text-transform-label` |
| Duration, easing | `AnimationEngine` | `--ws-duration-*`, `--ws-ease-*` |
| Wallpaper (image/gradient/color, blur/tint, crossfade, parallax) | `WallpaperEngine` | renders its own DOM layer directly, not tokens |
| Spacing, type scale, icon/control sizing, z-index defaults | static (`styles/tokens.css`) | `--ws-space-*`, `--ws-text-*`, `--ws-icon-*`, `--ws-control-height-*`, `--ws-z-*` |

## How a token gets from a slider to the screen

1. An engine registers a `SettingsSection` (see `core/theme/ThemeEngine.ts` or `core/typography/TypographyEngine.ts`).
2. The Settings panel renders that section generically (`ui/settings-panel/renderField.ts`) — no per-field UI code anywhere.
3. A field's `oninput` calls `SettingsManager.set(namespace, key, value)`, which updates the reactive store and persists (debounced).
4. The engine's `subscribeNamespace` callback fires, recomputes its token set, and calls `ThemeEngine.applyVariables({...})` — the one method in the app that calls `document.documentElement.style.setProperty`. (`TypographyEngine` and `AnimationEngine` both route through this same method rather than touching the DOM themselves — one writer, easy to reason about.)
5. Every plugin's CSS already reads `var(--ws-color-accent)` etc., so the whole UI updates in the same frame — including a `body`/`.ws-glass` crossfade transition on color changes, so a preset switch dissolves rather than snaps. No plugin re-renders; the browser's cascade does the work.

## Adding a new customizable token

Say you want a "widget gap" the user can control:

1. Add it to `ThemeTokens` (or a more appropriate engine) in `core/theme/tokens.ts`, with a default and a `TOKEN_CSS_VARS` entry.
2. Add a `range`/`color`/etc. field to that engine's `SettingsSection`.
3. Reference `var(--ws-widget-gap)` wherever it should apply.

That's the whole change. You do not touch the Settings panel, the
persistence layer, or any plugin.

## Presets vs. individual fields

A theme or typography preset (`core/theme/presets.ts`, `core/typography/presets.ts`)
is a *starting point*, not a locked mode: individual fields like `accent` or
`radius` are their own independently-stored settings so users can fine-tune
them after picking a preset. Switching presets re-seeds those fields from
the new preset's values (`PRESET_SEEDED_KEYS` in both engines) — otherwise a
manual tweak under one preset would silently "leak" into every future
preset forever.

**A hard-won rule from building the presets**: a preset's `surface` color
and `textPrimary` color must be a valid pair on their own (light surface +
dark text, or dark surface + light text) — never assume anything about
what's *behind* the glass. Widgets are translucent glass rendered over the
wallpaper, which is independently dark-by-default and fully user-controlled;
`--ws-color-background` is essentially only used by the (opaque) Settings
panel. The `daybreak` preset originally paired a dark surface with dark
text on the assumption it would sit on a light page background — it
actually sits on the (dark) wallpaper like every other widget, making the
text invisible. Fixed by keeping `surface` light and pushing `glassOpacity`
high enough that the surface color dominates the composite regardless of
what wallpaper is behind it. See `docs/ROADMAP.md` for the residual case
this doesn't cover (a dark theme + a user-chosen bright wallpaper + low
glass opacity).

## Motion

Two layers, matching how the app actually animates:

- **One-shot transitions** (entrances/exits, palette open, settings panel
  section swap): `AnimationEngine.animate(element, preset, options)` on top
  of the Web Animations API — see `core/animation/motion.ts` for the preset
  list (fade, scale, slide, blur, ripple, spring).
- **Continuous/hover-driven motion** (button lift, press feedback, glass
  shimmer sweep, ambient breathing): plain CSS utility classes in
  `styles/motion.css` (`.ws-motion-hover-lift`, `.ws-motion-press`,
  `.ws-motion-soft-scale`, `.ws-motion-shimmer`, `.ws-motion-breathe`,
  `.ws-motion-focus-glow`) that read the same duration/easing tokens.

Both collapse under reduced motion: the WAAPI path checks
`AnimationEngine`'s `reduceMotion` token directly; the CSS path is caught by
the blanket `@media (prefers-reduced-motion: reduce)` override in
`reset.css` that forces near-zero transition/animation duration globally,
so no component has to remember to handle it individually.

## Layout

`LayoutEngine` doesn't use CSS tokens — position/size are grid units
persisted per-workspace. It's still "everything customizable" in spirit:
move, resize, hide, and lock are all first-class operations on the same
data model, multiple named workspaces exist, and layouts export/import as
JSON from the Settings panel's General section. A widget can opt into
`allowOverflow` (its content container drops `overflow: hidden`) for
popovers that need to escape their own bounds — see Search's recent-results
dropdown — and any focused widget automatically paints above its siblings
via `:focus-within`, so this works without LayoutCanvas needing to know
what any given plugin is doing.

## What's static (by design, for now)

`styles/tokens.css` defines the spacing scale, type scale (`--ws-text-xs`
… `--ws-text-5xl`), icon/control sizing, and z-index defaults, none of which
are wired to a settings section yet. They're already CSS variables — the
day a "Spacing" settings section is worth adding, it's the same
engine-plus-schema recipe above, not a rewrite.
