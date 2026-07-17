import { NotFoundError, ForbiddenError, ConflictError, BusinessRuleError, ValidationError, BaseError } from '@/shared/errors';

// Re-export ForbiddenError for use in API route handlers
export { ForbiddenError } from '@/shared/errors';

/**
 * @domain comms
 * @description Ошибка: диалог не найден
 *
 * @spec
 * - Код ошибки: CONVERSATION_NOT_FOUND
 * - HTTP статус: 404
 * - Сообщение: диалог не найден по указанному ID
 */
export class ConversationNotFoundError extends NotFoundError {
  constructor(conversationId: string) {
    super('Conversation', conversationId);
  }
}

/**
 * @domain comms
 * @description Ошибка: доступ к диалогу запрещён
 *
 * @spec
 * - Код ошибки: CONVERSATION_ACCESS_DENIED
 * - HTTP статус: 403
 * - Сообщение: пользователь не является участником диалога
 */
export class ConversationAccessDeniedError extends ForbiddenError {
  constructor(message?: string) {
    super(message || 'У вас нет доступа к этому диалогу');
  }
}

/**
 * @domain comms
 * @description Ошибка: сообщение не найдено
 *
 * @spec
 * - Код ошибки: MESSAGE_NOT_FOUND
 * - HTTP статус: 404
 * - Сообщение: сообщение не найдено по указанному ID
 */
export class MessageNotFoundError extends NotFoundError {
  constructor(messageId: string) {
    super('Message', messageId);
  }
}

/**
 * @domain comms
 * @description Ошибка: диалог уже существует
 *
 * @spec
 * - Код ошибки: CONVERSATION_ALREADY_EXISTS
 * - HTTP статус: 409
 * - Сообщение: личный диалог между этими пользователями уже существует
 */
export class ConversationAlreadyExistsError extends ConflictError {
  constructor() {
    super('Личный диалог между этими пользователями уже существует');
  }
}

/**
 * @domain comms
 * @description Ошибка: нельзя написать самому себе
 *
 * @spec
 * - Код ошибки: CANNOT_MESSAGE_SELF
 * - HTTP статус: 400
 * - Сообщение: нельзя начать диалог с самим собой
 */
export class CannotMessageSelfError extends BusinessRuleError {
  constructor() {
    super('Нельзя начать диалог с самим собой');
  }
}

/**
 * @domain comms
 * @description Ошибка: нельзя написать заблокированному пользователю
 *
 * @spec
 * - Код ошибки: CANNOT_MESSAGE_BLOCKED_USER
 * - HTTP статус: 400
 * - Сообщение: нельзя начать диалог с заблокированным пользователем
 */
export class CannotMessageBlockedUserError extends BusinessRuleError {
  constructor() {
    super('Нельзя начать диалог с заблокированным пользователем');
  }
}

/**
 * @domain comms
 * @description Ошибка: сообщение слишком длинное
 *
 * @spec
 * - Код ошибки: MESSAGE_TOO_LARGE
 * - HTTP статус: 400
 * - Сообщение: сообщение превышает максимальный размер (4000 символов)
 */
export class MessageTooLargeError extends ValidationError {
  constructor() {
    super('Сообщение слишком длинное (максимум 4000 символов)');
  }
}

/**
 * @domain comms
 * @description Ошибка: нельзя удалить чужое сообщение
 *
 * @spec
 * - Код ошибки: CANNOT_DELETE_OTHERS_MESSAGE
 * - HTTP статус: 403
 * - Сообщение: нельзя удалить сообщение другого пользователя
 */
export class CannotDeleteOthersMessageError extends ForbiddenError {
  constructor() {
    super('Нельзя удалить сообщение другого пользователя');
  }
}

/**
 * @domain comms
 * @description Ошибка: групповой чат с таким названием уже существует
 *
 * @spec
 * - Код ошибки: CHAT_NAME_EXISTS
 * - HTTP статус: 409
 * - Сообщение: групповой чат с таким названием уже существует
 */
export class ChatNameExistsError extends ConflictError {
  constructor() {
    super('Групповой чат с таким названием уже существует');
  }
}

/**
 * @domain comms
 * @description Ошибка: слишком много участников в чате
 *
 * @spec
 * - Код ошибки: TOO_MANY_PARTICIPANTS
 * - HTTP статус: 400
 * - Сообщение: чат не может содержать более 50 участников
 */
export class TooManyParticipantsError extends ValidationError {
  constructor() {
    super('Чат не может содержать более 50 участников');
  }
}

/**
 * @domain comms
 * @description Ошибка: пользователь не имеет прав на редактирование чата
 *
 * @spec
 * - Код ошибки: CANNOT_EDIT_CHAT
 * - HTTP статус: 403
 * - Сообщение: у пользователя нет прав на редактирование этого чата
 */
export class CannotEditChatError extends ForbiddenError {
  constructor() {
    super('У вас нет прав на редактирование этого чата');
  }
}

/**
 * @domain comms
 * @description Ошибка: пользователь уже является участником чата
 *
 * @spec
 * - Код ошибки: PARTICIPANT_ALREADY_EXISTS
 * - HTTP статус: 409
 * - Сообщение: пользователь уже добавлен в чат
 */
export class ParticipantAlreadyExistsError extends ConflictError {
  constructor(message: string = 'Пользователь уже добавлен в чат') {
    super(message);
  }
}

/**
 * @domain comms
 * @description Ошибка: нельзя добавить участника (нет прав)
 *
 * @spec
 * - Код ошибки: CANNOT_ADD_PARTICIPANT
 * - HTTP статус: 403
 * - Сообщение: только создатель или администратор может добавлять участников
 */
export class CannotAddParticipantError extends ForbiddenError {
  constructor(message: string = 'Только создатель или администратор может добавлять участников') {
    super(message);
  }
}

/**
 * @domain comms
 * @description Ошибка: пользователь не найден среди участников чата
 *
 * @spec
 * - Код ошибки: CHAT_PARTICIPANT_NOT_FOUND
 * - HTTP статус: 404
 * - Сообщение: пользователь не найден в чате
 */
export class ChatParticipantNotFoundError extends NotFoundError {
  constructor(userId: string) {
    super(`Пользователь с ID ${userId} не найден в чате`, '404', 'CHAT_PARTICIPANT_NOT_FOUND');
  }
}

/**
 * @domain comms
 * @description Ошибка: некорректные данные запроса
 *
 * @spec
 * - Код ошибки: BAD_REQUEST
 * - HTTP статус: 400
 * - Сообщение: некорректные данные запроса
 */
export class BadRequestError extends BaseError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

/**
 * @domain comms
 * @description Ошибка: внутренняя ошибка сервера
 *
 * @spec
 * - Код ошибки: INTERNAL_ERROR
 * - HTTP статус: 500
 * - Сообщение: внутренняя ошибка сервера
 */
export class InternalServerError extends BaseError {
  constructor(message: string) {
    super(message, 500, 'INTERNAL_ERROR');
  }
}
