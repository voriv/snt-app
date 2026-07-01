/**
 * @hook useRegister
 * @description Хук для регистрации нового пользователя через API
 *
 * @spec
 * - Вызывает apiClient.post /auth/register с данными формы
 * - Управляет состояниями: isLoading, error, isSuccess
 * - При успехе: перенаправление на /login?registered=true через router.push
 * - При ошибке 409: устанавливает error = сообщение о дублировании email
 * - При ошибке 400: устанавливает error = сообщение о валидации
 * - При ошибке 500: устанавливает error = общая ошибка
 * - Блокирует повторную отправку через isLoading
 *
 * @returns {Object} - Объект с полями:
 *   - register(data: RegisterData): Promise<void> — функция регистрации
 *   - isLoading: boolean — состояние загрузки
 *   - error: string | null — сообщение ошибки
 *   - isSuccess: boolean — признак успешной регистрации
 *
 * @see docs/user-stories/US-2-registration.md — FR-8, FR-10, AC-10
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { UserData } from '@/domains/auth/auth.types';

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  /**
   * Зарегистрировать нового пользователя
   * @param data - Данные регистрации
   */
  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const response = await apiClient.post<UserData>('/auth/register', data);

      if (response.success && response.data) {
        setIsSuccess(true);
        // Перенаправление на страницу входа с флагом успешной регистрации
        router.push('/login?registered=true');
      }
    } catch (err) {
      const apiError = err as { error?: { code: string; message: string } };
      if (apiError.error?.code === 'USER_DUPLICATE_ERROR') {
        setError('Пользователь с таким email уже зарегистрирован');
      } else if (apiError.error?.code === 'USER_INVALID_DATA_ERROR') {
        setError(apiError.error.message);
      } else {
        setError('Произошла ошибка при регистрации. Попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    register,
    isLoading,
    error,
    isSuccess,
  };
}
