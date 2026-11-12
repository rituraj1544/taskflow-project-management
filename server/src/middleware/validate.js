import { HttpError } from '../utils/httpError.js';

export const validate = (schema, key = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[key]);
  if (!result.success) {
    next(new HttpError(400, 'Please check the information and try again.', result.error.issues.map(({ path, message }) => ({ field: path.join('.'), message }))));
    return;
  }
  req[key] = result.data;
  next();
};
