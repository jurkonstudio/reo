import { GameError } from '../core/errors.js';
import { makeId } from '../core/ids.js';
import { getProduct } from '../data/products.js';

const needQty = (q) => {
  if (!Number.isSafeInteger(q) || q < 1) throw new GameError('BAD_QTY', 'Quantity must be a whole number of at least 1.');
};

// Inventory holds {qty, value(cents)} per product (moving-average cost, integer-exact).
export const Inventory = {
  qty: (s, id) => s.inventory[id]?.qty ?? 0,
  value: (s, id) => s.inventory[id]?.value ?? 0,
  totalValue: (s) => Object.values(s.inventory).reduce((a, e) => a + e.value, 0),

  add(s, id, qty, cost, { ref = null, reason = '' } = {}) {
    if (!getProduct(id)) throw new GameError('UNKNOWN_PRODUCT', 'Unknown product.');
    needQty(qty);
    if (!Number.isSafeInteger(cost) || cost < 0) throw new GameError('BAD_COST', 'Invalid cost.');
    const e = (s.inventory[id] ??= { qty: 0, value: 0 });
    e.qty += qty;
    e.value += cost;
    s.movements.push({ id: makeId('mv', s), ts: Date.now(), day: s.day, productId: id, kind: 'in', qty, cost, ref, reason });
  },

  // Returns the cost basis removed. kind: 'sell' | 'consume'.
  remove(s, id, qty, { kind = 'consume', ref = null, reason = '' } = {}) {
    needQty(qty);
    const e = s.inventory[id];
    const have = e ? e.qty : 0;
    if (qty > have) {
      throw new GameError('INSUFFICIENT_STOCK', `Not enough ${getProduct(id)?.name ?? id}: need ${qty}, have ${have}.`);
    }
    const cost = qty === e.qty ? e.value : Math.round((e.value * qty) / e.qty);
    e.qty -= qty;
    e.value -= cost;
    s.movements.push({ id: makeId('mv', s), ts: Date.now(), day: s.day, productId: id, kind, qty, cost, ref, reason });
    return cost;
  },

  lowStock(s) {
    return Object.entries(s.inventory)
      .filter(([id, e]) => e.qty < getProduct(id).lowStock)
      .map(([id, e]) => ({ product: getProduct(id), qty: e.qty }));
  },
};
