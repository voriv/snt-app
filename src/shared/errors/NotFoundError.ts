import { BaseError } from './BaseError';

export class NotFoundError extends BaseError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 404, 'NOT_FOUND');
  }
}
