# Спецификация компонент: SPA-маршрутизация и навигация (REQ-NAV-001)

> **Назначение:** Спецификация компонент и скелетов кода для [REQ-NAV-001](../../plans/REQ-NAV-001-realization-plan.md)
> **Создано:** `component-spec` режим
> **Статус:** `[DRAFT]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `nav-routing` |
| **План реализации** | [`docs/plans/REQ-NAV-001-realization-plan.md`](../../plans/REQ-NAV-001-realization-plan.md) |
| **User Stories** | US-NAV-01…US-NAV-07 (7 штук) |
| **Требования** | REQ-NAV-001 |
| **Модель данных** | Без изменений (использует User, Role, Page) |
| **Версия** | `v1.0` |
| **Дата** | `2026-07-25` |
| **Статус** | `[DRAFT]` |

---

## 2. 📊 Матрица трассировки

> Каждая строка связывает компонент с требованиями. Без строки в матрице — нет компонента.
> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | `nav-items.config.ts` | Config | 🆕 | US-NAV-02, US-NAV-05, US-NAV-07 | AC-NAV-02-4, AC-NAV-05-2, AC-NAV-07-7 | NAV-02-T1 | `[TODO]` |
| 2 | `nav-utils.ts` (generateBreadcrumbs, getIconByPath, isActivePath) | Utils | 🆕 | US-NAV-06, US-NAV-02, US-NAV-05 | AC-NAV-06-2, AC-NAV-06-6, AC-NAV-02-6, AC-NAV-05-3 | NAV-02-T1, NAV-06-T1 | `[TODO]` |
| 3 | `useNavigation.ts` | Hook | 🆕 | US-NAV-02, US-NAV-05, US-NAV-07 | AC-NAV-02-4, AC-NAV-05-2, AC-NAV-07-7 | NAV-02-T2 | `[TODO]` |
| 4 | `ProgressBar` (в `dashboard/template.tsx`) | Page/Template | 🆕 | US-NAV-01 | AC-NAV-01-6 | NAV-01-T1 | `[TODO]` |
| 5 | `ErrorPage` (`dashboard/error.tsx`) | Page | 🆕 | US-NAV-01 | AC-NAV-01-7 | NAV-01-T2 | `[TODO]` |
| 6 | `SidebarItem` | UI/Layout | 🆕 | US-NAV-05 | AC-NAV-05-3, AC-NAV-05-4 | NAV-05-T1 | `[TODO]` |
| 7 | `Sidebar` | UI/Layout | 🆕 | US-NAV-05 | AC-NAV-05-1, AC-NAV-05-2, AC-NAV-05-3, AC-NAV-05-4, AC-NAV-05-5 | NAV-05-T2 | `[TODO]` |
| 8 | `Breadcrumbs` | UI/Layout | 🆕 | US-NAV-06 | AC-NAV-06-1…AC-NAV-06-6 | NAV-06-T2 | `[TODO]` |
| 9 | `MobileDrawer` | UI/Layout | 🆕 | US-NAV-07 | AC-NAV-07-2…AC-NAV-07-7 | NAV-07-T1 | `[TODO]` |
| 10 | `Navbar` | UI/Layout | 🔧 | US-NAV-02, US-NAV-07 | AC-NAV-02-4, AC-NAV-07-1, AC-NAV-07-2 | NAV-02-T2, NAV-07-T2 | `[TODO]` |
| 11 | `AppLayout` | UI/Layout | 🔧 | US-NAV-05, US-NAV-06 | AC-NAV-05-1, AC-NAV-05-5, AC-NAV-06-1 | NAV-05-T3, NAV-06-T3 | `[TODO]` |
| 12 | `NotFoundPage` (`not-found.tsx`) | Page | 🔧 | US-NAV-03 | AC-NAV-03-1, AC-NAV-03-2, AC-NAV-03-3 | NAV-03-T1 | `[TODO]` |

### Проверка покрытия AC

| US | AC | Покрыт в строке | Статус |
|---|---|---|---|
| US-NAV-01 | AC-NAV-01-1 (Главная для неавторизованных) | — | ✅ Готово |
| US-NAV-01 | AC-NAV-01-2 (Редирект авторизованного на дашборд) | — | ✅ Готово |
| US-NAV-01 | AC-NAV-01-3 (Редирект неавторизованного на вход) | — | ✅ Готово |
| US-NAV-01 | AC-NAV-01-4 (Сохранение callbackUrl) | — | ✅ Готово |
| US-NAV-01 | AC-NAV-01-5 (Истекшая сессия) | — | ✅ Готово |
| US-NAV-01 | AC-NAV-01-6 (Индикатор загрузки) | #4 | ✅ |
| US-NAV-01 | AC-NAV-01-7 (Ошибка с кнопкой «Повторить») | #5 | ✅ |
| US-NAV-01 | AC-NAV-01-8 (Graceful degradation) | — | ✅ Готово |
| US-NAV-02 | AC-NAV-02-1 (Navbar на всех страницах) | — | ✅ Готово |
| US-NAV-02 | AC-NAV-02-2 (Ссылка на профиль) | — | ✅ Готово |
| US-NAV-02 | AC-NAV-02-3 (Клиентская навигация) | — | ✅ Готово |
| US-NAV-02 | AC-NAV-02-4 (Ролевые пункты меню) | #1, #3, #10 | ✅ |
| US-NAV-02 | AC-NAV-02-5 (Не отображается для неавторизованных) | — | ✅ Готово |
| US-NAV-02 | AC-NAV-02-6 (Активное состояние) | #2, #10 | ✅ |
| US-NAV-03 | AC-NAV-03-1 (Кастомная 404) | #12 | ✅ |
| US-NAV-03 | AC-NAV-03-2 (Ссылка на дашборд для авториз.) | #12 | ✅ |
| US-NAV-03 | AC-NAV-03-3 (Ссылка на главную для неавториз.) | #12 | ✅ |
| US-NAV-03 | AC-NAV-03-4 (Исторические ссылки → 404) | — | ✅ Готово |
| US-NAV-04 | AC-NAV-04-1…AC-NAV-04-5 (Вкладка «Общение») | — | ✅ Готово |
| US-NAV-05 | AC-NAV-05-1 (Sidebar на дашборде) | #7, #11 | ✅ |
| US-NAV-05 | AC-NAV-05-2 (Ролевые пункты в sidebar) | #1, #3, #7 | ✅ |
| US-NAV-05 | AC-NAV-05-3 (Активное состояние пункта) | #2, #6, #7 | ✅ |
| US-NAV-05 | AC-NAV-05-4 (Иконки у пунктов) | #1, #2, #6 | ✅ |
| US-NAV-05 | AC-NAV-05-5 (Скрытие на мобильных) | #7, #11 | ✅ |
| US-NAV-06 | AC-NAV-06-1 (Breadcrumbs на страницах) | #8, #11 | ✅ |
| US-NAV-06 | AC-NAV-06-2 (Авто-генерация по пути) | #2, #8 | ✅ |
| US-NAV-06 | AC-NAV-06-3 (Кликабельные ссылки) | #8 | ✅ |
| US-NAV-06 | AC-NAV-06-4 (Последний уровень не кликабелен) | #8 | ✅ |
| US-NAV-06 | AC-NAV-06-5 (Разделитель между уровнями) | #8 | ✅ |
| US-NAV-06 | AC-NAV-06-6 (Максимальная глубина) | #2 | ✅ |
| US-NAV-07 | AC-NAV-07-1 (Гамбургер на мобильных) | #10 | ✅ |
| US-NAV-07 | AC-NAV-07-2 (Открытие drawer) | #9, #10 | ✅ |
| US-NAV-07 | AC-NAV-07-3 (Закрытие по клику на пункт) | #9 | ✅ |
| US-NAV-07 | AC-NAV-07-4 (Закрытие по overlay) | #9 | ✅ |
| US-NAV-07 | AC-NAV-07-5 (Закрытие по Escape) | #9 | ✅ |
| US-NAV-07 | AC-NAV-07-6 (Анимация) | #9 | ✅ |
| US-NAV-07 | AC-NAV-07-7 (Ролевые пункты) | #1, #3, #9 | ✅ |

---

## 3. 🏗️ Спецификация по слоям

> Данная спецификация покрывает UI-слой (Components, Hooks, Config, Utils, Pages).
> Domain/API слои — без изменений (навигация — чистый UI, данные из сессии).

---

### 3.1 Config & Utils Layer

---

#### 3.1.1 `nav-items.config.ts` — конфигурация пунктов меню

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/navigation/nav-items.config.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | NAV-02-T1 |
| **Трассировка** | US-NAV-02 AC-NAV-02-4, US-NAV-05 AC-NAV-05-2, US-NAV-07 AC-NAV-07-7 |

**Интерфейсы:**

| Интерфейс | Описание | Поля |
|---|---|---|
| `NavItem` | Пункт навигации | `path: string`, `title: string`, `icon: LucideIcon`, `roles?: string[]`, `group?: string`, `breadcrumbLabel?: string` |

**Конфигурация (экспорт `navItems: NavItem[]`):**

| # | Название | Путь | Иконка (Lucide) | Роли | Группа | breadcrumbLabel |
|---|----------|------|-----------------|------|--------|-----------------|
| 1 | Дашборд | `/dashboard` | `LayoutDashboard` | ALL | main | Дашборд |
| 2 | Участки | `/dashboard/plots` | `Map` | ALL | main | Участки |
| 3 | Документы | `/dashboard/documents` | `FileText` | ALL | main | Документы |
| 4 | Общение | `/dashboard/comms` | `MessageCircle` | ALL | main | Общение |
| 5 | Профиль | `/dashboard/profile` | `User` | ALL | account | Профиль |
| 6 | Пользователи | `/dashboard/users` | `Users` | ADMIN, SUPER_ADMIN | admin | Пользователи |
| 7 | Роли | `/dashboard/roles` | `Shield` | SUPER_ADMIN | admin | Роли |
| 8 | Платежи | `/dashboard/payments` | `CreditCard` | ADMIN, SUPER_ADMIN | finance | Платежи |

**Ролевая видимость:**

| Роль | Видимые пункты |
|------|---------------|
| GUEST / без роли | Дашборд, Участки, Документы, Профиль |
| MEMBER | Дашборд, Участки, Документы, Общение, Профиль |
| ADMIN | Дашборд, Участки, Документы, Общение, Профиль, Пользователи, Платежи |
| SUPER_ADMIN | Все пункты |

**Маппинг путей для breadcrumbs (`breadcrumbMap: Record<string, string>`):**

| Ключ | Значение |
|------|----------|
| `dashboard` | 🏠 Дашборд |
| `plots` | 📋 Участки |
| `documents` | 📄 Документы |
| `comms` | 💬 Общение |
| `comms/messages` | 💬 Личные сообщения |
| `comms/chats` | 💬 Групповые чаты |
| `comms/announcements` | 📢 Объявления |
| `comms/moderation` | 🛡 Модерация |
| `users` | 👥 Пользователи |
| `roles` | 🔐 Роли |
| `profile` | 👤 Профиль |
| `payments` | 💳 Платежи |
| `edit` | ✏️ Редактирование |
| `new` | ➕ Создание |
| `create` | ➕ Создание |

**Zod-схема (опционально):**

| Схема | Валидирует | Правила |
|---|---|---|
| `navItemSchema` | `NavItem` | `path` начинается с `/dashboard`; `title` min 1; `icon` — LucideIcon |

---

#### 3.1.2 `nav-utils.ts` — утилиты навигации

| Параметр | Значение |
|---|---|
| **Файл** | `src/lib/nav-utils.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | NAV-02-T1, NAV-06-T1 |
| **Трассировка** | US-NAV-02 AC-NAV-02-6, US-NAV-05 AC-NAV-05-3, US-NAV-06 AC-NAV-06-2, AC-NAV-06-6 |

