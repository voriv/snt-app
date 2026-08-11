/**
 * @component ChangePasswordForm
 * @category auth
 * @description Component-тесты для ChangePasswordForm
 *
 * @spec
 * - Рендер формы с 3 полями пароля
 * - Отображение ошибки валидации
 * - Отображение success state
 * - Кнопка show/hide пароля
 * - Кнопка submit disabled при пустых полях
 *
 * @covers AC-9.7 — отображение формы смены пароля
 * @covers AC-9.8 — успешная отправка формы
 * @covers AC-9.9 — клиентская валидация
 * @covers AC-9.10 — ошибка от сервера (UI)
 * @covers AC-9.12 — состояние загрузки
 */
// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangePasswordForm } from '@/components/features/auth/ChangePasswordForm/ChangePasswordForm';

// ============================================================================
// Mocks
// ============================================================================

// Mock apiClient
const mockApiPut = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    put: mockApiPut,
  },
}));

// Mock Next.js navigation
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

// ============================================================================
// Helpers
// ============================================================================

function renderChangePasswordForm(props = {}) {
  return render(React.createElement(ChangePasswordForm, props));
}

// ============================================================================
// Tests
// ============================================================================

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Рендеринг
  // -------------------------------------------------------------------------

  describe('Рендеринг', () => {
    it('должен рендерить поле "Текущий пароль"', () => {
      renderChangePasswordForm();
      expect(screen.getByLabelText('Текущий пароль')).toBeInTheDocument();
    });

    it('должен рендерить поле "Новый пароль"', () => {
      renderChangePasswordForm();
      expect(screen.getByLabelText('Новый пароль')).toBeInTheDocument();
    });

    it('должен рендерить поле "Подтверждение нового пароля"', () => {
      renderChangePasswordForm();
      expect(screen.getByLabelText('Подтверждение нового пароля')).toBeInTheDocument();
    });

    it('должен рендерить кнопку "Сменить пароль"', () => {
      renderChangePasswordForm();
      expect(screen.getByRole('button', { name: 'Сменить пароль' })).toBeInTheDocument();
    });

    it('должен рендерить форму с 3 полями ввода', () => {
      renderChangePasswordForm();
      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(3);
    });

    it('должен рендерить подсказку "Минимум 6 символов"', () => {
      renderChangePasswordForm();
      expect(screen.getByText('Минимум 6 символов')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Кнопки show/hide пароля
  // -------------------------------------------------------------------------

  describe('Кнопки show/hide пароля', () => {
    it('должен рендерить кнопку показа/скрытия для текущего пароля', () => {
      renderChangePasswordForm();
      const button = screen.getByRole('button', {
        name: 'Показать текущий пароль',
      });
      expect(button).toBeInTheDocument();
    });

    it('должен рендерить кнопку показа/скрытия для нового пароля', () => {
      renderChangePasswordForm();
      const button = screen.getByRole('button', {
        name: 'Показать новый пароль',
      });
      expect(button).toBeInTheDocument();
    });

    it('должен рендерить кнопку показа/скрытия для подтверждения пароля', () => {
      renderChangePasswordForm();
      const button = screen.getByRole('button', {
        name: 'Показать подтверждение пароля',
      });
      expect(button).toBeInTheDocument();
    });

    it('должен переключать видимость текущего пароля', () => {
      renderChangePasswordForm();
      const button = screen.getByRole('button', {
        name: 'Показать текущий пароль',
      });

      expect(button).toHaveTextContent('Показать текущий пароль');
      fireEvent.click(button);
      expect(button).toHaveTextContent('Скрыть текущий пароль');
    });

    it('должен переключать видимость нового пароля', () => {
      renderChangePasswordForm();
      const button = screen.getByRole('button', {
        name: 'Показать новый пароль',
      });

      expect(button).toHaveTextContent('Показать новый пароль');
      fireEvent.click(button);
      expect(button).toHaveTextContent('Скрыть новый пароль');
    });

    it('должен переключать видимость подтверждения пароля', () => {
      renderChangePasswordForm();
      const button = screen.getByRole('button', {
        name: 'Показать подтверждение пароля',
      });

      expect(button).toHaveTextContent('Показать подтверждение пароля');
      fireEvent.click(button);
      expect(button).toHaveTextContent('Скрыть подтверждение пароля');
    });
  });

  // -------------------------------------------------------------------------
  // Кнопка submit disabled при пустых полях
  // -------------------------------------------------------------------------

  describe('Кнопка submit', () => {
    it('должна быть disabled когда все поля пустые', () => {
      renderChangePasswordForm();
      const button = screen.getByRole('button', { name: 'Сменить пароль' });
      expect(button).toBeDisabled();
    });

    it('должна быть disabled когда заполнено только одно поле', () => {
      renderChangePasswordForm();
      const currentPassword = screen.getByLabelText('Текущий пароль');
      fireEvent.change(currentPassword, { target: { value: 'password123' } });

      const button = screen.getByRole('button', { name: 'Сменить пароль' });
      expect(button).toBeDisabled();
    });

    it('должна быть enabled когда все поля заполнены', () => {
      renderChangePasswordForm();
      const currentPassword = screen.getByLabelText('Текущий пароль');
      const newPassword = screen.getByLabelText('Новый пароль');
      const confirmPassword = screen.getByLabelText('Подтверждение нового пароля');

      fireEvent.change(currentPassword, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
      fireEvent.change(confirmPassword, { target: { value: 'newPassword123' } });

      const button = screen.getByRole('button', { name: 'Сменить пароль' });
      expect(button).toBeEnabled();
    });
  });

  // -------------------------------------------------------------------------
  // Успешная отправка формы
  // -------------------------------------------------------------------------

  describe('Успешная отправка формы', () => {
    it('должен отправить запрос при заполнении всех полей', async () => {
      mockApiPut.mockResolvedValueOnce({ success: true });

      renderChangePasswordForm();
      const currentPassword = screen.getByLabelText('Текущий пароль');
      const newPassword = screen.getByLabelText('Новый пароль');
      const confirmPassword = screen.getByLabelText('Подтверждение нового пароля');

      fireEvent.change(currentPassword, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
      fireEvent.change(confirmPassword, { target: { value: 'newPassword123' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockApiPut).toHaveBeenCalledWith('/auth/password', {
          currentPassword: 'oldPassword123',
          newPassword: 'newPassword123',
          confirmPasswordNew: 'newPassword123',
        });
      });
    });

    it('должен отобразить сообщение об успехе', async () => {
      mockApiPut.mockResolvedValueOnce({ success: true });

      renderChangePasswordForm();
      const currentPassword = screen.getByLabelText('Текущий пароль');
      const newPassword = screen.getByLabelText('Новый пароль');
      const confirmPassword = screen.getByLabelText('Подтверждение нового пароля');

      fireEvent.change(currentPassword, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
      fireEvent.change(confirmPassword, { target: { value: 'newPassword123' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Пароль успешно изменён')).toBeInTheDocument();
      });
    });

    it('должен вызвать колбэк onSuccess при успешной смене', async () => {
      mockApiPut.mockResolvedValueOnce({ success: true });
      const onSuccess = vi.fn();

      renderChangePasswordForm({ onSuccess });
      const currentPassword = screen.getByLabelText('Текущий пароль');
      const newPassword = screen.getByLabelText('Новый пароль');
      const confirmPassword = screen.getByLabelText('Подтверждение нового пароля');

      fireEvent.change(currentPassword, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
      fireEvent.change(confirmPassword, { target: { value: 'newPassword123' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('должен показать кнопку "Закрыть" в success state', async () => {
      mockApiPut.mockResolvedValueOnce({ success: true });

      renderChangePasswordForm();
      const currentPassword = screen.getByLabelText('Текущий пароль');
      const newPassword = screen.getByLabelText('Новый пароль');
      const confirmPassword = screen.getByLabelText('Подтверждение нового пароля');

      fireEvent.change(currentPassword, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
      fireEvent.change(confirmPassword, { target: { value: 'newPassword123' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Закрыть')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Ошибка от сервера
  // -------------------------------------------------------------------------

  describe('Ошибка от сервера', () => {
    it('должен отобразить ошибку при неверном текущем пароле', async () => {
      mockApiPut.mockRejectedValueOnce(new Error('Неверный текущий пароль'));

      renderChangePasswordForm();
      const currentPassword = screen.getByLabelText('Текущий пароль');
      const newPassword = screen.getByLabelText('Новый пароль');
      const confirmPassword = screen.getByLabelText('Подтверждение нового пароля');

      fireEvent.change(currentPassword, { target: { value: 'wrongPassword' } });
      fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
      fireEvent.change(confirmPassword, { target: { value: 'newPassword123' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Неверный текущий пароль')).toBeInTheDocument();
      });
    });

    it('должен отобразить ошибку при совпадении с текущим паролем', async () => {
      mockApiPut.mockRejectedValueOnce(
        new Error('Новый пароль не может совпадать с текущим')
      );

      renderChangePasswordForm();
      const currentPassword = screen.getByLabelText('Текущий пароль');
      const newPassword = screen.getByLabelText('Новый пароль');
      const confirmPassword = screen.getByLabelText('Подтверждение нового пароля');

      fireEvent.change(currentPassword, { target: { value: 'samePassword123' } });
      fireEvent.change(newPassword, { target: { value: 'samePassword123' } });
      fireEvent.change(confirmPassword, { target: { value: 'samePassword123' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Новый пароль не может совпадать с текущим')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Состояние загрузки
  // -------------------------------------------------------------------------

  describe('Состояние загрузки', () => {
    it('должен показать состояние загрузки во время отправки', async () => {
      let resolvePromise: (value: unknown) => void;
      const deferredPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiPut.mockReturnValueOnce(deferredPromise);

      renderChangePasswordForm();
      const currentPassword = screen.getByLabelText('Текущий пароль');
      const newPassword = screen.getByLabelText('Новый пароль');
      const confirmPassword = screen.getByLabelText('Подтверждение нового пароля');

      fireEvent.change(currentPassword, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
      fireEvent.change(confirmPassword, { target: { value: 'newPassword123' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'Смена пароля...' });
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
      });

      // Resolve promise to clean up
      resolvePromise!({ success: true });
    });

    it('должен заблокировать поля во время загрузки', async () => {
      let resolvePromise: (value: unknown) => void;
      const deferredPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiPut.mockReturnValueOnce(deferredPromise);

      renderChangePasswordForm();
      const currentPassword = screen.getByLabelText('Текущий пароль');
      const newPassword = screen.getByLabelText('Новый пароль');
      const confirmPassword = screen.getByLabelText('Подтверждение нового пароля');

      fireEvent.change(currentPassword, { target: { value: 'oldPassword123' } });
      fireEvent.change(newPassword, { target: { value: 'newPassword123' } });
      fireEvent.change(confirmPassword, { target: { value: 'newPassword123' } });

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(currentPassword).toBeDisabled();
        expect(newPassword).toBeDisabled();
        expect(confirmPassword).toBeDisabled();
      });

      // Resolve promise to clean up
      resolvePromise!({ success: true });
    });
  });
});
