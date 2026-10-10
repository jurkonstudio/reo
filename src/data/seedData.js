import { SCHEMA_VERSION } from '../core/constants.js';
import { makeId } from '../core/ids.js';
import { Economy } from '../domain/EconomyService.js';
import { Company } from '../domain/CompanyService.js';
import { START_CASH } from './balanceConfig.js';

export function createNewGame({ name = 'My Restaurant Co.', seed = Math.floor(Math.random() * 2 ** 31) } = {}) {
  const s = {
    schema: SCHEMA_VERSION, seed, day: 1, counters: {},
    company: { id: '', name, description: 'A new restaurant company.', brand: '#b4442b', founded: Date.now() },
    ledger: [], inventory: {}, movements: [],
    market: { volume: { day: 1, bought: {}, sold: {} }, orders: [] },
    history: [],
  };
  s.company.id = makeId('co', s);
  Economy.post(s, { type: 'capital', amount: START_CASH, description: 'Initial capital' });
  Company.log(s, 'company', 'Company founded');
  return s;
}
