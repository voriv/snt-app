'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * @component DocumentSearch
 * @category documents
 * @description Поле поиска документов с debounce 300ms
 *
 * @spec
 * - Debounce input (300ms) перед вызовом onSearch
 *
 * @traces US-22-05 AC-6, AC-7
 * @task DOCS-T4.2.3
 */
export function DocumentSearch({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [value, setValue] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onSearch(newValue);
      }, 300);
    },
    [onSearch],
  );

  const handleClear = useCallback(() => {
    setValue('');
    onSearch('');
  }, [onSearch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Поиск документов..."
        aria-label="Поиск по названию, описанию и тегам"
        className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          aria-label="Очистить поиск"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
