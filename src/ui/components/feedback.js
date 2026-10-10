import { h } from '../dom.js';

export function toast(message, kind = 'info') {
  const box = document.getElementById('toasts');
  if (!box) return;
  const icon = kind === 'ok' ? '✔ ' : kind === 'error' ? '✖ ' : 'ℹ ';
  const t = h('div', { class: `toast ${kind}`, role: kind === 'error' ? 'alert' : 'status' }, icon + message);
  box.append(t);
  setTimeout(() => t.remove(), 4500);
}

export function modal(title, body, { onClose } = {}) {
  const dlg = h('dialog', { class: 'modal', 'aria-label': title });
  dlg.append(
    h('div', { class: 'mhead' }, h('h2', {}, title), h('button', { class: 'btn', type: 'button', 'aria-label': 'Close', onClick: () => dlg.close() }, '✕')),
    body,
  );
  dlg.addEventListener('close', () => { dlg.remove(); if (onClose) onClose(); });
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

export function confirmDialog(title, message, okLabel = 'Confirm') {
  return new Promise((resolve) => {
    let result = false;
    const body = h('div', {},
      h('p', {}, message),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', type: 'button', onClick: () => dlg.close() }, 'Cancel'),
        h('button', { class: 'btn danger', type: 'button', onClick: () => { result = true; dlg.close(); } }, okLabel)));
    const dlg = modal(title, body, { onClose: () => resolve(result) });
  });
}

export const emptyState = (text, action) => h('div', { class: 'empty' }, h('p', {}, text), action || null);
