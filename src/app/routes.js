// Single source of truth for navigation. Only implemented pages are listed.
export const ROUTES = [
  { id: 'dashboard', path: '/', title: 'Dashboard', icon: '🏠', nav: true, mobile: true, desc: 'Company overview and recommended actions.' },
  { id: 'company', path: '/company', title: 'Company', icon: '🏢', nav: true, parent: '/', desc: 'Profile, identity, statistics and history.' },
  { id: 'warehouse', path: '/warehouse', title: 'Warehouse', icon: '📦', nav: true, mobile: true, parent: '/', desc: 'Company inventory and stock movements.' },
  { id: 'market', path: '/market', title: 'Market', icon: '🛒', nav: true, mobile: true, parent: '/', desc: 'Simulated NPC market (not other players). Buy and sell ingredients.' },
  { id: 'finance', path: '/finance', title: 'Finance', icon: '💰', nav: true, parent: '/', desc: 'Income statement, cash and the transaction ledger.' },
  { id: 'settings', path: '/settings', title: 'Settings', icon: '⚙️', nav: true, parent: '/', desc: 'Preferences, save management and about.' },
  { id: 'more', path: '/more', title: 'More', icon: '☰', nav: false, parent: '/', desc: 'All sections.' },
];
export const findRoute = (path) => ROUTES.find((r) => r.path === path) || null;
export function crumbsFor(route) {
  const out = [];
  let r = route;
  while (r) { out.unshift(r); r = r.parent ? findRoute(r.parent) : null; }
  return out;
}
