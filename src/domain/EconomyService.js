import { GameError } from '../core/errors.js';
import { makeId } from '../core/ids.js';

const TYPES = ['capital', 'inventory_purchase', 'market_sale', 'fee'];
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

// Cash is DERIVED from the ledger (single source of truth). Every function here
// takes a state draft; Game.transact() guarantees failed operations are discarded.
export const Economy = {
  cash: (s) => sum(s.ledger, (t) => t.amount),

  post(s, { type, amount, entity = null, description = '', key = null }) {
    if (!TYPES.includes(type)) throw new GameError('BAD_TX', `Unknown transaction type: ${type}`);
    if (!Number.isSafeInteger(amount) || amount === 0) throw new GameError('BAD_TX', 'Amount must be a non-zero whole number of cents.');
    if (key && s.ledger.some((t) => t.key === key)) throw new GameError('DUPLICATE', 'This transaction was already processed.');
    if (this.cash(s) + amount < 0) throw new GameError('INSUFFICIENT_FUNDS', 'Not enough cash for this transaction.');
    const tx = { id: makeId('tx', s), ts: Date.now(), day: s.day, type, amount, entity, status: 'posted', description, key };
    s.ledger.push(tx);
    return tx;
  },

  report(s) {
    const ofType = (t) => sum(s.ledger.filter((x) => x.type === t), (x) => x.amount);
    const capital = ofType('capital');
    const revenue = ofType('market_sale');
    const purchases = -ofType('inventory_purchase');
    const fees = -ofType('fee');
    const cogs = sum(s.movements.filter((m) => m.kind === 'sell' || m.kind === 'consume'), (m) => m.cost);
    const inboundCost = sum(s.movements.filter((m) => m.kind === 'in'), (m) => m.cost);
    const cash = this.cash(s);
    const inventoryValue = sum(Object.values(s.inventory), (e) => e.value);
    const operatingProfit = revenue - cogs - fees;
    return {
      cash, capital, revenue, purchases, fees, cogs, inventoryValue,
      operatingProfit, netProfit: operatingProfit,
      totalAssets: cash + inventoryValue, netWorth: cash + inventoryValue,
      checks: {
        cash: cash === capital + revenue - purchases - fees,
        inventory: inventoryValue === purchases - cogs,
        purchasesMatchStock: inboundCost === purchases,
      },
    };
  },
};
