# Спецификация компонент: Вкладка "Общение" (Comms Tabs MVP)

> **Назначение:** Спецификация компонент и скелетов кода для [REQ-COMMS-001 MVP](../../plans/REQ-COMMS-001-mvp-plan.md)
> **Создано:** `component-spec` режим
> **Статус:** `[DRAFT]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `comms-tabs-mvp` |
| **План реализации** | [`docs/plans/REQ-COMMS-001-mvp-plan.md`](../../plans/REQ-COMMS-001-mvp-plan.md) |
| **User Stories** | US-21-36, US-21-37 |
| **Требования** | REQ-COMMS-001 |
| **Модель данных** | Без изменений (использует существующие сущности) |
| **Версия** | `v1.0` |
| **Дата** | `2026-07-24` |
| **Статус** | `[DRAFT]` |

---

## 2. 📊 Матрица трассировки

> Каждая строка связывает компонент с требованиями. Без строки в матрице — нет компонента.
> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | `UnreadCounts` | Domain/Types | ✏️ | US-21-37 | AC-1, AC-2, AC-6 | REQ-COMMS-001-MVP-T0-1 | `[TODO]` |
| 2 | `ICommsRepository.getUnreadCounts()` | Domain/Repo Interface | ✏️ | US-21-37 | AC-6 | REQ-COMMS-001-MVP-T0-1 | `[TODO]` |
| 3 | `PrismaCommsRepository.getUnreadCounts()` | Domain/Repo Prisma | ✏️ | US-21-37 | AC-6 | REQ-COMMS-001-MVP-T0-1 | `[TODO]` |
| 4 | `CommsService.getUnreadCounts()` | Domain/Service | ✏️ | US-21-37 | AC-6 | REQ-COMMS-001-MVP-T0-1 | `[TODO]` |
| 5 | `GET /api/v1/comms/unread-counts` | API | 🆕 | US-21-37 | AC-6 | REQ-COMMS-001-MVP-T1-1 | `[TODO]` |
| 6 | `CommsTab` | UI | 🆕 | US-21-36 | AC-3, AC-4 | REQ-COMMS-001-MVP-T2-1 | `[TODO]` |
| 7 | `CommsTabs` | UI | 🆕 | US-21-36, US-21-37 | AC-3..AC-7, AC-1..AC-5 | REQ-COMMS-001-MVP-T2-1 | `[TODO]` |
| 8 | `CommsLayout` (layout.tsx) | Page/Layout | 🆕 | US-21-36 | AC-3, AC-4 | REQ-COMMS-001-MVP-T3-1 | `[TODO]` |
| 9 | `CommsPage` (redirect page.tsx) | Page | 🆕 | US-21-36 | AC-2 | REQ-COMMS-001-MVP-T3-2 | `[TODO]` |
| 10 | `CommsModerationPage` | Page | 🆕 | US-21-36 | AC-6, AC-7 | REQ-COMMS-001-MVP-T3-55 | `[TODO]` |
| 11 | `Navbar` (обновление) | UI/Layout | 🔧 | US-21-36 | AC-1 | REQ-COMMS-001-MVP-T4-1 | `[TODO]` |
| 12 | `CommsTabs/index.ts` | UI | 🆕 | — | — | REQ-COMMS-001-MVP-T2-1 | `[TODO]` |

### Проверка покрытия AC

| US | AC | Покрыт в строке | Статус |
|---|---|---|---|
| US-21-36 | AC-1 (пункт «Общение» в навбаре) | #11 | ✅ |
| US-21-36 | AC-2 (редирект `/dashboard/comms`) | #9 | ✅ |
| US-21-36 | AC-3 (панель вкладок) | #6, #7, #8 | ✅ |
| US-21-36 | AC-4 (переключение вкладок) | #6, #7 | ✅ |
| US-21-36 | AC-5 (прямой переход по URL) | #7, #8 | ✅ |
| US-21-36 | AC-6 (скрытие «Модерация» для MEMBER) | #7, #10 | ✅ |
| US-21-36 | AC-7 («Модерация» для ADMIN) | #7, #10 | ✅ |
| US-21-37 | AC-1 (бейдж на «Личные сообщения») | #1..#7 | ✅ |
| US-21-37 | AC-2 (бейдж на «Групповые чаты») | #1..#7 | ✅ |
| US-21-37 | AC-3 (скрытие бейджа при 0) | #7 | ✅ |
| US-21-37 | AC-4 (нет бейджа на «Объявления») | #7 | ✅ |
| US-21-37 | AC-5 (обновление счётчика) | #7 | ✅ |
| US-21-37 | AC-6 (API unread-counts) | #1..#5 | ✅ |

---

## 3. 🏗️ Спецификация по слоям

---

### 3.1 Domain Layer

---

#### 3.1.1 `UnreadCounts` — тип в `comms.types.ts`

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/comms/comms.types.ts` |
| **Действие** | ✏️ Добавить тип |
| **Задача** | REQ-COMMS-001-MVP-T0-1 |
| **Трассировка** | US-21-37 AC-1, AC-2, AC-6 |

