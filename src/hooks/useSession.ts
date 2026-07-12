import { useState, useEffect, useCallback } from 'react';
import { useSession as useNextAuthSession } from 'next-auth/react';
import { SessionData, UseSessionReturn, SessionError } from './useSession.types';

// Типизация сессии next-auth
type NextAuthSession = {
  user?: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    roles?: string[];
  };
  expires?: string;
};

/**
 * Преобразует сессию next-auth в унифицированный формат SessionData
 *
 * @param session - Сессия из next-auth
 * @returns Унифицированный объект SessionData или null
 *
 * @spec
 * - Преобразует next-auth Session в формат с полями user и expires
 * - user содержит id, email, name и roles
 * - Возвращает null если session null
 */
function mapNextAuthSessionToSessionData(
  session: NextAuthSession | null
): SessionData | null {
  if (!session) {
    return null;
  }

  return {
    user: {
      id: session.user?.id || '',
      email: session.user?.email || '',
      name: session.user?.name ?? null,
      roles: session.user?.roles || [],
    },
    expires: session.expires || '',
  };
}

/**
 * Создаёт объект ошибки сессии
 * 
 * @param code - Код ошибки
 * @param message - Человеческое-readable сообщение об ошибке
 * @returns Объект SessionError
 */
function createSessionError(code: string, message: string): SessionError {
  return { code, message };
}

/**
 * Хук для получения состояния сессии пользователя
 * 
 * Обёрнутый вокруг `next-auth` useSession(), предоставляет унифицированный
 * интерфейс для работы с сессией в клиентских компонентах.
 * 
 * @returns {UseSessionReturn} Объект с данными сессии и методами управления
 * 
 * @spec
 * - data: объект сессии или null, если не авторизован
 * - loading: true во время загрузки сессии
 * - error: объект ошибки или null
 * - refresh(): метод для принудительного обновления сессии
 * - Автоматически подписывается на изменения сессии через React Context
 * - maxRetries: 3 попытки при повторных вызовах refresh()
 * - retryInterval: 1 секунда между попытками
 * 
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { data: session, loading, error, refresh } = useSession();
 * 
 *   if (loading) return <div>Загрузка...</div>;
 *   if (error) return <div>Ошибка: {error.message}</div>;
 *   if (!session) return <div>Не авторизован</div>;
 * 
 *   return (
 *     <div>
 *       <h1>Привет, {session.user.name || session.user.email}!</h1>
 *       <button onClick={refresh}>Обновить</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSession(): UseSessionReturn {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SessionError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const MAX_RETRIES = 3;
  const RETRY_INTERVAL = 1000; // 1 секунда
  
  const { data: nextAuthSession, status: nextAuthStatus } = useNextAuthSession();

  // Эффект для обработки начальной загрузки и изменения сессии
  useEffect(() => {
    // Сброс состояния при изменении сессии
    const sessionData = mapNextAuthSessionToSessionData(nextAuthSession);
    
    if (nextAuthStatus === 'loading') {
      setLoading(true);
      setError(null);
      return;
    }

    if (sessionData) {
      // Проверка валидности сессии
      if (!sessionData.user.id || !sessionData.user.email) {
        const sessionError = createSessionError(
          'INVALID_SESSION',
          'Сессия содержит неполные данные'
        );
        setData(null);
        setError(sessionError);
        setLoading(false);
        return;
      }

      setData(sessionData);
      setError(null);
      setLoading(false);
    } else {
      // Session null — пользователь не авторизован
      setData(null);
      setError(null);
      setLoading(false);
    }
  }, [nextAuthSession, nextAuthStatus]);

  // Метод для принудительного обновления сессии
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Пробуем обновить сессию с максимальным количеством попыток
      let lastError: SessionError | null = null;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Обновляем сессию путем отправки запроса к API
          await fetch('/api/auth/session', { method: 'POST' });
          
          // Даем время на обновление сессии
          await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
          
          // Проверяем обновлённую сессию
          if (nextAuthSession) {
            const sessionData = mapNextAuthSessionToSessionData(nextAuthSession);
            if (sessionData && sessionData.user.id && sessionData.user.email) {
              setData(sessionData);
              setRetryCount(0);
              setLoading(false);
              return;
            }
          }
          
          lastError = createSessionError(
            'SESSION_REFRESH_FAILED',
            'Не удалось обновить сессию: попытка ' + (attempt + 1)
          );
        } catch (err) {
          lastError = createSessionError(
            'SESSION_REFRESH_FAILED',
            'Ошибка обновления сессии: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка')
          );
        }

        // Если это не последняя попытка, ждем перед следующим разом
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        }
      }

      // Все попытки исчерпаны
      if (lastError) {
        setError(lastError);
        setRetryCount(MAX_RETRIES);
      }
    } catch (err) {
      const sessionError = createSessionError(
        'NETWORK_ERROR',
        'Ошибка сети: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка')
      );
      setError(sessionError);
    } finally {
      setLoading(false);
    }
  }, [nextAuthSession]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}

export default useSession;
