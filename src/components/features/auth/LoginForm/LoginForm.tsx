'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { cn } from '@/shared/utils';

/**
 * @component LoginForm
 * @category auth
 * @description Компонент формы входа в систему для неавторизованных пользователей
 *
 * Использует встроенный механизм next-auth `signIn` для аутентификации
 * с Credentials Provider. Обрабатывает состояния загрузки, ошибки и успех.
 *
 * @example
 * ```tsx
 * <LoginForm
 *   callbackUrl="/dashboard"
 *   showRegistrationMessage={true}
 * />
 * ```
 *
 * @spec
 * - Поля: email (обязательно, валидный email), password (обязательно, не пустое)
 * - Состояния:
 *   - isLoading: блокирует кнопку отправки, показывает индикатор загрузки
 *   - error: отображает сообщение об ошибке (единое для всех ошибок входа)
 *   - success: после успешного входа происходит редирект на callbackUrl
 * - Валидация на клиенте: проверка на пустые поля + regex-проверка формата email
 * - При успехе: перенаправление на callbackUrl через router.push
 * - При ошибке: отображается сообщение "Неверный email или пароль"
 * - При некорректном формате email: отображается сообщение "Некорректный формат email"
 * - Доступность: aria-label для полей и кнопки, focus-ring для инпутов
 * - Блокировка кнопки при isLoading через disabled attribute
 *
 * @see docs/user-stories/US-04-реализация-страницы-входа-login.md
 */
export interface LoginFormProps {
  /** URL для перенаправления после успешного входа */
  callbackUrl?: string;
  /** Флаг для отображения сообщения об успешной регистрации */
  showRegistrationMessage?: boolean;
}

/**
 * Клиентский компонент формы входа
 * @param props -_props формы входа
 */
export function LoginForm({
  callbackUrl = '/dashboard',
  showRegistrationMessage = false,
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Обработчик отправки формы входа
   * @param event - Событие отправки формы
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Валидация на клиенте: проверка на пустые поля
    if (!email.trim() || !password.trim()) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    // Валидация на клиенте: проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Некорректный формат email');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Ошибка аутентификации - общий message для безопасности
        setError('Неверный email или пароль');
      } else if (result?.ok) {
        // Успешная аутентификация - редирект на callbackUrl
        router.push(callbackUrl);
      }
    } catch (err) {
      // Обработка сетевых ошибок и других исключений
      setError('Произошла ошибка при входе. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Заголовок формы */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Вход в систему
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Войдите в свой аккаунт для доступа к панели управления
        </p>
      </div>

      {/* Сообщение об успешной регистрации */}
      {showRegistrationMessage && (
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
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Аккаунт успешно создан! Теперь вы можете войти.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {error && <ErrorMessage message={error} />}

      {/* Форма входа */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="space-y-4">
          {/* Поле Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email адрес
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email адрес для входа"
            />
          </div>

          {/* Поле Пароль */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Пароль
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Введите ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Пароль для входа"
            />
          </div>
        </div>

        {/* Сообщение об ошибке */}
        {error && (
          <div
            className="rounded-md bg-red-50 dark:bg-red-900/20 p-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Кнопка отправки */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
            aria-label={isLoading ? 'Вход в систему...' : 'Войти в систему'}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </div>

        {/* Ссылка на регистрацию */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Нет аккаунта?{' '}
            <a
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Зарегистрироваться
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
