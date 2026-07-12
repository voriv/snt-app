/**
 * Данные сессии пользователя
 * 
 * @type SessionData
 * @description Унифицированный формат данных сессии
 * @spec
 * - user: объект с идентификатором, email, именем и ролями
 * - expires: время истечения сессии в формате ISO
 */
export interface SessionData {
  /** Информация о пользователе */
  user: {
    /** Уникальный идентификатор пользователя */
    id: string;
    /** Email пользователя */
    email: string;
    /** Имя пользователя (может быть null) */
    name: string | null;
    /** Роли пользователя */
    roles: string[];
  };
  /** Время истечения сессии */
  expires: string;
}

/**
 * Ошибка сессии
 * 
 * @type SessionError
 * @description Структура ошибки сессии
 * @spec
 * - code: код ошибки (например, NETWORK_ERROR, INVALID_SESSION)
 * - message: человеко-читаемое сообщение на русском языке
 */
export interface SessionError {
  /** Код ошибки */
  code: string;
  /** Сообщение об ошибке на русском языке */
  message: string;
}

/**
 * Возвращаемое значение хука useSession
 * 
 * @type UseSessionReturn
 * @description Результаты работы хука useSession
 * @spec
 * - data: объект сессии или null, если не авторизован
 * - loading: true во время загрузки сессии
 * - error: объект ошибки или null
 * - refresh(): метод для принудительного обновления сессии
 */
export interface UseSessionReturn {
  /** Данные сессии или null */
  data: SessionData | null;
  /** Флаг загрузки */
  loading: boolean;
  /** Ошибка или null */
  error: SessionError | null;
  /** Метод для принудительного обновления сессии */
  refresh: () => Promise<void>;
}
