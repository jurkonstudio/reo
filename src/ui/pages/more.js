import { h } from '../dom.js';
import { ROUTES } from '../../app/routes.js';
import { href } from '../../app/router.js';

export function morePage() {
  return h('div', { class: 'morelist' },
    ROUTES.filter((r) => r.nav && !r.mobile).map((r) =>
      h('a', { class: 'card morelink', href: href(r.path) }, h('span', { 'aria-hidden': 'true' }, r.icon), h('span', {}, h('strong', {}, r.title), h('div', { class: 'muted' }, r.desc)))));
}
