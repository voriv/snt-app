/**
 * @component ChangePasswordForm
 * @category auth
 * @description Компонент формы смены пароля текущего пользователя
 *
 * @spec
 * - Поля: currentPassword, newPassword (min 6), confirmPasswordNew (=== newPassword)
 * - Кнопки show/hide для каждого поля (toggle visibility)
 * - Кнопка "Сменить пароль" (type=submit, disabled при loading)
 * - <ErrorMessage> для серверных ошибок
 * - Inline валидация под полями (min 6, не совпадает)
 * - Состояние success: сообщение "Пароль успешно изменён"
 * - Состояние loading: disabled поля, спиннер на кнопке
 *
 * @covers AC-9.7 — отображение формы смены пароля
 * @covers AC-9.8 — успешная отправка формы
 * @covers AC-9.9 — клиентская валидация
 * @covers AC-9.10 — ошибка от сервера (UI)
 * @covers AC-9.12 — состояние загрузки
 *
 * @see docs/specs/auth/change-password-component-spec.md — секция 3.3.1
 * @see docs/user-stories/US-12-активная-смена-пароля-пользователем.md
 */
'use client';

import { useState, FormEvent } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useChangePassword } from '@/hooks/useChangePassword';

export interface ChangePasswordFormProps {
  /** Колбэк, вызываемый при успешной смене пароля */
  onSuccess?: () => void;
}

/** Состояние видимости для каждого поля пароля */
interface FieldVisibility {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

/**
 * Клиентский компонент формы смены пароля.
 * @param props - Props формы смены пароля
 */
export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const {
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
  } = useChangePassword();

  const [visibility, setVisibility] = useState<FieldVisibility>({
    current: false,
    new: false,
    confirm: false,
  });

  /** Кнопка disabled, пока не заполнены все поля */
  const isSubmitDisabled =
    isLoading ||
    currentPassword.length === 0 ||
    newPassword.length === 0 ||
    confirmPasswordNew.length === 0;

