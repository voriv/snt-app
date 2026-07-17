/**
 * @errors Message Domain Errors
 * @domain comms
 * @description Классы ошибок домена сообщений
 */

import { BaseError } from '../../shared/errors';
import { ValidationError } from '../../shared/errors/ValidationError';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ConflictError } from '../../shared/errors/ConflictError';
import { ForbiddenError } from '../../shared/errors/ForbiddenError';
import { BusinessRuleError } from '../../shared/errors/BusinessRuleError';

/**
 * @error MessageNotFoundError
 * @domain comms
 * @description Сообщение не найдено
 *
 * @spec
 * - HTTP 404
 * - Возникает при попытке получить несуществующее сообщение
 */
export class MessageNotFoundError extends NotFoundError {
  constructor(messageId: string) {
    super('Сообщение', messageId);
    this.name = 'MessageNotFoundError';
  }
}

/**
 * @error MessageInvalidDataError
 * @domain comms
 * @description Недействительные данные сообщения
 *
 * @spec
 * - HTTP 400
 * - Возникает при невалидных данных сообщения
 */
export class MessageInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'MessageInvalidDataError';
  }
}

/**
 * @error MessageReplyNotFoundError
 * @domain comms
 * @description Цитируемое сообщение не найдено
 *
 * @spec
 * - HTTP 404
 * - Возникает при попытке ответить на несуществующее сообщение
 */
export class MessageReplyNotFoundError extends NotFoundError {
  constructor(replyId: string) {
    super('Цитируемое сообщение', replyId);
    this.name = 'MessageReplyNotFoundError';
  }
}

/**
 * @error MessageReplyNotInConversationError
 * @domain comms
 * @description Цитируемое сообщение не принадлежит диалогу
 *
 * @spec
 * - HTTP 409
 * - Возникает при попытке ответить на сообщение из другого диалога
 */
export class MessageReplyNotInConversationError extends ConflictError {
  constructor(replyId: string, conversationId: string) {
    super(
      `Цитируемое сообщение с ID "${replyId}" не принадлежит диалогу "${conversationId}"`
    );
    this.name = 'MessageReplyNotInConversationError';
  }
}

/**
 * @error MessageCannotDeleteError
 * @domain comms
 * @description Нельзя удалить сообщение
 *
 * @spec
 * - HTTP 403
 * - Возникает при попытке удалить чужое сообщение без прав
 */
export class MessageCannotDeleteError extends ForbiddenError {
  constructor(messageId: string) {
    super(`Нет прав для удаления сообщения с ID "${messageId}"`);
    this.name = 'MessageCannotDeleteError';
  }
}

/**
 * @error MessageCannotEditError
 * @domain comms
 * @description Нельзя отредактировать сообщение
 *
 * @spec
 * - HTTP 403
 * - Возникает при попытке отредактировать чужое сообщение
 */
export class MessageCannotEditError extends ForbiddenError {
  constructor(messageId: string) {
    super(`Нет прав для редактирования сообщения с ID "${messageId}"`);
    this.name = 'MessageCannotEditError';
  }
}

/**
 * @error MessageEmptyContentError
 * @domain comms
 * @description Пустое содержание сообщения
 *
 * @spec
 * - HTTP 400
 * - Возникает при попытке создать сообщение с пустым текстом
 */
export class MessageEmptyContentError extends BusinessRuleError {
  constructor() {
    super('Текст сообщения не может быть пустым');
    this.name = 'MessageEmptyContentError';
  }
}

/**
 * @error MessageTooLongError
 * @domain comms
 * @description Сообщение слишком длинное
 *
 * @spec
 * - HTTP 400
 * - Возникает при превышении максимальной длины сообщения
 */
export class MessageTooLongError extends ValidationError {
  constructor(maxLength: number) {
    super(`Сообщение не может превышать ${maxLength} символов`);
    this.name = 'MessageTooLongError';
  }
}
