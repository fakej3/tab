/**
 * Global event bus — the ONLY sanctioned channel for cross-module
 * communication. Plugins and core services must never import each other
 * directly; they publish and subscribe to named events instead. This is
 * what keeps every feature removable and replaceable.
 *
 * The event map (`WorkspaceEvents`) is declared in `events.ts` and can be
 * extended by plugins via TypeScript module augmentation, so new event
 * types stay fully typed without editing this file.
 */

export type EventHandler<T> = (payload: T) => void;

export interface EventBus<EventMap> {
  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void;
  once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void;
  off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void;
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void;
  /** Scope a bus to a namespace prefix (used by PluginManager to sandbox plugin events). */
  namespace(prefix: string): EventBus<EventMap>;
}

export function createEventBus<EventMap>(): EventBus<EventMap> {
  const handlers = new Map<keyof EventMap, Set<EventHandler<unknown>>>();

  function on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>) {
    let set = handlers.get(event);
    if (!set) {
      set = new Set();
      handlers.set(event, set);
    }
    set.add(handler as EventHandler<unknown>);
    return () => off(event, handler);
  }

  function once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>) {
    const unsubscribe = on(event, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  function off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>) {
    handlers.get(event)?.delete(handler as EventHandler<unknown>);
  }

  function emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    const set = handlers.get(event);
    if (!set || set.size === 0) return;
    for (const handler of [...set]) handler(payload);
  }

  function namespace(): EventBus<EventMap> {
    // All plugins currently share the global bus namespace for discoverability
    // (e.g. command palette needs to see every plugin's commands); the hook
    // exists so a future stricter sandbox can wrap `emit`/`on` per-plugin
    // without changing any call sites.
    return bus;
  }

  const bus: EventBus<EventMap> = { on, once, off, emit, namespace };
  return bus;
}
