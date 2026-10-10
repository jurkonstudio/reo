// Thin key-value repositories. Swap for a remote adapter later without touching services.
export class LocalRepository {
  constructor(storage) { this.storage = storage; }
  get(k) { return this.storage.getItem(k); }
  set(k, v) { this.storage.setItem(k, v); }
  remove(k) { this.storage.removeItem(k); }
}
export class MemoryRepository {
  constructor() { this.m = new Map(); }
  get(k) { return this.m.has(k) ? this.m.get(k) : null; }
  set(k, v) { this.m.set(k, String(v)); }
  remove(k) { this.m.delete(k); }
}
