import { BaseError } from './BaseError';

export class NotFoundError extends BaseError {
  constructor(resource: string, id: string, code: string = 'NOT_FOUND') {
    super(`${resource} with id ${id} not found`, 404, code);
  }
}
