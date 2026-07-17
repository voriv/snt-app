/**
 * @type Message
 * @domain comms
 * @description Сообщение в диалоге (конверсации)
 *
 * @spec
 * - Бизнес-ключ: нет натурального ключа, идентификация через id
 * - Жизненный цикл: создается активным, может быть мягко удалено
 * - Инварианты: content обязательно и не пустое
 * - Цитирование: reply_to_id должен относиться к тому же диалогу
 *
 * @see docs/model/entities/message.md — концептуальная модель
 */
export interface Message {
  /** Уникальный идентификатор. Генерируется автоматически cuid */
  id: string;
  /** ID диалога. Внешний ключ на conversations.id */
  conversationId: string;
  /** ID отправителя. Внешний ключ на users.id */
  senderId: string;
  /** Текст сообщения. Обязательно, не пустое */
  content: string;
  /** ID цитируемого сообщения. Опционально */
  replyToId: string | null;
  /** Флаг мягкого удаления. По умолчанию: false */
  isDeleted: boolean;
  /** ID пользователя, удалившего сообщение. Заполняется при мягком удалении */
  deletedBy: string | null;
  /** Время мягкого удаления. Заполняется при мягком удалении */
  deletedAt: Date | null;
  /** Дата отправки. Генерируется автоматически */
  createdAt: Date;
  /** Дата последнего редактирования. Обновляется при редактировании */
  updatedAt: Date;
}

/**
 * @type CreateMessageData
 * @domain comms
 * @description Данные для создания сообщения
 *
 * @spec
 * - content обязательно и не пустое
 * - replyToId опционально, если указан — должен принадлежать тому же диалогу
 */
export interface CreateMessageData {
  /** Текст сообщения. Обязательно, не пустое */
  content: string;
  /** ID цитируемого сообщения. Опционально */
  replyToId?: string | null;
}

/**
 * @type UpdateMessageData
 * @domain comms
 * @description Данные для обновления сообщения
 *
 * @spec
 * - content опционально, если указано — не пустое
 */
export interface UpdateMessageData {
  /** Текст сообщения. Опционально */
  content?: string;
}

/**
 * @type MessageWithSender
 * @domain comms
 * @description Сообщение с данными отправителя
 *
 * @spec
 * - Используется для отображения в UI
 * - Содержит расширенную информацию об отправителе
 * - senderName формируется из firstName + lastName
 * - senderEmail используется как fallback, когда имя отсутствует (для UI)
 * - status используется для отображения статуса доставки сообщения
 *
 * @display-logic
 * - Для текущего пользователя: всегда отображается "ВЫ"
 * - Для собеседника: "Имя Фамилия" (если есть) или email
 * - Для удалённого пользователя: "Удалённый пользователь"
 */
export interface MessageWithSender extends Message {
  /** Имя отправителя */
  senderFirstName: string;
  /** Фамилия отправителя */
  senderLastName: string;
  /** Email отправителя (используется как fallback, если нет имени) */
  senderEmail: string;
  /** URL аватара отправителя */
  senderAvatarUrl: string | null;
  /** Полное имя отправителя для отображения (без "Вы" и "Удалённый пользователь") */
  senderName: string;
  /** Статус сообщения: sent, delivered, read */
  status?: 'sent' | 'delivered' | 'read';
}

/**
 * @type MessageWithAllRelations
 * @domain comms
 * @description Сообщение со всеми связанными данными
 *
 * @spec
 * - Содержит данные отправителя, цитируемого сообщения и диалога
 * - Используется для детального отображения
 */
export interface MessageWithAllRelations extends MessageWithSender {
  /** Цитируемое сообщение (если есть replyToId) */
  replyTo?: MessageWithSender;
  /** ID диалога */
  conversationId: string;
}

/**
 * @type MessageListParams
 * @domain comms
 * @description Параметры для списка сообщений
 */
export interface MessageListParams {
  /** ID диалога */
  conversationId: string;
  /** Максимальное количество сообщений */
  limit?: number;
  /** ID сообщения для пагинации (messages до этого) */
  beforeId?: string;
}
