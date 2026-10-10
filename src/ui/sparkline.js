const NS = 'http://www.w3.org/2000/svg';
export function sparkline(values, label) {
  const w = 80, hh = 24;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => `${(values.length < 2 ? 0 : (i / (values.length - 1)) * w).toFixed(1)},${(hh - 2 - ((v - min) / span) * (hh - 4)).toFixed(1)}`).join(' ');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${hh}`);
  svg.setAttribute('width', w);
  svg.setAttribute('height', hh);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  const line = document.createElementNS(NS, 'polyline');
  line.setAttribute('points', pts);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', 'currentColor');
  line.setAttribute('stroke-width', '1.5');
  svg.append(line);
  return svg;
}
