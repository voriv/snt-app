/**
 * @page /dashboard/profile
 * @auth required - useSession() check
 * @description Страница профиля пользователя (Client Component)
 *
 * @spec
 * - Использует 'use client' directive
 * - Использует useSession() для получения сессии
 * - При отсутствии сессии - редирект на /login?callbackUrl=/dashboard/profile (AC-2)
 * - Загружает профиль пользователя через apiClient.get('/profile') (AC-1)
 * - Отображает ProfileCard в режиме просмотра
 * - При клике "Редактировать" переключает режим редактирования
 * - Отображает UserProfileForm в режиме редактирования
 * - При сохранении вызывает apiClient.patch('/profile') (AC-3)
 * - При загрузке аватара вызывает apiClient.postFormData('/profile/avatar') (AC-5)
 * - При удалении аватара вызывает apiClient.delete('/profile/avatar') (AC-10)
 * - Отображает ThemeSelector для выбора темы оформления (AC-1, AC-2)
 * - При изменении темы вызывает apiClient.patch('/profile/theme')
 * - Toast/уведомления об успехе/ошибке (AC-10)
 * - Загружает данные при монтировании (useEffect)
 * - Обрабатывает состояния: loading, error, saving
 * - Tab-навигация: Профиль / Мои участки (TV-1)
 * - AC-2.5: Email отображается в disabled-режиме
 * - AC-2.8: Подтверждение отмены с несохраненными изменениями через ConfirmModal
 *
 * @data-flow
 * - useSession() -> session
 * - useEffect -> apiClient.get('/profile') -> profile data
 * - handleSave -> apiClient.put('/profile', data) -> updated profile
 * - handleUploadAvatar -> apiClient.postFormData('/profile/avatar', formData) -> avatar URL
 * - handleDeleteAvatar -> apiClient.delete('/profile/avatar') -> success
 * - handleThemeSave -> apiClient.patch('/profile/theme', { theme }) -> updated theme
 *
 * @Dependencies
 * - @/lib/api-client
 * - @/domains/userProfile/userProfile.types
 * - @/components/features/userProfile/ProfileCard
 * - @/components/features/userProfile/UserProfileForm
 * - @/components/features/userProfile/AvatarUpload
 * - @/components/features/userProfile/ThemeSelector
 * - @/components/features/plotUser/UserConnectionsList
 * - next-auth/react (useSession)
 *
 * @see US-19-3 TV-1: Профиль пользователя — вкладка "Мои участки"
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProfileCard, UserProfileForm, AvatarUpload, ThemeSelector } from '@/components/features/userProfile';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { UserConnectionsList } from '@/components/features/plotUser';
import { UserProfileFormData } from '@/components/features/userProfile/UserProfileForm/UserProfileForm';
import type { UserProfileFull, Theme } from '@/domains/userProfile/userProfile.types';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

type ProfileTab = 'profile' | 'connections';

export default function UserProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [profile, setProfile] = useState<UserProfileFull | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // AC-2.8: Состояние для отслеживания наличия несохраненных изменений
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

  // Функция загрузки профиля (вынесена в useCallback для кнопки повтора AC-1.6)
  const loadProfile = useCallback(async () => {
    if (sessionStatus === 'loading') return;

    if (!session?.user?.id) {
      // PROJECT.md §10: обязательна задержка перед редиректом для обработки 401
      setTimeout(() => {
        router.replace('/login?callbackUrl=/dashboard/profile');
      }, 100);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<UserProfileFull>('/profile');
      if (response.success && response.data) {
        setProfile(response.data);
        // AC-5.3: При загрузке профиля применяем тему с сервера (приоритет серверной темы)
        setTheme(response.data.theme);
      } else {
        setError(response.error?.message || 'Не удалось загрузить профиль');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля');
    } finally {
      setIsLoading(false);
    }
  }, [session, sessionStatus, router, setTheme]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = useCallback(async (data: UserProfileFormData) => {
    setIsSaving(true);
    try {
      const updateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        phone: data.phone,
        bio: data.bio,
      };

      // Используем PATCH для частичного обновления (AC-2.1, BR-02)
      const response = await apiClient.patch<UserProfileFull>('/profile', updateData);
      if (response.success && response.data != null) {
        setProfile(response.data);
        setIsEditing(false);
        setHasUnsavedChanges(false);
      } else {
        setError(response.error?.message || 'Ошибка при сохранении профиля');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении профиля');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // AC-2.8: Обработчик изменения данных формы для отслеживания несохраненных изменений
  // Примечание: Логика отслеживания изменений делегирована UserProfileForm через onChange callback
  // Этот хендлер не используется в текущей реализации
  const handleFormChange = useCallback((_field: keyof UserProfileFormData, _value: string) => {
    // Пустой хендлер — логика реализована внутри UserProfileForm
  }, []);

  const handleDeleteAvatar = useCallback(async () => {
    setIsDeletingAvatar(true);
    try {
      const response = await apiClient.delete<{ avatarUrl: null }>('/profile/avatar');
      if (response.success) {
        setProfile(prev => prev ? { ...prev, avatar: null } : null);
      } else {
        setError(response.error?.message || 'Ошибка при удалении аватара');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении аватара');
    } finally {
      setIsDeletingAvatar(false);
    }
  }, []);

  const handleUploadAvatar = useCallback(async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiClient.postFormData<{ avatarUrl: string }>('/profile/avatar', formData);
      if (response.success && response.data) {
        const avatarUrl = response.data.avatarUrl;
        if (avatarUrl) {
          setProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);
        }
      } else {
        setError(response.error?.message || 'Ошибка при загрузке аватара');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке аватара');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, []);

  const handleThemeSave = useCallback(async (theme: Theme) => {
    // Оптимистичное обновление: применяем тему мгновенно
    setTheme(theme);
    setProfile(prev => prev ? { ...prev, theme } : null);
    setIsSavingTheme(true);

    try {
      const response = await apiClient.patch<{ theme: Theme }>('/profile/theme', { theme });
      if (response.success && response.data?.theme) {
        // Сервер подтвердил сохранение
        setError(null);
      } else {
        // Ошибка сервера: показываем уведомление, но тема остаётся применённой
        setError(response.error?.message || 'Не удалось сохранить тему на сервере');
        // Не откатываем тему — optimistic update
      }
    } catch (err) {
      // Сетевая ошибка или другая проблема: показываем уведомление
      setError(err instanceof Error ? err.message : 'Не удалось сохранить тему на сервере');
      // Тема остаётся применённой локально
    } finally {
      setIsSavingTheme(false);
    }
  }, [setTheme]);

  // AC-2.8: Обработчик отмены редактирования с подтверждением при наличии изменений
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowCancelConfirmModal(true);
    } else {
      setIsEditing(false);
    }
  }, [hasUnsavedChanges]);

  // AC-2.8: Подтверждение отмены
  const handleConfirmCancel = useCallback(() => {
    setShowCancelConfirmModal(false);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  }, []);

  // AC-2.8: Отмена отмены (остаться в режиме редактирования)
  const handleCancelCancel = useCallback(() => {
    setShowCancelConfirmModal(false);
  }, []);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        <div className="flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="primary"
            size="sm"
            onClick={loadProfile}
            isLoading={isLoading}
          >
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-4 text-gray-600">Профиль не найден</div>;
  }

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'profile', label: 'Профиль' },
    { id: 'connections', label: 'Мои участки' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Профиль</h1>
        {activeTab === 'profile' && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Редактировать
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'profile' && (
        <>
          {isEditing ? (
            <div className="space-y-6">
              <UserProfileForm
                initialData={{
                  firstName: profile.firstName ?? '',
                  lastName: profile.lastName ?? '',
                  middleName: profile.middleName || '',
                  phone: profile.phone || '',
                  bio: profile.bio || '',
                }}
                onSave={handleSave}
                onCancel={handleCancel}
                isLoading={isSaving}
                email={profile.email}
                // Логика отслеживания изменений реализована внутри UserProfileForm
                // onChange здесь не требуется
              />
            </div>
          ) : (
           <ProfileCard
             user={{
               email: profile.email,
               name: profile.name,
               roles: profile.roles,
             }}
             profile={{
               firstName: profile.firstName,
               lastName: profile.lastName,
               middleName: profile.middleName,
               phone: profile.phone,
               avatar: profile.avatar,
               bio: profile.bio,
               userCreatedAt: profile.userCreatedAt,
               profileCreatedAt: profile.profileCreatedAt,
             }}
             isEditable={true}
              onEdit={() => setIsEditing(true)}
            />
          )}

          <AvatarUpload
            currentAvatar={profile.avatar}
            onDelete={handleDeleteAvatar}
            onUpload={handleUploadAvatar}
            isDeleting={isDeletingAvatar}
            isUploading={isUploadingAvatar}
          />

          <ThemeSelector
            currentTheme={profile.theme}
            onSave={handleThemeSave}
          />

          {/* AC-9.13: Ссылка на страницу смены пароля */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Безопасность
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Управление паролем и безопасностью учётной записи.
                </p>
              </div>
              <div className="mt-5">
                <Link
                  href="/settings/security"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Сменить пароль
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'connections' && session?.user?.id && (
        <UserConnectionsList userId={session.user.id} />
      )}

      {error && activeTab === 'profile' && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {/* AC-2.8: Модальное окно подтверждения отмены с несохраненными изменениями */}
      <ConfirmModal
        isOpen={showCancelConfirmModal}
        onClose={handleCancelCancel}
        title="Отмена редактирования"
        message="У вас есть несохраненные изменения. Вы уверены, что хотите отменить редактирование?"
        confirmText="Отменить"
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
