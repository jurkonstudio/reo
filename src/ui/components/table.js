import { h } from '../dom.js';
import { emptyState } from './feedback.js';

// cols: [{label, render(row) -> node|string, num?: true}]
export function dataTable(cols, rows, emptyText = 'Nothing to show.') {
  if (!rows.length) return emptyState(emptyText);
  return h('div', { class: 'tablewrap' },
    h('table', {},
      h('thead', {}, h('tr', {}, cols.map((c) => h('th', { scope: 'col', class: c.num ? 'num' : '' }, c.label)))),
      h('tbody', {}, rows.map((r) => h('tr', {}, cols.map((c) => h('td', { class: c.num ? 'num' : '' }, c.render(r))))))));
}
