import { GameError } from '../core/errors.js';
import { makeId } from '../core/ids.js';
import { MARKET } from '../data/balanceConfig.js';
import { getProduct } from '../data/products.js';
import { Economy } from './EconomyService.js';
import { Inventory } from './InventoryService.js';

// Simulated NPC market. NOT multiplayer. Prices are a pure function of (seed, product, day).
function hash(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rand01(seed) {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const priceAt = (seed, productId, day) => {
  const p = getProduct(productId);
  const noise = rand01((hash(productId) + seed + day * 7919) | 0);
  return Math.max(1, Math.round(p.base * (1 + MARKET.volatility * (2 * noise - 1))));
};

const volumeOf = (s) => (s.market.volume.day === s.day ? s.market.volume : { bought: {}, sold: {} });
const ensureVolume = (s) => {
  if (s.market.volume.day !== s.day) s.market.volume = { day: s.day, bought: {}, sold: {} };
};

export function quote(s, productId) {
  const p = getProduct(productId);
  const mid = priceAt(s.seed, productId, s.day);
  const vol = volumeOf(s);
  return {
    mid,
    ask: Math.round(mid * (1 + MARKET.spread / 2)),
    bid: Math.round(mid * (1 - MARKET.spread / 2)),
    availableToBuy: Math.max(0, p.supply - (vol.bought[productId] || 0)),
    availableToSell: Math.max(0, p.demand - (vol.sold[productId] || 0)),
  };
}

export function history(s, productId, n = MARKET.historyDays) {
  const out = [];
  for (let d = Math.max(1, s.day - n + 1); d <= s.day; d++) out.push({ day: d, mid: priceAt(s.seed, productId, d) });
  return out;
}

function plan(s, side, productId, qty) {
  const p = getProduct(productId);
  if (!p) throw new GameError('UNKNOWN_PRODUCT', 'Unknown product.');
  if (!Number.isSafeInteger(qty) || qty < 1) throw new GameError('BAD_QTY', 'Quantity must be a whole number of at least 1.');
  const q = quote(s, productId);
  const unit = side === 'buy' ? q.ask : q.bid;
  const gross = unit * qty;
  const fee = Math.round(gross * MARKET.feeRate);
  if (side === 'buy') {
    if (qty > q.availableToBuy) throw new GameError('NO_SUPPLY', `The market only has ${q.availableToBuy} ${p.unit} left to sell today.`);
    const total = gross + fee;
    if (Economy.cash(s) < total) throw new GameError('INSUFFICIENT_FUNDS', 'Not enough cash for this purchase.');
    return { unit, gross, fee, total };
  }
  const owned = Inventory.qty(s, productId);
  if (qty > owned) throw new GameError('INSUFFICIENT_STOCK', `You only have ${owned} ${p.unit} of ${p.name}.`);
  if (qty > q.availableToSell) throw new GameError('NO_DEMAND', `The market will only buy ${q.availableToSell} ${p.unit} more today.`);
  return { unit, gross, fee, total: gross - fee };
}

export function estimate(s, side, productId, qty) {
  try { return { ok: true, ...plan(s, side, productId, qty) }; }
  catch (e) { return { ok: false, error: e.message }; }
}

function record(s, side, productId, qty, p) {
  const order = { id: makeId('ord', s), ts: Date.now(), day: s.day, side, productId, qty, unit: p.unit, gross: p.gross, fee: p.fee };
  s.market.orders.push(order);
  return order;
}

export function buy(s, { productId, qty, key = null }) {
  ensureVolume(s);
  const p = plan(s, 'buy', productId, qty);
  const prod = getProduct(productId);
  Economy.post(s, { type: 'inventory_purchase', amount: -p.gross, entity: productId, description: `Bought ${qty} ${prod.unit} ${prod.name} from NPC market`, key });
  if (p.fee > 0) Economy.post(s, { type: 'fee', amount: -p.fee, entity: productId, description: `Market fee (buy ${prod.name})`, key: key ? `${key}:fee` : null });
  Inventory.add(s, productId, qty, p.gross, { ref: key, reason: 'market purchase' });
  s.market.volume.bought[productId] = (s.market.volume.bought[productId] || 0) + qty;
  return record(s, 'buy', productId, qty, p);
}

export function sell(s, { productId, qty, key = null }) {
  ensureVolume(s);
  const p = plan(s, 'sell', productId, qty);
  const prod = getProduct(productId);
  Inventory.remove(s, productId, qty, { kind: 'sell', ref: key, reason: 'market sale' });
  Economy.post(s, { type: 'market_sale', amount: p.gross, entity: productId, description: `Sold ${qty} ${prod.unit} ${prod.name} to NPC market`, key });
  if (p.fee > 0) Economy.post(s, { type: 'fee', amount: -p.fee, entity: productId, description: `Market fee (sell ${prod.name})`, key: key ? `${key}:fee` : null });
  s.market.volume.sold[productId] = (s.market.volume.sold[productId] || 0) + qty;
  return record(s, 'sell', productId, qty, p);
}

export const Market = { priceAt, quote, history, estimate, buy, sell };
