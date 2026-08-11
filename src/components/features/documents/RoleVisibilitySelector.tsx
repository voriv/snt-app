'use client';

import React, { useCallback } from 'react';

/**
 * @component RoleVisibilitySelector
 * @category documents
 * @description Чекбоксы выбора видимости документа по ролям
 *
 * @spec
 * - Чекбоксы: GUEST, MEMBER, ADMIN
 * - Минимум 1 роль должна быть выбрана
 * - Описание каждой роли
 *
 * @traces US-22-04 AC-3, US-22-07 AC-5
 * @task DOCS-T4.2.14
 */
export function RoleVisibilitySelector({
  value,
  onChange,
}: {
  value: string[];
  onChange: (roles: string[]) => void;
}) {
  const roles = [
    { id: 'GUEST', label: 'Гость', description: 'Минимальные права, только просмотр' },
    { id: 'MEMBER', label: 'Участник', description: 'Основные права участника СНТ' },
    { id: 'ADMIN', label: 'Администратор', description: 'Полный доступ к управлению' },
  ];

  const handleToggle = useCallback(
    (roleId: string) => {
      if (value.includes(roleId)) {
        const newValue = value.filter((r) => r !== roleId);
        // Минимум 1 роль должна быть выбрана
        if (newValue.length > 0) {
          onChange(newValue);
        }
      } else {
        onChange([...value, roleId]);
      }
    },
    [value, onChange],
  );

  return (
    <div className="space-y-3" role="group" aria-label="Видимость по ролям">
      <label className="block text-sm font-medium text-gray-700">
        Видимость документа
      </label>
      <p className="text-xs text-gray-500">
        Выберите роли, которые могут просматривать этот документ. Минимум одна роль обязательна.
      </p>

      <div className="space-y-2">
        {roles.map((role) => (
          <label
            key={role.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={value.includes(role.id)}
              onChange={() => handleToggle(role.id)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">{role.label}</span>
              <p className="text-xs text-gray-500">{role.description}</p>
            </div>
          </label>
        ))}
      </div>

      {value.length === 0 && (
        <p className="text-xs text-red-600" role="alert">
          Выберите хотя бы одну роль для доступа
        </p>
      )}

      {/* Выбранные роли */}
      <div className="flex flex-wrap gap-2">
        {value.map((roleId) => {
          const role = roles.find((r) => r.id === roleId);
          return (
            <span
              key={roleId}
              className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
            >
              {role?.label || roleId}
            </span>
          );
        })}
      </div>
    </div>
  );
}
