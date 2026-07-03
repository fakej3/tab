# Writing a plugin

A plugin is a folder under `src/plugins/<id>/` plus one line in
`src/app/registerBuiltinPlugins.ts`. Nothing else in the app needs to change.

## Structure

```
plugins/<id>/
  constants.ts   # plugin id, any fixed enums/lookup tables
  settings.ts    # the declarative SettingsSection (no namespace field — PluginManager adds it)
  view.ts        # pure DOM construction + an update(state) function — no settings/storage access
  controller.ts  # owns lifecycle: reads settings/storage, wires events, drives the view
  index.ts       # exports a factory returning a `Plugin` object
  styles.css     # imported from index.ts; scoped by convention (`.ws-<id>__*` class prefix)
  README.md      # what it does, what it deliberately doesn't do, extension points
```

`view.ts` and `controller.ts` are a deliberate split: the view never reads
settings or storage directly, so it can be unit-tested (or reused) without a
`PluginContext`. The controller is the only thing that touches
`context.settings` / `context.storage` / `context.bus`.

## The minimal `Plugin` object

```ts
import type { Plugin, PluginContext } from '@core/plugins/Plugin';

export function createExamplePlugin(): Plugin {
  return {
    id: 'example',
    name: 'Example',
    version: '1.0.0',
    description: 'What this does, in one sentence.',
    widget: { defaultSize: { w: 4, h: 3 }, minSize: { w: 2, h: 2 } }, // omit entirely for non-widget plugins

    init(context: PluginContext) {
      context.settings.registerSection({ title: 'Example', fields: [...] });
    },
    mount(container: HTMLElement) {
      /* create + append your view */
    },
    unmount() {
      /* remove DOM, clear timers/listeners — plugin stays registered */
    },
    destroy() {
      /* full teardown — called when the plugin is unregistered entirely */
    }
  };
}
```

`mount`/`unmount` can be called multiple times (the layout canvas
mounts once and only calls `unmount` if the widget is fully removed from a
workspace, but a future multi-workspace switch may unmount/remount). Keep
`mount` idempotent and cheap to re-run.

## Settings

Call `context.settings.registerSection({ title, description?, order?, fields })`
once in `init`. Every field becomes a control in the Settings panel
automatically — see `core/settings/SettingsSchema.ts` for the full field
type list (`boolean`, `string`, `number`, `range`, `select`, `color`,
`font`). You never write panel UI code for a plugin's own settings.

Read/write values with `context.settings.get<T>(key)` /
`context.settings.set(key, value)`; react to changes with
`context.settings.subscribe(listener)`. These are automatically scoped to
`plugin.<id>` — you never see or collide with another plugin's namespace.

If a field needs bespoke UI the generic renderer can't express (e.g. an
image gallery), set `hiddenInPanel: true` on it and render your own control
— see `ui/settings-panel/WallpaperExtras.ts` for the pattern. Use this
sparingly; it's an escape hatch, not the default.

## Storage

`context.storage` is a `StorageService` already namespaced to
`plugin:<id>:*`. Use it for anything that isn't a "setting" a user tweaks
(e.g. Quotes' favorites list, Notes' text content). It has the same
`get`/`set`/`onChange` API as the top-level service.

## Talking to other plugins or core services

Never import another plugin. If you need to react to something happening
elsewhere, add a typed event to `core/event-bus/events.ts`'s
`WorkspaceEvents` and `emit`/`on` it via `context.bus`.

If you want an action to show up in the ⌘K command palette, use
`context.commands.register({ id, title, group, perform })` — the id is
auto-prefixed with `plugin:<id>:` so you can't collide with another
plugin's commands, and everything you register is automatically
unregistered when the plugin is torn down.

## Removing a plugin

Delete its folder and its one line in `registerBuiltinPlugins.ts`. No other
file references it by name — settings/storage keys are namespaced by id and
simply stop being read; nothing needs a migration.
