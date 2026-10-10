import { SCHEMA_VERSION } from './constants.js';
import { GameError } from './errors.js';
import { getProduct } from '../data/products.js';

const bad = (why) => { throw new GameError('INVALID_STATE', `Invalid game data: ${why}`); };
const int = (n) => Number.isSafeInteger(n);

export function validateState(s) {
  if (!s || typeof s !== 'object') bad('not an object');
  if (s.schema !== SCHEMA_VERSION) bad(`schema ${s.schema}`);
  if (!int(s.seed)) bad('seed');
  if (!int(s.day) || s.day < 1) bad('day');
  if (!s.counters || typeof s.counters !== 'object') bad('counters');
  const c = s.company;
  if (!c || typeof c.id !== 'string' || typeof c.name !== 'string' || !c.name.trim()) bad('company');
  if (typeof c.description !== 'string' || !/^#[0-9a-f]{6}$/i.test(c.brand || '')) bad('company profile');
  if (!Array.isArray(s.ledger)) bad('ledger');
  const ids = new Set();
  let cash = 0;
  for (const t of s.ledger) {
    if (typeof t?.id !== 'string' || ids.has(t.id)) bad('ledger id');
    ids.add(t.id);
    if (!int(t.amount) || t.amount === 0) bad('ledger amount');
    cash += t.amount;
  }
  if (cash < 0) bad('negative cash');
  if (!s.inventory || typeof s.inventory !== 'object') bad('inventory');
  for (const [id, e] of Object.entries(s.inventory)) {
    if (!getProduct(id)) bad(`unknown product ${id}`);
    if (!int(e?.qty) || e.qty < 0 || !int(e.value) || e.value < 0) bad(`inventory ${id}`);
    if (e.qty === 0 && e.value !== 0) bad(`inventory ${id} value`);
  }
  for (const k of ['movements', 'history']) if (!Array.isArray(s[k])) bad(k);
  for (const m of s.movements) if (!int(m?.qty) || !int(m.cost)) bad('movement');
  if (!s.market || !Array.isArray(s.market.orders) || !s.market.volume) bad('market');
  return s;
}