**Функции:**

| Функция | Параметры | Возврат | Описание |
|---|---|---|---|
| `getMenuItems` | `roles: string[]` | `NavItem[]` | Фильтрует `navItems` по ролям пользователя |
| `getIconByPath` | `path: string` | `LucideIcon \| undefined` | Возвращает иконку по пути (из `navItems`) |
| `isActivePath` | `itemPath: string`, `currentPath: string` | `boolean` | Определяет активность пункта (`startsWith` для префиксов, точное для `/dashboard`) |
| `generateBreadcrumbs` | `pathname: string`, `maxDepth?: number` | `BreadcrumbItem[]` | Генерирует хлебные крошки из pathname |

**Интерфейсы:**

| Интерфейс | Описание | Поля |
|---|---|---|
| `BreadcrumbItem` | Элемент breadcrumbs | `label: string`, `href: string`, `isCurrent: boolean` |

**Спецификация `generateBreadcrumbs()`:**

- Разбивает `pathname` на сегменты
- Для каждого сегмента ищет label в `breadcrumbMap` (fallback — сам сегмент)
- Строит cumulative `href`: `/dashboard` → `/dashboard/plots` → …
- Численные сегменты (regex `^\d+$`): добавляет как `#N` к предыдущему label (например, «Участок #3»)
- Максимальная глубина: по умолчанию 4. Если глубже — показывает первые 3 + последний
- Игнорирует query-параметры (разделяет `?`)
- Последний элемент: `isCurrent: true`
- Первый элемент (root): `href: '/dashboard'`, `label: '🏠 Дашборд'`

**Спецификация `isActivePath()`:**

- Для `/dashboard`: точное совпадение (`currentPath === '/dashboard'`)
- Для остальных: `currentPath.startsWith(itemPath)` (префиксное совпадение)

---

### 3.2 Hook Layer

---

#### 3.2.1 `useNavigation` — хук навигации

| Параметр | Значение |
|---|---|
| **Файл** | `src/hooks/useNavigation.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | NAV-02-T2 |
| **Трассировка** | US-NAV-02 AC-NAV-02-4, US-NAV-05 AC-NAV-05-2, US-NAV-07 AC-NAV-07-7 |

**Возвращаемое значение:**

| Поле | Тип | Описание |
|---|---|---|
| `menuItems` | `NavItem[]` | Пункты меню, отфильтрованные по ролям |
| `activePath` | `string` | Текущий `pathname` |
| `userRoles` | `string[]` | Роли из сессии |
| `isAdmin` | `boolean` | `true` если ADMIN или SUPER_ADMIN |
| `isSuperAdmin` | `boolean` | `true` если SUPER_ADMIN |

**Состояния:**

- Использует `useSession()` для получения `session.user.roles`
- Использует `usePathname()` для `activePath`
- Вызывает `getMenuItems(userRoles)` для фильтрации

**Поведение:**

- При mount: получает роли из сессии
- При изменении pathname: `activePath` обновляется автоматически
- `isAdmin` / `isSuperAdmin` — memoized через `useMemo`

---

### 3.3 UI Layer — Новые компоненты

---

#### 3.3.1 `SidebarItem` — элемент бокового меню

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/layouts/SidebarItem.tsx` |
| **Тип** | Client Component (`'use client'`) |
| **Действие** | 🆕 Создать |
| **Задача** | NAV-05-T1 |
| **Трассировка** | US-NAV-05 AC-NAV-05-3, AC-NAV-05-4 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `item` | `NavItem` | ✅ | Данные пункта меню |
| `isActive` | `boolean` | ✅ | Активное состояние пункта |
| `onClick` | `() => void` | ❌ | Callback при клике (для drawer — закрытие) |

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `active` | `isActive === true` | Фон `color.bg.secondary`, текст `color.accent.default` |
| `idle` | `isActive === false` | Текст `color.text.secondary` |
| `hover` | `:hover` | Текст `color.text.primary` |

**Поведение:**

- Рендерит `Link` из `next/link` с `href={item.path}`
- Иконка слева от текста (через `item.icon` Lucide-компонент)
- При клике: `onClick?.()` (для drawer — закрытие)
- Текст обрезается (`truncate`), полное название в `title`
- `aria-current="page"` при `isActive === true`

**Tailwind-классы:**

```
Контейнер: flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
active: bg-gray-100 text-blue-600
idle: text-gray-500 hover:text-gray-900 hover:bg-gray-50
truncate: overflow-hidden text-ellipsis whitespace-nowrap
focus: focus:outline-none focus:ring-2 focus:ring-blue-500
```

**A11y:**

- `<a>` внутри `<nav aria-label="Sidebar">`
- `aria-current="page"` при активном состоянии
- `title` для truncated текста
- Keyboard: Tab + Enter

**Зависимости:**

- `next/link` — `Link`
- `lucide-react` — иконки
- `@/shared/utils` — `cn`

---

#### 3.3.2 `Sidebar` — боковое меню

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/layouts/Sidebar.tsx` |
| **Тип** | Client Component (`'use client'`) |
| **Действие** | 🆕 Создать |
| **Задача** | NAV-05-T2 |
| **Трассировка** | US-NAV-05 AC-NAV-05-1…AC-NAV-05-5 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `isCollapsed` | `boolean` | ❌ | Состояние коллапса (опционально) |
| `onCollapseToggle` | `() => void` | ❌ | Переключение коллапса |

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `loading` | Сессия загружается | Skeleton blocks (6 pulsing items) |
| `empty` | Нет доступных пунктов | `(нет доступных разделов)` |
| `data` | Пункты получены | Список `SidebarItem` с группировкой |

**Поведение:**

- Использует `useNavigation()` для получения `menuItems` и `activePath`
- Группирует пункты по `group` (main, account, admin, finance) с разделителями
- Определяет активный пункт через `isActivePath(item.path, activePath)`
- Рендерит `SidebarItem` для каждого пункта
- `hidden md:block` — скрыт на мобильных (< 768px)
- `overflow-y-auto` — прокрутка при большом количестве пунктов
- Фиксированная ширина `w-60` (240px)

**Tailwind-классы:**

```
Контейнер: hidden md:block w-60 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto
padding: p-4
Группа-разделитель: border-t border-gray-200 my-2
SidebarItem: (см. выше)
```

**A11y:**

- `<nav aria-label="Sidebar">` — семантический контейнер
- `aria-current="page"` — через `SidebarItem`
- Keyboard: Tab, Enter, Arrow keys

**Зависимости:**

- `next/navigation` — `usePathname`
- `@/hooks/useNavigation` — `useNavigation`
- `@/components/layouts/SidebarItem` — `SidebarItem`
- `@/components/features/navigation/nav-items.config` — `navItems`
- `@/lib/nav-utils` — `isActivePath`

---

#### 3.3.3 `Breadcrumbs` — хлебные крошки

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/layouts/Breadcrumbs.tsx` |
| **Тип** | Client Component (`'use client'`) |
| **Действие** | 🆕 Создать |
| **Задача** | NAV-06-T2 |
| **Трассировка** | US-NAV-06 AC-NAV-06-1…AC-NAV-06-6 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `pathname` | `string` | ❌ | Альтернативный pathname (если не использовать `usePathname()`) |
| `maxDepth` | `number` | ❌ | `4` по умолчанию |
| `separator` | `ReactNode` | ❌ | `›` по умолчанию |
| `className` | `string` | ❌ | Доп. классы |

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `loading` | (не применимо — синхронная генерация) | — |
| `shallow` | Глубина 1 (только корень) | Только «Дашборд» (не кликабелен) |
| `data` | 2+ уровней | Полная цепочка breadcrumbs |

**Поведение:**

- Вызывает `generateBreadcrumbs(pathname ?? usePathname(), maxDepth)`
- Кликабельные уровни (не последний) — `Link` из `next/link`
- Последний уровень — `<span>` + `aria-current="page"` (не кликабелен)
- Разделитель `›` между уровнями
- Семантика: `<nav aria-label="Breadcrumb">` + `<ol>` + `<li>`
- Длинный текст обрезается (`truncate`)

**Tailwind-классы:**

```
Контейнер: flex items-center gap-1 text-xs text-gray-500
Link: hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded
current: text-gray-900 font-medium
separator: text-gray-400
```

**A11y:**

- `<nav aria-label="Breadcrumb">` + `<ol>` + `<li>`
- `aria-current="page"` для текущего элемента
- Keyboard: Tab + Enter

**Зависимости:**

- `next/navigation` — `usePathname`
- `next/link` — `Link`
- `@/lib/nav-utils` — `generateBreadcrumbs`
- `@/shared/utils` — `cn`

---

#### 3.3.4 `MobileDrawer` — мобильное выезжающее меню

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/layouts/MobileDrawer.tsx` |
| **Тип** | Client Component (`'use client'`) |
| **Действие** | 🆕 Создать |
| **Задача** | NAV-07-T1 |
| **Трассировка** | US-NAV-07 AC-NAV-07-2…AC-NAV-07-7 |

**Props Interface:**

| Пропс | Тип | Обязательный | Описание |
|---|---|---|---|
| `isOpen` | `boolean` | ✅ | Открыт ли drawer |
| `onClose` | `() => void` | ✅ | Callback закрытия |

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `closed` | `isOpen === false` | Drawer `-translate-x-full`, overlay `opacity-0 pointer-events-none` |
| `opening` | Transition start | Drawer анимация `translate-x-0` за 300ms |
| `open` | `isOpen === true` + transition complete | Drawer visible, overlay visible, focus trap active |
| `closing` | Transition end | Drawer `-translate-x-full`, overlay `opacity-0` |

**Поведение:**

- Выезжает слева с CSS transition (`transition-transform duration-300 ease-in-out`)
- Содержит те же пункты меню, что и Sidebar (через `useNavigation()`)
- Рендерит `SidebarItem` для каждого пункта с `onClick={() => { router.push(item.path); onClose(); }}`
- **Overlay** (затемнение) на весь экран (`fixed inset-0 bg-black/50`)
- Закрытие по клику на overlay
- Закрытие по Escape (`keydown` listener через `useEffect`)
- Focus trap: `aria-modal="true"`, `role="dialog"`
- Возврат фокуса на кнопку гамбургера при закрытии (сохраняет ref)
- Авто-закрытие при изменении размера окна на desktop (`useMediaQuery` или `resize` listener)

**Tailwind-классы:**

```
Overlay: fixed inset-0 bg-black/50 z-40 transition-opacity duration-300
Drawer panel: fixed inset-y-0 left-0 w-60 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
open: translate-x-0
closed: -translate-x-full
Контент: overflow-y-auto p-4
```

**A11y:**

- `role="dialog"`, `aria-modal="true"` — drawer
- `aria-expanded={isOpen}`, `aria-controls="mobile-drawer"` — кнопка гамбургера
- Focus trap внутри drawer
- Возврат фокуса на trigger при закрытии
- Keyboard: Escape закрывает

**Зависимости:**

- `next/navigation` — `useRouter`
- `@/hooks/useNavigation` — `useNavigation`
- `@/components/layouts/SidebarItem` — `SidebarItem`
- `lucide-react` — `X` (кнопка закрытия)
- `@/shared/utils` — `cn`

---

### 3.4 UI Layer — Изменение существующих компонентов

---

#### 3.4.1 `Navbar` — модификация существующего

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/layouts/Navbar.tsx` |
| **Тип** | Client Component |
| **Действие** | 🔧 Изменить |
| **Задача** | NAV-02-T2, NAV-07-T2 |
| **Трассировка** | US-NAV-02 AC-NAV-02-4, AC-NAV-02-6, US-NAV-07 AC-NAV-07-1, AC-NAV-07-2 |

**Изменения:**

1. **Замена статического `navigation` на `useNavigation()`:**
   - Удалить хардкод массивов `navigation`, `adminNavigation`, `profileLink`
   - Использовать `const { menuItems, activePath } = useNavigation()`
   - Фильтрация: пункты группы `account` (Профиль) вынести отдельно
   - Рендерить nav items из `menuItems.filter(item => item.group !== 'account')`

2. **Добавление MobileMenuButton (гамбургер):**
   - Добавить кнопку `md:hidden` перед логотипом
   - Иконка: `Menu` из Lucide (три горизонтальные линии)
   - State: `isDrawerOpen` (useState)
   - `aria-expanded={isDrawerOpen}`, `aria-controls="mobile-drawer"`
   - Клик → toggle `isDrawerOpen`

3. **Интеграция MobileDrawer:**
   - Рендер `<MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />`
   - Desktop nav items: `hidden md:flex` (было `hidden sm:ml-6 sm:flex`)

4. **Скелетон профиля при загрузке:**
   - При `isLoadingProfile === true`: показывать pulsing block вместо «Загрузка...»
   - `w-10 h-4 bg-gray-200 animate-pulse rounded`

5. **Иконки у пунктов navbar (desktop):**
   - Каждый пункт получает иконку через `getIconByPath(item.path)`
   - `flex items-center gap-1.5` для иконки + текста

**Новые/изменённые пропсы:**

| Пропс | Тип | Описание изменения |
|---|---|---|
| `isLoadingProfile` | `boolean` | Уже есть. Использовать для skeleton. |

**Tailwind-классы (изменения):**

```
MobileMenuButton: md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
Profile skeleton: w-10 h-4 bg-gray-200 animate-pulse rounded
NavItem с иконкой: flex items-center gap-1.5
```

**A11y:**

- `aria-expanded`, `aria-controls` — гамбургер
- Nav items: `aria-current="page"` для активного
- Mobile drawer: `role="dialog"`, `aria-modal="true"`

**Зависимости (новые):**

- `@/hooks/useNavigation` — `useNavigation`
- `@/lib/nav-utils` — `getIconByPath`, `isActivePath`
- `@/components/layouts/MobileDrawer` — `MobileDrawer`
- `lucide-react` — `Menu`

---

#### 3.4.2 `AppLayout` — интеграция sidebar + breadcrumbs + mobile menu

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/layouts/AppLayout.tsx` |
| **Тип** | Client Component |
| **Действие** | 🔧 Изменить |
| **Задача** | NAV-05-T3, NAV-06-T3 |
| **Трассировка** | US-NAV-05 AC-NAV-05-1, AC-NAV-05-5, US-NAV-06 AC-NAV-06-1 |

**Изменения:**

1. **Добавление Sidebar в layout:**
   - Изменить структуру на flex: `<div className="flex">`
   - Navbar остаётся сверху (full width)
   - Sidebar + Main content — flex row под navbar

2. **Добавление Breadcrumbs:**
   - Вставить `<Breadcrumbs />` перед `<main>` (в content area)
   - Только на desktop: `hidden md:block`

3. **Адаптивная структура:**

```
<div className="min-h-screen bg-gray-50">
  <Navbar ... />
  <div className="flex">
    <Sidebar />              {/* hidden md:block */}
    <div className="flex-1">
      <Breadcrumbs />         {/* hidden md:block */}
      <main className="py-6">
        {children}
      </main>
    </div>
  </div>
</div>
```

**Новые зависимости:**

- `@/components/layouts/Sidebar` — `Sidebar`
- `@/components/layouts/Breadcrumbs` — `Breadcrumbs`

---

### 3.5 Pages Layer

---

#### 3.5.1 `ProgressBar` — индикатор загрузки при навигации

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/template.tsx` |
| **Тип** | Client Component (`'use client'`) |
| **Действие** | 🆕 Создать |
| **Задача** | NAV-01-T1 |
| **Трассировка** | US-NAV-01 AC-NAV-01-6 |

**Описание:**

Next.js `template.tsx` — special file, который перерендеривается при каждой навигации (в отличие от `layout.tsx`). Внутри — progress-bar.

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `idle` | Нет навигации | Progress-bar скрыт (`opacity-0`) |
| `loading` | Navigation start | Progress-bar `opacity-100`, width 30% → 80% (CSS animation) |
| `complete` | Navigation complete | width 100% → скрывается через 300ms |

**Поведение:**

- При mount (создание template): показывает progress-bar анимацию
- `useEffect` запускает CSS transition width: 30% → 80% → 100%
- После 300ms от `width: 100%` → `opacity: 0`
- Следующая навигация: Next.js пересоздаёт template, анимация повторяется

**Tailwind-классы:**

```
fixed top-0 left-0 w-full h-1 z-50 bg-blue-600 transition-all duration-300 ease-out
idle: opacity-0
loading: opacity-100
```

**Зависимости:**

- `react` — `useEffect`, `useState`

---

#### 3.5.2 `ErrorPage` — страница ошибки с кнопкой «Повторить»

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/error.tsx` |
| **Тип** | Client Component (`'use client'`) — Next.js Error Boundary |
| **Действие** | 🆕 Создать |
| **Задача** | NAV-01-T2 |
| **Трассировка** | US-NAV-01 AC-NAV-01-7 |

**Props (Next.js Error Boundary):**

| Пропс | Тип | Описание |
|---|---|---|
| `error` | `Error & { digest?: string }` | Объект ошибки |
| `reset` | `() => void` | Callback повтора загрузки |

**Поведение:**

- Отображает сообщение «Произошла ошибка при загрузке страницы»
- Кнопка «Повторить» вызывает `reset()`
- Иконка `AlertTriangle` из Lucide

**Tailwind-классы:**

```
Контейнер: flex flex-col items-center justify-center min-h-[50vh] text-center p-8
Иконка: text-4xl text-red-500 mb-4
Заголовок: text-xl font-semibold text-gray-900 mb-2
Описание: text-gray-500 mb-6
Кнопка: (Button variant="primary")
```

**A11y:**

- `role="alert"` — контейнер
- Кнопка «Повторить» — `aria-label="Повторить попытку загрузки"`

**Зависимости:**

- `lucide-react` — `AlertTriangle`
- `@/components/ui/Button` — `Button`

---

#### 3.5.3 `NotFoundPage` — контекстная 404 страница

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/not-found.tsx` |
| **Тип** | Client Component |
| **Действие** | 🔧 Изменить |
| **Задача** | NAV-03-T1 |
| **Трассировка** | US-NAV-03 AC-NAV-03-1, AC-NAV-03-2, AC-NAV-03-3 |

**Изменения:**

1. **Добавление `useSession()`:**
   - Проверка статуса авторизации для выбора ссылки

2. **Контекстные ссылки:**
   - `session.status === 'authenticated'` → `Link href="/dashboard"` с текстом «Вернуться на дашборд»
   - Иначе → `Link href="/"` с текстом «На главную»

3. **Улучшенный дизайн:**
   - Иконка `SearchX` из Lucide (`text-6xl`)
   - Заголовок «404 — Страница не найдена» (`text-3xl font-bold`)
   - Описание «Извините, запрошенная страница не существует.»
   - Кнопка `Button variant="primary"` для навигации

4. **Доступность:**
   - `role="alert"` — контейнер

**Состояния:**

| Состояние | Условие | Отображение |
|---|---|---|
| `loading` | `session.status === 'loading'` | Skeleton button placeholder |
| `authenticated` | `session.status === 'authenticated'` | «Вернуться на дашборд» → `/dashboard` |
| `unauthenticated` | `session.status === 'unauthenticated'` | «На главную» → `/` |
| `error` | `session.status === 'error'` | Fallback: «На главную» |

**Tailwind-классы:**

```
Контейнер: flex flex-col items-center justify-center min-h-screen bg-white text-center p-8
Иконка: text-6xl text-gray-400 mb-6
Заголовок: text-3xl font-bold text-gray-900 mb-2
Описание: text-gray-500 mb-8 max-w-md
Кнопка: (Button variant="primary")
```

**A11y:**

- `role="alert"` — контейнер
- `aria-label="Страница не найдена"`

**Зависимости (новые):**

- `next-auth/react` — `useSession`
- `lucide-react` — `SearchX`
- `@/components/ui/Button` — `Button`

---

## 4. 📎 Связанные артефакты

- 📋 **План:** [`docs/plans/REQ-NAV-001-realization-plan.md`](../../plans/REQ-NAV-001-realization-plan.md)
- 📋 **Макет:** [`docs/plans/REQ-NAV-001-layout.md`](../../plans/REQ-NAV-001-layout.md)
- 📋 **Требования:** [`docs/requirements/REQ-NAV-001.md`](../../requirements/REQ-NAV-001.md)
- 📋 **US-NAV-01:** [`docs/user-stories/US-NAV-01-защита-маршрутов-и-редиректы.md`](../../user-stories/US-NAV-01-защита-маршрутов-и-редиректы.md)
- 📋 **US-NAV-02:** [`docs/user-stories/US-NAV-02-навигационная-панель-top-navbar.md`](../../user-stories/US-NAV-02-навигационная-панель-top-navbar.md)
- 📋 **US-NAV-03:** [`docs/user-stories/US-NAV-03-страница-404-и-обработка-несуществующих-маршрутов.md`](../../user-stories/US-NAV-03-страница-404-и-обработка-несуществующих-маршрутов.md)
- 📋 **US-NAV-05:** [`docs/user-stories/US-NAV-05-боковое-меню-sidebar.md`](../../user-stories/US-NAV-05-боковое-меню-sidebar.md)
- 📋 **US-NAV-06:** [`docs/user-stories/US-NAV-06-хлебные-крошки-breadcrumbs.md`](../../user-stories/US-NAV-06-хлебные-крошки-breadcrumbs.md)
- 📋 **US-NAV-07:** [`docs/user-stories/US-NAV-07-адаптивное-мобильное-меню-гамбургер.md`](../../user-stories/US-NAV-07-адаптивное-мобильное-меню-гамбургер.md)
- 🎨 **Токены:** [`docs/design/tokens/`](../../design/tokens/)
- 🧩 **Компоненты:** [`docs/design/components/`](../../design/components/)
- 📁 **Текущая реализация:** [`src/components/layouts/Navbar.tsx`](../../../src/components/layouts/Navbar.tsx), [`src/components/layouts/AppLayout.tsx`](../../../src/components/layouts/AppLayout.tsx), [`src/app/not-found.tsx`](../../../src/app/not-found.tsx)

---

## 📝 История изменений

| Дата       | Версия | Автор            | Изменение                                          |
| ---------- | ------ | ---------------- | --------------------------------------------------- |
| 2026-07-25 | v1.0   | Component Spec   | Создание спецификации для REQ-NAV-001 (B-009)       |
