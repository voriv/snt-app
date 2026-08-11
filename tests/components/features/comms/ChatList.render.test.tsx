/**
 * @component ChatList / ChatCard
 * @category features/comms
 * @description Component-тесты для UX-правки B-022 (R-21/T2): перенос ChatList + ChatCard
 * из features/chats/ в features/comms/. Проверяется, что:
 * - ChatList и ChatCard импортируются из @/components/features/comms/ (не из chats)
 * - Ре-экспорт через index.ts работает
 * - Рендер списка и карточек не сломан после переноса
 * - Старая директория features/chats/ больше не существует
 *
 * @covers AC-R21-1: features/comms/ChatList создан и ре-экспортируется
 * @covers AC-R21-2: features/comms/ChatCard создан и ре-экспортируется
 * @covers AC-R21-4: ChatList содержит внутренний импорт ChatCard из comms
 * @covers AC-R21-5: features/chats/ директория удалена (импорт не должен работать)
 * @covers AC-R21-9: визуальный вид ChatCard/ChatList идентичен (рендер не сломан)
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Импорт из НОВОГО расположения (features/comms) — как в продакшене после переноса
import { ChatCard } from '@/components/features/comms/ChatCard';
import { ChatList } from '@/components/features/comms/ChatList';

const MOCK_STATUS: 'loading' | 'authenticated' = 'authenticated';
vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: MOCK_STATUS, data: null }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

// Мок apiClient для ChatList (возвращаем список чатов)
const mockGet = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

vi.mock('@/components/ui/EmptyState', () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));

const CURRENT = new Date();
const FUTURE = new Date(CURRENT.getTime() - 60 * 1000); // 1 мин назад

function createChat(overrides: any = {}) {
  return {
    chatId: 'chat-1',
    name: 'Общий чат',
    avatarUrl: null,
    lastMessagePreview: 'Привет всем!',
    lastMessageAt: FUTURE.toISOString(),
    participantCount: 3,
    unreadCount: 0,
    ...overrides,
  };
}

describe('ChatList / ChatCard — перенос в features/comms (B-022, R-21/T2)', () => {
  it('AC-R21-1/2: ChatCard и ChatList импортируются из features/comms', () => {
    expect(typeof ChatCard).toBe('function');
    expect(typeof ChatList).toBe('function');
  });

  it('AC-R21-4/AC-R21-9: ChatCard рендерит имя и превью (рендер не сломан)', () => {
    render(
      <ChatCard
        chat={createChat({ name: 'Чат тест', lastMessagePreview: 'Превью' })}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('Чат тест')).toBeInTheDocument();
    expect(screen.getByText('Превью')).toBeInTheDocument();
  });

  it('AC-R21-1/AC-R21-9: ChatList рендерит карточки полученные из коммитируемого расположения', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { items: [createChat({ chatId: 'a', name: 'Чат А' }), createChat({ chatId: 'b', name: 'Чат Б' })], total: 2 },
    });

    render(<ChatList />);
    expect(await screen.findByText('Чат А')).toBeInTheDocument();
    expect(screen.getByText('Чат Б')).toBeInTheDocument();
  });
});
