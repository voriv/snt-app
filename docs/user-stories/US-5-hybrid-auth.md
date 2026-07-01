# US-5: Гибридная клиентская аутентификация

## Описание
Переключение с Server-side аутентификации на Client-side (CSR) для поддержки гибридной архитектуры с API Routes в Next.js.

## Контекст
Текущая архитектура использует:
- **Middleware** для защиты роутов (`middleware.ts`)
- **Server Components** для проверки сессии (`getServerSession()`)

Для упрощения архитектуры и удаления Server Components требуется:
1. Удалить Middleware
2. Перенести все проверки аутентификации на Client-side
3. Сохранить API Routes в Next.js

## User Story
**Как** разработчик  
**Я хочу** убрать Server-side проверки аутентификации и middleware  
**Чтобы** упростить архитектуру и использовать только Client Components

---

## Акцептанс критерии

### AC-1: Middleware удалён
- [ ] Файл `src/middleware.ts` удалён
- [ ] Импорты из `middleware.ts` удалены из всех файлов
- [ ] `matcher` конфигурация удалена из `next.config.ts`

### AC-2: Dashboard Layout — Client Component
- [ ] `src/app/dashboard/layout.tsx` преобразован в Client Component (`'use client'`)
- [ ] `getServerSession()` заменён на `useSession()` из `next-auth/react`
- [ ] Спиннер загрузки показывается до проверки сессии
- [ ] Неавторизованные пользователи перенаправляются на `/login`

### AC-3: Auth Guard Component
- [ ] Создан компонент `src/components/features/auth/AuthGuard.tsx`
- [ ] `AuthGuard` проверяет `status` сессии из `useSession()`
- [ ] При `status === 'loading'` — показывает спиннер
- [ ] При `status === 'unauthenticated'` — перенаправляет на `/login`
- [ ] `AuthGuard` используется для защиты приватных страниц

### AC-4: Login Page — Client Component
- [ ] `src/app/(public)/login/page.tsx` преобразован в Client Component
- [ ] `searchParams` читаются через `useSearchParams()`
- [ ] Callback URL берётся из URL query parameters
- [ ] Flash-сообщения отображаются при `registered=true`

### AC-5: Registration Page — Client Component
- [ ] `src/app/(public)/register/page.tsx` остаётся Client Component (`'use client'`)
- [ ] Валидация формы работает на клиенте
- [ ] POST запрос на `/api/v1/auth/register`
- [ ] Успешная регистрация → редирект на `/login?registered=true`

### AC-6: API Routes — без изменений
- [ ] `src/app/api/auth/[...nextauth]/route.ts` — работает
- [ ] `src/app/api/v1/members/route.ts` — работает
- [ ] `src/app/api/v1/members/[id]/route.ts` — работает
- [ ] `src/app/api/v1/auth/register/route.ts` — работает

### AC-7: Session Provider
- [ ] `SessionProvider` подключён в `src/app/dashboard/layout.tsx`
- [ ] `Session` передается в `AppLayout`
- [ ] `Navbar` получает сессию из props

### AC-8: Build проходит без ошибок
- [ ] `npm run build` завершается успешно
- [ ] `npm run dev` запускается без ошибок
- [ ] Все API endpoints работают
- [ ] Авторизация работает через `/login`
- [ ] Защита роутов работает через `useSession()`

---

## Технические детали

### 1. Dashboard Layout

**Было** (`src/app/dashboard/layout.tsx`):
```ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardLayoutClient } from './dashboard-layout-client';

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) { return <Spinner />; }
  return <DashboardLayoutClient session={session}>{children}</DashboardLayoutClient>;
}
```

