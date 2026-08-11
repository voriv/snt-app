# Руководство разработчика: Навигационная система (NAV)

## Обзор

Данное руководство описывает архитектуру, структуру кода и процессы разработки навигационной системы (REQ-NAV-001). Система обеспечивает SPA-маршрутизацию, защиту маршрутов, ролевую навигацию, хлебные крошки и адаптивные UI-элементы (top-navbar, sidebar, мобильный drawer).

---

## 1. Архитектура

Навигационная система состоит из серверных и клиентских слоёв:

```
src/
├── middleware.ts                    # Server-side защита маршрутов
├── app/
│   ├── layout.tsx                  # Корневой layout
│   ├── page.tsx                    # Главная страница (landing)
│   ├── not-found.tsx               # Кастомная 404-страница
│   ├── (public)/                   # Публичные страницы (login, register)
│   ├── dashboard/                  # Защищённые страницы дашборда
│   │   └── layout.tsx              # Layout дашборда (AppLayout)
│   └── api/v1/comms/unread-counts/ # API счётчиков непрочитанных
├── lib/
│   └── nav-utils.ts                # Утилиты навигации
├── hooks/
│   └── useNavigation.ts            # Хук навигации (роли + пункты меню)
├── components/
│   ├── layouts/
│   │   ├── Navbar.tsx              # Top-navbar (desktop + mobile)
│   │   ├── Sidebar.tsx             # Боковое меню (desktop)
│   │   ├── MobileDrawer.tsx        # Мобильное выезжающее меню
│   │   ├── SidebarItem.tsx         # Элемент меню sidebar
│   │   ├── Breadcrumbs.tsx         # Хлебные крошки
│   │   └── AppLayout.tsx           # Обёртка layout дашборда
│   └── features/navigation/
│       └── nav-items.config.ts     # Конфигурация пунктов меню
└── shared/
    └── utils/
        └── path-matcher.ts         # Утилита сравнения путей
```

### Слои навигации

| Слой | Компонент | Назначение |
|------|-----------|------------|
| **Server** | `middleware.ts` | Защита маршрутов `/dashboard/*` и `/api/v1/*` |
| **Config** | `nav-items.config.ts` | Статическая конфигурация пунктов меню и breadcrumbs |
| **Utils** | `nav-utils.ts` | Фильтрация по ролям, активное состояние, генерация breadcrumbs |
| **Hook** | `useNavigation.ts` | Клиентский хук: объединяет сессию + путь + пункты меню |
| **UI Layout** | `Navbar`, `Sidebar`, `Breadcrumbs`, `MobileDrawer` | Визуальные компоненты навигации |
| **Pages** | `not-found.tsx` | Кастомная 404-страница |

---

## 2. Типы данных

### NavItem

Основной тип пункта навигации ([`nav-items.config.ts`](src/components/features/navigation/nav-items.config.ts)):

```typescript
interface NavItem {
  path: string;           // Маршрут (начинается с `/dashboard`)
  title: string;          // Отображаемое название
  icon: LucideIcon;       // Иконка Lucide
  roles?: string[];       // Роли, которым доступен пункт. Если undefined — доступен всем
  group: NavGroup;        // Группа для sidebar (main, account, admin, finance)
  breadcrumbLabel?: string; // Подпись для breadcrumbs (без эмодзи)
}
```

### NavGroup

```typescript
type NavGroup = 'main' | 'account' | 'admin' | 'finance';
```

### BreadcrumbItem

```typescript
interface BreadcrumbItem {
  label: string;    // Отображаемая подпись (с эмодзи)
  href: string;     // Кумулятивный href до этого сегмента
  isCurrent: boolean; // Является ли текущим (последний элемент)
}
```

### UseNavigationReturn

