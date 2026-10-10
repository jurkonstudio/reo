import { SCHEMA_VERSION } from '../core/constants.js';
import { GameError } from '../core/errors.js';

// MIGRATIONS[n] upgrades data from schema n to n+1. None yet (schema 1 is the first).
export const MIGRATIONS = {};

export function migrate(envelope) {
  if (!envelope || typeof envelope !== 'object' || typeof envelope.schema !== 'number' || !envelope.data) {
    throw new GameError('INVALID_SAVE', 'Not a valid save file.');
  }
  if (envelope.schema > SCHEMA_VERSION) {
    throw new GameError('NEWER_SAVE', 'This save was made by a newer version of the game.');
  }
  let data = envelope.data;
  for (let v = envelope.schema; v < SCHEMA_VERSION; v++) {
    const step = MIGRATIONS[v];
    if (!step) throw new GameError('NO_MIGRATION', `No migration from schema ${v}.`);
    data = step(data);
    data.schema = v + 1;
  }
  return data;
}
