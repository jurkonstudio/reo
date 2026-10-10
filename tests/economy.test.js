import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/app/appState.js';
import { SaveService } from '../src/persistence/SaveService.js';
import { PrefsService } from '../src/persistence/PrefsService.js';
import { MemoryRepository } from '../src/persistence/LocalRepository.js';
import { Economy } from '../src/domain/EconomyService.js';
import { Inventory } from '../src/domain/InventoryService.js';
import { Market } from '../src/domain/MarketService.js';
import { Simulation } from '../src/domain/SimulationService.js';
import { START_CASH } from '../src/data/balanceConfig.js';
import { KEYS } from '../src/core/constants.js';

const mk = (repo = new MemoryRepository()) => ({
  repo,
  game: new Game(new SaveService(repo), new PrefsService(repo)).init(12345),
});
const snap = (g) => JSON.stringify(g.state);

test('new game starts with capital in the ledger', () => {
  const { game } = mk();
  assert.equal(Economy.cash(game.state), START_CASH);
  assert.equal(game.state.ledger.length, 1);
});

test('valid purchase: cash down, stock up, fee booked, ledger reconciles', () => {
  const { game } = mk();
  const est = Market.estimate(game.state, 'buy', 'flour', 100);
  assert.ok(est.ok);
  game.transact((s) => Market.buy(s, { productId: 'flour', qty: 100, key: 'k1' }));
  assert.equal(Inventory.qty(game.state, 'flour'), 100);
  assert.equal(Economy.cash(game.state), START_CASH - est.total);
  const r = Economy.report(game.state);
  assert.deepEqual(r.checks, { cash: true, inventory: true, purchasesMatchStock: true });
  assert.equal(r.fees, est.fee);
});

test('insufficient balance is rejected and changes nothing', () => {
  const { game } = mk();
  game.transact((s) => { s.ledger = []; Economy.post(s, { type: 'capital', amount: 500 }); });
  const before = snap(game);
  assert.throws(() => game.transact((s) => Market.buy(s, { productId: 'coffee', qty: 10, key: 'poor' })), /Not enough cash/);
  assert.equal(snap(game), before);
  assert.equal(Economy.cash(game.state), 500);
});

test('failed purchase is atomic (no partial mutation)', () => {
  const { game } = mk();
  game.transact((s) => { s.ledger = []; Economy.post(s, { type: 'capital', amount: 100 }); });
  const before = snap(game);
  assert.throws(() => game.transact((s) => Market.buy(s, { productId: 'beef', qty: 5, key: 'x' })), /Not enough cash/);
  assert.equal(snap(game), before);
});

test('selling needs stock; sale books revenue, COGS and fee', () => {
  const { game } = mk();
  assert.throws(() => game.transact((s) => Market.sell(s, { productId: 'rice', qty: 1, key: 's0' })), /only have 0/);
  game.transact((s) => Market.buy(s, { productId: 'rice', qty: 50, key: 'b1' }));
  game.transact((s) => Market.sell(s, { productId: 'rice', qty: 20, key: 's1' }));
  assert.equal(Inventory.qty(game.state, 'rice'), 30);
  const r = Economy.report(game.state);
  assert.ok(r.revenue > 0 && r.cogs > 0);
  assert.equal(r.operatingProfit, r.revenue - r.cogs - r.fees);
  assert.ok(Object.values(r.checks).every(Boolean));
});

test('duplicate transaction key is rejected', () => {
  const { game } = mk();
  game.transact((s) => Market.buy(s, { productId: 'flour', qty: 10, key: 'dup' }));
  const before = snap(game);
  assert.throws(() => game.transact((s) => Market.buy(s, { productId: 'flour', qty: 10, key: 'dup' })), /already processed/);
  assert.equal(snap(game), before);
});

test('invalid quantities are rejected', () => {
  const { game } = mk();
  for (const q of [0, -3, 1.5, NaN]) {
    assert.throws(() => game.transact((s) => Market.buy(s, { productId: 'flour', qty: q })), /whole number/);
  }
  assert.throws(() => game.transact((s) => Market.buy(s, { productId: 'nope', qty: 1 })), /Unknown product/);
});

test('daily supply limit applies and resets on a new day', () => {
  const { game } = mk();
  game.transact((s) => Market.buy(s, { productId: 'tea', qty: 60, key: 't1' }));
  assert.throws(() => game.transact((s) => Market.buy(s, { productId: 'tea', qty: 1, key: 't2' })), /left to sell today/);
  game.transact((s) => Simulation.advanceDay(s));
  game.transact((s) => Market.buy(s, { productId: 'tea', qty: 1, key: 't3' }));
  assert.equal(Inventory.qty(game.state, 'tea'), 61);
});

