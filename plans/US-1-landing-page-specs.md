# План спецификаций для US-1: Стартовая страница неавторизованной зоны

## 0. Принятые архитектурные решения

| # | Вопрос | Решение |
|---|--------|---------|
| Q1 | Route group `(dashboard)` vs плоская структура | **Плоская `dashboard/`** — без route group |
| Q2 | AuthLayout для login | **PublicLayout + центрирование формы** внутри PublicLayout |
| Q3 | Дизайн Landing Page | **Минималистичная текстовая страница** |
| Q4 | Дублирование AppLayout/DashboardLayout | **Консолидировать** — dashboard/layout.tsx использует AppLayout |


## 1. Анализ текущего состояния

### Текущая структура маршрутов

```
src/app/
├── layout.tsx                        # Root layout
├── not-found.tsx                     # 404
├── (auth)/login/page.tsx             # /login ← route group
├── (dashboard)/layout.tsx            # Dashboard layout
├── (dashboard)/page.tsx              # / ← ПРОБЛЕМА: дашборд на корне!
├── (dashboard)/members/page.tsx      # /members ← без /dashboard/ префикса
└── api/v1/...                        # API routes
```

### Выявленные проблемы

| # | Проблема | Текущее | Должно быть |
|---|----------|---------|-------------|
| 1 | Дашборд на корневом маршруте | `(dashboard)/page.tsx` → URL `/` | `dashboard/page.tsx` → URL `/dashboard` |
| 2 | Нет landing page | — | `(public)/page.tsx` → URL `/` |
| 3 | Нет middleware | файл отсутствует | `middleware.ts` с авторизацией |
| 4 | Неверный signIn path в auth.config | `signIn: '/auth/login'` | `signIn: '/login'` |
| 5 | Нет редиректа авторизованного с `/` | — | Middleware: `/` → `/dashboard` |
| 6 | Members без /dashboard/ префикса | `/members` | `/dashboard/members` |

### Рассинхрон US-1 с оптимальной структурой

US-1 указывает путь `src/app/(dashboard)/dashboard/page.tsx`, что создаёт вложенность `(dashboard)/dashboard/`. Это избыточно — route group `(dashboard)` не даёт выгоды, если внутри уже есть реальный сегмент `dashboard/`.

**Рекомендация:** убрать route group, использовать плоскую структуру `src/app/dashboard/`.

---

## 2. Целевая структура маршрутов

```mermaid
flowchart TD
    subgraph Public Zone
        ROOT[/ - Landing Page] 
        LOGIN[/login - Страница входа]
    end
    subgraph Dashboard Zone
        DASH[/dashboard - Главная дашборда]
        MEMBERS[/dashboard/members - Члены СНТ]
        PLOTS[/dashboard/plots - Участки]
    end
    
    ROOT -->|кнопка Войти| LOGIN
    ROOT -->|авторизован| DASH
    LOGIN -->|успешный вход| DASH
```

```
src/app/
├── layout.tsx                        # Root layout — без изменений
├── not-found.tsx                     # 404 — без изменений
├── (public)/
│   ├── layout.tsx                    # НОВЫЙ: Layout публичной зоны
│   ├── page.tsx                      # НОВЫЙ: Landing Page — Server Component
│   └── login/page.tsx                # ПЕРЕМЕЩЁН из (auth)/login/
├── dashboard/
│   ├── layout.tsx                    # ПЕРЕМЕЩЁН из (dashboard)/layout.tsx
│   ├── page.tsx                      # ПЕРЕМЕЩЁН из (dashboard)/page.tsx
│   └── members/page.tsx              # ПЕРЕМЕЩЁН из (dashboard)/members/
└── api/v1/...                        # Без изменений
```

---

## 3. Спецификации компонентов — скелеты

### 3.1. Landing Page — `src/app/(public)/page.tsx`

**Тип:** Server Component — без `'use client'`  
**Маршрут:** `/`  
**Auth:** none

```typescript
/**
 * @page /
 * @auth none
 * @description Стартовая страница неавторизованной зоны — landing page приложения СНТ Берёзки-НТ
 *
 * @spec
 * - Server Component: не использует хуки, не обращается к БД
 * - Контент статический, захардкожен в компоненте
 * - Отображает: название приложения, описание, кнопку Войти
 * - Кнопка Войти — ссылка на /login, визуально выделена как primary action
 * - Адаптивная верстка: мобильные и десктоп
 * - SEO: экспортирует metadata с title и description
 *
 * @data-flow
 * - Server Component → статический рендеринг → PublicLayout
 */
```

**Структура JSX — минималистичная текстовая страница:**
- Заголовок h1: «СНТ Берёзки-НТ»
- Абзац с описанием назначения системы управления товариществом
- Кнопка «Войти» → `<Link href="/login">` — визуально primary action
- Metadata export для SEO

---

### 3.2. Public Layout — `src/app/(public)/layout.tsx`

**Тип:** Server Component
**Маршрут:** `/`, `/login`

```typescript
/**
 * @component PublicLayoutRoute
 * @category features
 * @description Route group layout для публичной зоны — обёртка над PublicLayout-компонентом
 *
 * @spec
 * - Server Component: импортирует и рендерит PublicLayout из src/components/layouts/
 * - Передаёт children в PublicLayout
 * - Применяется ко всем маршрутам внутри (public) route group: / и /login
 */
```

---

### 3.3. PublicLayout компонент — `src/components/layouts/PublicLayout.tsx`

