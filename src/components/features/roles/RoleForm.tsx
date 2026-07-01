/**
 * @component RoleForm
 * @category features
 * @description Форма создания/редактирования роли
 *
 * @spec
 * - Поля: name (обязательное, 2-50 символов), description (опциональное, до 500 символов)
 * - При редактировании системной роли (isSystem=true) поле name disabled
 * - Валидация на стороне клиента перед отправкой
 * - Кнопка блокируется при isLoading, показывается спиннер
 * - При ошибке 409 (дублирование имени) отображается сообщение
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-3, FR-4, AC-3, AC-4, AC-15
 */
'use client';

import { useState, useEffect } from 'react';
import type { Role } from '@/domains/roles';
import { Button, Input } from '@/components/ui';

export interface RoleFormProps {
  /** Существующая роль для редактирования, null для создания */
  role?: Role | null;
  /** Колбэк при отправке формы */
  onSubmit: (data: { name: string; description?: string }) => void;
  /** Колбэк при отмене */
  onCancel?: () => void;
  /** Состояние загрузки — блокирует кнопку отправки */
  isLoading?: boolean;
  /** Сообщение об ошибке для отображения */
  error?: string | null;
}

export function RoleForm({
  role,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}: RoleFormProps): React.JSX.Element {
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  useEffect(() => {
    setName(role?.name ?? '');
    setDescription(role?.description ?? '');
    setNameError(null);
    setDescriptionError(null);
  }, [role]);

  const isSystem = role?.isSystem === true;

  const validateName = (value: string): string | null => {
    if (value.trim().length < 2) {
      return 'Имя роли должно содержать минимум 2 символа';
    }
    if (value.trim().length > 50) {
      return 'Имя роли не может превышать 50 символов';
    }
    return null;
  };

  const validateDescription = (value: string): string | null => {
    if (value.length > 500) {
      return 'Описание не может превышать 500 символов';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    const nErr = validateName(name);
    if (nErr) {
      setNameError(nErr);
      hasError = true;
    }

    const dErr = validateDescription(description);
    if (dErr) {
      setDescriptionError(dErr);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() ? description.trim() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Имя роли"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setNameError(null);
        }}
        disabled={isSystem || isLoading}
        error={nameError ?? undefined}
        placeholder="Например: CONTENT_EDITOR"
        required
      />
      {isSystem && (
        <p className="text-xs text-gray-500">
          Имя системной роли нельзя изменить
        </p>
      )}
      <div className="w-full">
        <label
          htmlFor="role-description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Описание
        </label>
        <textarea
          id="role-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setDescriptionError(null);
          }}
          disabled={isLoading}
          rows={3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
          placeholder="Краткое описание роли"
        />
        {descriptionError && (
          <p className="mt-1 text-sm text-red-600">{descriptionError}</p>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" isLoading={isLoading}>
          {role ? 'Сохранить' : 'Создать роль'}
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