**Интерфейс:**

| Интерфейс | Описание | Поля |
|---|---|---|
| `UnreadCounts` | Счётчики непрочитанных по категориям | `messages: number`, `chats: number` |

**Инварианты:**
- `messages >= 0`, `chats >= 0`
- `messages` — сумма непрочитанных в DIRECT диалогах
- `chats` — сумма непрочитанных в GROUP чатах

---

#### 3.1.2 `ICommsRepository.getUnreadCounts()` — метод в интерфейсе

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/comms/comms.repository.interface.ts` |
| **Действие** | ✏️ Добавить метод |
| **Задача** | REQ-COMMS-001-MVP-T0-1 |
| **Трассировка** | US-21-37 AC-6 |

**Метод:**

| Метод | Параметры | Возврат | Описание |
|---|---|---|---|
| `getUnreadCounts` | `userId: string` | `Promise<UnreadCounts>` | Подсчитывает непрочитанные сообщения по категориям |

**Инварианты методов:**
- `messages`: считает сообщения в DIRECT диалогах, где `conversation_participants.last_read_at` < `messages.created_at` и `messages.senderId !== userId`
- `chats`: аналогично для GROUP диалогов

---

#### 3.1.3 `PrismaCommsRepository.getUnreadCounts()` — реализация

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/comms/comms.repository.prisma.ts` |
| **Действие** | ✏️ Добавить метод |
| **Задача** | REQ-COMMS-001-MVP-T0-1 |
| **Трассировка** | US-21-37 AC-6 |

**Описание:** Prisma-реализация `getUnreadCounts()`.

**Зависимости (DI):**
- `prisma` — PrismaClient (через модуль)

---

#### 3.1.4 `CommsService.getUnreadCounts()` — метод сервиса

| Параметр | Значение |
|---|---|
| **Файл** | `src/domains/comms/comms.service.ts` |
| **Действие** | ✏️ Добавить метод |
| **Задача** | REQ-COMMS-001-MVP-T0-1 |
| **Трассировка** | US-21-37 AC-6 |

**Метод:**

| Метод | Параметры | Возврат | Бизнес-правила |
|---|---|---|---|
| `getUnreadCounts` | `userId: string` | `Promise<UnreadCounts>` | Делегирует в Repository |

---

### 3.2 API Layer

---

#### 3.2.1 `GET /api/v1/comms/unread-counts`

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/api/v1/comms/unread-counts/route.ts` |
| **Действие** | 🆕 Создать |
| **Задача** | REQ-COMMS-001-MVP-T1-1 |
| **Трассировка** | US-21-37 AC-6 |

**HTTP-метод:** `GET`

**Авторизация:** требуется (`auth()`)

**Ответ:**
```json
{
  "success": true,
  "data": {
    "messages": 3,
    "chats": 2
  }
}
```

**Обработка ошибок:**
- 500 — `{ success: false, error: "Не удалось загрузить счётчики" }`

---

### 3.3 UI Layer

---

#### 3.3.1 `CommsTab` — отдельная вкладка

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/comms/CommsTab/CommsTab.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | REQ-COMMS-001-MVP-T2-1 |
| **Трассировка** | US-21-36 AC-3, AC-4 |

**Пропсы:**

| Prop | Тип | Описание |
|------|-----|----------|
| `href` | `string` | Маршрут вкладки |
| `label` | `string` | Текст вкладки |
| `icon` | `ReactNode` | Иконка вкладки |
| `active` | `boolean` | Активна ли вкладка |
| `badgeCount` | `number \| undefined` | Количество непрочитанных (опционально) |

**Состояния:**
- `active` — подчёркнута `color.accent.default`
- `idle` — `color.text.secondary`
- `hover` — `color.text.primary`

**Токены:**
- Активное подчёркивание: `color.accent.default`
- Текст неактивной: `color.text.secondary`
- Текст активной: `color.text.primary`
- Бейдж: `Badge variant="danger"` → `color.danger`, `radius-full`

**Зависимости:**
- `next/link` — `Link`
- `@/components/ui/Badge` — `Badge`
- `@/shared/utils` — `cn`

---

#### 3.3.2 `CommsTabs` — панель вкладок

| Параметр | Значение |
|---|---|
| **Файл** | `src/components/features/comms/CommsTabs/CommsTabs.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | REQ-COMMS-001-MVP-T2-1 |
| **Трассировка** | US-21-36 AC-3..AC-7, US-21-37 AC-1..AC-5 |

