/**
 * @page /register
 * @auth none
 * @description Страница регистрации нового пользователя
 *
 * @spec
 * - Client Component: использует хук useRegister для управления состоянием
 * - Поля формы: email, пароль, подтверждение пароля
 * - Валидация на клиенте: перед отправкой проверяются все поля
 *   - email: заполнен, формат email
 *   - пароль: заполнен, минимум 6 символов
 *   - подтверждение: заполнено, совпадает с паролем
 * - Ошибки валидации отображаются под соответствующими полями — inline
 * - Общая ошибка от сервера: alert в верхней части формы
 * - Состояние загрузки: кнопка заблокирована, показывается спиннер
 * - После успеха: редирект на /login?registered=true
 * - Авторизованные пользователи: редирект на /dashboard — через middleware
 * - a11y: правильные label, autocomplete, focus management
 * - Адаптивная верстка: мобильные и десктоп
 *
 * @data-flow
 * - Client Component → useRegister → apiClient.post /auth/register → /login?registered=true
 *
 * @see docs/user-stories/US-2-registration.md — FR-1..FR-3, FR-8..FR-10, AC-1..AC-10
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRegister, type RegisterData } from '@/hooks/useRegister';

/**
 * Валидация email
 * @param email - Email для проверки
 * @returns true если email валиден
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const { register, isLoading, error: apiError } = useRegister();
  const router = useRouter();

  // Сброс локальных ошибок при изменении полей
  useEffect(() => {
    setLocalError(null);
  }, [email, password, confirmPassword]);

  /**
   * Обработчик отправки формы
   * @param e - Event от формы
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Клиентская валидация
    const errors: string[] = [];

    if (!email) {
      errors.push('Email обязателен');
    } else if (!validateEmail(email)) {
      errors.push('Введите корректный email');
    }

    if (!password) {
      errors.push('Пароль обязателен');
    } else if (password.length < 6) {
      errors.push('Пароль должен содержать минимум 6 символов');
    }

    if (!confirmPassword) {
      errors.push('Подтверждение пароля обязательно');
    } else if (password !== confirmPassword) {
      errors.push('Пароли не совпадают');
    }

    if (errors.length > 0) {
      setLocalError(errors.join(' '));
      return;
    }

    try {
      await register({ email, password, confirmPassword });
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Регистрация</h2>
          <p className="mt-2 text-sm text-gray-600">
            Создайте учётную запись для доступа к системе СНТ Берёзки-НТ
          </p>
        </div>

        {apiError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{apiError}</div>
          </div>
        )}

        {localError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{localError}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <Input
              label="Email"
              type="email"
              id="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={localError && !validateEmail(email) ? 'Введите корректный email' : ''}
            />
          </div>

          <div>
            <Input
              label="Пароль"
              type="password"
              id="password"
              autoComplete="new-password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={
                localError && password.length > 0 && password.length < 6
                  ? 'Пароль должен содержать минимум 6 символов'
                  : ''
              }
            />
          </div>

          <div>
            <Input
              label="Подтверждение пароля"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Подтвердите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={
                localError && confirmPassword && password !== confirmPassword
                  ? 'Пароли не совпадают'
                  : ''
              }
            />
          </div>

          <div>
            {isLoading ? (
              <Button type="submit" disabled isLoading>
                Регистрация...
              </Button>
            ) : (
              <Button type="submit">Зарегистрироваться</Button>
            )}
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600">Уже есть аккаунт?</span>{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
