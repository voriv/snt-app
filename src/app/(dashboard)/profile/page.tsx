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
 * - При сохранении вызывает apiClient.put('/profile') (AC-3)
 * - При загрузке аватара вызывает apiClient.postFormData('/profile/avatar') (AC-5)
 * - При удалении аватара вызывает apiClient.delete('/profile/avatar') (AC-10)
 * - Отображает ThemeSelector для выбора темы оформления (AC-1, AC-2)
 * - При изменении темы вызывает apiClient.patch('/api/v1/profile/theme')
 * - Toast/уведомления об успехе/ошибке (AC-10)
 * - Загружает данные при монтировании (useEffect)
 * - Обрабатывает состояния: loading, error, saving
 *
 * @data-flow
 * - useSession() -> session
 * - useEffect -> apiClient.get('/profile') -> profile data
 * - handleSave -> apiClient.put('/profile', data) -> updated profile
 * - handleUploadAvatar -> apiClient.postFormData('/profile/avatar', formData) -> avatar URL
 * - handleDeleteAvatar -> apiClient.delete('/profile/avatar') -> success
 * - handleThemeSave -> apiClient.patch('/api/v1/profile/theme', { theme }) -> updated theme
 *
 * @Dependencies
 * - @/lib/api-client
 * - @/domains/userProfile/userProfile.types
 * - @/components/features/userProfile/ProfileCard
 * - @/components/features/userProfile/UserProfileForm
 * - @/components/features/userProfile/AvatarUpload
 * - @/components/features/userProfile/ThemeSelector
 * - next-auth/react (useSession)
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ProfileCard, UserProfileForm, AvatarUpload, ThemeSelector } from '@/components/features/userProfile';
import { UserProfileFormData } from '@/components/features/userProfile/UserProfileForm/UserProfileForm';
import type { UserProfileFull, Theme } from '@/domains/userProfile/userProfile.types';
import { apiClient } from '@/lib/api-client';
import { useTheme } from '@/hooks/useTheme';

export default function UserProfilePage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfileFull | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (sessionStatus === 'loading') return;

      if (!session?.user?.id) {
        router.replace('/login?callbackUrl=/dashboard/profile');
        return;
      }

      try {
        const response = await apiClient.get<UserProfileFull>('/profile');
        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          setError(response.error?.message || 'Не удалось загрузить профиль');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [session, sessionStatus, router]);

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

      const response = await apiClient.put<UserProfileFull>('/profile', updateData);
      if (response.success && response.data != null) {
        setProfile(response.data);
        setIsEditing(false);
      } else {
        setError(response.error?.message || 'Ошибка при сохранении профиля');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении профиля');
    } finally {
      setIsSaving(false);
    }
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
    setIsSavingTheme(true);
    try {
      const response = await apiClient.patch<{ theme: Theme }>('/profile/theme', { theme });
      if (response.success && response.data?.theme) {
        const newTheme = response.data.theme;
        setProfile(prev => prev ? { ...prev, theme: newTheme } : null);
        // Применяем тему к DOM и localStorage через единый источник истины
        setTheme(newTheme);
      } else {
        setError(response.error?.message || 'Ошибка при сохранении темы');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении темы');
    } finally {
      setIsSavingTheme(false);
    }
  }, [setTheme]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !profile) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="p-4 text-gray-600">Профиль не найден</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Профиль</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            Редактировать
          </button>
        )}
      </div>

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
            onCancel={() => setIsEditing(false)}
            isLoading={isSaving}
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

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
