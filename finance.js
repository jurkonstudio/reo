import { h } from '../dom.js';
import { href } from '../../app/router.js';
import { fmt } from '../../core/money.js';
import { Economy } from '../../domain/EconomyService.js';
import { dataTable } from '../components/table.js';

const TYPE_LABEL = { capital: 'Capital', inventory_purchase: 'Inventory purchase', market_sale: 'Market sale', fee: 'Fee' };

export function financePage({ game, query }) {
  const s = game.state;
  const r = Economy.report(s);
  const type = TYPE_LABEL[query.type] ? query.type : '';
  const rows = [...s.ledger].reverse().filter((t) => !type || t.type === type).slice(0, 100);
  const line = (label, value, strong) => h('tr', {}, h('td', {}, strong ? h('strong', {}, label) : label), h('td', { class: 'num' }, strong ? h('strong', {}, fmt(value)) : fmt(value)));
  const check = (ok, text) => h('li', {}, ok ? '✔ ' : '✖ ', text, ok ? ' — reconciled' : ' — MISMATCH');

  const filter = h('select', { 'aria-label': 'Transaction type', onChange: (e) => { location.hash = href('/finance', { type: e.target.value }).slice(1); } },
    h('option', { value: '' }, 'All types'),
    Object.entries(TYPE_LABEL).map(([k, v]) => h('option', { value: k, selected: k === type }, v)));

  return h('div', {},
    h('div', { class: 'grid2' },
      h('section', { class: 'card' }, h('h2', {}, 'Income statement'),
        h('div', { class: 'tablewrap' }, h('table', {}, h('tbody', {},
          line('Revenue (market sales)', r.revenue),
          line('Cost of goods sold', -r.cogs),
          line('Market fees', -r.fees),
          line('Operating profit', r.operatingProfit, true),
          line('Net profit', r.netProfit, true)))),
        h('p', { class: 'muted' }, 'Buying inventory is not an expense: it becomes an asset until sold. No taxes or interest exist yet, so net profit equals operating profit.')),
      h('section', { class: 'card' }, h('h2', {}, 'Cash and assets'),
        h('div', { class: 'tablewrap' }, h('table', {}, h('tbody', {},
          line('Initial capital', r.capital),
          line('Cash on hand', r.cash, true),
          line('Inventory value (at cost)', r.inventoryValue),
          line('Total assets / net worth', r.totalAssets, true)))),
        h('ul', { class: 'checks' },
          check(r.checks.cash, 'Cash = capital + revenue − purchases − fees'),
          check(r.checks.inventory, 'Inventory value = purchases − COGS'),
          check(r.checks.purchasesMatchStock, 'Ledger purchases = stock received')))),
    h('section', { class: 'card' }, h('h2', {}, 'Transaction ledger'),
      h('div', { class: 'toolbar' }, filter),
      dataTable([
        { label: 'Day', render: (t) => t.day },
        { label: 'ID', render: (t) => t.id },
        { label: 'Type', render: (t) => TYPE_LABEL[t.type] },
        { label: 'Description', render: (t) => t.description },
        { label: 'Amount', num: true, render: (t) => h('span', { class: t.amount < 0 ? 'bad' : 'ok' }, (t.amount < 0 ? '▼ ' : '▲ ') + fmt(t.amount)) },
      ], rows, 'No transactions match this filter.'),
      h('p', { class: 'muted' }, 'Showing the latest 100 matching transactions.')));
}
