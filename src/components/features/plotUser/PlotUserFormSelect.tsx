'use client';

/**
 * @component PlotUserFormSelect
 * @category features
 * @description Компонент поиска и выбора пользователя или участка из списка
 *
 * @example
 * ```tsx
 * <PlotUserFormSelect
 *   label="Пользователь"
 *   items={users}
 *   searchPlaceholder="Поиск пользователя..."
 *   value={selectedUserId}
 *   onChange={handleUserIdChange}
 *   renderItem={(user) => `${user.email} ${user.firstName}`}
 *   getValue={(user) => user.id}
 * />
 * ```
 *
 * @spec
 * - OQ-4: Поддерживает поиск по началу строки (case-insensitive)
 * - Поддерживает "ленивый" выбор из большого списка
 * - Показывает пустое состояние если ничего не найдено
 * - Использует native select для доступности
 */

import { useState, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

/**
 * Props для PlotUserFormSelect
 */
export interface PlotUserFormSelectProps<TItem> {
  /** Метка поля */
  label: string;
  /** Полный список элементов */
  items: TItem[];
  /** Плейсхолдер для поиска */
  searchPlaceholder?: string;
  /** Выбранное значение (ID) */
  value: string;
  /** Обработчик изменения значения */
  onChange: (value: string) => void;
  /** Функция для отображения элемента (текст) */
  renderItem: (item: TItem) => string;
  /** Функция для получения ID элемента */
  getValue: (item: TItem) => string;
  /** Показывать ли плейсхолдер "Выберите..." */
  showPlaceholder?: boolean;
  /** Требуется ли обязательное поле */
  required?: boolean;
  /** Ошибка валидации */
  error?: string;
}

/**
 * @component
 */
export function PlotUserFormSelect<TItem>({
  label,
  items,
  searchPlaceholder = 'Поиск...',
  value,
  onChange,
  renderItem,
  getValue,
  showPlaceholder = true,
  required = false,
  error,
}: PlotUserFormSelectProps<TItem>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Фильтрация элементов по поисковому запросу
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) =>
      renderItem(item).toLowerCase().includes(query)
    );
  }, [items, searchQuery, renderItem]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  }, []);

  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
    setIsOpen(false);
    setSearchQuery('');
  }, [onChange]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Находим выбранный элемент
  const selectedItem = value ? items.find((item) => getValue(item) === value) : null;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Строка поиска и кнопки */}
      <div className="flex space-x-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleToggle}
            aria-haspopup="listbox"
          />
        </div>
        {selectedItem && (
          <button
            type="button"
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => {
              onChange('');
              setSearchQuery('');
            }}
          >
            Очистить
          </button>
        )}
      </div>

      {/* Выпадающий список */}
      {isOpen && (
        <div className="mt-1 relative">
          <div className="bg-white border border-gray-300 rounded-md shadow-sm max-h-60 overflow-auto">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                Ничего не найдено
              </div>
            ) : (
              <select
                className="w-full border-none rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
                style={{ maxHeight: '16rem' }}
                value={value}
                onChange={handleSelectChange}
                aria-label={label}
              >
                {showPlaceholder && (
                  <option value="">Выберите из списка...</option>
                )}
                {filteredItems.map((item) => (
                  <option key={getValue(item)} value={getValue(item)}>
                    {renderItem(item)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Ошибка валидации */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
