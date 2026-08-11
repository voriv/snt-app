/**
 * @component ParticipantSelector
 * @category features/comms
 * @description Component-тесты для aria-паттерна спиннера поиска (B-021-T3, R-17/R-26)
 *
 * @covers AC-R17/26-7: спиннер поиска участников имеет
 *   role="status" + aria-live="polite" на контейнере + aria-hidden="true" на svg
 * @covers AC-NEG-06: вид спиннера (animate-spin, text-[var(--theme-accent)]) не изменён
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ParticipantSelector } from '@/components/features/comms/ParticipantSelector';

// Deferred promise — контролируем, когда поиск завершится, чтобы спиннер оставался видимым
let resolveMock: ((value: unknown) => void) | null = null;
const mockGet = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

const onChange = vi.fn();

function makePendingMock() {
  resolveMock = null;
  mockGet.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveMock = resolve;
      })
  );
}

function renderComponent() {
  return render(<ParticipantSelector selectedIds={[]} onChange={onChange} />);
}

describe('ParticipantSelector — aria-паттерн спиннера поиска (B-021-T3, R-17/R-26)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onChange.mockReset();
  });

  // AC-R17/26-7: контейнер спиннера поиска имеет role="status" + aria-live="polite", svg — aria-hidden
  it('AC-R17/26-7: спиннер поиска имеет role="status" + aria-live="polite" + svg aria-hidden', async () => {
    makePendingMock();
    renderComponent();

    const input = screen.getByLabelText('Добавить участников');
    // Поиск с >= 2 символами запускает isSearching=true (spinner виден, пока mock не resolved)
    fireEvent.change(input, { target: { value: 'Ан' } });

    await waitFor(() => {
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      const svg = status.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      // вид не изменён (AC-NEG-06): animate-spin + theme-accent
      const cls = svg?.getAttribute('class') ?? '';
      expect(cls).toContain('animate-spin');
      expect(cls).toContain('theme-accent');
    });
  });

  // AC-NEG-06: svg сохранил исходные классы (не только aria-атрибуты)
  it('AC-NEG-06: svg спиннера не изменил вид (animate-spin + theme-accent)', async () => {
    makePendingMock();
    renderComponent();

    fireEvent.change(screen.getByLabelText('Добавить участников'), { target: { value: 'Ива' } });

    await waitFor(() => {
      const svg = screen.getByRole('status').querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg?.getAttribute('class')).toBe('animate-spin h-8 w-8 text-[var(--theme-accent)]');
    });

    // завершаем поиск, чтобы не было ghost-таймеров (оборачиваем в act для чистого апдейта)
    await act(async () => {
      resolveMock?.({ success: true, data: [] });
    });
  });

  // После завершения поиска спиннер исчезает (isSearching=false)
  it('спиннер скрывается после завершения поиска', async () => {
    makePendingMock();
    renderComponent();

    fireEvent.change(screen.getByLabelText('Добавить участников'), { target: { value: 'Пет' } });

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    resolveMock?.({ success: true, data: [] });

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
