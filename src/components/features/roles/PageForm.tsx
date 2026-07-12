/**
 * @component PageForm
 * @category features
 * @description Форма создания/редактирования страницы реестра
 *
 * @spec
 * - Поля: path (обязательное, начинается с /, уникальное), title (обязательное, 2-100 символов),
 *   groupName (опциональное), sortOrder (число, по умолчанию 0), isActive (чекбокс, по умолчанию true)
 * - Валидация формата path на стороне клиента (regex ^/[a-z0-9-/]*$)
 * - Кнопка блокируется при isLoading
 * - При ошибке 409 (дублирование path) отображается сообщение
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-7, AC-8, AC-13, AC-14
 */
'use client';

import { useState, useEffect } from 'react';
import type { Page } from '@/domains/roles';
import { Button, Input } from '@/components/ui';

const PATH_REGEX = /^\/[a-z0-9\-/]*$/;

export interface PageFormProps {
  /** Существующая страница для редактирования, null для создания */
  page?: Page | null;
  /** Колбэк при отправке формы */
  onSubmit: (data: {
    path: string;
    title: string;
    groupName?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => void;
  /** Колбэк при отмене */
  onCancel?: () => void;
  /** Состояние загрузки */
  isLoading?: boolean;
  /** Сообщение об ошибке */
  error?: string | null;
}

export function PageForm({
  page,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}: PageFormProps): React.JSX.Element {
  const [path, setPath] = useState(page?.path ?? '');
  const [title, setTitle] = useState(page?.title ?? '');
  const [groupName, setGroupName] = useState(page?.groupName ?? '');
  const [sortOrder, setSortOrder] = useState(page?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(page?.isActive ?? true);
  const [pathError, setPathError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    setPath(page?.path ?? '');
    setTitle(page?.title ?? '');
    setGroupName(page?.groupName ?? '');
    setSortOrder(page?.sortOrder ?? 0);
    setIsActive(page?.isActive ?? true);
    setPathError(null);
    setTitleError(null);
  }, [page]);

  const validatePath = (value: string): string | null => {
    if (!value.trim()) {
      return 'Путь обязателен';
    }
    if (!PATH_REGEX.test(value)) {
      return 'Путь должен начинаться с / и содержать только строчные буквы, цифры, дефисы и слэши';
    }
    return null;
  };

  const validateTitle = (value: string): string | null => {
    if (value.trim().length < 2) {
      return 'Заголовок должен содержать минимум 2 символа';
    }
    if (value.trim().length > 100) {
      return 'Заголовок не может превышать 100 символов';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    const pErr = validatePath(path);
    if (pErr) {
      setPathError(pErr);
      hasError = true;
    }

    const tErr = validateTitle(title);
    if (tErr) {
      setTitleError(tErr);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    onSubmit({
      path: path.trim(),
      title: title.trim(),
      groupName: groupName.trim() ? groupName.trim() : undefined,
      sortOrder,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Путь"
        value={path}
        onChange={(e) => {
          setPath(e.target.value);
          setPathError(null);
        }}
        disabled={isLoading}
        error={pathError ?? undefined}
        placeholder="/dashboard/plots"
        required
      />
      <Input
        label="Заголовок"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setTitleError(null);
        }}
        disabled={isLoading}
        error={titleError ?? undefined}
        placeholder="Члены СНТ"
        required
      />
      <Input
        label="Группа (опционально)"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        disabled={isLoading}
        placeholder="Основное"
      />
      <Input
        label="Порядок сортировки"
        type="number"
        value={sortOrder}
        onChange={(e) => setSortOrder(Number(e.target.value))}
        disabled={isLoading}
        min={0}
      />
      <div className="flex items-center">
        <input
          id="page-is-active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          disabled={isLoading}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
        />
        <label
          htmlFor="page-is-active"
          className="text-sm font-medium text-gray-700 cursor-pointer"
        >
          Активна
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" isLoading={isLoading}>
          {page ? 'Сохранить' : 'Создать страницу'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
}
