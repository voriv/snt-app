/**
 * @component UserSearch
 * @category features/users
 * @description Поле поиска пользователей с debounce
 *
 * @example
 * ```tsx
 * <UserSearch onSearch={handleSearch} />
 * ```
 *
 * @spec
 * - Input поле с debounce 300ms
 * - Callback onSearch(query: string) при изменении после debounce
 * - Очистка поиска по кнопке X
 * - Placeholder «Поиск по email, имени, фамилии...»
 *
 * @see docs/user-stories/US-20-02-поиск-и-сортировка-пользователей.md
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';

/**
 * @interface UserSearchParams
 * @description Props для компонента UserSearch
 */
export interface UserSearchParams {
  /** Callback при изменении текста поиска (после debounce) */
  onSearch: (query: string) => void;
}

const DEBOUNCE_MS = 300;

export function UserSearch({ onSearch }: UserSearchParams): ReactElement {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current) {
      globalThis.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      clearPendingTimer();
      timerRef.current = setTimeout(() => {
        onSearch(newValue);
      }, DEBOUNCE_MS);
    },
    [onSearch, clearPendingTimer],
  );

  const handleClear = useCallback(() => {
    setValue('');
    clearPendingTimer();
    onSearch('');
  }, [onSearch, clearPendingTimer]);

  useEffect(() => {
    return () => {
      clearPendingTimer();
    };
  }, [clearPendingTimer]);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Поиск по email, имени, фамилии..."
        className="w-full px-4 py-2 pl-10 pr-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        aria-label="Поиск пользователей"
      />
      {/* Search icon */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Очистить поиск"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
