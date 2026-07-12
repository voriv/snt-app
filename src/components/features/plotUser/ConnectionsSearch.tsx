/**
 * @component ConnectionsSearch
 * @category features
 * @description Поле поиска связей по номеру участка или адресу
 *
 * @example
 * ```tsx
 * <ConnectionsSearch
 *   value={search}
 *   onChange={handleChange}
 *   onClear={handleClear}
 * />
 * ```
 *
 * @spec
 * - Placeholder: "Поиск по номеру участка или адресу"
 * - Debounce 300ms (OQ-6) — обрабатывается родителем
 * - Кнопка очистки (×)
 * - aria-describedby для доступности
 *
 * @see US-19-3 FR-5 (поиск)
 * @see US-19-3 AC-5.1 (поле поиска)
 */
'use client';

import { Input } from '@/components/ui/Input';

export interface ConnectionsSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function ConnectionsSearch({
  value,
  onChange,
  onClear,
}: ConnectionsSearchProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    onClear();
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Поиск по номеру участка или адресу"
        value={value}
        onChange={handleChange}
        aria-label="Поиск по номеру участка или адресу"
        aria-describedby="search-help"
        className="w-64"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Очистить поиск"
        >
          ×
        </button>
      )}
      <span id="search-help" className="sr-only">
        Введите номер участка или адрес для поиска
      </span>
    </div>
  );
}
