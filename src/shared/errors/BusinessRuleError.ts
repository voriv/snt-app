import { BaseError } from './BaseError';

export class BusinessRuleError extends BaseError {
  constructor(message: string) {
    super(message, 422, 'BUSINESS_RULE_ERROR');
  }
}