test('prices are deterministic per seed+day and stay inside the volatility band', () => {
  for (let d = 1; d < 50; d++) {
    const a = Market.priceAt(12345, 'beef', d);
    assert.equal(a, Market.priceAt(12345, 'beef', d));
    assert.ok(a >= 1150 * 0.85 - 1 && a <= 1150 * 1.15 + 1);
  }
});

test('moving-average cost basis is integer-exact after partial sells', () => {
  const { game } = mk();
  game.transact((s) => Market.buy(s, { productId: 'oil', qty: 7, key: 'o1' }));
  game.transact((s) => Market.sell(s, { productId: 'oil', qty: 3, key: 'o2' }));
  game.transact((s) => Market.sell(s, { productId: 'oil', qty: 4, key: 'o3' }));
  assert.equal(Inventory.qty(game.state, 'oil'), 0);
  assert.equal(Inventory.value(game.state, 'oil'), 0);
  assert.ok(Object.values(Economy.report(game.state).checks).every(Boolean));
});

test('save/load round trip keeps state exactly, no duplicated ledger', () => {
  const { game, repo } = mk();
  game.transact((s) => Market.buy(s, { productId: 'milk', qty: 40, key: 'm1' }));
  const reloaded = new Game(new SaveService(repo), new PrefsService(repo)).init(999);
  assert.equal(snap(reloaded), snap(game));
  assert.equal(reloaded.state.ledger.length, game.state.ledger.length);
});

test('corrupt save is preserved under a backup key and a new game starts', () => {
  const repo = new MemoryRepository();
  repo.set(KEYS.save, '{not json');
  const g = new Game(new SaveService(repo), new PrefsService(repo)).init(1);
  assert.equal(g.loadInfo.status, 'recovered');
  assert.equal(Economy.cash(g.state), START_CASH);
  const kept = [...repo.m.keys()].filter((k) => k.startsWith(KEYS.corruptPrefix));
  assert.equal(kept.length, 1);
  assert.equal(repo.get(kept[0]), '{not json');
});

test('tampered save (negative stock) is rejected on load', () => {
  const { game, repo } = mk();
  const env = JSON.parse(repo.get(KEYS.save));
  env.data.inventory.flour = { qty: -5, value: 0 };
  repo.set(KEYS.save, JSON.stringify(env));
  const g = new Game(new SaveService(repo), new PrefsService(repo)).init(1);
  assert.equal(g.loadInfo.status, 'recovered');
  assert.notEqual(game, undefined);
});

test('newer-schema and malformed imports are rejected; valid import replaces and keeps backup', () => {
  const { game, repo } = mk();
  const save = new SaveService(repo);
  assert.throws(() => save.parseImport('nope'), /valid JSON/);
  assert.throws(() => save.parseImport(JSON.stringify({ schema: 99, data: {} })), /newer version/);
  assert.throws(() => save.parseImport(JSON.stringify({ schema: 1, data: { schema: 1 } })), /Invalid game data/);
  const text = save.exportJSON(game.state);
  game.transact((s) => Market.buy(s, { productId: 'flour', qty: 5, key: 'i1' }));
  const imported = save.parseImport(text);
  game.replace(imported);
  assert.equal(Inventory.qty(game.state, 'flour'), 0);
  assert.ok(save.hasBackup());
  assert.equal(Inventory.qty(save.readBackup(), 'flour'), 5);
});

test('preferences persist separately from game state and reset to defaults', () => {
  const { game, repo } = mk();
  game.setPref('density', 'compact');
  game.setPref('sidebarCollapsed', true);
  const again = new Game(new SaveService(repo), new PrefsService(repo)).init(1);
  assert.equal(again.prefs.density, 'compact');
  assert.equal(again.prefs.sidebarCollapsed, true);
  again.resetPrefs();
  assert.equal(again.prefs.density, 'comfortable');
});

test('company profile validation', async () => {
  const { Company } = await import('../src/domain/CompanyService.js');
  const { game } = mk();
  assert.throws(() => game.transact((s) => Company.update(s, { name: 'x', description: '', brand: '#fff' })), /Name must be/);
  game.transact((s) => Company.update(s, { name: 'Alpha Foods', description: 'hi', brand: '#112233' }));
  assert.equal(game.state.company.name, 'Alpha Foods');
  assert.ok(game.state.history.some((e) => e.text.includes('Alpha Foods')));
});
