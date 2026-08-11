'use client';

import React, { useState, useCallback, useRef } from 'react';

/**
 * @component TagInput
 * @category documents
 * @description Компонент ввода тегов для документов
 *
 * @spec
 * - Enter для добавления, × для удаления
 * - max 10 тегов, max 50 символов
 * - Отображение тегов как чипсов
 *
 * @traces US-22-04 AC-4, US-22-07 AC-3, AC-4
 * @task DOCS-T4.2.13
 */
export function TagInput({
  value,
  onChange,
  maxTags = 10,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault();
        const trimmed = inputValue.trim().slice(0, 50);

        if (value.length >= maxTags) {
          setError(`Максимум ${maxTags} тегов`);
          return;
        }

        if (trimmed.length > 50) {
          setError('Тег не может превышать 50 символов');
          return;
        }

        if (!value.includes(trimmed)) {
          onChange([...value, trimmed]);
          setInputValue('');
          setError(null);
        } else {
          setError('Такой тег уже существует');
        }
      }
      if (e.key === 'Backspace' && !inputValue && value.length > 0) {
        onChange(value.slice(0, -1));
      }
    },
    [inputValue, value, onChange, maxTags],
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange],
  );

  return (
    <div className="space-y-2" role="group" aria-label="Ввод тегов">
      <label className="block text-sm font-medium text-gray-700">
        Теги
      </label>

      {/* Список тегов */}
      <div className="flex flex-wrap gap-2 rounded-md border border-gray-300 px-3 py-2 min-h-[42px]">
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-sm text-blue-700"
            role="listitem"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-blue-500 hover:bg-blue-100 hover:text-blue-700"
              aria-label={`Удалить тег ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        {/* Поле ввода */}
        {value.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? 'Введите тег и нажмите Enter' : ''}
            className="flex-1 min-w-[120px] bg-transparent focus:outline-none text-sm"
            aria-label="Новый тег"
            maxLength={50}
          />
        )}
      </div>

      {/* Подсказка */}
      <p className="text-xs text-gray-500">
        {value.length}/{maxTags} тегов • Enter для добавления, Backspace для удаления
      </p>

      {/* Ошибка */}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