**Тип:** Server Component — без состояния  
**Категория:** ui

```typescript
/**
 * @component PublicLayout
 * @category ui
 * @description Компонент layout публичной зоны с шапкой и подвалом
 *
 * @example
 * ```tsx
 * <PublicLayout>
 *   <LandingPage />
 * </PublicLayout>
 * ```
 *
 * @spec
 * - Шапка: название приложения СНТ Берёзки-НТ, выровнено по левому краю
 * - Подвал: текст копирайта — текущий год, название организации
 * - Children рендерится между шапкой и подвалом
 * - min-h-screen + flex: шапка и подвал всегда видны, контент заполняет оставшееся пространство
 * - Адаптивная верстка: мобильные и десктоп
 * - Login-страница внутри PublicLayout: форма центрирована по вертикали и горизонтали
 */
export interface PublicLayoutProps {
  /** Содержимое страницы между шапкой и подвалом */
  children: React.ReactNode;
}
```

---

### 3.4. Middleware — `src/middleware.ts`

**Тип:** Middleware function  
**Расположение:** корень `src/` — обязательно для Next.js

```typescript
/**
 * @function middleware
 * @description Middleware авторизации — контролирует доступ к маршрутам на основе сессии
 *
 * @spec
 * - Публичные маршруты: / и /login — доступны всем
 * - Авторизованный на / → редирект 307 на /dashboard
 * - Авторизованный на /login → редирект 307 на /dashboard
 * - Неавторизованный на /dashboard/* → редирект 307 на /login
 * - Неавторизованный на / → пропускается без редиректа
 * - API маршруты /api/* — не обрабатываются middleware
 * - Статические файлы — не обрабатываются middleware
 *
 * @see src/infrastructure/auth/auth.config.ts — конфигурация next-auth
 */
```

**Matcher config:**
```typescript
export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};
```

---

### 3.5. Обновление auth.config.ts — `src/infrastructure/auth/auth.config.ts`

**Изменения:**
- `signIn: '/auth/login'` → `signIn: '/login'`
- Обновить `authorized()` callback:
  - Добавить проверку корневого маршрута `/` — авторизованный → редирект на `/dashboard`
  - Изменить `isOnAuth` на проверку `/login` вместо `/auth`
  - Сохранить логику `/dashboard/*` → неавторизованный → редирект на `/login`

---

## 4. План перемещения файлов

```mermaid
flowchart LR
    A[src/app/(auth)/login/page.tsx] -->|переместить| B[src/app/(public)/login/page.tsx]
    C[src/app/(dashboard)/layout.tsx] -->|переместить| D[src/app/dashboard/layout.tsx]
    E[src/app/(dashboard)/page.tsx] -->|переместить| F[src/app/dashboard/page.tsx]
    G[src/app/(dashboard)/members/page.tsx] -->|переместить| H[src/app/dashboard/members/page.tsx]
```

### Обновления в перемещённых файлах

| Файл | Что обновить |
|------|-------------|
| `dashboard/page.tsx` | Ссылки в stats уже ведут на `/dashboard/...` — корректно |
| `dashboard/layout.tsx` | **Консолидация с AppLayout:** заменить inline-навигацию на `<AppLayout>{children}</AppLayout>` из `src/components/layouts/` |
| `(public)/login/page.tsx` | Убрать внешний `min-h-screen flex items-center justify-center` — центрирование обеспечит PublicLayout. `window.location.href = '/dashboard'` — уже корректно |

---

## 5. Порядок выполнения

| Шаг | Действие | Тип |
|-----|----------|-----|
| 1 | Создать `src/components/layouts/PublicLayout.tsx` — скелет с JSDoc | Новый файл |
| 2 | Создать `src/app/(public)/layout.tsx` — скелет с JSDoc | Новый файл |
| 3 | Создать `src/app/(public)/page.tsx` — скелет Landing Page с JSDoc | Новый файл |
| 4 | Переместить `(auth)/login/page.tsx` → `(public)/login/page.tsx` | Перемещение |
| 5 | Переместить `(dashboard)/page.tsx` → `dashboard/page.tsx` | Перемещение |
| 6 | Переместить `(dashboard)/members/` → `dashboard/members/` | Перемещение |
| 7 | Переместить `(dashboard)/layout.tsx` → `dashboard/layout.tsx` | Перемещение |
| 8 | Создать `src/middleware.ts` — скелет с JSDoc | Новый файл |
| 9 | Обновить `auth.config.ts` — исправить signIn path и authorized callback | Изменение |
| 10 | Обновить `src/components/layouts/index.ts` — добавить экспорт PublicLayout | Изменение |
| 11 | Удалить пустые директории `(auth)/` и `(dashboard)/` | Удаление |
| 12 | Обновить US-1 — отметить изменения в таблице UI | Документация |

---

## 6. Решённые архитектурные вопросы

| # | Вопрос | Решение |
|---|--------|---------|
| Q1 | Route group `(dashboard)` vs плоская структура | **Плоская `dashboard/`** — route group избыточна при реальном сегменте |
| Q2 | AuthLayout для login-страницы | **PublicLayout + центрирование** — форма входа центрирована внутри PublicLayout, AuthLayout не используется |
| Q3 | Дизайн Landing Page | **Минималистичная текстовая страница** — заголовок, описание, кнопка |
| Q4 | Дублирование AppLayout/DashboardLayout | **Консолидировать** — `dashboard/layout.tsx` делегирует навигацию в `AppLayout` |