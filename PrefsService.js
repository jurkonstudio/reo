import { KEYS } from '../core/constants.js';

// UI preferences are stored separately from economic state.
export const DEFAULT_PREFS = { sidebarCollapsed: false, density: 'comfortable', reducedMotion: false };

export class PrefsService {
  constructor(repo) { this.repo = repo; }
  load() {
    try {
      const p = JSON.parse(this.repo.get(KEYS.prefs) || '{}');
      return {
        sidebarCollapsed: p.sidebarCollapsed === true,
        density: p.density === 'compact' ? 'compact' : 'comfortable',
        reducedMotion: p.reducedMotion === true,
      };
    } catch { return { ...DEFAULT_PREFS }; }
  }
  save(prefs) { try { this.repo.set(KEYS.prefs, JSON.stringify(prefs)); } catch { /* non-fatal */ } }
}
