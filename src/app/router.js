export function parseHash(hash) {
  const raw = (hash || '').replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs)) };
}
export function href(path, query) {
  const entries = Object.entries(query || {}).filter(([, v]) => v !== '' && v != null);
  const qs = entries.length ? '?' + new URLSearchParams(entries).toString() : '';
  return `#${path}${qs}`;
}
export const navigate = (path, query) => { location.hash = href(path, query).slice(1); };
