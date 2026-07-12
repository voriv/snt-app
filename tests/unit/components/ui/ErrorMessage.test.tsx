/**
 * @file Тесты для компонента ErrorMessage
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

describe('ErrorMessage Component', () => {
  describe('AC-11.1.2: Отображение сообщения об ошибке', () => {
    it('should render error message when message prop is provided', () => {
      const errorMessage = 'Неверный email или пароль';
      render(<ErrorMessage message={errorMessage} />);
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should not render anything when message is null', () => {
      render(<ErrorMessage message={null} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not render anything when message is undefined', () => {
      render(<ErrorMessage message={undefined as unknown as string} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('AC-11.4.1: Язык сообщений (русский)', () => {
    it('should render Russian error messages', () => {
      const russianMessage = 'Пожалуйста, заполните все поля';
      render(<ErrorMessage message={russianMessage} />);
      expect(screen.getByText(russianMessage)).toBeInTheDocument();
    });

    it('should handle multiple Russian error messages', () => {
      const messages = [
        'Неверный email или пароль',
        'Введите корректный email',
        'Пароль должен содержать минимум 6 символов',
      ];

      messages.forEach((message) => {
        render(<ErrorMessage message={message} />);
        expect(screen.getByText(message)).toBeInTheDocument();
        screen.getByRole('alert').remove();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert" attribute', () => {
      render(<ErrorMessage message="Ошибка" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have aria-live="polite" attribute', () => {
      render(<ErrorMessage message="Ошибка" />);
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible icon with aria-hidden="true"', () => {
      render(<ErrorMessage message="Ошибка" />);
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply default error styling classes', () => {
      render(<ErrorMessage message="Ошибка" />);
      const container = screen.getByRole('alert').parentElement;
      expect(container).toHaveClass('bg-red-50');
      expect(container).toHaveClass('text-red-700');
      expect(container).toHaveClass('rounded-md');
    });

    it('should apply custom className when provided', () => {
      render(<ErrorMessage message="Ошибка" className="custom-class" />);
      const container = screen.getByRole('alert').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('should combine default and custom classes', () => {
      render(<ErrorMessage message="Ошибка" className="custom-class" />);
      const container = screen.getByRole('alert').parentElement;
      expect(container).toHaveClass('bg-red-50');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Error message variants', () => {
    it('should render short error message', () => {
      render(<ErrorMessage message="Ошибка" />);
      expect(screen.getByText('Ошибка')).toBeInTheDocument();
    });

    it('should render long error message with multiple sentences', () => {
      const longMessage =
        'Произошла ошибка при входе. Попробуйте позже. Если проблема сохранится, обратитесь в поддержку.';
      render(<ErrorMessage message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should render error message with special characters', () => {
      const message = 'Неверный email или пароль!';
      render(<ErrorMessage message={message} />);
      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string message gracefully', () => {
      render(<ErrorMessage message="" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle message with only whitespace', () => {
      render(<ErrorMessage message="   " />);
      // Whitespace-only message should render since it's not null/undefined
      const alert = screen.queryByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should render Cyrillic characters correctly', () => {
      const cyrillicMessage = 'Неверный email или пароль';
      render(<ErrorMessage message={cyrillicMessage} />);
      expect(screen.getByText(cyrillicMessage)).toBeInTheDocument();
    });
  });
});
