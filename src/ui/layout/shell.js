import { h } from '../dom.js';
import { ROUTES, findRoute, crumbsFor } from '../../app/routes.js';
import { parseHash, href } from '../../app/router.js';
import { Economy } from '../../domain/EconomyService.js';
import { fmt } from '../../core/money.js';

export function mountShell(root, game, pages) {
  const header = h('header', { class: 'top' });
  const side = h('nav', { class: 'side', 'aria-label': 'Main navigation' });
  const main = h('main', { id: 'main', tabindex: '-1' });
  const bottom = h('nav', { class: 'bottom', 'aria-label': 'Primary' });
  root.replaceChildren(header, side, main, bottom);

  function appearance() {
    const d = document.documentElement;
    d.dataset.density = game.prefs.density;
    d.dataset.motion = game.prefs.reducedMotion ? 'reduced' : 'full';
    d.style.setProperty('--brand', game.state.company.brand);
    root.classList.toggle('collapsed', game.prefs.sidebarCollapsed);
  }

  const link = (route, active, cls = '') =>
    h('a', { href: href(route.path), class: `${cls}${active ? ' active' : ''}`, title: route.title, 'aria-current': active ? 'page' : null },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, route.icon), h('span', { class: 'lbl' }, route.title));

  function chrome(route) {
    const c = game.state.company;
    const cash = Economy.cash(game.state);
    header.replaceChildren(
      h('a', { class: 'brand', href: href('/company'), title: 'Company profile' },
        h('span', { class: 'logo', 'aria-hidden': 'true' }, c.name.trim().charAt(0).toUpperCase()),
        h('span', { class: 'cname' }, c.name)),
      h('span', { class: 'spacer' }),
      h('span', { class: 'day' }, `Day ${game.state.day}`),
      h('a', { class: 'cash', href: href('/finance'), title: 'Open finance' }, h('small', {}, 'Cash'), h('strong', {}, fmt(cash))),
      h('a', { class: 'iconbtn', href: href('/settings'), title: 'Settings', 'aria-label': 'Settings' }, '⚙️'));

    side.replaceChildren(
      ...ROUTES.filter((r) => r.nav).map((r) => link(r, route && route.id === r.id)),
      h('button', { class: 'collapse btn', type: 'button', title: 'Collapse or expand sidebar', 'aria-label': 'Collapse or expand sidebar',
        onClick: () => game.setPref('sidebarCollapsed', !game.prefs.sidebarCollapsed) }, game.prefs.sidebarCollapsed ? '»' : '«'));

    const moreActive = !route || !route.mobile;
    bottom.replaceChildren(
      ...ROUTES.filter((r) => r.mobile).map((r) => link(r, route && route.id === r.id)),
      link(findRoute('/more'), moreActive));
  }

  function page(focus) {
    const { path, query } = parseHash(location.hash);
    const route = findRoute(path);
    const keep = main.scrollTop;
    chrome(route);
    const ctx = { game, query, route, crumbs: [] };
    let content;
    let title = 'Page not found';
    let desc = '';
    if (!route) {
      content = h('div', { class: 'empty' }, h('p', {}, `There is no page at "${path}".`), h('a', { class: 'btn primary', href: href('/') }, 'Go to dashboard'));
    } else {
      title = route.title;
      desc = route.desc;
      try { content = pages[route.id](ctx); }
      catch (e) {
        content = h('div', { class: 'empty', role: 'alert' }, h('p', {}, `Something went wrong showing this page: ${e.message}`),
          h('a', { class: 'btn', href: href('/') }, 'Back to dashboard'));
      }
    }
    const trail = route ? [...crumbsFor(route).map((r) => ({ label: r.title, to: r.path })), ...ctx.crumbs] : [{ label: 'Dashboard', to: '/' }, { label: 'Not found' }];
    const crumbs = h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' },
      trail.map((c, i) => [i ? h('span', { 'aria-hidden': 'true' }, ' › ') : null,
        i < trail.length - 1 && c.to ? h('a', { href: href(c.to, c.query) }, c.label) : h('span', { 'aria-current': 'page' }, c.label)]));
    main.replaceChildren(trail.length > 1 ? crumbs : null, h('h1', {}, title), desc ? h('p', { class: 'muted' }, desc) : null, content);
    document.title = `${title} · ${game.state.company.name}`;
    appearance();
    if (focus) { main.scrollTop = 0; main.focus({ preventScroll: true }); } else main.scrollTop = keep;
  }

  window.addEventListener('hashchange', () => page(true));
  game.subscribe(() => page(false));
  page(false);
}
