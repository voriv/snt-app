'use client';

import React, { useState } from 'react';
import { useForm, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Alert } from '@/components/ui/alert';

// ================================
// Schemas
// ================================

/**
 * Schema для валидации данных профиля при обновлении
 * @public
 */
export const updateProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
  email: z.string().email('Некорректный email'),
  phone: z.string().optional(),
  avatarUrl: z.string().url('Некорректный URL аватара').optional(),
  member: z
    .object({
      surname: z.string().min(1, 'Фамилия обязательна').max(100, 'Фамилия слишком длинная'),
      firstName: z.string().min(1, 'Имя обязательно').max(100, 'Имя слишком длинное'),
      patronymic: z.string().max(100, 'Отчество слишком длинное').optional(),
      address: z.string().max(300, 'Адрес слишком длинный').optional(),
      snn: z.string().max(50, 'Именование СНТ слишком длинное').optional(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Интерфейс данных профиля
 * @public
 */
export interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  member: {
    surname: string;
    firstName: string;
    patronymic: string | null;
    address: string | null;
    snn: string | null;
  } | null;
}

export type MemberInput = {
  surname: string;
  firstName: string;
  patronymic?: string | null;
  address?: string | null;
  snn?: string | null;
};

/**
 * Входные данные для обновления профиля
 */
export type UpdateProfileInputData = {
  id: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  member?: MemberInput | null;
};

/**
 * Пропсы для компонента ProfileForm
 * @public
 */
export interface ProfileFormProps {
  /** Текущие данные профиля */
  profile?: ProfileData;
  /** Обработчик сохранения */
  onSubmit: (data: UpdateProfileInputData) => Promise<void>;
  /** Режим отображения: view | edit */
  mode?: 'view' | 'edit';
  /** Флаг загрузки */
  loading?: boolean;
}

// ================================
// Components
// ================================

/**
 * Типы для специализированных контроллеров
 */
type MemberFieldNames = 
  | 'member.surname'
  | 'member.firstName'
  | 'member.patronymic'
  | 'member.address'
  | 'member.snn';

/**
 * Компонент поля ввода с валидацией
 * @public
 */
function ProfileField({
  label,
  name,
  control,
  placeholder,
  rules,
  type = 'text',
}: {
  label: string;
  name: FieldPath<UpdateProfileInput>;
  control: any;
  placeholder?: string;
  rules?: any;
  type?: 'text' | 'tel' | 'url';
}) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue=""
      render={({ field, fieldState: { error } }) => (
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
          <input
            type={type}
            {...field}
            placeholder={placeholder}
            className={cn(
              'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20',
              error && 'border-red-500'
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
          />
          {error && (
            <p id={`${name}-error`} className="mt-1 text-xs text-red-500" role="alert">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}

/**
 * Компонент отображения данных в режиме просмотра
 * @public
 */
function ViewMode({ profile }: { profile: ProfileData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
          Email
        </label>
        <p className="rounded-lg bg-[var(--color-bg-secondary)] px-4 py-2 text-[var(--color-text-primary)]">
          {profile.email}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
          Имя
        </label>
        <p className="rounded-lg bg-[var(--color-bg-secondary)] px-4 py-2 text-[var(--color-text-primary)]">
          {profile.name || '—'}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
          Телефон
        </label>
        <p className="rounded-lg bg-[var(--color-bg-secondary)] px-4 py-2 text-[var(--color-text-primary)]">
          {profile.phone || '—'}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
          Роль
        </label>
        <p className="rounded-lg bg-[var(--color-bg-secondary)] px-4 py-2 text-[var(--color-text-primary)]">
          {profile.role}
        </p>
      </div>
    </div>
  );
}

/**
 * Компонент редактирования данных участника
 * @public
 */
function MemberFields({ control }: { control: any }) {
  const fields = [
    { name: 'member.surname' as MemberFieldNames, label: 'Фамилия', rules: { required: 'Фамилия обязательна' } },
    { name: 'member.firstName' as MemberFieldNames, label: 'Имя', rules: { required: 'Имя обязательно' } },
    { name: 'member.patronymic' as MemberFieldNames, label: 'Отчество' },
    { name: 'member.address' as MemberFieldNames, label: 'Адрес' },
    { name: 'member.snn' as MemberFieldNames, label: 'Именование СНТ' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map(({ name, label, rules }) => (
        <ProfileField
          key={name}
          label={label}
          name={name}
          control={control}
          rules={rules}
        />
      ))}
    </div>
  );
}

/**
 * Форма редактирования профиля пользователя
 *
 * @param props - Профпсы компонента
 * @public
 */
export function ProfileForm({ profile, onSubmit, mode = 'view', loading }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit');

  // Не инициализируем форму, если профиль не загружен
  if (!profile) {
    return null;
  }

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      id: profile.id,
      name: profile.name ?? '',
      email: profile.email,
      phone: profile.phone ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      member: profile.member
        ? {
            surname: profile.member.surname,
            firstName: profile.member.firstName,
            patronymic: profile.member.patronymic ?? '',
            address: profile.member.address ?? '',
            snn: profile.member.snn ?? '',
          }
        : undefined,
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setValue('name', profile.name ?? '');
    setValue('phone', profile.phone ?? '');
    setValue('avatarUrl', profile.avatarUrl ?? '');
    if (profile.member) {
      setValue('member', {
        surname: profile.member.surname,
        firstName: profile.member.firstName,
        patronymic: profile.member.patronymic ?? '',
        address: profile.member.address ?? '',
        snn: profile.member.snn ?? '',
      });
    } else {
      setValue('member', undefined);
    }
    setIsEditing(false);
  };

  const onSubmitForm = async (data: UpdateProfileInput) => {
    await onSubmit({
      id: data.id,
      name: data.name,
      phone: data.phone ?? null,
      avatarUrl: data.avatarUrl ?? null,
      member: data.member || null,
    });
    setIsEditing(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6" noValidate>
      {/* Аватар */}
      <div className="flex items-center gap-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt="Аватар"
            className="h-20 w-20 rounded-full object-cover border-2 border-[var(--color-border)]"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent)] text-2xl font-bold text-white">
            {profile.name?.charAt(0).toUpperCase() ?? profile.email.charAt(0).toUpperCase()}
          </div>
        )}

        {isEditing && (
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              URL аватара
            </label>
            <Controller
              name="avatarUrl"
              control={control}
              defaultValue=""
              render={({ field, fieldState: { error } }) => (
                <div>
                  <input
                    type="url"
                    {...field}
                    placeholder="https://example.com/avatar.jpg"
                    className={cn(
                      'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20',
                      error && 'border-red-500'
                    )}
                    aria-invalid={!!error}
                  />
                  {error && (
                    <p className="mt-1 text-xs text-red-500" role="alert">
                      {error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        )}
      </div>

      {/* Основная информация */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isEditing ? (
          <>
            <ProfileField
              label="Имя"
              name="name"
              control={control}
              rules={{ required: 'Имя обязательно' }}
            />
            <ProfileField
              label="Телефон"
              name="phone"
              control={control}
              type="tel"
              placeholder="+7XXXXXXXXXX"
            />
          </>
        ) : (
          <ViewMode profile={profile} />
        )}

        {/* Email не редактируется */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            Email
          </label>
          <p className="rounded-lg bg-[var(--color-bg-secondary)] px-4 py-2 text-[var(--color-text-primary)]">
            {profile.email}
          </p>
        </div>

        {/* Роль не редактируется */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
            Роль
          </label>
          <p className="rounded-lg bg-[var(--color-bg-secondary)] px-4 py-2 text-[var(--color-text-primary)]">
            {profile.role}
          </p>
        </div>
      </div>

      {/* Данные участника */}
      {profile.member && (
        <div className="rounded-lg border border-[var(--color-border)] p-4">
          <h3 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
            Данные участника
          </h3>
          {isEditing ? <MemberFields control={control} /> : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Фамилия
                </label>
                <p className="text-[var(--color-text-primary)]">{profile.member.surname}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Имя
                </label>
                <p className="text-[var(--color-text-primary)]">{profile.member.firstName}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Отчество
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {profile.member.patronymic || '—'}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Адрес
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {profile.member.address || '—'}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                  Именование СНТ
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {profile.member.snn || '—'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ошибки валидации */}
      {Object.keys(errors).length > 0 && (
        <Alert
          type="error"
          title="Ошибки валидации"
          message="Пожалуйста, исправьте ошибки в форме"
        />
      )}

      {/* Кнопки действий */}
      <div className="flex justify-end gap-3">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 font-medium text-white hover:bg-[var(--color-accent)]/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleEdit}
            disabled={loading}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 font-medium text-white hover:bg-[var(--color-accent)]/90 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Редактировать
          </button>
        )}
      </div>
    </form>
  );
}
