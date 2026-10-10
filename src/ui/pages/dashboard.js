import { h } from '../dom.js';
import { href } from '../../app/router.js';
import { fmt } from '../../core/money.js';
import { Economy } from '../../domain/EconomyService.js';
import { Inventory } from '../../domain/InventoryService.js';
import { Simulation } from '../../domain/SimulationService.js';
import { getProduct } from '../../data/products.js';
import { dataTable } from '../components/table.js';
import { toast } from '../components/feedback.js';

export function dashboardPage({ game }) {
  const s = game.state;
  const r = Economy.report(s);
  const low = Inventory.lowStock(s);
  const card = (label, value, to, sub) =>
    h('a', { class: 'card stat', href: to }, h('span', { class: 'lbl' }, label), h('strong', {}, value), sub ? h('small', {}, sub) : null);

  const actions = [];
  if (!Object.keys(s.inventory).length) actions.push(h('li', {}, h('a', { href: href('/market') }, 'Buy your first ingredients at the market.')));
  if (low.length) actions.push(h('li', {}, h('a', { href: href('/warehouse', { low: '1' }) }, `${low.length} product(s) are running low — review stock.`)));
  if (!actions.length) actions.push(h('li', {}, 'Nothing urgent. Trade at the market or advance the day.'));

  const recent = [...s.ledger].reverse().slice(0, 5);
  return h('div', {},
    h('div', { class: 'grid' },
      card('Cash', fmt(r.cash), href('/finance'), 'Liquid money'),
      card('Inventory value', fmt(r.inventoryValue), href('/warehouse'), 'At cost, not cash'),
      card('Net profit', fmt(r.netProfit), href('/finance'), 'Revenue − COGS − fees'),
      card('Net worth', fmt(r.netWorth), href('/company'), 'Cash + inventory')),
    h('section', { class: 'card' },
      h('h2', {}, 'Recommended actions'), h('ul', {}, actions),
      h('p', {}, h('button', { class: 'btn primary', type: 'button', onClick: () => {
        const day = game.transact((st) => Simulation.advanceDay(st));
        toast(`It is now day ${day}. Market prices and daily supply have refreshed.`, 'ok');
      } }, 'Advance to next day'))),
    low.length ? h('section', { class: 'card' }, h('h2', {}, 'Low stock'),
      dataTable([{ label: 'Product', render: (x) => x.product.name }, { label: 'Left', num: true, render: (x) => `${x.qty} ${x.product.unit}` }], low)) : null,
    h('section', { class: 'card' }, h('h2', {}, 'Recent transactions'),
      dataTable([
        { label: 'Day', render: (t) => t.day },
        { label: 'Description', render: (t) => t.description },
        { label: 'Amount', num: true, render: (t) => h('span', { class: t.amount < 0 ? 'bad' : 'ok' }, (t.amount < 0 ? '▼ ' : '▲ ') + fmt(t.amount)) },
      ], recent),
      h('p', {}, h('a', { href: href('/finance') }, 'Open full ledger →'))));
}