```typescript
interface UseNavigationReturn {
  menuItems: NavItem[];     // Пункты меню, отфильтрованные по ролям
  activePath: string;       // Текущий pathname
  userRoles: string[];      // Роли пользователя из сессии
  isAdmin: boolean;         // true, если ADMIN или SUPER_ADMIN
  isSuperAdmin: boolean;    // true, если SUPER_ADMIN
  loading: boolean;         // Сессия загружается
}
```

---

## 3. Конфигурация пунктов меню

### nav-items.config.ts

Файл [`nav-items.config.ts`](src/components/features/navigation/nav-items.config.ts) содержит:

1. **Массив `navItems`** — 8 пунктов навигации с иконками, ролями и группами
2. **`breadcrumbMap`** — маппинг сегментов пути → подпись breadcrumbs (с эмодзи)
3. **`navGroupOrder`** — порядок групп в sidebar

### Текущие пункты меню

| Путь | Название | Иконка | Роли | Группа |
|------|----------|--------|------|--------|
| `/dashboard` | Дашборд | `LayoutDashboard` | Все | `main` |
| `/dashboard/plots` | Участки | `Map` | Все | `main` |
| `/dashboard/documents` | Документы | `FileText` | Все | `main` |
| `/dashboard/comms` | Общение | `MessageCircle` | Все | `main` |
| `/dashboard/profile` | Профиль | `User` | Все | `account` |
| `/dashboard/users` | Пользователи | `Users` | `ADMIN`, `SUPER_ADMIN` | `admin` |
| `/dashboard/roles` | Роли | `Shield` | `SUPER_ADMIN` | `admin` |
| `/dashboard/payments` | Платежи | `CreditCard` | `ADMIN`, `SUPER_ADMIN` | `finance` |

### Ролевая видимость

| Роль | Доступные разделы |
|------|-------------------|
| **GUEST / без роли** | Дашборд, Участки, Документы, Профиль |
| **MEMBER** | + Общение |
| **ADMIN** | + Пользователи, Платежи |
| **SUPER_ADMIN** | + Роли |

### Добавление нового пункта меню

1. Добавьте иконку из `lucide-react`
2. Добавьте объект в `navItems`:

```typescript
{
  path: '/dashboard/new-section',
  title: 'Новый раздел',
  icon: NewIcon,
  roles: ['ADMIN', 'SUPER_ADMIN'], // или undefined для всех
  group: 'main',
  breadcrumbLabel: 'Новый раздел',
}
```

3. Добавьте запись в `breadcrumbMap`:

```typescript
'new-section': '🏷️ Новый раздел',
```

---

## 4. Утилиты навигации (nav-utils.ts)

Файл [`nav-utils.ts`](src/lib/nav-utils.ts) предоставляет:

### getMenuItems(roles)

Фильтрует `navItems` по ролям пользователя:

```typescript
function getMenuItems(roles: string[]): NavItem[]
```

- Пункт без `roles` доступен всем
- Пункт с `roles` доступен при пересечении ролей
- Пустой `roles` → только пункты без ограничения

### isActivePath(itemPath, currentPath)

Определяет активное состояние пункта:

```typescript
function isActivePath(itemPath: string, currentPath: string | null | undefined): boolean
```

- `/dashboard` — точное совпадение (не подсвечивается на вложенных)
- Остальные — префиксное совпадение (`/dashboard/plots` активен на `/dashboard/plots/123`)
- Игнорирует query-параметры

### generateBreadcrumbs(pathname, maxDepth)

Генерирует breadcrumbs из pathname:

```typescript
function generateBreadcrumbs(pathname: string | null | undefined, maxDepth = 4): BreadcrumbItem[]
```

