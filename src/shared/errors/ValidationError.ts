import { BaseError } from './BaseError';

export class ValidationError extends BaseError {
  constructor(message: string = 'Validation error') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}
