/**
 * @page /dashboard/profile
 * @auth required
 * @description Страница профиля пользователя
 *
 * @spec
 * - SSR: получает session на сервере
 * - Загружает профиль через API
 * - Отображает ProfileCard в режиме просмотра
 * - Кнопка "Редактировать" переключает режим редактирования
 * - В режиме редактирования показывает UserProfileForm
 * - Загрузка: через Suspense + loading.tsx
 * - Ошибки: через error.tsx
 * - При отсутствии профиля — создает его автоматически
 * - Toast уведомления об успехе/ошибке
 */
'use client';

import { useState, useEffect } from 'react';
import { ProfileCard, UserProfileForm, AvatarUpload } from '@/components/features/userProfile';
import { UserProfileFormData } from '@/components/features/userProfile/UserProfileForm/UserProfileForm';
import type { UserProfileFull } from '@/domains/userProfile/userProfile.types';
import type { Session } from 'next-auth';
import { apiClient } from '@/lib/api-client';

interface UserProfilePageClientProps {
  session: Session;
}

export default function UserProfilePageClient({ session }: UserProfilePageClientProps) {
  const [profile, setProfile] = useState<UserProfileFull | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get<UserProfileFull>('/api/v1/profile');
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

    fetchProfile();
  }, []);

  const handleSave = async (data: UserProfileFormData) => {
    setIsSaving(true);
    try {
      // Map form data to API update format
      const updateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        phone: data.phone,
        bio: data.bio,
      };
      
      const response = await apiClient.put<UserProfileFull>('/api/v1/profile', updateData);
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
  };

  const handleDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    try {
      const response = await apiClient.delete<{ avatarUrl: null }>('/api/v1/profile/avatar');
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
  };

  const handleUploadAvatar = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiClient.postFormData<{ avatarUrl: string }>('/api/v1/profile/avatar', formData);
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
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Загрузка...</div>;
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
              firstName: profile.firstName,
              lastName: profile.lastName,
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

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
