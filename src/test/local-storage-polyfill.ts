type StorageLike = Storage;

/**
 * happy-dom (v18) exposes a broken localStorage global under vitest — an
 * object without any Web Storage methods. Install a spec-shaped Map-backed
 * replacement when the platform one is unusable.
 */
export function installLocalStoragePolyfill(): void {
  const g = globalThis as { localStorage?: StorageLike };
  const existing = g.localStorage;
  if (
    existing &&
    typeof existing.setItem === 'function' &&
    typeof existing.removeItem === 'function' &&
    typeof existing.getItem === 'function' &&
    typeof existing.clear === 'function'
  ) {
    return;
  }

  const map = new Map<string, string>();
  g.localStorage = {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    key(index) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  } as StorageLike;
}
