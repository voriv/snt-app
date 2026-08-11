/**
 * @function useSession
 * @description Хук для получения состояния сессии пользователя
 * @spec
 * - data: объект сессии или null, если не авторизован
 * - loading: true во время загрузки сессии
 * - error: объект ошибки или null
 * - refresh(): метод для принудительного обновления сессии
 */
export { useSession } from './useSession';

/**
 * @type SessionData
 * @description Унифицированный формат данных сессии
 */
export type { SessionData } from './useSession.types';

/**
 * @type SessionError
 * @description Структура ошибки сессии
 */
export type { SessionError } from './useSession.types';

/**
 * @type UseSessionReturn
 * @description Результаты работы хука useSession
 */
export type { UseSessionReturn } from './useSession.types';

/**
 * @function useChangePassword
 * @description Хук для смены пароля текущего авторизованного пользователя
 * @spec
 * - Управляет состоянием формы (currentPassword, newPassword, confirmPasswordNew)
 * - Клиентская валидация (min 6 символов, совпадение паролей)
 * - Вызывает apiClient.put('/auth/password', data)
 * - Состояния: isLoading, error, success
 *
 * @covers AC-9.8 — успешная отправка формы
 * @covers AC-9.10 — ошибка от сервера
 * @covers AC-9.12 — состояние загрузки
 */
export { useChangePassword } from './useChangePassword';
export type { UseChangePasswordResult } from './useChangePassword';

/**
 * @function useMarkAsRead
 * @description Хук для автоматической отметки сообщений как прочитанных при открытии диалога/чата
 * @spec
 * - markAsRead(conversationId, type) вызывает PATCH /read endpoint
 * - type='DIRECT' → PATCH /conversations/:id/read
 * - type='GROUP' → PATCH /chats/:id/read
 * - После успеха — refetch GET /comms/unread-counts
 * - Silent fail при ошибке сети (AC-6)
 * - isMarking предотвращает дублирующиеся вызовы
 *
 * @covers AC-1 US-39-01 — отметка при открытии личного диалога
 * @covers AC-2 US-39-01 — отметка при открытии группового чата
 * @covers AC-5 US-39-01 — обновление счётчиков
 * @covers AC-6 US-39-01 — silent fail
 */
export { useMarkAsRead } from './useMarkAsRead';
export type { UseMarkAsReadResult } from './useMarkAsRead';
