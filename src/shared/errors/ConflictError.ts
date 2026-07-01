import { BaseError } from './BaseError';

export class ConflictError extends BaseError {
  constructor(message: string = 'Conflict error') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}
