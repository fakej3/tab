import { signal, type Signal } from './signal';

/**
 * A typed, single-source-of-truth store for a slice of application state.
 * Thin wrapper around `signal` that adds partial-patch updates for object
 * state, which every core service (settings, layout, theme) needs.
 */
export class Store<T extends Record<string, unknown>> {
  private readonly state: Signal<T>;

  constructor(initial: T) {
    this.state = signal(initial);
  }

  get(): T {
    return this.state();
  }

  peek(): T {
    return this.state.peek();
  }

  set(next: T): void {
    this.state.set(next);
  }

  patch(partial: Partial<T>): void {
    this.state.set((prev) => ({ ...prev, ...partial }));
  }

  subscribe(listener: (value: T) => void): () => void {
    return this.state.subscribe(listener);
  }
}
