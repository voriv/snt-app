/**
 * @page /dashboard/comms/chats/:chatId/edit
 * @category features/comms
 * @description Component-тесты для UX-правки B-022 (R-28/T4): fallback-экран «Чат не найден».
 * В [edit/page.tsx] блоки loadError и !chat имеют идентичную структуру
 * (заголовок + кнопка «Назад» + ErrorMessage). HTTP-ответ success:false
 * инициирует loadError='Чат не найден' и рендерит тот же шаблон, что и блок !chat.
 *
 * @covers AC-R28-1: fallback содержит h1 «Редактирование чата» + кнопку «Назад» + ErrorMessage
 * @covers AC-R28-2: кнопка «Назад» вызывает router.push('/dashboard/comms/chats')
 * @covers AC-R28-3: кнопка «Назад» имеет aria-label="Назад к списку чатов"
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let MOCK_STATUS = 'authenticated';
vi.mock('next-auth/react', () => ({
  useSession: () => ({ status: MOCK_STATUS, data: null }),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: (...a: unknown[]) => mockPush(...a),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({ chatId: 'ch1' }),
}));

// Мок apiClient: возвращаем success:false → loadError='Чат не найден'
const mockGet = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

vi.mock('@/components/layouts/Breadcrumbs', () => ({
  Breadcrumbs: () => <nav aria-label="Breadcrumb" role="navigation">breadcrumbs</nav>,
}));

vi.mock('@/components/ui/ErrorMessage', () => ({
  ErrorMessage: (props: any) => (
    <div role="alert" data-testid="error-message" data-message={props.message}>
      {props.message}
    </div>
  ),
}));

vi.mock('@/components/features/comms/EditChatForm', () => ({
  EditChatForm: () => <div data-testid="edit-chat-form" />,
}));

import ChatsEditPage from '@/app/dashboard/comms/chats/[chatId]/edit/page';

describe('EditChatPage — «Чат не найден» (B-022, R-28/T4)', () => {
  beforeEach(() => {
    MOCK_STATUS = 'authenticated';
    mockPush.mockReset();
    mockGet.mockReset();
  });

  // AC-R28-1: fallback-экран с заголовком, кнопкой и ErrorMessage
  it('AC-R28-1: при success:false рендерит заголовок, кнопку «Назад» и ErrorMessage "Чат не найден"', async () => {
    mockGet.mockResolvedValue({ success: false, data: null, error: { message: 'Чат не найден' } });

    render(<ChatsEditPage />);
    await screen.findByTestId('error-message');

    expect(screen.getByRole('heading', { name: 'Редактирование чата' })).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveAttribute('data-message', 'Чат не найден');
    expect(screen.getByRole('button', { name: 'Назад к списку чатов' })).toBeInTheDocument();
    expect(screen.queryByTestId('edit-chat-form')).not.toBeInTheDocument();
  });

  // AC-R28-3: aria-label кнопки «Назад»
  it('AC-R28-3: кнопка «Назад» имеет aria-label="Назад к списку чатов"', async () => {
    mockGet.mockResolvedValue({ success: false, data: null, error: { message: 'Чат не найден' } });

    render(<ChatsEditPage />);
    const btn = await screen.findByRole('button', { name: 'Назад к списку чатов' });
    expect(btn.getAttribute('aria-label')).toBe('Назад к списку чатов');
  });

  // AC-R28-2: клик по кнопке «Назад» → router.push('/dashboard/comms/chats')
  it('AC-R28-2: клик по кнопке «Назад» вызывает router.push("/dashboard/comms/chats")', async () => {
    mockGet.mockResolvedValue({ success: false, data: null, error: { message: 'Чат не найден' } });

    render(<ChatsEditPage />);
    const btn = await screen.findByRole('button', { name: 'Назад к списку чатов' });
    fireEvent.click(btn);
    expect(mockPush).toHaveBeenCalledWith('/dashboard/comms/chats');
  });
});
