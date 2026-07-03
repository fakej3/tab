# Music Plugin

A self-contained local audio player: pick files from disk, play/pause/skip/
seek/volume, OS media-key integration via the Media Session API, and a
canvas visualizer driven by a Web Audio `AnalyserNode`.

- `visualizer.ts` — canvas renderer (bars/wave/circular), fully driven by
  `VisualizerConfig`; knows nothing about playback.
- `controller.ts` — owns the `<audio>` element, the Web Audio graph
  (`MediaElementSource -> Analyser -> Gain -> destination`), the in-memory
  playlist (object URLs, revoked on unmount), and `navigator.mediaSession`.

## Why local files only (for now)

The extension's CSP restricts `media-src` to `'self' data: blob:` — no
remote streaming. That's a deliberate default (no surprise network requests
from a new tab page). Streaming from a URL or a service like Spotify needs
either a relaxed CSP + explicit user opt-in, or (for Spotify specifically)
OAuth + the Web Playback SDK, which is a meaningfully bigger integration —
tracked as a roadmap item, not silently half-built here.

## Extending

A new visualizer type is one entry in `VISUALIZER_TYPES` (constants.ts) +
one `draw*` method in `visualizer.ts`.
