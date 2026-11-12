import { HttpError } from './httpError.js';

export function parseId(value, label = 'Record') {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(404, `${label} not found.`);
  return id;
}
