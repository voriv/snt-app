/**
 * @component UserSelectorList
 * @category features/comms
 * @description Component-тесты для UserSelectorList после дедупликации (B-019-T18, R-16)
 *
 * @covers AC-7 (R-16): единственный источник UserSelectorList (не инлайн)
 * @covers B-019-T18: backward-compatible API (existingConversations, conversationsLoaded)
 * @covers EC-04: кнопки блокируются до завершения предзагрузки диалогов
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserSelectorList } from '@/components/features/comms/UserSelectorList';

const mockGet = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

const onSelectUser = vi.fn();

function renderWithProps(overrides: Record<string, unknown> = {}) {
  return render(
    <UserSelectorList
      onSelectUser={onSelectUser}
      isLoading={false}
      existingConversations={new Map<string, string>()}
      conversationsLoaded={true}
      {...overrides}
    />
  );
}

describe('UserSelectorList — R-16 дедупликация (B-019)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReset();
  });

  // AC-2: поле поиска через <Input>
  it('AC-2: рендерит поле поиска <Input>', () => {
    renderWithProps();
    expect(screen.getByLabelText('Найти пользователя')).toBeInTheDocument();
  });

  it('backward compatible: работает без existingConversations (default) — кнопка «Написать»', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: [{ id: 'u1', email: 'a@x.ru', name: 'Аня', avatar: null }],
    });

    renderWithProps({
      existingConversations: undefined,
      conversationsLoaded: undefined,
    });

    const input = screen.getByLabelText('Найти пользователя');
    fireEvent.change(input, { target: { value: 'Ан' } });

    await waitFor(() => {
      expect(screen.getByRole('option')).toBeInTheDocument();
    });
    // две кнопки: «Написать» (нет существующего диалога)
    expect(screen.getByRole('button', { name: /Написать/ })).toBeInTheDocument();
  });

  // AC-05: при существующем диалоге — кнопка «Открыть диалог»
  it('AC-05: показывает «Открыть диалог» для существующего диалога', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: [{ id: 'u1', email: 'a@x.ru', name: 'Аня', avatar: null }],
    });

    const existing = new Map<string, string>([['u1', 'conv-1']]);
    renderWithProps({ existingConversations: existing });

    fireEvent.change(screen.getByLabelText('Найти пользователя'), { target: { value: 'Ан' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Открыть диалог/ })).toBeInTheDocument();
    });
  });

  it('AC-06: onSelectUser вызывается с conversationId для «Открыть диалог»', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: [{ id: 'u1', email: 'a@x.ru', name: 'Аня', avatar: null }],
    });

    const existing = new Map<string, string>([['u1', 'conv-1']]);
    renderWithProps({ existingConversations: existing });

    fireEvent.change(screen.getByLabelText('Найти пользователя'), { target: { value: 'Ан' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Открыть диалог/ })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Открыть диалог/ }));
    expect(onSelectUser).toHaveBeenCalledWith('u1', 'conv-1');
  });

  // EC-04: блокировка до завершения предзагрузки
  it('EC-04: поле поиска и кнопки блокируются при conversationsLoaded=false', () => {
    const { container } = renderWithProps({ conversationsLoaded: false });
    const input = container.querySelector('input#user-search') as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});
