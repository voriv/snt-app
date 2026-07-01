import { NotFoundError, ValidationError, ConflictError } from '@/shared/errors/index';

export class MemberNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(id, id);
  }
}

export class MemberDuplicateError extends ConflictError {
  constructor(email: string) {
    super(`Member with email ${email} already exists`);
  }
}

export class MemberInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(`Member data invalid: ${message}`);
  }
}