**⚠️ Оценка:** ~80 строк — превышает 50 — рекомендуется разбиение

**Рекомендация по разбиению:**

| Подкомпонент | Ответственность |
|---|---|
| `CommsTabs` | Координация, загрузка счётчиков, рендер списка вкладок |
| `CommsTab` | Отдельная вкладка (Link + Badge) |

**Пропсы:**

| Prop | Тип | Описание |
|------|-----|----------|
| `activeTab` | `'messages' \| 'chats' \| 'announcements' \| 'moderation'` | Активная вкладка |
| `userRoles` | `string[]` | Роли пользователя |

**Состояния:**
- `loading` — счётчики загружаются (бейджи скрыты)
- `error` — ошибка загрузки (бейджи скрыты, навигация работает)
- `data` — бейджи отображаются при count > 0

**Поведение:**
- `useEffect` для загрузки `/api/v1/comms/unread-counts` при mount
- Обновление счётчиков при `activeTab` change
- Вкладка «Модерация» скрыта если `!userRoles.includes('ADMIN') && !userRoles.includes('SUPER_ADMIN')`
- Бейдж "99+" при count > 99
- Бейдж скрыт при count === 0

**ARIA:**
- `role="tablist"`
- `role="tab"` + `aria-selected` на каждой вкладке

**Токены:**
- Фон панели: `color.bg.primary`
- Активная вкладка: `color.accent.default` (underline)
- Неактивная вкладка: `color.text.secondary`
- Hover: `color.text.primary`
- Бейдж: `color.danger`, `radius-full`

**Зависимости:**
- `next/navigation` — `usePathname`
- `next/link` — `Link`
- `@/components/ui/Badge` — `Badge`
- `@/components/features/comms/CommsTab` — `CommsTab`
- `@/lib/api-client` — `apiClient`

---

### 3.4 Pages Layer

---

#### 3.4.1 `CommsLayout` — layout-обёртка

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/comms/layout.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | REQ-COMMS-001-MVP-T3-1 |
| **Трассировка** | US-21-36 AC-3, AC-4 |

**Описание:** Client Component (`'use client'`) — определяет `activeTab` из `pathname`, рендерит `CommsTabs` + `children`.

**Зависимости:**
- `next/navigation` — `usePathname`
- `next-auth/react` — `useSession`
- `@/components/features/comms/CommsTabs` — `CommsTabs`

---

#### 3.4.2 `CommsPage` — страница-редирект

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/comms/page.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | REQ-COMMS-001-MVP-T3-2 |
| **Трассировка** | US-21-36 AC-2 |

**Описание:** Client Component с `useRouter().replace('/dashboard/comms/messages')`. Return `null`.

---

#### 3.4.3 `CommsModerationPage` — заглушка модерации

| Параметр | Значение |
|---|---|
| **Файл** | `src/app/dashboard/comms/moderation/page.tsx` |
| **Действие** | 🆕 Создать |
| **Задача** | REQ-COMMS-001-MVP-T3-55 |
| **Трассировка** | US-21-36 AC-6, AC-7 |

**Описание:** Client Component — проверка роли, EmptyState заглушка.

**Поведение:**
- Для MEMBER — редирект на `/dashboard/comms/messages`
- Для ADMIN/SUPER_ADMIN — EmptyState с текстом "Функции модерации будут добавлены в ближайшем обновлении"

**Токены:**
- Заголовок: `text.heading-2` + `color.text.primary`
- EmptyState: `color.bg.primary`
- Описание: `text.body-sm` + `color.text.secondary`

**Зависимости:**
- `next/navigation` — `useRouter`
- `next-auth/react` — `useSession`
- `@/components/ui/EmptyState` — `EmptyState`

---

## 4. 📎 Связанные артефакты

- 📋 **US-21-36:** [`docs/user-stories/US-21-36-навигация-по-вкладке-общение.md`](../../user-stories/US-21-36-навигация-по-вкладке-общение.md)
- 📋 **US-21-37:** [`docs/user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md`](../../user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md)
- 📋 **План:** [`docs/plans/REQ-COMMS-001-mvp-plan.md`](../../plans/REQ-COMMS-001-mvp-plan.md)
- 📋 **Макет:** [`docs/design/layouts/comms/layout.md`](../../design/layouts/comms/layout.md)
- 🎨 **Токены:** [`docs/design/tokens/`](../../design/tokens/)
- 🧩 **Компоненты:** [`docs/design/components/`](../../design/components/)
- 📁 **Домен:** [`src/domains/comms/`](../../../src/domains/comms/)
- 📁 **UI:** [`src/components/features/comms/`](../../../src/components/features/comms/)
