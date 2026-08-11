/**
 * @hook useMarkAsRead
 * @category hooks
 * @description Component-тесты для хука автоматической отметки прочитанных (B-026, US-39-01)
 *
 * @covers AC-1 (US-39-01): PATCH /conversations/:id/read для DIRECT
 * @covers AC-2 (US-39-01): PATCH /chats/:id/read для GROUP
 * @covers AC-4 (US-39-01): Идемпотентность (защита от дублей)
 * @covers AC-5 (US-39-01): Refetch unread-counts после успеха
 * @covers AC-6 (US-39-01): Silent fail при ошибке сети — не блокирует UI
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMarkAsRead } from '@/hooks/useMarkAsRead';

const mockPatch = vi.fn();
const mockGet = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    patch: (...args: unknown[]) => mockPatch(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('useMarkAsRead (US-39-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatch.mockReset();
    mockGet.mockReset();
  });

  // AC-1: DIRECT → /conversations/:id/read
  it('AC-1: должен вызывать PATCH /conversations/:id/read для DIRECT', async () => {
    mockPatch.mockResolvedValue({ success: true });
    mockGet.mockResolvedValue({ messages: 0, chats: 0 });

    const { result } = renderHook(() => useMarkAsRead());
    await act(async () => {
      await result.current.markAsRead('conv-1', 'DIRECT');
    });

    expect(mockPatch).toHaveBeenCalledWith('/conversations/conv-1/read', {});
  });

  // AC-2: GROUP → /chats/:id/read
  it('AC-2: должен вызывать PATCH /chats/:id/read для GROUP', async () => {
    mockPatch.mockResolvedValue({ success: true });
    mockGet.mockResolvedValue({ messages: 0, chats: 0 });

    const { result } = renderHook(() => useMarkAsRead());
    await act(async () => {
      await result.current.markAsRead('chat-1', 'GROUP');
    });

    expect(mockPatch).toHaveBeenCalledWith('/chats/chat-1/read', {});
  });

  // AC-5: refetch unread-counts после успеха
  it('AC-5: должен обновлять unread-counts после успеха', async () => {
    mockPatch.mockResolvedValue({ success: true });
    mockGet.mockResolvedValue({ messages: 2, chats: 1 });

    const { result } = renderHook(() => useMarkAsRead());
    await act(async () => {
      await result.current.markAsRead('conv-1', 'DIRECT');
    });

    expect(mockGet).toHaveBeenCalledWith('/comms/unread-counts');
  });

  // AC-6: silent fail при ошибке сети
  it('AC-6: не должен выбрасывать ошибку при сбое сети (silent fail)', async () => {
    mockPatch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMarkAsRead());
    await act(async () => {
      // Не должно бросаться исключение
      await expect(
        result.current.markAsRead('conv-1', 'DIRECT')
      ).resolves.toBeUndefined();
    });
  });

  // AC-4: защита от дублирующихся вызовов
  it('AC-4: должен предотвращать повторный вызов пока выполняется первый (isMarking)', async () => {
    let resolvePatch: (v: unknown) => void;
    mockPatch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePatch = resolve;
        })
    );
    mockGet.mockResolvedValue({ messages: 0, chats: 0 });

    const { result } = renderHook(() => useMarkAsRead());

    let p2: Promise<void>;
    await act(async () => {
      const p1 = result.current.markAsRead('conv-1', 'DIRECT');
      // Второй вызов во время первого должен быть проигнорирован внутри same act
      p2 = result.current.markAsRead('conv-1', 'DIRECT');
      resolvePatch!({ success: true });
      await Promise.all([p1, p2]);
    });

    expect(mockPatch).toHaveBeenCalledTimes(1);
    await act(async () => {
      await waitFor(() => expect(result.current.isMarking).toBe(false));
    });
  });
});
