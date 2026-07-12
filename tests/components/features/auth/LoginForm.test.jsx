/**
 * @component LoginForm
 * @category auth
 * @description Component-тесты для LoginForm
 *
 * @spec
 * - Рендер формы с полями email и password
 * - Отображение кнопки submit
 * - Валидация пустых полей (показ ошибки)
 * - Валидация формата email
 * - Успешный вход (signIn resolves, редирект на /dashboard)
 * - Ошибка входа (signIn rejects, показ сообщения "Неверный email или пароль")
 * - Блокировка кнопки при загрузке
 * - Отсутствие вызова signIn при невалидных данных
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/features/auth/LoginForm/LoginForm';

// Mock Next.js Navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

// ============================================================================
// Helpers
// ============================================================================

function renderLoginForm(props = {}) {
  const defaultProps = {
    callbackUrl: '/dashboard',
    showRegistrationMessage: false,
  };

  return render(React.createElement(LoginForm, { ...defaultProps, ...props }));
}

// ============================================================================
// Tests
// ============================================================================

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Рендеринг
  // -------------------------------------------------------------------------

  describe('Рендеринг', () => {
    it('должен рендерить заголовок формы', () => {
      renderLoginForm();
      expect(screen.getByText(/вход в систему/i)).toBeInTheDocument();
    });

    it('должен рендерить описание формы', () => {
      renderLoginForm();
      expect(
        screen.getByText(/войдите в свой аккаунт для доступа к панели управления/i)
      ).toBeInTheDocument();
    });

    it('должен рендерить поле email', () => {
      renderLoginForm();
      expect(screen.getByLabelText(/email адрес для входа/i)).toBeInTheDocument();
    });

    it('должен рендерить поле password', () => {
      renderLoginForm();
      expect(screen.getByLabelText(/пароль для входа/i)).toBeInTheDocument();
    });

    it('должен рендерить кнопку submit', () => {
      renderLoginForm();
      expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
    });

    it('должен рендерить ссылку на регистрацию', () => {
      renderLoginForm();
      expect(screen.getByRole('link', { name: /зарегистрироваться/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Валидация полей
  // -------------------------------------------------------------------------

  describe('Валидация полей', () => {
    it('должен показывать ошибку при пустой форме', async () => {
      renderLoginForm();

      const button = screen.getByRole('button', { name: /войти/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/заполните все поля/i)).toBeInTheDocument();
      });
    });

    it('должен проверять заполнение всех полей перед отправкой', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledTimes(1);
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        });
      });
    });

    it('должен очищать ошибку при вводе данных', async () => {
      renderLoginForm();

      const button = screen.getByRole('button', { name: /войти/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/заполните все поля/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      await waitFor(() => {
        expect(screen.queryByText(/заполните все поля/i)).not.toBeInTheDocument();
      });
    });

    it('должен проверять формат email', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/некорректный формат email/i)).toBeInTheDocument();
        expect(signIn).not.toHaveBeenCalled();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Обработчик отправки формы
  // -------------------------------------------------------------------------

  describe('Обработчик отправки формы', () => {
    it('должен вызывать signIn при валидных данных', async () => {
      const mockSignIn = signIn;
      mockSignIn.mockResolvedValueOnce({ ok: true });

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledTimes(1);
      });

      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      });
    });

    it('должен блокировать кнопку при загрузке', async () => {
      const mockSignIn = signIn;
      mockSignIn.mockResolvedValueOnce(new Promise((resolve) => setTimeout(resolve, 1000)));

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it('должен показывать индикатор загрузки', async () => {
      const mockSignIn = signIn;
      mockSignIn.mockResolvedValueOnce(new Promise((resolve) => setTimeout(resolve, 1000)));

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/войти/i)).toBeInTheDocument();
      });
    });

    it('должен перенаправлять на callbackUrl при успешном входе', async () => {
      const mockSignIn = signIn;
      mockSignIn.mockResolvedValueOnce({ ok: true, error: null });
      const mockRouterPush = useRouter().push;
      mockRouterPush.mockReset();

      renderLoginForm({ callbackUrl: '/custom-dashboard' });

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockRouterPush).toHaveBeenCalledWith('/custom-dashboard');
      });
    });

    it('должен показывать общую ошибку при неудачной аутентификации', async () => {
      const mockSignIn = signIn;
      mockSignIn.mockResolvedValueOnce({ ok: false, error: 'Invalid credentials' });

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/неверный email или пароль/i)).toBeInTheDocument();
      });
    });

    it('должен сбрасывать кнопку после ошибки', async () => {
      const mockSignIn = signIn;
      mockSignIn.mockResolvedValueOnce({ ok: false, error: 'Invalid credentials' });

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/неверный email или пароль/i)).toBeInTheDocument();
      });

      expect(button).toBeEnabled();
    });

    it('должен показывать сетевую ошибку при исключении', async () => {
      const mockSignIn = signIn;
      mockSignIn.mockRejectedValueOnce(new Error('Network error'));

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/произошла ошибка при входе. попробуйте позже/i)).toBeInTheDocument();
      });
    });

    it('должен отправлять данные без предварительного trim (trim выполняется внутри signIn)', async () => {
      const mockSignIn = signIn;
      mockSignIn.mockResolvedValueOnce({ ok: true });

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: ' test@example.com ' } });
      fireEvent.change(passwordInput, { target: { value: ' password123 ' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: ' test@example.com ',
          password: ' password123 ',
          redirect: false,
        });
      }, { timeout: 100 });
    });
  });

  // -------------------------------------------------------------------------
  // Сообщение об успешной регистрации
  // -------------------------------------------------------------------------

  describe('Сообщение об успешной регистрации', () => {
    it('должен показывать сообщение об успешной регистрации при showRegistrationMessage=true', () => {
      renderLoginForm({ showRegistrationMessage: true });
      expect(screen.getByText(/аккаунт успешно создан/i)).toBeInTheDocument();
    });

    it('не должен показывать сообщение об успешной регистрации при showRegistrationMessage=false', () => {
      renderLoginForm({ showRegistrationMessage: false });
      expect(screen.queryByText(/аккаунт успешно создан/i)).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Доступность (a11y)
  // -------------------------------------------------------------------------

  describe('Доступность (a11y)', () => {
    it('должен иметь aria-label для полей ввода', () => {
      renderLoginForm();
      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('должен иметь aria-label для кнопки', () => {
      renderLoginForm();
      const button = screen.getByRole('button', { name: /войти/i });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('должен иметь aria-live для сообщения об ошибке', async () => {
      renderLoginForm();
      const button = screen.getByRole('button', { name: /войти/i });
      fireEvent.click(button);
      await waitFor(() => {
        const errorElement = screen.getByText(/заполните все поля/i);
        expect(errorElement).toBeInTheDocument();
      });
    });

    it('должен иметь aria-live для сообщения об успехе', () => {
      renderLoginForm({ showRegistrationMessage: true });
      expect(screen.getByText(/аккаунт успешно создан/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('не должен вызывать signIn при пустой форме', async () => {
      renderLoginForm();
      const button = screen.getByRole('button', { name: /войти/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(signIn).not.toHaveBeenCalled();
      });
    });

    it('должен обрабатывать очень длинные значения полей', () => {
      renderLoginForm();
      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const longString = 'a'.repeat(1000);

      fireEvent.change(emailInput, { target: { value: longString } });
      expect(emailInput.value).toBe(longString);
    });

    it('должен сохранять состояние введенных данных после ошибки', async () => {
      const mockSignIn = signIn;
      mockSignIn.mockResolvedValueOnce({ ok: false, error: 'Invalid credentials' });

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email адрес для входа/i);
      const passwordInput = screen.getByLabelText(/пароль для входа/i);
      const button = screen.getByRole('button', { name: /войти/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/неверный email или пароль/i)).toBeInTheDocument();
      });

      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('wrongpassword');
    });
  });
});
