/**
 * @file ChatLayout.test.tsx
 * @description Unit-тесты для компонента ChatLayout (B-025 / US-38-03)
 *
 * Проверяемые критерии приёмки:
 * - AC-1: Ограничение ширины на десктопе (lg:max-w-4xl + центрирование)
 * - AC-2: Заголовок на всю ширину (ChatHeader вне centring-контейнера)
 * - AC-3: Видимый фон по бокам (структура контейнера)
 * - AC-4: Полная ширина на мобильных (w-full)
 * - AC-5: Единое поведение для личных и групповых чатов
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatLayout } from '@/components/features/comms/ChatLayout';

// Мок для ChatHeader, так как это клиентский компонент
vi.mock('@/components/features/comms/ChatHeader', () => ({
  ChatHeader: vi.fn(({ title, description, onBack, actions }) => (
    <div data-testid="chat-header" data-title={title} data-description={description}>
      <button data-testid="back-button" onClick={onBack}>Назад</button>
      {actions && <div data-testid="header-actions">{actions}</div>}
    </div>
  )),
}));

describe('ChatLayout', () => {
  const defaultProps = {
    title: 'Тестовый чат',
    onBack: vi.fn(),
    children: <div data-testid="test-children">Сообщения</div>,
  };

  // --- AC-1: Ограничение ширины на десктопе ---
  describe('AC-1: Ограничение ширины на десктопе (≥1024px: max-w-4xl + центрирование)', () => {
    it('должен рендерить внутренний контейнер с lg:max-w-4xl и mx-auto', () => {
      const { container } = render(<ChatLayout {...defaultProps} />);

      // Ищем внутренний контейнер (centring inner) — второй div с классом w-full
      const outerDiv = container.querySelector('div > div > div:last-child');
      expect(outerDiv).not.toBeNull();

      // Внутренний контейнер — дочерний flex-элемент с ограничением ширины
      const innerContainer = container.querySelector('.lg\\:max-w-4xl');
      expect(innerContainer).not.toBeNull();
      expect(innerContainer?.classList.contains('mx-auto')).toBe(true);
      expect(innerContainer?.classList.contains('w-full')).toBe(true);
    });

    it('должен рендерить внешний контейнер с flex justify-center для центрирования', () => {
      const { container } = render(<ChatLayout {...defaultProps} />);

      // Внешний центрирующий div
      const centringContainer = container.querySelector('.flex-1.min-h-0');
      expect(centringContainer).not.toBeNull();
      expect(centringContainer?.classList.contains('flex')).toBe(true);
      expect(centringContainer?.classList.contains('justify-center')).toBe(true);
    });
  });

  // --- AC-2: Заголовок на всю ширину ---
  describe('AC-2: Заголовок на всю ширину (ChatHeader вне centring-контейнера)', () => {
    it('должен рендерить ChatHeader как прямой потомок корневого div', () => {
      const { container } = render(<ChatLayout {...defaultProps} />);

      // Корневой div
      const rootDiv = container.querySelector('div.flex.flex-col');
      expect(rootDiv).not.toBeNull();

      // ChatHeader — первый потомок корневого div
      const header = rootDiv?.children[0];
      expect(header).not.toBeNull();
      expect(header?.getAttribute('data-testid')).toBe('chat-header');

      // Centring-контейнер — второй потомок (не внутри header)
      const centringContainer = rootDiv?.children[1];
      expect(centringContainer).not.toBeNull();
      expect(centringContainer?.classList.contains('flex-1')).toBe(true);
    });

    it('должен передавать props в ChatHeader', () => {
      render(
        <ChatLayout
          {...defaultProps}
          description="Описание чата"
          headerActions={<span>Действия</span>}
        />
      );

      const header = screen.getByTestId('chat-header');
      expect(header).toBeTruthy();
      expect(header.getAttribute('data-title')).toBe('Тестовый чат');
      expect(header.getAttribute('data-description')).toBe('Описание чата');
      expect(screen.getByTestId('header-actions')).toBeTruthy();
    });
  });

  // --- AC-3: Видимый фон по бокам ---
  describe('AC-3: Видимый фон по бокам', () => {
    it('должен рендерить корневой div с h-full и w-full для фона страницы', () => {
      const { container } = render(<ChatLayout {...defaultProps} />);

      const rootDiv = container.querySelector('div.flex.flex-col');
      expect(rootDiv?.classList.contains('h-full')).toBe(true);
      expect(rootDiv?.classList.contains('w-full')).toBe(true);
      // Фон страницы (--theme-bg-primary) применяется к родительскому контейнеру страницы
      // ChatLayout наследует его через h-full w-full
    });

    it('должен рендерить children внутри centring-контейнера', () => {
      render(<ChatLayout {...defaultProps} />);

      const children = screen.getByTestId('test-children');
      expect(children).toBeTruthy();
      expect(children.textContent).toBe('Сообщения');
    });
  });

  // --- AC-4: Полная ширина на мобильных ---
  describe('AC-4: Полная ширина на мобильных (<1024px: w-full)', () => {
    it('должен иметь w-full на внутреннем контейнере (mobile-first)', () => {
      const { container } = render(<ChatLayout {...defaultProps} />);

      // w-full применяется всегда, lg:max-w-4xl только на ≥1024px
      const innerContainer = container.querySelector('.lg\\:max-w-4xl');
      expect(innerContainer?.classList.contains('w-full')).toBe(true);
      // На мобильных lg:max-w-4xl не применяется Tailwind автоматически
    });

    it('должен иметь w-full на внешнем контейнере', () => {
      const { container } = render(<ChatLayout {...defaultProps} />);

      const centringContainer = container.querySelector('.flex-1');
      expect(centringContainer?.classList.contains('w-full')).toBe(true);
    });
  });

  // --- AC-5: Единое поведение для обоих типов чатов ---
  describe('AC-5: Единое поведение для личных и групповых чатов', () => {
    it('должен работать с заголовком диалога (личный чат)', () => {
      const { container } = render(
        <ChatLayout
          title="Диалог с Иваном"
          onBack={vi.fn()}
          children={<div>Сообщения диалога</div>}
        />
      );

      const header = screen.getByTestId('chat-header');
      expect(header.getAttribute('data-title')).toBe('Диалог с Иваном');

      const innerContainer = container.querySelector('.lg\\:max-w-4xl');
      expect(innerContainer).not.toBeNull();
    });

    it('должен работать с заголовком и описанием группового чата', () => {
      const { container } = render(
        <ChatLayout
          title="Общий чат"
          description="Для обсуждения общих вопросов"
          onBack={vi.fn()}
          children={<div>Сообщения чата</div>}
        />
      );

      const header = screen.getByTestId('chat-header');
      expect(header.getAttribute('data-title')).toBe('Общий чат');
      expect(header.getAttribute('data-description')).toBe('Для обсуждения общих вопросов');

      // Та же структура centring-контейнера
      const innerContainer = container.querySelector('.lg\\:max-w-4xl');
      expect(innerContainer).not.toBeNull();
      expect(innerContainer?.classList.contains('mx-auto')).toBe(true);
    });
  });

  // --- Дополнительные граничные случаи ---
  describe('Edge Cases', () => {
    it('EC-1: должен рендериться без description (личный диалог)', () => {
      const { container } = render(<ChatLayout {...defaultProps} />);

      // Описание не передано — атрибут data-description отсутствует
      const header = screen.getByTestId('chat-header');
      expect(header.getAttribute('data-description')).toBeNull();

      // Структура не меняется
      expect(container.querySelector('.lg\\:max-w-4xl')).not.toBeNull();
    });

    it('EC-2: должен рендериться без headerActions', () => {
      render(<ChatLayout {...defaultProps} />);

      expect(screen.getByTestId('chat-header')).toBeTruthy();
      expect(screen.queryByTestId('header-actions')).toBeNull();
    });

    it('EC-3: должен передавать onBack в ChatHeader', () => {
      const onBack = vi.fn();
      render(<ChatLayout {...defaultProps} onBack={onBack} />);

      const backButton = screen.getByTestId('back-button');
      backButton.click();
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });
});
