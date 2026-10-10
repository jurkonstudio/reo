import { GameError } from '../core/errors.js';
import { makeId } from '../core/ids.js';

export const Company = {
  log(s, type, text) {
    s.history.push({ id: makeId('ev', s), ts: Date.now(), day: s.day, type, text });
  },
  validateProfile({ name, description, brand }) {
    const errors = [];
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 40) errors.push('Name must be 2–40 characters.');
    if (typeof description !== 'string' || description.length > 240) errors.push('Description must be at most 240 characters.');
    if (!/^#[0-9a-f]{6}$/i.test(brand || '')) errors.push('Brand color must be a hex color like #b4442b.');
    return errors;
  },
  update(s, patch) {
    const errors = this.validateProfile(patch);
    if (errors.length) throw new GameError('INVALID_PROFILE', errors.join(' '));
    const renamed = s.company.name !== patch.name.trim();
    s.company.name = patch.name.trim();
    s.company.description = patch.description;
    s.company.brand = patch.brand;
    if (renamed) this.log(s, 'company', `Company renamed to "${s.company.name}"`);
  },
};
