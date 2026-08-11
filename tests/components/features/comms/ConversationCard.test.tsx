/**
 * @component ConversationCard
 * @category features/comms
 * @description Component-тесты для UX-правок B-022: аватар h-10 w-10 (R-18/T1)
 * и иконка chevron-right + hover-сдвиг (R-29/T5).
 *
 * @covers AC-R18-1: <img> аватара имеет классы h-10 w-10 (а не h-12 w-12)
 * @covers AC-R18-2: fallback-блок аватара имеет классы h-10 w-10
 * @covers AC-NEG-02: rounded-full сохранён на img и fallback
 * @covers AC-R29-1: корневой div имеет group в className
 * @covers AC-R29-2: SVG chevron-right имеет h-4 w-4, transition-transform, group-hover:translate-x-0.5
 * @covers AC-R29-3: контейнер стрелки имеет flex-shrink-0
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversationCard } from '@/components/features/comms/ConversationCard';

function createConversation(overrides: any = {}) {
  return {
    conversationId: 'conv-1',
    participantId: 'user-2',
    participantName: 'Иван Петров',
    participantAvatar: null,
    lastMessagePreview: 'Привет!',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    ...overrides,
  };
}

describe('ConversationCard — UX-правки (B-022)', () => {
  // AC-R18-1: img аватара h-10 w-10 вместо h-12 w-12
  it('AC-R18-1: <img> аватара имеет классы h-10 w-10 (не h-12 w-12)', () => {
    const { container } = render(
      <ConversationCard
        conversation={createConversation({ participantAvatar: 'http://avatar.test/a.png' })}
        onClick={vi.fn()}
      />
    );

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img!.className).toContain('h-10');
    expect(img!.className).toContain('w-10');
    expect(img!.className).not.toContain('h-12');
    expect(img!.className).not.toContain('w-12');
  });

  // AC-R18-2: fallback-блок h-10 w-10 (когда аватара нет)
  it('AC-R18-2: fallback-блок аватара имеет классы h-10 w-10 и инициалы', () => {
    const { container } = render(
      <ConversationCard conversation={createConversation()} onClick={vi.fn()} />
    );

    const fallback = container.querySelector('.rounded-full');
    expect(fallback!.className).toContain('h-10');
    expect(fallback!.className).toContain('w-10');
    expect(fallback!.className).not.toContain('h-12');
    expect(fallback!.className).not.toContain('w-12');
    // Инициалы из "Иван Петров" → "ИП"
    expect(screen.getByText('ИП')).toBeInTheDocument();
  });

  // AC-NEG-02: rounded-full сохранён на img и fallback
  it('AC-NEG-02: rounded-full сохранён (img + fallback)', () => {
    const withImg = render(
      <ConversationCard
        conversation={createConversation({ participantAvatar: 'http://avatar.test/a.png' })}
        onClick={vi.fn()}
      />
    );
    expect(withImg.container.querySelector('img')!.className).toContain('rounded-full');
    withImg.unmount();

    const withFallback = render(
      <ConversationCard conversation={createConversation()} onClick={vi.fn()} />
    );
    expect(withFallback.container.querySelector('.rounded-full')!.className).toContain('rounded-full');
  });

  // AC-R29-1: корневой div имеет group в className
  it('AC-R29-1: корневой div содержит group в className', () => {
    const { container } = render(
      <ConversationCard conversation={createConversation()} onClick={vi.fn()} />
    );

    const root = container.querySelector('[role="link"]')!;
    expect(root.className).toContain('group');
  });

  // AC-R29-2: SVG chevron-right имеет h-4 w-4, transition-transform, group-hover:translate-x-0.5
  it('AC-R29-2: SVG chevron-right присутствует с h-4 w-4 и group-hover:translate-x-0.5', () => {
    const { container } = render(
      <ConversationCard conversation={createConversation()} onClick={vi.fn()} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    // В jsdom у SVG элемента className — SVGAnimatedString, поэтому читаем через getAttribute('class')
    const cls = svg!.getAttribute('class') ?? '';
    expect(cls).toContain('h-4');
    expect(cls).toContain('w-4');
    expect(cls).toContain('transition-transform');
    expect(cls).toContain('group-hover:translate-x-0.5');
  });

  // AC-R29-3: контейнер стрелки имеет flex-shrink-0
  it('AC-R29-3: контейнер стрелки имеет flex-shrink-0', () => {
    const { container } = render(
      <ConversationCard conversation={createConversation({ lastMessagePreview: 'x'.repeat(200) })} onClick={vi.fn()} />
    );

    const svg = container.querySelector('svg')!;
    const wrapper = svg.parentElement!;
    expect(wrapper.className).toContain('flex-shrink-0');
  });
});