  /**
   * Переключить видимость поля.
   * @param field - Имя поля
   */
  const toggleVisibility = (field: keyof FieldVisibility): void => {
    setVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /**
   * Обработчик отправки формы.
   * @param event - Событие отправки формы
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const ok = await changePassword();
    if (ok && onSuccess) {
      onSuccess();
    }
  };

  /** Обработчик сброса формы */
  const handleReset = (): void => {
    reset();
  };

  return (
    <div className="w-full max-w-md">
      {/* Сообщение об успехе */}
      {success && (
        <div
          className="mb-6 rounded-md bg-green-50 dark:bg-green-900/20 p-4"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Пароль успешно изменён
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="ml-auto text-sm font-medium text-green-700 dark:text-green-300 hover:underline"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Сообщение об ошибке от сервера */}
      {error && <ErrorMessage message={error} />}

      {/* Форма смены пароля */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-4">
          {/* Поле "Текущий пароль" */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Текущий пароль
            </label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={visibility.current ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="Введите текущий пароль"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
                aria-label="Текущий пароль"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('current')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={visibility.current ? 'Скрыть текущий пароль' : 'Показать текущий пароль'}
                tabIndex={-1}
              >
                {visibility.current ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745A10.029 10.029 0 0020 10c0-1.2-.4-2.3-1.1-3.2-.7-.9-1.7-1.6-2.8-2.1A9.97 9.97 0 0010 3c-1.3 0-2.6.3-3.7.8L3.28 2.22zM7.5 10a2.5 2.5 0 012.5-2.5c.36 0 .7.08 1.02.21l1.27 1.27A2.5 2.5 0 017.5 10zM10 12.5a2.5 2.5 0 01-2.5-2.5c0-.36.08-.7.21-1.02l3.31 3.31c-.32.13-.66.21-1.02.21z" />
                    <path d="M10 15c-3.866 0-7.2-2.69-8.3-6.2a.75.75 0 010-.4c.2-.7.5-1.3.9-1.9L4 7.5a8.6 8.6 0 00-1.3 1.3 8.5 8.5 0 001.3 1.3 8.5 8.5 0 002.7 1.8c1 .4 2.1.6 3.3.6 1.2 0 2.3-.2 3.3-.6l1.5 1.5A9.97 9.97 0 0110 15z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 12.5a2.5 2.5 0 002.5-2.5c0-.36-.08-.7-.21-1.02L8.98 11.29c.32.13.66.21 1.02.21z" />
                    <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l1.1 1.1A9.97 9.97 0 0010 7c1.3 0 2.6.3 3.7.8 1.1.5 2.1 1.2 2.8 2.1.7.9 1.1 2 1.1 3.2 0 .9-.2 1.7-.5 2.5l1.5 1.5a.75.75 0 10-1.06-1.06L3.28 2.22zM10 5c-1.2 0-2.3.2-3.3.6L4 7.5A8.6 8.6 0 005.3 6.2 8.5 8.5 0 0110 5z" />
                    <path fillRule="evenodd" d="M10 3C5.6 3 1.9 5.9.7 10c1.2 4.1 4.9 7 9.3 7s8.1-2.9 9.3-7C18.1 5.9 14.4 3 10 3zm0 11a4 4 0 110-8 4 4 0 010 8z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Поле "Новый пароль" */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Новый пароль
            </label>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Минимум 6 символов</p>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={visibility.new ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Введите новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
                aria-label="Новый пароль"
                error={newPasswordError ?? undefined}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('new')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={visibility.new ? 'Скрыть новый пароль' : 'Показать новый пароль'}
                tabIndex={-1}
              >
                {visibility.new ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745A10.029 10.029 0 0020 10c0-1.2-.4-2.3-1.1-3.2-.7-.9-1.7-1.6-2.8-2.1A9.97 9.97 0 0010 3c-1.3 0-2.6.3-3.7.8L3.28 2.22zM7.5 10a2.5 2.5 0 012.5-2.5c.36 0 .7.08 1.02.21l1.27 1.27A2.5 2.5 0 017.5 10zM10 12.5a2.5 2.5 0 01-2.5-2.5c0-.36.08-.7.21-1.02l3.31 3.31c-.32.13-.66.21-1.02.21z" />
                    <path d="M10 15c-3.866 0-7.2-2.69-8.3-6.2a.75.75 0 010-.4c.2-.7.5-1.3.9-1.9L4 7.5a8.6 8.6 0 00-1.3 1.3 8.5 8.5 0 001.3 1.3 8.5 8.5 0 002.7 1.8c1 .4 2.1.6 3.3.6 1.2 0 2.3-.2 3.3-.6l1.5 1.5A9.97 9.97 0 0110 15z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 12.5a2.5 2.5 0 002.5-2.5c0-.36-.08-.7-.21-1.02L8.98 11.29c.32.13.66.21 1.02.21z" />
                    <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l1.1 1.1A9.97 9.97 0 0010 7c1.3 0 2.6.3 3.7.8 1.1.5 2.1 1.2 2.8 2.1.7.9 1.1 2 1.1 3.2 0 .9-.2 1.7-.5 2.5l1.5 1.5a.75.75 0 10-1.06-1.06L3.28 2.22zM10 5c-1.2 0-2.3.2-3.3.6L4 7.5A8.6 8.6 0 005.3 6.2 8.5 8.5 0 0110 5z" />
                    <path fillRule="evenodd" d="M10 3C5.6 3 1.9 5.9.7 10c1.2 4.1 4.9 7 9.3 7s8.1-2.9 9.3-7C18.1 5.9 14.4 3 10 3zm0 11a4 4 0 110-8 4 4 0 010 8z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Поле "Подтверждение нового пароля" */}
          <div>
            <label
              htmlFor="confirmPasswordNew"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Подтверждение нового пароля
            </label>
            <div className="relative">
              <Input
                id="confirmPasswordNew"
                name="confirmPasswordNew"
                type={visibility.confirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Повторите новый пароль"
                value={confirmPasswordNew}
                onChange={(e) => setConfirmPasswordNew(e.target.value)}
                disabled={isLoading}
                aria-label="Подтверждение нового пароля"
                error={confirmPasswordError ?? undefined}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('confirm')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={visibility.confirm ? 'Скрыть подтверждение пароля' : 'Показать подтверждение пароля'}
                tabIndex={-1}
              >
                {visibility.confirm ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745A10.029 10.029 0 0020 10c0-1.2-.4-2.3-1.1-3.2-.7-.9-1.7-1.6-2.8-2.1A9.97 9.97 0 0010 3c-1.3 0-2.6.3-3.7.8L3.28 2.22zM7.5 10a2.5 2.5 0 012.5-2.5c.36 0 .7.08 1.02.21l1.27 1.27A2.5 2.5 0 017.5 10zM10 12.5a2.5 2.5 0 01-2.5-2.5c0-.36.08-.7.21-1.02l3.31 3.31c-.32.13-.66.21-1.02.21z" />
                    <path d="M10 15c-3.866 0-7.2-2.69-8.3-6.2a.75.75 0 010-.4c.2-.7.5-1.3.9-1.9L4 7.5a8.6 8.6 0 00-1.3 1.3 8.5 8.5 0 001.3 1.3 8.5 8.5 0 002.7 1.8c1 .4 2.1.6 3.3.6 1.2 0 2.3-.2 3.3-.6l1.5 1.5A9.97 9.97 0 0110 15z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 12.5a2.5 2.5 0 002.5-2.5c0-.36-.08-.7-.21-1.02L8.98 11.29c.32.13.66.21 1.02.21z" />
                    <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l1.1 1.1A9.97 9.97 0 0010 7c1.3 0 2.6.3 3.7.8 1.1.5 2.1 1.2 2.8 2.1.7.9 1.1 2 1.1 3.2 0 .9-.2 1.7-.5 2.5l1.5 1.5a.75.75 0 10-1.06-1.06L3.28 2.22zM10 5c-1.2 0-2.3.2-3.3.6L4 7.5A8.6 8.6 0 005.3 6.2 8.5 8.5 0 0110 5z" />
                    <path fillRule="evenodd" d="M10 3C5.6 3 1.9 5.9.7 10c1.2 4.1 4.9 7 9.3 7s8.1-2.9 9.3-7C18.1 5.9 14.4 3 10 3zm0 11a4 4 0 110-8 4 4 0 010 8z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Кнопка отправки */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={isSubmitDisabled}
            className="w-full"
            aria-label={isLoading ? 'Смена пароля...' : 'Сменить пароль'}
          >
            {isLoading ? 'Смена пароля...' : 'Сменить пароль'}
          </Button>
        </div>
      </form>
    </div>
  );
}
