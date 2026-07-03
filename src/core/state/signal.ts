/**
 * Minimal, dependency-free fine-grained reactivity primitive.
 *
 * This is the reactive foundation for the entire platform: SettingsManager,
 * ThemeEngine, LayoutEngine and every plugin build on top of `signal`,
 * `computed` and `effect` instead of a UI framework. Keeping this tiny keeps
 * the whole app portable to a future non-Chrome shell.
 */

type Unsubscribe = () => void;

interface ReadonlySignal<T> {
  (): T;
  peek(): T;
  subscribe(listener: (value: T) => void): Unsubscribe;
}

export interface Signal<T> extends ReadonlySignal<T> {
  set(value: T | ((prev: T) => T)): void;
}

let activeEffect: Effect | null = null;
const effectStack: Effect[] = [];

class Effect {
  private fn: () => void;
  private deps = new Set<Set<Effect>>();
  disposed = false;

  constructor(fn: () => void) {
    this.fn = fn;
  }

  run(): void {
    if (this.disposed) return;
    this.cleanup();
    effectStack.push(this);
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- tracking the currently-running effect for dependency capture
    activeEffect = this;
    try {
      this.fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1] ?? null;
    }
  }

  track(subscribers: Set<Effect>): void {
    subscribers.add(this);
    this.deps.add(subscribers);
  }

  cleanup(): void {
    for (const subscribers of this.deps) subscribers.delete(this);
    this.deps.clear();
  }

  dispose(): void {
    this.cleanup();
    this.disposed = true;
  }
}

export function signal<T>(initial: T): Signal<T> {
  let value = initial;
  const subscribers = new Set<Effect>();
  const listeners = new Set<(value: T) => void>();

  const read = (() => {
    if (activeEffect) activeEffect.track(subscribers);
    return value;
  }) as Signal<T>;

  read.peek = () => value;

  read.set = (next: T | ((prev: T) => T)) => {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
    if (Object.is(resolved, value)) return;
    value = resolved;
    for (const listener of listeners) listener(value);
    // Snapshot before iterating: running an effect may re-subscribe it.
    for (const sub of [...subscribers]) sub.run();
  };

  read.subscribe = (listener: (value: T) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return read;
}

export function computed<T>(fn: () => T): ReadonlySignal<T> {
  const result = signal<T>(undefined as T);
  const eff = new Effect(() => result.set(fn()));
  eff.run();
  const readonly = (() => result()) as ReadonlySignal<T>;
  readonly.peek = () => result.peek();
  readonly.subscribe = (listener) => result.subscribe(listener);
  return readonly;
}

export function effect(fn: () => void): Unsubscribe {
  const eff = new Effect(fn);
  eff.run();
  return () => eff.dispose();
}

/** Batch is a no-op placeholder for API stability; each `set` is already synchronous and coalesced per-signal. */
export function batch(fn: () => void): void {
  fn();
}
