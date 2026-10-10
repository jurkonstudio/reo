// Stable, deterministic IDs. Counters live in game state so reloads never reuse an ID.
export function makeId(prefix, state) {
  state.counters[prefix] = (state.counters[prefix] || 0) + 1;
  return `${prefix}_${state.counters[prefix].toString(36).padStart(4, '0')}`;
}
