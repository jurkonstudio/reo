import { KEYS, SCHEMA_VERSION } from '../core/constants.js';
import { GameError } from '../core/errors.js';
import { validateState } from '../core/validation.js';
import { migrate } from './migrations.js';

export class SaveService {
  constructor(repo) { this.repo = repo; }

  #parse(text) {
    let env;
    try { env = JSON.parse(text); } catch { throw new GameError('INVALID_SAVE', 'File is not valid JSON.'); }
    return validateState(migrate(env));
  }

  load() {
    const raw = this.repo.get(KEYS.save);
    if (raw == null) return { state: null, status: 'new' };
    try {
      return { state: this.#parse(raw), status: 'ok' };
    } catch (e) {
      const copyKey = KEYS.corruptPrefix + Date.now();
      try { this.repo.set(copyKey, raw); } catch { /* storage full: nothing more we can do */ }
      return { state: null, status: 'recovered', message: `Your saved game could not be read (${e.message}). A copy was kept under "${copyKey}" and a new game was started.` };
    }
  }

  save(state) {
    try {
      const at = Date.now();
      this.repo.set(KEYS.save, JSON.stringify({ schema: SCHEMA_VERSION, savedAt: at, data: state }));
      return { ok: true, at, error: null };
    } catch (e) {
      return { ok: false, at: null, error: e.message || 'Could not write save.' };
    }
  }

  exportJSON(state) { return JSON.stringify({ schema: SCHEMA_VERSION, savedAt: Date.now(), data: state }, null, 2); }
  parseImport(text) { return this.#parse(text); }

  backupCurrent() {
    const raw = this.repo.get(KEYS.save);
    if (raw != null) this.repo.set(KEYS.backup, raw);
  }
  hasBackup() { return this.repo.get(KEYS.backup) != null; }
  readBackup() {
    const raw = this.repo.get(KEYS.backup);
    if (raw == null) throw new GameError('NO_BACKUP', 'No backup available.');
    return this.#parse(raw);
  }
}
