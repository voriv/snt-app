/**
 * @hook useChangePassword
 * @description Хук для смены пароля текущего авторизованного пользователя через API
 *
 * @spec
 * - Управляет состоянием формы: currentPassword, newPassword, confirmPasswordNew
 * - Выполняет клиентскую валидацию (min 6 символов, совпадение паролей)
 * - Вызывает apiClient.put('/auth/password', data) — PUT /api/v1/auth/password
 * - Состояния: isLoading, error, success
 * - При успехе: success=true, очистка полей
 * - При ошибке 401 (неверный текущий пароль): error = "Неверный текущий пароль"
 * - При ошибке 400 (тот же пароль): error = "Новый пароль не может совпадать с текущим"
 * - При ошибке 422 (валидация): error = сообщение сервера
 * - При сетевой ошибке: error = "Ошибка сети. Попробуйте позже."
 *
 * @covers AC-9.8 — успешная отправка формы
 * @covers AC-9.10 — отображение ошибки от сервера
 * @covers AC-9.12 — состояние загрузки
 *
 * @see docs/specs/auth/change-password-component-spec.md — секция 3.4.1
 * @see docs/user-stories/US-12-активная-смена-пароля-пользователем.md
 */
'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

/** Минимальная длина пароля (BR-10) */
const MIN_PASSWORD_LENGTH = 6;

export interface UseChangePasswordResult {
  currentPassword: string;
  newPassword: string;
  confirmPasswordNew: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  setCurrentPassword: (v: string) => void;
  setNewPassword: (v: string) => void;
  setConfirmPasswordNew: (v: string) => void;
  changePassword: () => Promise<boolean>;
  reset: () => void;
  /** Ошибка валидации поля newPassword */
  newPasswordError: string | null;
  /** Ошибка валидации поля confirmPasswordNew */
  confirmPasswordError: string | null;
}

/**
 * Хук смены пароля пользователя.
 * Управляет состоянием формы, клиентской валидацией и вызовом API.
 */
export function useChangePassword(): UseChangePasswordResult {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPasswordNew, setConfirmPasswordNew] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  /**
   * Клиентская валидация перед отправкой.
   * @returns true, если валидация прошла успешно
   */
  const validate = useCallback((): boolean => {
    let valid = true;

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setNewPasswordError('Пароль должен содержать минимум 6 символов');
      valid = false;
    } else {
      setNewPasswordError(null);
    }

    if (newPassword !== confirmPasswordNew) {
      setConfirmPasswordError('Пароли не совпадают');
      valid = false;
    } else {
      setConfirmPasswordError(null);
    }

    return valid;
  }, [newPassword, confirmPasswordNew]);

  /**
   * Сбросить все состояния формы.
   */
  const reset = useCallback((): void => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPasswordNew('');
    setError(null);
    setSuccess(false);
    setNewPasswordError(null);
    setConfirmPasswordError(null);
    setIsLoading(false);
  }, []);

  /**
   * Отправить запрос смены пароля.
   * @returns true при успехе, false при ошибке
   */
  const changePassword = useCallback(async (): Promise<boolean> => {
    setError(null);
    setSuccess(false);

    // Клиентская валидация
    if (!validate()) {
      return false;
    }

    setIsLoading(true);

    try {
      await apiClient.put('/auth/password', {
        currentPassword,
        newPassword,
        confirmPasswordNew,
      });

      // Успех — очистить поля
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPasswordNew('');
      setNewPasswordError(null);
      setConfirmPasswordError(null);
      return true;
    } catch (err) {
      // apiClient выбрасывает Error с сообщением из error.error.message
      const message = err instanceof Error ? err.message : 'Ошибка при смене пароля';

      // Обработка известных кодов/сообщений сервера
      if (message.includes('Неверный текущий пароль')) {
        setError('Неверный текущий пароль');
      } else if (message.includes('Новый пароль не может совпадать с текущим')) {
        setError('Новый пароль не может совпадать с текущим');
      } else if (
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('Request failed')
      ) {
        setError('Ошибка сети. Попробуйте позже.');
      } else {
        setError(message);
      }

      setSuccess(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentPassword, newPassword, confirmPasswordNew, validate]);

  return {
    currentPassword,
    newPassword,
    confirmPasswordNew,
    isLoading,
    error,
    success,
    setCurrentPassword,
    setNewPassword,
    setConfirmPasswordNew,
    changePassword,
    reset,
    newPasswordError,
    confirmPasswordError,
  };
}
