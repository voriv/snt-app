'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';

export default function LandingPage() {
  const router = useRouter();
  const { data: session, loading } = useSession();

  useEffect(() => {
    // AC-10.1.1: Перенаправление авторизованного пользователя на dashboard
    if (!loading && session) {
      router.replace('/dashboard');
    }
  }, [session, loading, router]);

  // AC-10.2.1: Обработка состояния загрузки
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  // AC-10.1.2: Landing page для неавторизованных пользователей
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            СНТ Берёзки-НТ
          </h1>
          <p className="text-lg text-gray-600 sm:text-xl">
            Система управления товариществом — централизованный портал для членов СНТ.
            Получайте информацию о членах, участках и платежах в одном месте.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors"
        >
          Войти в систему
        </Link>
      </div>
    </div>
  );
}
