/**
 * @hook useUnreadCounts
 * @category hooks
 * @description Component-тесты для единого хука загрузки счётчиков непрочитанных (B-027, US-21-37)
 *
 * @covers AC-3 (US-21-37): Скрытие бейджа при 0 — counts = { messages: 0, chats: 0 }
 * @covers AC-5 (US-21-37): Обновление счётчика после прочтения — refetch по триггеру
 * @covers AC-7 (US-21-37): Refetch после markAsRead — перезагрузка при изменении refetchTrigger
 * @covers AC-8 (US-21-37): «99+» при > 99 — counts с большими значениями
 * @covers AC-9 (US-21-37): Глобальный бейдж обновляется — refetch на смене триггера (pathname)
 * @covers AC-12 (US-21-37): silent fail не блокирует навигацию — error заполняется, исключение не выбрасывается
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';

const mockGet = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

describe('useUnreadCounts (US-21-37)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReset();
  });

  // AC-6: загрузка при mount
  it('AC-6: должен загружать /comms/unread-counts при mount', async () => {
    mockGet.mockResolvedValue({ success: true, data: { messages: 3, chats: 2 } });

    const { result } = renderHook(() => useUnreadCounts());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith('/comms/unread-counts');
    expect(result.current.counts).toEqual({ messages: 3, chats: 2 });
    expect(result.current.error).toBeNull();
  });

  // AC-3: нулевые счётчики
  it('AC-3: возвращает нулевые счётчики без ошибки', async () => {
    mockGet.mockResolvedValue({ success: true, data: { messages: 0, chats: 0 } });

    const { result } = renderHook(() => useUnreadCounts());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.counts).toEqual({ messages: 0, chats: 0 });
    expect(result.current.error).toBeNull();
  });

  // AC-7/AC-9: refetch при изменении refetchTrigger
  it('AC-7/AC-9: должен перезагружать данные при изменении refetchTrigger', async () => {
    mockGet.mockResolvedValueOnce({ success: true, data: { messages: 5, chats: 1 } });
    mockGet.mockResolvedValueOnce({ success: true, data: { messages: 2, chats: 0 } });

    const { result, rerender } = renderHook(({ trigger }) => useUnreadCounts(trigger), {
      initialProps: { trigger: 0 },
    });

    await waitFor(() => expect(result.current.counts).toEqual({ messages: 5, chats: 1 }));

    // Смена триггера → refetch (как после markAsRead/navigation)
    rerender({ trigger: 1 });

    await waitFor(() => expect(result.current.counts).toEqual({ messages: 2, chats: 0 }));
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  // AC-12: silent fail при ошибке
  it('AC-12: silent fail — error заполняется, исключение не выбрасывается', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUnreadCounts());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.counts).toBeNull();
  });

  // AC-8: значения > 99 возвращаются как есть (форматирование «99+» — на стороне компонента)
  it('AC-8: возвращает счётчики больше 99 без обрезки (формат «99+» — в компоненте)', async () => {
    mockGet.mockResolvedValue({ success: true, data: { messages: 150, chats: 0 } });

    const { result } = renderHook(() => useUnreadCounts());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.counts).toEqual({ messages: 150, chats: 0 });
  });
});
