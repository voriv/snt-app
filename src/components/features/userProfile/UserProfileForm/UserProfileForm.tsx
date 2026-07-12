/**
 * @component UserProfileForm
 * @category features
 * @description Форма редактирования профиля пользователя
 *
 * @example
 * ```tsx
 * <UserProfileForm
 *   initialData={{ firstName: 'Ivan', lastName: 'Ivanov', phone: '+79990000000', bio: '' }}
 *   onSave={handleSave}
 *   onCancel={handleCancel}
 * />
 * ```
 *
 * @spec
 * - Поля: firstName (optional, 2-50 символов или null), lastName (optional, 2-50 символов или null),
 *   middleName (optional, 2-50 символов или null), phone (optional), bio (optional, max 500 символов)
 * - Пустая строка для firstName/lastName трансформируется в null (BR-14)
 * - Поля firstName/lastName необязательны при обновлении (BR-1, BR-2)
 * - Валидация в реальном времени (показывать ошибки при invalid)
 * - При отправке вызывает onSave с валидированными данными
 * - При нажатии Cancel вызывает onCancel без сохранения
 * - Email отображается в disabled-режиме (AC-2.5)
 * - Индикатор загрузки при отправке формы
 * - Сообщения об успехе/ошибке через toast
 * - Доступность: aria-invalid, aria-describedby для ошибок
 */
'use client';

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardBody, CardFooter, Input, Button } from '@/components/ui';

/**
 * @type UserProfileFormData
 * @description Данные формы редактирования профиля
 * @spec
 * - Поля firstName/lastName опциональны (пустая строка преобразуется в null)
 * - Пустая строка трансформируется в null (BR-14)
 */
export interface UserProfileFormData {
  /** Имя - опциональное, 2-50 символов или null (BR-1, BR-2, BR-14) */
  firstName: string | null;
  /** Фамилия - опциональная, 2-50 символов или null (BR-1, BR-2, BR-14) */
  lastName: string | null;
  /** Отчество - опциональное, 2-50 символов или null */
  middleName?: string | null;
  /** Телефон - опциональный */
  phone?: string | null;
  /** Биография - опциональная, max 500 символов */
  bio?: string | null;
}

export interface UserProfileFormProps {
  /** Начальные данные формы */
  initialData: UserProfileFormData;
  /** Обработчик сохранения */
  onSave: (data: UserProfileFormData) => Promise<void>;
  /** Обработчик отмены */
  onCancel: () => void;
  /** Показывать ли индикатор загрузки */
  isLoading?: boolean;
  /** Email пользователя (для отображения в disabled-режиме, AC-2.5) */
  email?: string;
  /** Обработчик изменения данных формы (для отслеживания несохраненных изменений, AC-2.8) */
  onChange?: (field: keyof UserProfileFormData, value: string) => void;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  bio?: string;
}

/**
 * Валидация поля формы
 * @spec
 * - Пустая строка или null - поле опционально, валидация пропускается (BR-1, BR-2)
 * - Если значение указано: firstName/lastName/middleName - минимум 2 символа (BR-3, BR-4)
 * - Пустая строка трансформируется в null (BR-14)
 * - Биография - максимум 500 символов (AC-2.6)
 */
const validateField = (name: string, value: string | null | undefined): string | undefined => {
  // Пустая строка или null - поле опционально, валидация пропускается (BR-1, BR-2)
  if (!value || value === '') {
    return undefined;
  }
  
  // Для firstName, lastName, middleName проверяем длину если значение не пустое
  if (name === 'firstName' || name === 'lastName' || name === 'middleName') {
    if (value.length < 2) {
      return name === 'firstName'
        ? 'Имя должно содержать минимум 2 символа'
        : name === 'lastName'
          ? 'Фамилия должна содержать минимум 2 символа'
          : 'Отчество должно содержать минимум 2 символа';
    }
    if (value.length > 50) {
      return name === 'firstName'
        ? 'Имя не может превышать 50 символов'
        : name === 'lastName'
          ? 'Фамилия не может превышать 50 символов'
          : 'Отчество не может превышать 50 символов';
    }
  }
  
  // Для биографии проверяем максимум 500 символов (AC-2.6)
  if (name === 'bio') {
    if (value.length > 500) {
      return 'Биография не может превышать 500 символов';
    }
  }
  
  return undefined;
};