**Алгоритм:**
1. Разбивает pathname на сегменты
2. Для каждого сегмента ищет label в `breadcrumbMap`
3. Составные ключи (`comms/messages`, `comms/chats`) приоритетнее одиночных
4. Числовой ID → `#N` к предыдущему label (например, «Чат #5»)
5. Fallback — сегмент с заглавной буквы
6. Последний элемент: `isCurrent: true`
7. Глубина > maxDepth → первые `maxDepth - 1` + последний

**Пример:**

```
/dashboard/comms/chats/5
→ [{ "label": "🏠 Дашборд", "href": "/dashboard", "isCurrent": false },
   { "label": "💬 Общение", "href": "/dashboard/comms", "isCurrent": false },
   { "label": "💬 Групповые чаты", "href": "/dashboard/comms/chats", "isCurrent": false },
   { "label": "💬 Групповые чаты #5", "href": "/dashboard/comms/chats/5", "isCurrent": true }]
```

### getIconByPath(path)

```typescript
function getIconByPath(path: string): LucideIcon | undefined
```

Возвращает иконку Lucide по маршруту.

### getNavIcon(item)

```typescript
function getNavIcon(item: NavItem): LucideIcon
```

Возвращает иконку из NavItem.

---

## 5. Хук useNavigation

Файл [`useNavigation.ts`](src/hooks/useNavigation.ts).

```typescript
function useNavigation(): UseNavigationReturn
```

**Поведение:**
- Получает `session.user.roles` через [`useSession()`](src/hooks/useSession.ts)
- Получает текущий pathname через `usePathname()`
- Вызывает `getMenuItems(userRoles)` для фильтрации
- Вычисляет `isAdmin` / `isSuperAdmin` (memoized)
- Все значения `useMemo` для оптимизации

**Пример использования:**

```tsx
const { menuItems, activePath, isAdmin } = useNavigation();
```

---

## 6. Защита маршрутов (Middleware)

Файл [`middleware.ts`](src/middleware.ts).

### Принцип работы

Middleware выполняется **до** загрузки страницы и проверяет JWT-токен:

```typescript
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (token) {
    return NextResponse.next();  // Пропускаем
  }
  
  // Редирект на /login с callbackUrl
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}
```

### Matcher

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',           // Все страницы дашборда
    '/api/v1/plots/:path*',        // API участков
    '/api/v1/users/:path*',        // API пользователей
    '/api/v1/profile/:path*',      // API профиля
    '/api/v1/roles/:path*',        // API ролей
    '/api/v1/pages/:path*',        // API страниц
    '/api/v1/api-endpoints/:path*', // API эндпоинтов
    '/api/v1/plot-users/:path*',   // API пользователей участков
  ],
};
```

### Публичные маршруты (не защищаются)

- `/login`, `/register` — страницы входа/регистрации
- `/api/auth/*` — NextAuth endpoints
- `/api/v1/auth/*` — публичные auth endpoints
- `_next/static`, `_next/image`, `favicon.ico` — статика

### Edge Cases

| Сценарий | Поведение |
|----------|-----------|
| Прямой доступ без авторизации | Редирект на `/login?callbackUrl=...` |
| Истекшая сессия | Middleware → редирект на `/login` |
| callbackUrl | Сохраняется и используется после входа |
| Статические файлы | Пропускаются через matcher |

---

## 7. Компоненты UI

### Navbar ([`Navbar.tsx`](src/components/layouts/Navbar.tsx))

Верхняя навигационная панель.

**Пропсы:**

| Prop | Тип | Описание |
|------|-----|----------|
| `session` | `Session \| null` | Сессия NextAuth |
| `profile` | `UserProfileFull \| null` | Профиль пользователя |
| `isLoadingProfile` | `boolean` | Профиль загружается |
| `currentTheme` | `Theme` | Текущая тема |
| `onThemeChange` | `(theme) => void` | Callback смены темы |

**Функциональность:**
- Отображает пункты `main` + `admin` + `finance` групп (desktop)
- Ссылка на профиль (`account` группа)
- Индикатор непрочитанных (запрос `GET /api/v1/comms/unread-counts`)
- Кнопка гамбургера (mobile) → открывает [`MobileDrawer`](src/components/layouts/MobileDrawer.tsx)
- `ThemeToggle` для смены темы
- `LogoutButton` для выхода
- ARIA: `role="navigation"`, `aria-label="Основная навигация"`

### Sidebar ([`Sidebar.tsx`](src/components/layouts/Sidebar.tsx))

Боковое меню (desktop).

**Пропсы:**

| Prop | Тип | Описание |
|------|-----|----------|
| `isCollapsed` | `boolean` | Состояние коллапса (зарезервировано) |
| `onCollapseToggle` | `() => void` | Переключение коллапса (зарезервировано) |

**Функциональность:**
- `hidden md:block` — скрыт на мобильных (< 768px)
- Группирует пункты по `group` с порядком `navGroupOrder`
- `SidebarItem` для каждого пункта
- Активное состояние через `isActivePath()`
- Skeleton при загрузке сессии (6 пульсирующих строк)
- ARIA: `aria-label="Sidebar"`

### MobileDrawer ([`MobileDrawer.tsx`](src/components/layouts/MobileDrawer.tsx))

Выезжающее мобильное меню.

**Пропсы:**

| Prop | Тип | Описание |
|------|-----|----------|
| `isOpen` | `boolean` | Открыт ли drawer |
| `onClose` | `() => void` | Callback закрытия |

**Функциональность:**
- Выезжает слева с overlay (затемнение)
- Содержит те же пункты, что и Sidebar
- Закрытие при: клике на пункт, клике на overlay, клавише Escape
- Focus trap: фокус перемещается в drawer, возвращается при закрытии
- Блокировка прокрутки `body` при открытии
- Анимация: `transition 300ms`
- ARIA: `role="dialog"`, `aria-modal="true"`

### Breadcrumbs ([`Breadcrumbs.tsx`](src/components/layouts/Breadcrumbs.tsx))

Хлебные крошки.

**Пропсы:**

| Prop | Тип | Описание |
|------|-----|----------|
| `pathname` | `string` | Альтернативный pathname |
| `maxDepth` | `number` | Макс. глубина (4 по умолчанию) |
| `separator` | `ReactNode` | Разделитель (`›` по умолчанию) |
| `className` | `string` | Доп. классы |

**Функциональность:**
- Авто-генерация через `generateBreadcrumbs()`
- Кликабельные ссылки (кроме последнего элемента)
- `hidden md:flex` — скрыт на мобильных
- ARIA: `role="navigation"`, `aria-label="Breadcrumb"`, `aria-current="page"`
- Truncate длинных labels (`max-w-[40ch]`)

**Пример использования:**

```tsx
<Breadcrumbs />
<Breadcrumbs pathname="/dashboard/plots/123/edit" maxDepth={4} />
```

### NotFoundPage ([`not-found.tsx`](src/app/not-found.tsx))

Кастомная 404-страница.

**Функциональность:**
- `role="alert"`, `aria-label="Страница не найдена"`
- Состояние loading → skeleton кнопки
- Авторизованный → «Вернуться на дашборд» → `/dashboard`
- Неавторизованный → «На главную» → `/`
- HTTP-статус 404

---

## 8. Бизнес-правила

| ID | Правило | Реализация |
|----|---------|------------|
| **BR-01** | Все страницы интерактивны | Next.js App Router + Client Components |
| **BR-02** | Главная доступна всем | `page.tsx` не защищён middleware |
| **BR-03** | Login/Register без авторизации | Matcher исключает `/login`, `/register` |
| **BR-04** | `/dashboard/*` требует авторизации | [`middleware.ts`](src/middleware.ts) |
| **BR-05** | Редирект авторизованных `/` → `/dashboard` | Redirect в `page.tsx` |
| **BR-06** | Ролевые пункты меню | [`getMenuItems()`](src/lib/nav-utils.ts) |
| **BR-07** | Ссылка на профиль в navbar | [`Navbar.tsx`](src/components/layouts/Navbar.tsx) |
| **BR-08** | Email вместо имени | `profile.email` как fallback |
| **BR-09** | Единая вкладка «Общение» | Один пункт в navItems |
| **BR-10** | Нет отдельных вкладок MS/Chats | Нет `/dashboard/messages` в navItems |

---

## 9. Маршруты

### Публичные

| Маршрут | Описание |
|---------|----------|
| `/` | Главная (landing для неавторизованных) |
| `/login` | Вход |
| `/register` | Регистрация |
| `/api/auth/*` | NextAuth endpoints |

### Защищённые (UI)

| Маршрут | Описание |
|---------|----------|
| `/dashboard` | Дашборд |
| `/dashboard/plots` | Участки |
| `/dashboard/documents` | Документы |
| `/dashboard/comms` | Общение |
| `/dashboard/profile` | Профиль |
| `/dashboard/users` | Пользователи (ADMIN+) |
| `/dashboard/roles` | Роли (SUPER_ADMIN) |
| `/dashboard/payments` | Платежи (ADMIN+) |

### Защищённые (API)

| Маршрут | Описание |
|---------|----------|
| `/api/v1/comms/unread-counts` | Счётчики непрочитанных |
| `/api/v1/plots/*` | CRUD участков |
| `/api/v1/users/*` | CRUD пользователей |
| `/api/v1/profile/*` | Профиль |
| `/api/v1/roles/*` | Роли |

---

## 10. Тестирование

### Component-тесты

| Файл | Описание |
|------|----------|
| `tests/components/features/navigation/Breadcrumbs.test.tsx` | Тесты Breadcrumbs |

**Запуск:**

```bash
npm run test:components
```

### E2E-тесты

Полные сценарии навигации.

**Запуск:**

```bash
npx playwright test --grep "navigation"
```

---

## 11. Обработка ошибок

| Сценарий | Компонент | Поведение |
|----------|-----------|-----------|
| Нет сессии | Middleware | Редирект на `/login` |
| Истекла сессия | Middleware | Редирект на `/login` |
| Загрузка сессии | Sidebar/Navbar | Skeleton |
| Ошибка загрузки | not-found.tsx | «На главную» |
| Путь не найден | Next.js 404 | `not-found.tsx` |

---

## 12. Адаптивность (Responsive)

| Breakpoint | Navbar | Sidebar | MobileDrawer | Breadcrumbs |
|------------|--------|---------|--------------|-------------|
| `< 768px` (mobile) | Гамбургер + профиль | Скрыт | Доступен | Скрыт |
| `>= 768px` (desktop) | Пункты меню + профиль | Виден | Скрыт | Виден |

---

## 13. Стилевые правила

### Именование

- **Типы:** PascalCase (`NavItem`, `BreadcrumbItem`)
- **Константы:** camelCase (`navItems`, `breadcrumbMap`)
- **Функции:** camelCase (`getMenuItems`, `isActivePath`, `generateBreadcrumbs`)
- **Компоненты:** PascalCase (`Navbar`, `Sidebar`, `Breadcrumbs`, `MobileDrawer`)

### JSDoc

Все компоненты содержат JSDoc с:
- `@component` — название компонента
- `@description` — описание
- `@spec` — ссылка на спецификацию
- `@task` — ID задачи
- `@covers` — покрываемые AC
- `@example` — пример использования

### Tailwind

- `hidden sm:` — скрыто на мобильных
- `hidden md:block` — только desktop
- `transition-transform duration-300` — анимации drawer
- `animate-pulse` — skeleton

### ARIA

- `role="navigation"` для navbar/sidebar
- `role="dialog"` для drawer
- `aria-current="page"` для текущего breadcrumbs
- `aria-label` для всех навигационных элементов
- `aria-expanded` для гамбургера
- `aria-controls="mobile-drawer"` для гамбургера

---

## История изменений

| Версия | Дата | Описание |
|--------|------|----------|
| 1.0 | 2026-07-26 | Первоначальное руководство |
