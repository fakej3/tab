# Workspace — A New Tab

A calm, premium, endlessly customizable New Tab replacement for Chrome. Built
as a modular workspace platform that happens to run inside a browser
extension today — not the other way around.

This is not a dashboard, not a widget collection, not another Momentum
clone. The wallpaper is the hero; the interface exists to enhance it, not
compete with it. Every visible surface — theme, typography, layout, motion,
wallpaper, search, plugins — is built on the same customization
infrastructure, so "everything is configurable" is a property of the
architecture, not a checklist that was implemented widget-by-widget.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 — runs as a plain page, storage falls back to localStorage
npm run build       # outputs dist/ — a loadable unpacked Chrome extension
npm run typecheck
npm run lint
```

To load it as an actual New Tab replacement: `npm run build`, then in Chrome
go to `chrome://extensions`, enable Developer Mode, "Load unpacked", and
select the `dist/` folder.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — the core/plugin/UI split, data flow, why it's shaped this way.
- [`docs/PLUGINS.md`](docs/PLUGINS.md) — how to write a new plugin.
- [`docs/THEMING.md`](docs/THEMING.md) — the token system, adding new customizable surfaces.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — what's deliberately not built yet, and why.

## What's actually implemented

Fully working: a complete design token system (color/glass/elevation,
typography, spacing, motion — see `docs/THEMING.md`), Wallpaper
(color/gradient/image with crossfade transitions, load-in, subtle cursor
parallax, dynamic dimming behind overlays), Theme (5 presets + full manual
override), Typography (7 presets — Minimal/Editorial/Modern/Elegant/Swiss/
Classic/Monospace — + manual override), a shared motion language (hover
lift, press, shimmer, ambient breathing) applied consistently across every
interactive surface, a draggable/resizable/lockable/hideable multi-workspace
layout grid, a searchable Settings overlay that renders every plugin's
settings generically, a ⌘K command palette, Search (8 providers + shortcut
routing + an inline calculator + unit conversion + recent searches), Clock,
Quotes (local/favorites/custom), Notes, Calendar, Bookmarks, and Music
(local files, Media Session, 5 configurable canvas visualizer styles
including a signature "breathing" waveform).

Intentionally scaffolded, not faked: Weather and AI register real settings
and a real widget slot (hidden by default until configured, so they don't
greet new users with an apology card) but don't call a live provider — see
their READMEs for exactly what wiring one up requires and why it wasn't
done silently.
