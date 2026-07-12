# US-5: Гибридная клиентская аутентификация - План реализации

## Описание задачи
Переход с серверной аутентификации (middleware) на клиентскую с использованием `useSession()` из next-auth/react.

## Требуемые изменения

### 1. Создание функции getSession для App Router
**Файл:** `src/lib/auth.ts` (дописать функцию)

Добавить функцию getSession, которая будет использоваться в middleware:

```typescript
/**
 * Получить сессию серверного компонента
 * @param request - NextRequest объект
 * @returns Session | null
 */
export async function getSession(request: NextRequest) {
  const session = await authOptions.callbacks.session?.({
    session: { user: {} as Session['user'] },
    token: await authOptions.callbacks.jwt?.({ token: {} as any, user: undefined }),
  });
  return session;
}
```

### 2. Создание файла middleware.ts с защитой маршрутов
**Файл:** `src/middleware.ts`

```typescript
/**
 * @file src/middleware.ts
 * @description Middleware для защиты роутов и управления перенаправлениями
 * @spec
 * - Защищает маршруты /dashboard, /api/v1/* (кроме /api/v1/auth/register)
 * - Перенаправляет неавторизованных пользователей на /login
 * - Перенаправляет авторизованных пользователей с /login и /register на /dashboard
 * - Использует next-auth session API для проверки аутентификации
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/api/v1'];
const publicRoutes = ['/', '/login', '/register'];
const apiAuthRoutes = ['/api/auth'];

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  
  const isApiAuthRoute = apiAuthRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) && !pathname.startsWith('/api/auth')
  );
  
  const session = await getSession(request);
  const isAuthenticated = !!session;
  
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### 3. Обновление dashboard/layout.tsx
**Файл:** `src/app/dashboard/layout.tsx`

Превратить в Client Component:

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layouts';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (status === 'unauthenticated') {
      const callbackUrl = window.location.pathname;
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, router]);

  // Показываем спиннер во время проверки сессии
  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <AppLayout session={session}>{children}</AppLayout>;
}
```

### 4. Обновление login/page.client.tsx
**Файл:** `src/app/(public)/login/page.client.tsx`

Превратить в Client Component с использованием `useSearchParams`:

```typescript
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginFormDataComponent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const isRegistered = searchParams?.get('registered') === 'true';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showFlashMessage, setShowFlashMessage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setShowFlashMessage(isRegistered);
  }, [isRegistered]);

  const handleInputChange = () => {
    setError({});
    if (isRegistered) {
      setShowFlashMessage(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: LoginErrors = {};

    if (!email) {
      errors.email = 'Email обязателен';
    } else if (!isValidEmail(email)) {
      errors.email = 'Некорректный email';
    }

    if (!password) {
      errors.password = 'Пароль обязателен';
    }

    if (Object.keys(errors).length > 0) {
      setError(errors);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password: password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError({ general: 'Неверный email или пароль' });
        setIsLoading(false);
      } else {
        window.location.href = callbackUrl;
      }
    } catch (err) {
      setError({ general: 'Произошла ошибка при входе. Попробуйте позже.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Войдите в свой аккаунт для доступа к панели управления
          </p>
        </div>

        {showFlashMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Успешная регистрация!</strong>
            <span className="block sm:inline"> Теперь войдите в систему.</span>
            <button
              type="button"
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setShowFlashMessage(false)}
            >
              <span className="sr-only">Закрыть</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {error.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Ошибка!</strong>
            <span className="block sm:inline"> {error.general}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  handleInputChange();
                }}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  error.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Email"
              />
              {error.email && (
                <p className="mt-1 text-sm text-red-600">{error.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }}
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  error.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Пароль"
              />
              {error.password && (
                <p className="mt-1 text-sm text-red-600">{error.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Обработка...
                </>
              ) : (
                'Войти'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Нет аккаунта?{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Зарегистрироваться
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 5. Проверка и обновление SessionWrapper
**Файл:** `src/app/dashboard/session-wrapper.tsx`

Этот файл должен быть удален или обновлен. SessionProvider должен быть добавлен в AppLayout или DashboardLayout.

### 6. Проверка AppLayout.tsx
**Файл:** `src/components/layouts/AppLayout.tsx`

Проверить, что компонент принимает session и передает его в Navbar:

```typescript
'use client';

import { Navbar } from '@/components/layouts/Navbar';
import { Session } from 'next-auth';

export interface AppLayoutProps {
  children: React.ReactNode;
  session: Session | null;
}

export function AppLayout({ children, session }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />
      <main className="py-6">
        {children}
      </main>
    </div>
  );
}
```

### 7. Проверка Navbar.tsx
**Файл:** `src/components/layouts/Navbar.tsx`

Проверить, что компонент получает session через props и использует useSession в реальном времени.

### 8. Аудит и удаление middleware.ts
- Удалить файл `src/middleware.ts` после подтверждения, что все protected routes защищены через DashboardLayout
- Удалить из `next.config.ts` любые упоминания middleware

### 9. Обновление next.config.ts
**Файл:** `src/middleware.ts` (проверить, нет ли настроек middleware)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Если понадобятся новые функции React
  },
  transpilePackages: ["archive"],
};

export default nextConfig;
```

### 10. Тестирование

1. **Запуск разработки:** `npm run dev`
2. **Проверка:**
   - Открыть `/login` - должна работать форма входа
   - Попробовать войти с неверными данными - показать ошибку
   - Войти с верными данными - перенаправить на `/dashboard`
   - Открыть `/dashboard` без сессии - перенаправить на `/login`
   - Открыть `/login` с сессией - перенаправить на `/dashboard`
   - Проверить logout - должно перенаправлять на `/`

## Чек-лист выполнения

- [ ] Создать getSession функцию в src/lib/auth.ts
- [ ] Создать src/middleware.ts с логикой защиты
- [ ] Преобразовать src/app/dashboard/layout.tsx в Client Component
- [ ] Обновить src/app/(public)/login/page.client.tsx для использования useSearchParams
- [ ] Удалить или обновить src/app/dashboard/session-wrapper.tsx
- [ ] Убедиться, что AppLayout.tsx передает session в Navbar
- [ ] Убедиться, что Navbar.tsx правильно использует session
- [ ] Удалить src/middleware.ts если middleware не используется
- [ ] Проверить next.config.ts на наличие middleware настроек
- [ ] Протестировать всю цепочку аутентификации
- [ ] Запустить `npm run build` и убедиться, что сборка проходит без ошибок
- [ ] Запустить `npm run dev` и убедиться, что приложение работает корректно

## Возможные проблемы и решения

### Проблема: Middleware конфликтует с DashboardLayout
**Решение:** Либо удалить middleware, либо адаптировать логику в middleware для проверки сессии на клиенте

### Проблема: Callback URL не работает
**Решение:** Убедиться, что callbackUrl передается правильно в signIn и сохраняется в сессии

### Проблема: Infinite redirect loop
**Решение:** Проверить условия перенаправления в middleware и DashboardLayout

### Проблема: Session не загружается
**Решение:** Проверить SessionProvider в правильном месте и корректность конфигурации next-auth

## Итоговый результат
После выполнения всех пунктов будет обеспечена:
- Клиентская аутентификация через useSession
- Защита маршрутов через Client Component в DashboardLayout
- Правильная работа формы входа с обработкой ошибок
- Корректные редиректы при отсутствии/наличии сессии
- Отсутствие серверной middleware защиты