export function UserProfileForm({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
  email,
  onChange,
}: UserProfileFormProps) {
  const [formData, setFormData] = useState<UserProfileFormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Проверка наличия изменений относительно начальных данных
  const checkForChanges = useCallback((newData: UserProfileFormData) => {
    const hasAnyChange =
      (newData.firstName ?? '') !== (initialData.firstName ?? '') ||
      (newData.lastName ?? '') !== (initialData.lastName ?? '') ||
      (newData.middleName || '') !== (initialData.middleName || '') ||
      (newData.phone || '') !== (initialData.phone || '') ||
      (newData.bio || '') !== (initialData.bio || '');
    setHasChanges(hasAnyChange);
  }, [initialData]);

  const handleChange = useCallback((field: keyof UserProfileFormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      checkForChanges(newData);
      return newData;
    });
    
    if (touchedFields.has(field)) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error,
      }));
    }
    
    // Вызываем внешний обработчик для отслеживания изменений (AC-2.8)
    if (onChange) {
      onChange(field, value);
    }
  }, [touchedFields, onChange, checkForChanges]);

  const handleBlur = useCallback((field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    const error = validateField(field, formData[field as keyof UserProfileFormData] as string);
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация всех полей
    const newErrors: FormErrors = {};
    const fieldsToValidate: (keyof UserProfileFormData)[] = ['firstName', 'lastName', 'middleName'];
    
    for (const field of fieldsToValidate) {
      const value = formData[field];
      // Проверяем только если значение не пустое (BR-1, BR-2)
      if (value && value !== '') {
        const error = validateField(field, value);
        if (error) {
          newErrors[field] = error;
        }
      }
    }
    
    setErrors(newErrors);
    setTouchedFields(new Set(fieldsToValidate));
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    // Преобразуем пустые строки в null (BR-14)
    await onSave({
      firstName: formData.firstName === '' ? null : formData.firstName,
      lastName: formData.lastName === '' ? null : formData.lastName,
      middleName: formData.middleName || null,
      phone: formData.phone || null,
      bio: formData.bio || null,
    });
  }, [formData, onSave]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Редактирование профиля</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardBody>
          <div className="space-y-4">
            <Input
              label="Имя"
              id="firstName"
              value={formData.firstName ?? ''}
              onChange={(e) => handleChange('firstName', e.target.value)}
              onBlur={() => handleBlur('firstName')}
              error={touchedFields.has('firstName') ? errors.firstName : undefined}
              aria-invalid={touchedFields.has('firstName') && !!errors.firstName}
            />
            <Input
              label="Фамилия"
              id="lastName"
              value={formData.lastName ?? ''}
              onChange={(e) => handleChange('lastName', e.target.value)}
              onBlur={() => handleBlur('lastName')}
              error={touchedFields.has('lastName') ? errors.lastName : undefined}
              aria-invalid={touchedFields.has('lastName') && !!errors.lastName}
            />
            <Input
              label="Отчество"
              id="middleName"
              value={formData.middleName || ''}
              onChange={(e) => handleChange('middleName', e.target.value)}
              onBlur={() => handleBlur('middleName')}
              error={touchedFields.has('middleName') ? errors.middleName : undefined}
              aria-invalid={touchedFields.has('middleName') && !!errors.middleName}
            />
            {email && (
              <div className="w-full">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  aria-disabled="true"
                  className="block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 text-gray-500 px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-500">Email не редактируется</p>
              </div>
            )}
            <Input
              label="Телефон"
              id="phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+7 (999) 000-00-00"
            />
            <div className="w-full">
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                О себе
              </label>
              <textarea
                id="bio"
                rows={4}
                value={formData.bio || ''}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                placeholder="Расскажите о себе..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.bio?.length || 0}/500 символов
              </p>
            </div>
          </div>
        </CardBody>
        <CardFooter>
          <div className="flex justify-end space-x-3 w-full">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Сохранить
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
