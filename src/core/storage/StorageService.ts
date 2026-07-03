import { createLogger } from '@core/utils/logger';

/**
 * The single gateway to persistence. Nothing else in the app should touch
 * `chrome.storage` or `localStorage` directly — that keeps every other
 * module portable to a future desktop/standalone shell that persists data
 * differently (e.g. a filesystem or IndexedDB).
 *
 * Falls back to `localStorage` automatically when `chrome.storage` isn't
 * available (plain browser tab during `vite dev`, or a future non-extension
 * host), so the whole app is testable outside the extension runtime.
 */
export interface StorageDriver {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  onChange(callback: (key: string) => void): () => void;
}

const log = createLogger('StorageService');

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local
  );
}

class ChromeStorageDriver implements StorageDriver {
  async get<T>(key: string): Promise<T | undefined> {
    const result = await chrome.storage.local.get(key);
    return result[key] as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }

  async clear(): Promise<void> {
    await chrome.storage.local.clear();
  }

  onChange(callback: (key: string) => void): () => void {
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'local') return;
      for (const key of Object.keys(changes)) callback(key);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
}

class LocalStorageDriver implements StorageDriver {
  private prefix = 'workspace:';

  async get<T>(key: string): Promise<T | undefined> {
    const raw = localStorage.getItem(this.prefix + key);
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('workspace:storage-change', { detail: key }));
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(this.prefix)) localStorage.removeItem(key);
    }
  }

  onChange(callback: (key: string) => void): () => void {
    const listener = (event: Event) => callback((event as CustomEvent<string>).detail);
    window.addEventListener('workspace:storage-change', listener);
    return () => window.removeEventListener('workspace:storage-change', listener);
  }
}

export class StorageService {
  private driver: StorageDriver;
  private cache = new Map<string, unknown>();

  constructor(driver?: StorageDriver) {
    this.driver = driver ?? (hasChromeStorage() ? new ChromeStorageDriver() : new LocalStorageDriver());
    if (!hasChromeStorage()) log.info('chrome.storage unavailable — using localStorage fallback (dev mode).');
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    if (this.cache.has(key)) return this.cache.get(key) as T;
    const value = await this.driver.get<T>(key);
    const resolved = value ?? fallback;
    this.cache.set(key, resolved);
    return resolved;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
    await this.driver.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    await this.driver.remove(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    await this.driver.clear();
  }

  onChange(callback: (key: string) => void): () => void {
    return this.driver.onChange((key) => {
      this.cache.delete(key);
      callback(key);
    });
  }

  /** Returns a StorageService restricted to keys under a namespace prefix (used for per-plugin storage). */
  namespaced(prefix: string): StorageService {
    const wrapper: StorageDriver = {
      get: (key) => this.driver.get(`${prefix}:${key}`),
      set: (key, value) => this.driver.set(`${prefix}:${key}`, value),
      remove: (key) => this.driver.remove(`${prefix}:${key}`),
      clear: async () => {
        /* Namespaced clients only clear their own keys via `remove`; a full
         * clear would risk wiping sibling plugins' data. */
      },
      onChange: (callback) =>
        this.driver.onChange((key) => {
          if (key.startsWith(`${prefix}:`)) callback(key.slice(prefix.length + 1));
        })
    };
    return new StorageService(wrapper);
  }
}

export const storageService = new StorageService();
