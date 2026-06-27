'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Входные пропс для формы входа.
 *
 * @public
 */
interface LoginFormProps {
  /** Callback после успешного входа */
  onSuccess?: () => void;
  /** URL для редиректа после входа (по умолчанию '/') */
  redirectUrl?: string;
}

/**
 * Форма входа по email/password.
 *
 * @remarks
 * Поддерживает валидацию, отображение ошибок и состояние загрузки.
 * Использует next-auth для авторизации.
 *
 * @param props - Настройки формы
 *
 * @example
 * ```tsx
 * <LoginForm redirectUrl="/profile" />
 * ```
 */
export function LoginForm({ onSuccess, redirectUrl = '/' }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (result?.error) {
        setError(result.error || 'Ошибка входа');
      } else {
        router.push(redirectUrl);
        router.refresh();
        onSuccess?.();
      }
    } catch {
      setError('Неизвестная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-6"
      aria-label="Форма входа"
    >
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center">
        Вход в систему
      </h2>

      {/* Сообщение об ошибке */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Поле Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-invalid={!!error}
          aria-describedby={error ? 'login-error' : undefined}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2 text-[var(--color-text-primary)] placeholder-gray-400 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
          placeholder="your@email.com"
        />
      </div>

      {/* Поле Пароль */}
      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
        >
          Пароль
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-invalid={!!error}
          aria-describedby={error ? 'login-error' : undefined}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2 text-[var(--color-text-primary)] placeholder-gray-400 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
          placeholder="••••••••"
        />
      </div>

      {/* Кнопка входа */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 font-medium text-white hover:bg-[var(--color-accent)]/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Вход...' : 'Войти'}
      </button>

      {/* Ссылка на восстановление пароля */}
      <div className="text-center">
        <button
          type="button"
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          Забыли пароль?
        </button>
      </div>

      {/* Ссылка на регистрацию */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push('/register')}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          Зарегистрироваться
        </button>
      </div>
    </form>
  );
}
