# Media Hub

A provider-based media player. The UI (`view.ts`, `MediaWidget`) never knows
where audio comes from — it only ever reads a `MediaState` and calls methods
on `MediaEngine`. Adding a real new source later is a new file in
`providers/`, not a rewrite of the widget.

## Architecture

- **`types.ts`** — the unified model (`MediaState`, `MediaProvider`,
  `MediaCapabilities`) every other file speaks. Nothing provider-specific
  ever leaks past this.
- **`MediaEngine.ts`** — registry + single source of truth. Holds a
  `signal<MediaState>`, forwards transport commands (`play`/`pause`/`seek`/
  etc.) to whichever provider is active, republishes that provider's state
  changes as one unified stream. Owns no playback logic itself.
- **`providers/BrowserMediaSessionProvider.ts`** — the one real,
  working provider. Plays local audio files and publishes that playback to
  `navigator.mediaSession` for OS/hardware media-key integration. See the
  file's own doc comment for exactly what that API can and can't do here —
  short version below.
- **`providers/PlaceholderProvider.ts`** — a factory used for Spotify,
  YouTube Music, Apple Music, and SoundCloud. Each reports
  `isSupported() === false` so `MediaEngine` never activates one
  automatically; they exist so the provider list — and a future real
  integration — isn't a single hardcoded source.
- **`controller.ts`** — thin orchestrator: builds the engine, registers
  providers, wires the view's callbacks to engine methods, and starts/stops
  the visualizer based on playback state.
- **`view.ts`** — `MediaWidget`'s DOM. `render(state)` is the one entry
  point; every visual state (idle, no source, unsupported, connecting,
  loading, playing, paused, error) falls out of `state.status`.
- **`visualizer.ts`** — canvas renderer driven by a Web Audio
  `AnalyserNode`, fully isolated from playback. Supports bars, spectrum,
  wave, minimal line, dots, circular, breathing, and aura, all through one
  `draw()` dispatch. Throttles to ~30fps, drops to ~1fps under reduced
  motion, and skips painting entirely while the tab is hidden.

## Why every other provider is a placeholder, not "coming soon" filler

`navigator.mediaSession` lets a page describe **its own** currently-playing
media to the OS (lock screen, hardware keys, the browser's media overlay).
It is not a cross-tab or cross-origin read channel — there is no web
platform API that lets a New Tab page observe *another* tab's Media Session
state. A New Tab extension cannot see that Spotify is playing in a
different tab, regardless of permissions requested.

That's why `BrowserMediaSessionProvider` plays local files: it's the one
source this extension actually controls, so it's the one source that can
honestly *use* the Media Session API rather than fake reading from it.
Real Spotify/Apple Music integration is possible, but each needs its own
non-trivial auth flow (OAuth + a playback SDK) — a self-contained follow-up
per provider, not a Media Hub redesign, because the engine already treats
every provider identically.

## Why local files only (for now)

The extension's CSP restricts `media-src` to `'self' data: blob:` — no
remote streaming. That's a deliberate default (no surprise network requests
from a new tab page).

## Extending

A new visualizer type is one entry in `VISUALIZER_TYPES` (constants.ts) +
one `draw*` method in `visualizer.ts`. A new provider is one file
implementing `MediaProvider` (types.ts) + one `engine.register(...)` call in
`controller.ts`.
