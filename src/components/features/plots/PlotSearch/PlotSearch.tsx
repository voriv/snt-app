/**
 * @component PlotSearch
 * @category features
 * @description Компонент поиска участков по номеру, кадастровому номеру и описанию
 *
 * @spec
 * - Три поля ввода: номер участка, кадастровый номер, описание
 * - Debounce 300мс для избежания лишних запросов (BR-3)
 * - Минимальная длина: номер ≥ 2, кадастр ≥ 3, описание ≥ 2 (BR-1)
 * - Отменяет предыдущие запросы через AbortController (BR-4)
 * - Кнопка «Очистить» сбрасывает все поля и выполняет поиск без фильтров
 * - Поля расположены горизонтально, кнопка «Очистить» справа
 *
 * @param value - Текущее состояние поиска
 * @param onChange - Коллбек при изменении результатов поиска
 * @param isLoading - Индикатор загрузки
 *
 * @example
 * ```tsx
 * <PlotSearch
 *   value={{ number: '42', cadastral: '', note: '' }}
 *   onChange={(plots) => setPlots(plots)}
 *   isLoading={false}
 * />
 * ```
 *
 * @see docs/user-stories/US-17-plot-search.md — FR-1, FR-2, FR-3, FR-4, FR-5
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Plot } from '@/domains/plot/plot.types';
import type { PlotSearchFilters } from '@/domains/plot/plot.types';

export interface PlotSearchState {
  number: string;
  cadastral: string;
  note: string;
}

export interface PlotSearchProps {
  /** Текущее состояние поиска */
  value: PlotSearchState;
  /** Коллбек при изменении результатов поиска */
  onChange: (plots: Plot[]) => void;
  /** Индикатор загрузки */
  isLoading: boolean;
}

const DEBOUNCE_DELAY = 300;
const MIN_LENGTH_NUMBER = 2;
const MIN_LENGTH_CADASTRAL = 3;
const MIN_LENGTH_NOTE = 2;

const EMPTY_STATE: PlotSearchState = {
  number: '',
  cadastral: '',
  note: '',
};

export function PlotSearch({ value, onChange, isLoading }: PlotSearchProps): React.ReactElement {
  const [localValue, setLocalValue] = useState<PlotSearchState>(value);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Синхронизируем с внешним значением (для сброса)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * Выполняет поиск участков через API
   */
  const performSearch = useCallback(
    async (filters: PlotSearchFilters) => {
      // Отменяем предыдущий запрос
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const queryParams: Record<string, string | number | boolean | null | undefined> = {};
        if (filters.number) queryParams.number = filters.number;
        if (filters.cadastral) queryParams.cadastral = filters.cadastral;
        if (filters.note) queryParams.note = filters.note;

        const response = await apiClient.getWithQuery<Plot[]>('/plots/search', queryParams, {
          signal: controller.signal,
        });

        if (response.success && response.data) {
          onChange(response.data);
        }
      } catch (error: unknown) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Plot search error:', error);
      }
    },
    [onChange],
  );

  /**
   * Debounce-обёртка для performSearch
   */
  const debouncedSearch = useCallback(
    (filters: PlotSearchFilters) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        performSearch(filters);
      }, DEBOUNCE_DELAY);
    },
    [performSearch],
  );

  /**
   * Обработчик изменения любого поля
   */
  const handleInputChange = useCallback(
    (field: keyof PlotSearchState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const updated = { ...localValue, [field]: newValue };
      setLocalValue(updated);

      // Собираем все фильтры
      const filters: PlotSearchFilters = {};
      if (updated.number && updated.number.length >= MIN_LENGTH_NUMBER) {
        filters.number = updated.number;
      }
      if (updated.cadastral && updated.cadastral.length >= MIN_LENGTH_CADASTRAL) {
        filters.cadastral = updated.cadastral;
      }
      if (updated.note && updated.note.length >= MIN_LENGTH_NOTE) {
        filters.note = updated.note;
      }

      // Если есть хотя бы один фильтр — выполняем поиск
      const hasFilters = Object.keys(filters).length > 0;
      if (hasFilters) {
        debouncedSearch(filters);
      }
    },
    [localValue, debouncedSearch],
  );

  /**
   * Обработчик кнопки «Очистить»
   */
  const handleClear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalValue(EMPTY_STATE);
    // После очистки загружаем полный список (пустые фильтры)
    debouncedSearch({});
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {/* Поле № участка */}
        <div>
          <label
            htmlFor="plot-search-number"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            № участка
          </label>
          <input
            id="plot-search-number"
            type="text"
            placeholder="Поиск по номеру..."
            value={localValue.number}
            onChange={handleInputChange('number')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            aria-label="Поиск по номеру участка"
          />
        </div>

        {/* Поле Кадастровый номер */}
        <div>
          <label
            htmlFor="plot-search-cadastral"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Кадастровый номер
          </label>
          <input
            id="plot-search-cadastral"
            type="text"
            placeholder="Поиск по кадастру..."
            value={localValue.cadastral}
            onChange={handleInputChange('cadastral')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            aria-label="Поиск по кадастровому номеру"
          />
        </div>

        {/* Поле Описание */}
        <div>
          <label
            htmlFor="plot-search-note"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Описание
          </label>
          <input
            id="plot-search-note"
            type="text"
            placeholder="Поиск по описанию..."
            value={localValue.note}
            onChange={handleInputChange('note')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            aria-label="Поиск по описанию"
          />
        </div>
      </div>

      {/* Кнопка Очистить */}
      <button
        type="button"
        onClick={handleClear}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Очистить поиск"
      >
        Очистить
      </button>
    </div>
  );
}
