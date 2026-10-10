import { h } from '../dom.js';
import { href } from '../../app/router.js';
import { fmt } from '../../core/money.js';
import { PRODUCTS, CATEGORIES, getProduct } from '../../data/products.js';
import { Market } from '../../domain/MarketService.js';
import { Inventory } from '../../domain/InventoryService.js';
import { dataTable } from '../components/table.js';
import { sparkline } from '../components/sparkline.js';
import { modal, toast } from '../components/feedback.js';

function tradeDialog(game, side, product) {
  const key = `${side}:${product.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`; // idempotency key per dialog
  const qty = h('input', { type: 'number', min: 1, step: 1, value: '1', inputMode: 'numeric', 'aria-label': 'Quantity' });
  const preview = h('div', { class: 'preview', 'aria-live': 'polite' });
  const err = h('p', { class: 'bad', role: 'alert' });
  const go = h('button', { class: 'btn primary', type: 'submit' }, side === 'buy' ? 'Confirm purchase' : 'Confirm sale');
  const verb = side === 'buy' ? 'Total cost' : 'Net proceeds';

  const update = () => {
    const est = Market.estimate(game.state, side, product.id, Number(qty.value));
    err.textContent = '';
    if (est.ok) {
      preview.replaceChildren(
        h('div', {}, `Unit price: ${fmt(est.unit)} / ${product.unit}`),
        h('div', {}, `Subtotal: ${fmt(est.gross)}`),
        h('div', {}, `Market fee: ${fmt(est.fee)}`),
        h('strong', {}, `${verb}: ${fmt(est.total)}`));
      go.disabled = false;
    } else {
      preview.replaceChildren(h('span', { class: 'bad' }, `✖ ${est.error}`));
      go.disabled = true;
    }
  };
  qty.addEventListener('input', update);

  const form = h('form', { onSubmit: (e) => {
    e.preventDefault();
    go.disabled = true; // block double-submit
    try {
      const order = game.transact((s) => (side === 'buy' ? Market.buy : Market.sell)(s, { productId: product.id, qty: Number(qty.value), key }));
      toast(`${side === 'buy' ? 'Bought' : 'Sold'} ${order.qty} ${product.unit} ${product.name}.`, 'ok');
      dlg.close();
    } catch (ex) {
      err.textContent = ex.message;
      toast(ex.message, 'error');
      go.disabled = false;
    }
  } },
  h('label', {}, `Quantity (${product.unit})`, qty), preview, err,
  h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onClick: () => dlg.close() }, 'Cancel'), go));
  const dlg = modal(`${side === 'buy' ? 'Buy' : 'Sell'} ${product.name}`, form);
  update();
  qty.focus();
}

export function marketPage({ game, query }) {
  const f = { q: query.q || '', cat: CATEGORIES.includes(query.cat) ? query.cat : '' };
  const body = h('div');
  const sync = () => history.replaceState(null, '', href('/market', f));

  function draw() {
    const s = game.state;
    const needle = f.q.trim().toLowerCase();
    const rows = PRODUCTS.filter((p) => (!f.cat || p.category === f.cat) && (!needle || p.name.toLowerCase().includes(needle)));
    body.replaceChildren(dataTable([
      { label: 'Product', render: (p) => h('div', {}, h('strong', {}, p.name), h('div', { class: 'muted' }, p.category)) },
      { label: 'Trend (14d)', render: (p) => {
        const hist = Market.history(s, p.id).map((x) => x.mid);
        const last = hist[hist.length - 1], prev = hist.length > 1 ? hist[hist.length - 2] : last;
        return h('span', { class: 'trend' }, sparkline(hist, `Price trend for ${p.name}`), last > prev ? ' ▲' : last < prev ? ' ▼' : ' ―');
      } },
      { label: 'Buy price', num: true, render: (p) => fmt(Market.quote(s, p.id).ask) },
      { label: 'Sell price', num: true, render: (p) => fmt(Market.quote(s, p.id).bid) },
      { label: 'Supply today', num: true, render: (p) => `${Market.quote(s, p.id).availableToBuy} ${p.unit}` },
      { label: 'You own', num: true, render: (p) => `${Inventory.qty(s, p.id)} ${p.unit}` },
      { label: '', render: (p) => h('div', { class: 'rowact' },
        h('button', { class: 'btn primary', type: 'button', onClick: () => tradeDialog(game, 'buy', p) }, 'Buy'),
        h('button', { class: 'btn', type: 'button', disabled: Inventory.qty(s, p.id) === 0, onClick: () => tradeDialog(game, 'sell', p) }, 'Sell')) },
    ], rows, 'No products match your filters.'));
  }

  const search = h('input', { type: 'search', value: f.q, placeholder: 'Search products', 'aria-label': 'Search products', onInput: (e) => { f.q = e.target.value; sync(); draw(); } });
  const cat = h('select', { 'aria-label': 'Category', onChange: (e) => { f.cat = e.target.value; sync(); draw(); } },
    h('option', { value: '' }, 'All categories'),
    CATEGORIES.map((c) => h('option', { value: c, selected: c === f.cat }, c)));
  draw();

  const s = game.state;
  const orders = [...s.market.orders].reverse().slice(0, 15);
  return h('div', {},
    h('div', { class: 'toolbar' }, search, cat),
    body,
    h('section', { class: 'card' }, h('h2', {}, 'Order history'),
      dataTable([
        { label: 'Day', render: (o) => o.day },
        { label: 'Side', render: (o) => (o.side === 'buy' ? '▼ Buy' : '▲ Sell') },
        { label: 'Product', render: (o) => getProduct(o.productId).name },
        { label: 'Qty', num: true, render: (o) => `${o.qty} ${o.unit}` },
        { label: 'Value', num: true, render: (o) => fmt(o.gross) },
        { label: 'Fee', num: true, render: (o) => fmt(o.fee) },
      ], orders, 'No orders yet.')));
}
