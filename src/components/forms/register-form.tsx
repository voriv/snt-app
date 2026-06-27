'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Входные пропс для формы регистрации.
 *
 * @public
 */
interface RegisterFormProps {
  /** Callback после успешной регистрации */
  onSuccess?: () => void;
}

/**
 * Форма регистрации нового пользователя.
 *
 * @remarks
 * Поддерживает валидацию email и пароля, отображение ошибок и состояние загрузки.
 *
 * @param props - Настройки формы
 *
 * @example
 * ```tsx
 * <RegisterForm onSuccess={() => router.push('/login')} />
 * ```
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Клиентская валидация
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message ?? 'Ошибка регистрации');
        return;
      }

      router.push('/login');
      router.refresh();
      onSuccess?.();
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
      aria-label="Форма регистрации"
    >
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center">
        Регистрация
      </h2>

      {/* Сообщение об ошибке */}
      {error && (
        <div
          role="alert"
          id="register-error"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Поле Email */}
      <div>
        <label
          htmlFor="register-email"
          className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
        >
          Email
        </label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-invalid={!!error}
          aria-describedby={error ? 'register-error' : undefined}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2 text-[var(--color-text-primary)] placeholder-gray-400 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
          placeholder="your@email.com"
        />
      </div>

      {/* Поле Пароль */}
      <div>
        <label
          htmlFor="register-password"
          className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
        >
          Пароль
        </label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          aria-invalid={!!error}
          aria-describedby={error ? 'register-error' : undefined}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2 text-[var(--color-text-primary)] placeholder-gray-400 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
          placeholder="••••••••"
        />
      </div>

      {/* Поле Подтверждение пароля */}
      <div>
        <label
          htmlFor="register-confirm-password"
          className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]"
        >
          Подтвердите пароль
        </label>
        <input
          id="register-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          aria-invalid={!!error}
          aria-describedby={error ? 'register-error' : undefined}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2 text-[var(--color-text-primary)] placeholder-gray-400 focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors"
          placeholder="••••••••"
        />
      </div>

      {/* Кнопка регистрации */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 font-medium text-white hover:bg-[var(--color-accent)]/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>

      {/* Ссылка на вход */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          Уже есть аккаунт? Войти
        </button>
      </div>
    </form>
  );
}
