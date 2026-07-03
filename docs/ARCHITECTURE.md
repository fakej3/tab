# Architecture

## Design goals, and how they map to code

| Goal | Mechanism |
|---|---|
| Nothing hardcoded, everything customizable | `SettingsManager` + declarative `SettingsSection` schemas; every engine/plugin registers one instead of building bespoke config |
| Features never depend on each other directly | `EventBus` is the only cross-module channel; plugins never import other plugins |
| Business logic portable off Chrome | Core services touch `chrome.storage` in exactly one file (`StorageService`); everything else is plain TypeScript + DOM/Web APIs |
| Plugins are removable/replaceable | `PluginManager` owns the full lifecycle; a plugin is one factory function in `registerBuiltinPlugins.ts` |
| No UI framework tax | A ~90-line signal/effect primitive (`core/state/signal.ts`) does all the reactivity; views are built with a typed `h()` helper, not innerHTML |

## Folder structure

```
src/
  core/               # services only — no visual opinions, no plugin knowledge
    state/            # signal/computed/effect, Store
    event-bus/        # EventBus + the WorkspaceEvents type map
    storage/          # StorageService (chrome.storage.local, localStorage fallback)
    settings/         # SettingsManager, SettingsSchema (the declarative field types)
    plugins/          # Plugin contract, PluginManager
    theme/             # ThemeEngine, tokens, presets, wallpaper color extraction
    animation/         # AnimationEngine, motion tokens, WAAPI helpers
    layout/             # LayoutEngine, grid math
    wallpaper/          # WallpaperEngine (its own section in the spec, not a plugin)
    command-palette/    # CommandRegistry + CommandPalette (open/close state)
    dom/                 # h() hyperscript helper, icons
    utils/               # id, debounce/throttle, clamp, logger

  plugins/              # every visible feature — see docs/PLUGINS.md
    clock/ search/ quotes/ music/ notes/ calendar/ bookmarks/ weather/ ai/

  ui/                   # composition + generic rendering of core services
    shell/               # Shell.ts (assembles the app), LayoutCanvas (drag/resize)
    settings-panel/      # generic field renderer + the panel shell
    command-palette/     # the ⌘K overlay view

  app/
    Application.ts               # composition root — constructs every core service in order
    registerBuiltinPlugins.ts    # the one file that knows every plugin by name

  styles/                # tokens.css (default CSS vars), reset.css, global.css, fonts.css
  main.ts                # boots Application, mounts Shell
```

## The core has no opinions

Every file under `src/core` is a service: `EventBus`, `PluginManager`,
`StorageService`, `SettingsManager`, `ThemeEngine`, `AnimationEngine`,
`LayoutEngine`, `WallpaperEngine`, `CommandPalette`. None of them import
anything from `src/plugins`. A core service's job is to expose a narrow,
typed API and own exactly one piece of state — it does not know what a
"clock" or "quotes" plugin is.

## Plugins never see each other

A `Plugin` (`core/plugins/Plugin.ts`) gets a `PluginContext` at `init()`:
a namespaced `settings` API, a namespaced `storage` handle, the shared
`EventBus`, and a scoped `logger`. That's the entire surface area. If two
plugins need to coordinate, they do it by emitting/listening on the
`EventBus` — see `music:track-changed` or `search:submit` in
`core/event-bus/events.ts`. Nothing prevents a plugin from being deleted
except removing its one line in `registerBuiltinPlugins.ts`.

## The one wiring exception

`Application.bootstrap()` contains exactly one piece of cross-service glue:
when `PluginManager` emits `plugin:registered`, `Application` checks whether
the plugin declared a `widget` descriptor and, if so, calls
`LayoutEngine.registerWidget(...)`. This is deliberate — "a plugin can have
an on-canvas presence" is a property of the platform, not something either
`PluginManager` or `LayoutEngine` should know about the other to implement.
It lives in the composition root, not buried in either service.

## State management

`core/state/signal.ts` implements `signal`, `computed`, and `effect` —
enough fine-grained reactivity for the whole app without adopting a UI
framework. `SettingsManager`, `LayoutEngine`, `ThemeEngine`, and
`CommandPalette` each hold their state in one `signal`/`Store` and expose
`get`/`subscribe`. There is exactly one source of truth per concern; nothing
duplicates state into a second copy for rendering.

## Rendering

There's no virtual DOM. `core/dom/h.ts` is a typed `document.createElement`
wrapper. Views subscribe to the relevant `signal`/settings and imperatively
patch the small piece of DOM they own (see `plugins/clock/view.ts` or
`ui/shell/LayoutCanvas.ts`). This keeps the bundle framework-free and the
render cost proportional to what actually changed — appropriate for a page
that needs to feel instant on every new tab.

## Persistence

`StorageService` is the only module that touches `chrome.storage` (or its
`localStorage` fallback when running outside the extension, e.g. `vite dev`
in a plain browser tab for local development/testing). Every plugin gets a
`storage` handle pre-namespaced to `plugin:<id>:*` so plugin data can never
collide. Settings persist debounced, live-write, no explicit "Save".

## Portability

If this ever becomes a standalone desktop/browser shell: `StorageService`'s
`chrome.storage` branch is the only thing that needs a new driver
implementation (the interface, `StorageDriver`, already exists — see
`LocalStorageDriver` as a second, working implementation of it). Everything
above that layer — settings, theme, layout, plugins, UI — is plain
TypeScript and Web APIs with zero Chrome-extension-specific assumptions.
`Application.ts` is the only file that would need to change.
