import { h } from '../dom.js';
import { APP_VERSION, SCHEMA_VERSION } from '../../core/constants.js';
import { toast, confirmDialog } from '../components/feedback.js';

export function settingsPage({ game }) {
  const p = game.prefs;
  const ss = game.saveStatus;
  const mode = (typeof window !== 'undefined' && window.__reoPersistent === false) ? 'Local, memory only (browser storage unavailable)' : 'Local (saved in this browser)';

  const density = h('select', { 'aria-label': 'Density', onChange: (e) => game.setPref('density', e.target.value) },
    h('option', { value: 'comfortable', selected: p.density === 'comfortable' }, 'Comfortable'),
    h('option', { value: 'compact', selected: p.density === 'compact' }, 'Compact'));
  const motion = h('input', { type: 'checkbox', checked: p.reducedMotion, onChange: (e) => game.setPref('reducedMotion', e.target.checked) });
  const sidebar = h('input', { type: 'checkbox', checked: p.sidebarCollapsed, onChange: (e) => game.setPref('sidebarCollapsed', e.target.checked) });

  const fileIn = h('input', { type: 'file', accept: 'application/json,.json', 'aria-label': 'Choose save file to import', onChange: async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('File is too large to be a save.');
      const state = game.saveService.parseImport(await file.text());
      const ok = await confirmDialog('Replace current game?', `Import "${state.company.name}" (day ${state.day})? Your current game is kept as a backup you can restore.`, 'Import and replace');
      if (ok) { game.replace(state); toast('Save imported.', 'ok'); }
    } catch (ex) { toast(`Import rejected: ${ex.message}`, 'error'); }
  } });

  const row = (label, control) => h('label', { class: 'inline setting' }, control, ' ', label);

  return h('div', {},
    h('section', { class: 'card' }, h('h2', {}, 'Interface'),
      h('label', {}, 'Density', density),
      row('Reduce animation', motion),
      row('Collapse sidebar on desktop', sidebar),
      h('p', {}, h('button', { class: 'btn', type: 'button', onClick: () => { game.resetPrefs(); toast('Preferences restored to defaults.', 'ok'); } }, 'Restore default preferences'))),

    h('section', { class: 'card' }, h('h2', {}, 'Save data'),
      h('p', {}, ss.ok ? `Auto-saved${ss.at ? ' at ' + new Date(ss.at).toLocaleTimeString() : ''}. Every action saves immediately.` : h('span', { class: 'bad' }, `✖ Saving failed: ${ss.error}`)),
      h('div', { class: 'actions left' },
        h('button', { class: 'btn', type: 'button', onClick: () => { const r = game.persist(); toast(r.ok ? 'Saved.' : `Save failed: ${r.error}`, r.ok ? 'ok' : 'error'); game.emit(); } }, 'Save now'),
        h('button', { class: 'btn', type: 'button', onClick: () => {
          const blob = new Blob([game.saveService.exportJSON(game.state)], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `restaurant-empire-day${game.state.day}.json` });
          document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        } }, 'Export save'),
        h('label', { class: 'btn' }, 'Import save…', fileIn)),
      game.saveService.hasBackup() ? h('p', {}, h('button', { class: 'btn', type: 'button', onClick: async () => {
        try {
          const b = game.saveService.readBackup();
          if (await confirmDialog('Restore backup?', `Restore the backup ("${b.company.name}", day ${b.day})? The current game becomes the new backup.`, 'Restore')) { game.replace(b); toast('Backup restored.', 'ok'); }
        } catch (ex) { toast(`Cannot restore: ${ex.message}`, 'error'); }
      } }, 'Restore previous backup')) : null,
      h('p', {}, h('button', { class: 'btn danger', type: 'button', onClick: async () => {
        if (await confirmDialog('Start a new game?', 'This replaces your current company with a fresh one. A backup of the current game is kept (one level only).', 'Start new game')) { game.resetNew('My Restaurant Co.'); toast('New game started.', 'ok'); location.hash = '#/'; }
      } }, 'Reset local game'))),

    h('section', { class: 'card' }, h('h2', {}, 'Privacy'),
      h('p', {}, 'All data stays in this browser (localStorage). Nothing is sent to any server. Clearing site data deletes your game, so use Export save for a copy. localStorage is not secure storage.')),

    h('section', { class: 'card' }, h('h2', {}, 'About'),
      h('p', {}, `Restaurant Empire Online v${APP_VERSION} · save schema ${SCHEMA_VERSION}`),
      h('p', {}, `Mode: ${mode}. Online features are unavailable; there is no backend.`),
      h('p', { class: 'muted' }, 'Known limitations: no map, restaurants, staff, research or production yet. See IMPLEMENTATION_STATUS.md in the repository.')));
}
