import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionContext, useSession as useNextAuthSession } from 'next-auth/react';
import { useSession } from '@/hooks/useSession';

// Моки next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <SessionContext.Provider value={{ status: 'loading' } as any}>
      {children}
    </SessionContext.Provider>
  ),
}));

// Фикстуры
const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    roles: ['MEMBER'],
  },
  expires: '2026-12-31T23:59:59.000Z',
};

const mockLoadingSession = null;

describe('useSession Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC-9.1.1: Возврат данных сессии', () => {
    it('should return data when user is authorized', async () => {
      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.data).toEqual({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            roles: ['MEMBER'],
          },
          expires: '2026-12-31T23:59:59.000Z',
        });
      });
    });

    it('should map roles array correctly', async () => {
      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: { ...mockSession, user: { ...mockSession.user, roles: ['ADMIN', 'MEMBER'] } },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSession());

      await waitFor(() => {
        expect(result.current.data?.user.roles).toEqual(['ADMIN', 'MEMBER']);
      });
    });
  });

  describe('AC-9.1.2: Обработка загрузки', () => {
    it('should show loading state on first render', async () => {
      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: null,
        status: 'loading',
      });

      const { result } = renderHook(() => useSession());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should transition from loading to authenticated', async () => {
      // Mock возвращает loading сначала, затем authenticated
      let callCount = 0;
      (useNextAuthSession as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { data: null, status: 'loading' as const };
        }
        return { data: mockSession, status: 'authenticated' as const };
      });

      const { result, rerender } = renderHook(() => useSession());

      expect(result.current.loading).toBe(true);

      // Ререндер сменяет на authenticated
      rerender();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).not.toBeNull();
      }, { timeout: 3000 });
    });
  });

  describe('AC-9.1.3: Обработка ошибок', () => {
    it('should handle null session (not authenticated)', async () => {
      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle invalid session data', async () => {
      const invalidSession = {
        user: {
          id: null,
          email: '',
          name: null,
          roles: [],
        },
        expires: '',
      };

      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: invalidSession as any,
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toEqual({
          code: 'INVALID_SESSION',
          message: 'Сессия содержит неполные данные',
        });
      });
    });
  });

  describe('AC-9.2.1: Обновление сессии', () => {
    it('should call refresh and update data', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValue({ ok: true });

      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSession());

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'POST',
      });
    });

    it('should set loading to true during refresh', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValue({ ok: true });

      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSession());

      expect(result.current.loading).toBe(false);

      await act(async () => {
        result.current.refresh();
      });

      expect(result.current.loading).toBe(true);
    });
  });

  describe('AC-9.2.2: Повторные попытки', () => {
    it('should retry failed refresh up to 3 times', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockRejectedValue(new Error('Network error'));

      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSession());

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.current.error).toEqual({
        code: 'SESSION_REFRESH_FAILED',
        message: 'Ошибка обновления сессии: Network error',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user fields gracefully', async () => {
      const partialSession = {
        user: {
          email: 'test@example.com',
        },
        expires: '2026-12-31T23:59:59.000Z',
      };

      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: partialSession as any,
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBeNull();
        expect(result.current.error).toEqual({
          code: 'INVALID_SESSION',
          message: 'Сессия содержит неполные данные',
        });
      });
    });

    it('should handle empty roles array', async () => {
      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: {
          ...mockSession,
          user: { ...mockSession.user, roles: [] },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSession());

      await waitFor(() => {
        expect(result.current.data?.user.roles).toEqual([]);
      });
    });

    it('should handle null name field', async () => {
      (useNextAuthSession as ReturnType<typeof vi.fn>).mockReturnValue({
        data: {
          ...mockSession,
          user: { ...mockSession.user, name: null },
        },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useSession());

      await waitFor(() => {
        expect(result.current.data?.user.name).toBeNull();
      });
    });
  });
});
