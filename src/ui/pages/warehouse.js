import { h } from '../dom.js';
import { href } from '../../app/router.js';
import { fmt } from '../../core/money.js';
import { PRODUCTS, CATEGORIES, getProduct } from '../../data/products.js';
import { Inventory } from '../../domain/InventoryService.js';
import { dataTable } from '../components/table.js';

export function warehousePage({ game, query, crumbs }) {
  const s = game.state;

  if (query.p) {
    const p = getProduct(query.p);
    if (p) {
      crumbs.push({ label: p.name });
      const moves = s.movements.filter((m) => m.productId === p.id).reverse();
      return h('div', {},
        h('p', {}, h('a', { href: href('/warehouse') }, '← Back to warehouse')),
        h('section', { class: 'card' },
          h('h2', {}, `${p.name} movements`),
          h('p', {}, `In stock: ${Inventory.qty(s, p.id)} ${p.unit} · Value: ${fmt(Inventory.value(s, p.id))}`),
          dataTable([
            { label: 'Day', render: (m) => m.day },
            { label: 'Kind', render: (m) => ({ in: '▼ Received', sell: '▲ Sold', consume: '▲ Consumed' }[m.kind] || m.kind) },
            { label: 'Qty', num: true, render: (m) => `${m.qty} ${p.unit}` },
            { label: 'Cost basis', num: true, render: (m) => fmt(m.cost) },
            { label: 'Reason', render: (m) => m.reason || '—' },
          ], moves, 'No movements for this product yet.')));
    }
    crumbs.push({ label: 'Unknown product' });
    return h('div', { class: 'empty', role: 'alert' }, h('p', {}, 'That product does not exist.'), h('a', { class: 'btn', href: href('/warehouse') }, 'Back to warehouse'));
  }

  const f = { q: query.q || '', cat: CATEGORIES.includes(query.cat) ? query.cat : '', low: query.low === '1' };
  const body = h('div');
  const sync = () => history.replaceState(null, '', href('/warehouse', { q: f.q, cat: f.cat, low: f.low ? '1' : '' }));
  const lowIds = new Set(Inventory.lowStock(s).map((x) => x.product.id));

  function draw() {
    const needle = f.q.trim().toLowerCase();
    const rows = PRODUCTS.filter((p) => (!f.cat || p.category === f.cat) && (!needle || p.name.toLowerCase().includes(needle)) && (!f.low || lowIds.has(p.id)));
    body.replaceChildren(dataTable([
      { label: 'Product', render: (p) => h('a', { href: href('/warehouse', { p: p.id }) }, p.name) },
      { label: 'Category', render: (p) => p.category },
      { label: 'Quantity', num: true, render: (p) => `${Inventory.qty(s, p.id)} ${p.unit}` },
      { label: 'Avg cost', num: true, render: (p) => { const q = Inventory.qty(s, p.id); return q ? fmt(Math.round(Inventory.value(s, p.id) / q)) : '—'; } },
      { label: 'Value', num: true, render: (p) => fmt(Inventory.value(s, p.id)) },
      { label: 'Status', render: (p) => (!s.inventory[p.id] ? 'Not stocked' : lowIds.has(p.id) ? '⚠ Low' : '✔ OK') },
      { label: '', render: (p) => h('a', { class: 'btn', href: href('/market', { q: p.name }) }, 'Buy') },
    ], rows, 'No products match your filters.'));
  }

  const search = h('input', { type: 'search', value: f.q, placeholder: 'Search products', 'aria-label': 'Search products', onInput: (e) => { f.q = e.target.value; sync(); draw(); } });
  const cat = h('select', { 'aria-label': 'Category', onChange: (e) => { f.cat = e.target.value; sync(); draw(); } },
    h('option', { value: '' }, 'All categories'), CATEGORIES.map((c) => h('option', { value: c, selected: c === f.cat }, c)));
  const low = h('input', { type: 'checkbox', checked: f.low, onChange: (e) => { f.low = e.target.checked; sync(); draw(); } });
  draw();
  return h('div', {},
    h('p', {}, `Total inventory value: `, h('strong', {}, fmt(Inventory.totalValue(s)))),
    h('div', { class: 'toolbar' }, search, cat, h('label', { class: 'inline' }, low, ' Low stock only')),
    body);
}
