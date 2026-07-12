'use client';

/**
 * @component ParticipantSearch
 * @category features
 * @description Поиск по имени/email с debounce
 *
 * @example
 * ```tsx
 * <ParticipantSearch
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   debounceMs={300}
 * />
 * ```
 *
 * @spec
 * - Debounce 300ms по умолчанию (BR-7)
 * - Поле с placeholder "Поиск по имени или email"
 * - Кнопка очистки при непустом значении
 * - Вызывает onChange с затухающим значением
 *
 * @see US-19-2 FR-5 (поиск по участникам)
 * @see BR-7 (поиск моментальный < 200 мс)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/** Props для ParticipantSearch */
export interface ParticipantSearchProps {
  /** Текущее значение поиска */
  value: string;
  /** Callback при изменении поиска */
  onChange: (query: string) => void;
  /** Время debounce в мс (по умолчанию 300) */
  debounceMs?: number;
}

/**
 * @component
 */
/**
 * @component ParticipantSearch
 * @description Поиск по имени/email с debounce
 * @param value - Текущее значение
 * @param onChange - Callback при изменении
 * @param debounceMs - Время debounce
 * @returns JSX элемент
 */
export function ParticipantSearch({
  value,
  onChange,
  debounceMs = 300,
}: ParticipantSearchProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs],
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          className="h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        placeholder="Поиск по имени или email"
        className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
