'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ProfileForm } from '@/components/ui/profile-form';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Spinner } from '@/components/ui/spinner';
import { Alert } from '@/components/ui/alert';
import type { Session } from 'next-auth';
import type { ProfileData, UpdateProfileInputData } from '@/components/ui/profile-form';

/**
 * Страница профиля пользователя.
 * 
 * @remarks
 * - Требует аутентификации
 * - Отображает данные профиля и позволяет редактировать
 * - Redirect на /login если пользователь не авторизован
 * @public
 */
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    // Перенаправление если не авторизован
    if (status === 'unauthenticated') {
      const redirectPath = pathname || '/profile';
      router.push(`/login?callbackUrl=${encodeURIComponent(redirectPath)}`);
      return;
    }

    // Загрузка данных профиля когда сессия доступна
    if (status === 'authenticated' && session?.user?.id) {
      fetchProfile(session.user.id);
    }
  }, [status, session?.user?.id, pathname, router]);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Получаем данные профиля из API
      const response = await fetch(`/api/profile/${userId}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется авторизация');
        }
        if (response.status === 404) {
          throw new Error('Профиль не найден');
        }
        throw new Error('Ошибка загрузки профиля');
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Превращаем данные из API в формат ProfileData
      const data: ProfileData = {
        id: result.data.id,
        email: result.data.email,
        name: result.data.name ?? null,
        phone: result.data.phone ?? null,
        avatarUrl: result.data.avatarUrl ?? null,
        role: result.data.role ?? 'member',
        member: result.data.member ?? null,
      };

      setProfileData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль');
      console.error('Ошибка загрузки профиля:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (data: UpdateProfileInputData) => {
    if (!profileData) return;
    
    try {
      setLoading(true);
      setError(null);

      // Отправка обновлённых данных на сервер
      const response = await fetch(`/api/profile/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || 'Ошибка сохранения профиля');
      }

      // Обновляем локальные данные - сохраняем email и role
      setProfileData({
        ...profileData,
        name: data.name,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        member: data.member || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить профиль');
      console.error('Ошибка обновления профиля:', err);
    } finally {
      setLoading(false);
    }
  };

  // Показываем спиннер пока загружается сессия или данные
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Показываем ошибку если она произошла
  if (error) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Alert type="error" title="Ошибка" message={error} />
      </main>
    );
  }

  // Рендерим профиль если данные загружены
  if (!profileData) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Alert type="info" title="Загрузка" message="Загрузка данных профиля..." />
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Профиль пользователя</h1>
        <p className="text-muted-foreground">
          Просмотр и редактирование информации о вашем профиле
        </p>
      </div>

      <section aria-label="Profile information" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая колонка — Аватар и темы */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h2 className="text-xl font-semibold mb-4">Аватар</h2>
            <div className="flex flex-col items-center">
              {profileData.avatarUrl ? (
                <img
                  src={profileData.avatarUrl}
                  alt={`Аватар пользователя ${profileData.name}`}
                  className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-primary/20"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center mb-4 text-4xl font-bold text-muted-foreground">
                  {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <button className="btn btn-outline">
                Сменить аватар
              </button>
            </div>
          </div>

          {/* Переключатель темы */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h2 className="text-xl font-semibold mb-4">Внешний вид</h2>
            <ThemeToggle />
          </div>
        </div>

        {/* Правая колонка — Форма профиля */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold">Информация о профиле</h2>
            </div>

            <div className="p-6">
              <ProfileForm
                profile={profileData}
                onSubmit={handleUpdateProfile}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
