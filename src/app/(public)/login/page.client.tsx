'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface LoginFormDataComponentProps {
  callbackUrl: string;
  isRegistered: boolean;
}

/**
 * @component LoginFormDataComponent
 * @description Клиентский компонент формы входа с использованием next-auth
 *
 * @spec
 * - Читает callbackUrl и isRegistered из props
 * - Отображает flash-сообщение о регистрации при isRegistered=true
 * - Блокирует кнопку отправки при isLoading=true
 * - Проверяет email и пароль перед отправкой
 * - Использует signIn из next-auth/react для авторизации
 * - Обрабатывает ошибки с отображением сообщения об ошибке
 *
 * @see docs/user-stories/US-3-authentication.md — FR-1
 */
export default function LoginFormDataComponent({ callbackUrl, isRegistered }: LoginFormDataComponentProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showFlashMessage, setShowFlashMessage] = useState(false);

  useEffect(() => {
    setShowFlashMessage(isRegistered);
  }, [isRegistered]);

  const handleInputChange = () => {
    setError({});
    if (isRegistered) {
      setShowFlashMessage(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
  
    const errors: LoginErrors = {};
  
    if (!email) {
      errors.email = 'Email обязателен';
    } else if (!isValidEmail(email)) {
      errors.email = 'Некорректный email';
    }
  
    if (!password) {
      errors.password = 'Пароль обязателен';
    }
  
    if (Object.keys(errors).length > 0) {
      setError(errors);
      return;
    }
  
    setIsLoading(true);
  
    // Вызываем signIn с redirect: true (по умолчанию)
    // NextAuth автоматически выполнит перенаправление при успехе
    // Или покажет ошибку CredentialsSignin на странице при неудаче
    await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password: password,
      redirect: true,
      callbackUrl,
    });
  
    // Этого кода не будет достигнуто при успехе (redirect уже сработал)
    // Если здесь оказались — значит произошла ошибка
    setIsLoading(false);
    setError({ general: 'Неверный email или пароль' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Войдите в свой аккаунт для доступа к панели управления
          </p>
        </div>

        {showFlashMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Успешная регистрация!</strong>
            <span className="block sm:inline"> Теперь войдите в систему.</span>
            <button
              type="button"
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setShowFlashMessage(false)}
            >
              <span className="sr-only">Закрыть</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {error.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Ошибка!</strong>
            <span className="block sm:inline"> {error.general}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  handleInputChange();
                }}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  error.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Email"
              />
              {error.email && (
                <p className="mt-1 text-sm text-red-600">{error.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  error.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Пароль"
              />
              {error.password && (
                <p className="mt-1 text-sm text-red-600">{error.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Обработка...
                </>
              ) : (
                'Войти'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