**Станет**:
```ts
'use client';

import { useSession } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layouts';

export default function DashboardLayout({ children }) {
  return (
    <SessionProvider>
      <DashboardGuard>{children}</DashboardGuard>
    </SessionProvider>
  );
}

function DashboardGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = window.location.pathname;
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, router]);

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

### 2. Login Page

**Было** (`src/app/(public)/login/page.tsx`):
```ts
import { redirect } from 'next/navigation';
import { use } from 'react';
import LoginFormDataComponent from './page.client';

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams.callbackUrl || '/dashboard';
  return <LoginFormDataComponent callbackUrl={callbackUrl} />;
}
```

**Станет**:
```ts
'use client';

import { useSearchParams } from 'next/navigation';
import LoginFormDataComponent from './page.client';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const isRegistered = searchParams.get('registered') === 'true';

  return <LoginFormDataComponent callbackUrl={callbackUrl} isRegistered={isRegistered} />;
}
```

### 3. Auth Guard Component

**Создаётся** (`src/components/features/auth/AuthGuard.tsx`):
```ts
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = window.location.pathname;
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [status, router]);

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
```

### 4. Middleware — удаляется

Файл `src/middleware.ts` **полностью удаляется**.

Важно: если есть зависимости от `matcher`, удалить из `next.config.ts`.

---

## Влияние на слои архитектуры

### Service
- **Без изменений** — сервисы (`AuthService`, `MemberService`) работают через API Routes
- Все business logic сохраняется

### Repository
- **Без изменений** — репозитории (`PrismaMemberRepository`, `PrismaAuthRepository`) работают через API
- Доступ к БД только через API Routes

### API Route Handlers
- **Без изменений** — все API endpoints остаются
- `GET/POST /api/auth/[...nextauth]`
- `GET/POST /api/v1/auth/register`
- `GET/POST /api/v1/members`
- `GET/PATCH /api/v1/members/[id]`

### Components
- **Изменения**:
  - `src/app/dashboard/layout.tsx` — Server → Client Component
  - `src/app/(public)/login/page.tsx` — Server → Client Component
  - `src/components/features/auth/AuthGuard.tsx` — **новый** компонент

### Layouts
- `src/components/layouts/AppLayout.tsx` — без изменений
- `src/components/layouts/Navbar.tsx` — получает session из props (`useSession`)
- `src/app/dashboard/dashboard-layout-client.tsx` — можно упростить/удалить

---

## Зависимости

| Зависимость | Статус |
|-------------|--------|
| US-3-Authentication | ✅ Связана — обновление спецификации по client-side auth |
| next-auth/react | ✅ Используется |
| next-auth v4 | ✅ Используется |

---

## Edge cases

| Сценарий | Поведение |
|----------|-----------|
| Страница открывается до загрузки сессии | Спиннер загрузки |
| Навигация после logout | `status === 'unauthenticated'` → редирект на `/login` |
| Refresh страницы на защищённом роуте | `status === 'loading'` → спиннер, потом `useSession` решает |
| API Route недоступен | Ошибка `fetch` → отображение error boundary |
| CSRF-токен отсутствует | `signIn()` возвращает ошибку → `signIn` retry logic |

---

## Тесты

### Unit tests

```typescript
// tests/unit/components/AuthGuard.test.tsx
describe('AuthGuard', () => {
  it('должен показывать спиннер при loading', () => {
    // render(<AuthGuard><div>Test</div></AuthGuard>);
    // expect(screen.getByRole('spinner')).toBeInTheDocument();
  });

  it('должен перенаправлять на /login при unauthenticated', () => {
    // mock useSession returns status 'unauthenticated';
    // render(<AuthGuard><div>Test</div></AuthGuard>);
    // expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('должен рендерить children при authenticated', () => {
    // mock useSession returns status 'authenticated';
    // render(<AuthGuard><div>Protected</div></AuthGuard>);
    // expect(screen.getByText('Protected')).toBeInTheDocument();
  });
});
```

---

## Обновление

| Параметр | Значение |
|----------|----------|
| Статус | Draft |
| Версия | 1.0 |
| Дата | 2026-06-29 |
| Автор | System Architect |
