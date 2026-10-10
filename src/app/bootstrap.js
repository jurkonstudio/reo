import { Game } from './appState.js';
import { SaveService } from '../persistence/SaveService.js';
import { PrefsService } from '../persistence/PrefsService.js';
import { LocalRepository, MemoryRepository } from '../persistence/LocalRepository.js';
import { mountShell } from '../ui/layout/shell.js';
import { PAGES } from '../ui/pages/index.js';
import { toast } from '../ui/components/feedback.js';

function pickRepo() {
  try {
    localStorage.setItem('__reo_probe', '1');
    localStorage.removeItem('__reo_probe');
    return { repo: new LocalRepository(localStorage), persistent: true };
  } catch {
    return { repo: new MemoryRepository(), persistent: false };
  }
}

function main() {
  const root = document.getElementById('app');
  try {
    const { repo, persistent } = pickRepo();
    window.__reoPersistent = persistent;
    const game = new Game(new SaveService(repo), new PrefsService(repo)).init();
    mountShell(root, game, PAGES);
    if (!persistent) toast('Browser storage is unavailable: progress will be lost when you close this tab.', 'error');
    if (game.loadInfo.status === 'recovered') toast(game.loadInfo.message, 'error');
    if (!game.saveStatus.ok) toast(`Saving failed: ${game.saveStatus.error}`, 'error');
  } catch (e) {
    root.textContent = `The game failed to start: ${e.message}`;
    console.error(e);
  }
}

if (typeof document !== 'undefined') main();
