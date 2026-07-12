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
