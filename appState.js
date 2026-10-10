import { validateState } from '../core/validation.js';
import { createNewGame } from '../data/seedData.js';
import { DEFAULT_PREFS } from '../persistence/PrefsService.js';

// Game owns the single domain state. UI never mutates it directly: it calls transact().
export class Game {
  constructor(saveService, prefsService) {
    this.saveService = saveService;
    this.prefsService = prefsService;
    this.listeners = new Set();
    this.state = null;
    this.prefs = { ...DEFAULT_PREFS };
    this.saveStatus = { ok: true, at: null, error: null };
    this.loadInfo = { status: 'new' };
  }

  init(seed) {
    this.prefs = this.prefsService.load();
    const r = this.saveService.load();
    this.loadInfo = r;
    this.state = r.state ?? createNewGame(seed === undefined ? {} : { seed });
    this.persist();
    return this;
  }

  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const fn of this.listeners) fn(); }
  persist() { this.saveStatus = this.saveService.save(this.state); return this.saveStatus; }

  // Atomic: fn mutates a clone; if it (or validation) throws, nothing changes.
  transact(fn) {
    const draft = structuredClone(this.state);
    const result = fn(draft);
    validateState(draft);
    this.state = draft;
    this.persist();
    this.emit();
    return result;
  }

  replace(state) {
    validateState(state);
    this.saveService.backupCurrent();
    this.state = state;
    this.persist();
    this.emit();
  }
  resetNew(name) { this.replace(createNewGame({ name })); }

  setPref(key, value) {
    this.prefs = { ...this.prefs, [key]: value };
    this.prefsService.save(this.prefs);
    this.emit();
  }
  resetPrefs() {
    this.prefs = { ...DEFAULT_PREFS };
    this.prefsService.save(this.prefs);
    this.emit();
  }
}
