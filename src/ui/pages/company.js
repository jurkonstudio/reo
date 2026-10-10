import { h } from '../dom.js';
import { href } from '../../app/router.js';
import { fmt } from '../../core/money.js';
import { Economy } from '../../domain/EconomyService.js';
import { Company } from '../../domain/CompanyService.js';
import { dataTable } from '../components/table.js';
import { toast } from '../components/feedback.js';

export function companyPage({ game }) {
  const s = game.state;
  const c = s.company;
  const r = Economy.report(s);
  const stat = (l, v, to) => h(to ? 'a' : 'div', { class: 'card stat', href: to ? href(to) : null }, h('span', { class: 'lbl' }, l), h('strong', {}, v));

  const name = h('input', { value: c.name, maxLength: 40, required: true, 'aria-label': 'Company name' });
  const desc = h('textarea', { rows: 3, maxLength: 240, 'aria-label': 'Description' }, c.description);
  const brand = h('input', { type: 'color', value: c.brand, 'aria-label': 'Brand color' });
  const err = h('p', { class: 'bad', role: 'alert' });
  const form = h('form', { novalidate: true, onSubmit: (e) => {
    e.preventDefault();
    const patch = { name: name.value, description: desc.value, brand: brand.value };
    const errors = Company.validateProfile(patch);
    if (errors.length) { err.textContent = errors.join(' '); return; }
    try { game.transact((st) => Company.update(st, patch)); toast('Company profile saved.', 'ok'); }
    catch (ex) { err.textContent = ex.message; }
  } },
  h('label', {}, 'Company name', name), h('label', {}, 'Description', desc), h('label', {}, 'Brand color', brand), err,
  h('div', { class: 'actions' },
    h('button', { class: 'btn', type: 'button', onClick: () => { name.value = c.name; desc.value = c.description; brand.value = c.brand; err.textContent = ''; } }, 'Cancel changes'),
    h('button', { class: 'btn primary', type: 'submit' }, 'Save profile')));

  return h('div', {},
    h('p', { class: 'muted' }, `Company ID: ${c.id} · Founded ${new Date(c.founded).toLocaleDateString()} (in game: day 1)`),
    h('div', { class: 'grid' },
      stat('Cash', fmt(r.cash), '/finance'),
      stat('Inventory value', fmt(r.inventoryValue), '/warehouse'),
      stat('Total assets', fmt(r.totalAssets), '/finance'),
      stat('Revenue', fmt(r.revenue), '/finance'),
      stat('Net profit', fmt(r.netProfit), '/finance'),
      stat('Restaurants', '0'),
      stat('Employees', '0'),
      stat('Research completed', '0')),
    h('p', { class: 'muted' }, 'Restaurants, employees and research show 0 because those systems are not built yet.'),
    h('section', { class: 'card' }, h('h2', {}, 'Identity'), form),
    h('section', { class: 'card' }, h('h2', {}, 'Company history'),
      dataTable([{ label: 'Day', render: (e) => e.day }, { label: 'Event', render: (e) => e.text }], [...s.history].reverse(), 'No events yet.')));
}
