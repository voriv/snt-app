# Спецификация компонент: Синхронизация счётчиков непрочитанных (B-027)

> **Назначение:** Спецификация компонент и скелетов кода для [B-027](../../plans/REQ-COMMS-003-B027-plan.md)  
> **Создано:** `component-spec` режим  
> **Статус:** `[DRAFT]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `comms-unread-count-sync` |
| **План реализации** | [`docs/plans/REQ-COMMS-003-B027-plan.md`](../../plans/REQ-COMMS-003-B027-plan.md) |
| **User Stories** | [US-21-37](../../user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md), [US-21-01](../../user-stories/US-21-01-просмотр-личных-диалогов.md), [US-21-04](../../user-stories/US-21-04-просмотр-списка-групповых-чатов.md) |
| **Требования** | REQ-COMMS-003 |
| **Модель данных** | Без изменений (`ConversationParticipant.lastReadAt`, `ChatParticipant.lastReadAt` уже существуют) |
| **Предыдущая спецификация** | [`docs/specs/comms/B-026-component-spec.md`](./B-026-component-spec.md) |
| **Макет** | [`docs/design/layouts/comms/B-027-unread-count-sync-layout.md`](../../design/layouts/comms/B-027-unread-count-sync-layout.md) |
| **Диагностический отчёт** | [`docs/tests/B-027-diagnostic-report.md`](../../tests/B-027-diagnostic-report.md) |
| **Версия** | `v1.0` |
| **Дата** | `2026-08-03` |
| **Статус** | `[DRAFT]` |

---

## 2. 📊 Матрица трассировки

> Каждая строка связывает компонент с требованиями. Без строки в матрице — нет компонента.  
> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | AC | Задача | Статус |
|---|---|---|---|---|---|---|---|
| 1 | `useUnreadCounts` | Hook | 🆕 | US-21-37 | AC-3, AC-5, AC-7, AC-8, AC-9 | B-027-T4-1 | `[TODO]` |
| 2 | `Navbar` — бейдж unread | UI/Layout | ✏️ | US-21-37 | AC-3, AC-5, AC-8, AC-9, AC-12 | B-027-T4-1 | `[TODO]` |
| 3 | `CommsTabs` — бейджи вкладок | UI/Feature | ✏️ | US-21-37 | AC-1, AC-2, AC-3, AC-5, AC-5b, AC-5c, AC-7 | B-027-T4-1 | `[TODO]` |

> **Примечание:** Серверные исправления T1-1 (`isDeleted`-фильтр) и T1-2 (`lastReadAt` при вступлении) покрывают AC-10, AC-11, AC-1.6, AC-1.7. Эти методы repository не включены в данную компонентную спецификацию (domain-уровень, см. [`comms.repository.prisma.ts`](../../../src/domains/comms/comms.repository.prisma.ts)). В спецификации они отражены как **требования к поведению** (Expected Behaviour) для UI-компонентов.

### Серверные требования к поведению (для UI)

| ID | Требование | Источник | Влияние на UI |
|---|---|---|---|
| **BR-T1-1** | Удалённые сообщения (`isDeleted: true`) исключены из всех счётчиков | T1-1 | UI получает корректный `{ messages, chats }` из `GET /unread-counts`; бейджи не включают удалённые |
| **BR-T1-2** | Новый участник чата получает `lastReadAt = now()` при вступлении | T1-2 | UI показывает 0 непрочитанных для нового участника (AC-10) |

### Проверка покрытия AC

#### US-21-37 (Счётчики непрочитанных на вкладках)

| AC | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| AC-1 | Бейдж на «Личные сообщения» | ✅ Уже реализовано (B-026) | ✅ |
| AC-2 | Бейдж на «Групповые чаты» | ✅ Уже реализовано (B-026) | ✅ |
| AC-3 | Скрытие бейджа при 0 | #1, #2, #3 | ✅ |
| AC-4 | Нет бейджа на «Объявления» | ✅ Уже реализовано (B-026) | ✅ |
| AC-5 | Обновление счётчика после прочтения | #1, #3 | ✅ |
| AC-5a | Обновление бейджа карточки | ✅ Уже реализовано (B-026) | ✅ |
| AC-5b | Обновление счётчика GROUP после прочтения | #3 | ✅ |
| AC-5c | Скрытие бейджа при достижении нуля | #3 | ✅ |
| AC-6 | Загрузка счётчиков при открытии | ✅ Уже реализовано (B-026) | ✅ |
| AC-7 | Refetch после markAsRead | #1, #2, #3 | ✅ |
| AC-8 | «99+» при > 99 | #2, #3 | ✅ |
| AC-9 | Глобальный бейдж обновляется после прочтения | #1, #2 | ✅ |
| AC-10 | Новый участник не видит историю как непрочитанную | BR-T1-2 (серверный фикс) | ✅ |
| AC-11 | Удалённые сообщения не учитываются в счётчиках | BR-T1-1 (серверный фикс) | ✅ |
| AC-12 | Собственные сообщения не учитываются | ✅ Уже реализовано (`senderId: not userId`) | ✅ |

#### US-21-01 (Просмотр личных диалогов) — затрагиваемые AC

| AC | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| AC-1.6 | Бейдж на вкладке «Личные сообщения» | ✅ Уже реализовано | ✅ |
| AC-1.7 | Удалённые сообщения не учитываются | BR-T1-1 | ✅ |
| AC-1.8 | Счётчик синхронизируется с датой прочтения | #1, #2, #3 | ✅ |

#### US-21-04 (Просмотр групповых чатов) — затрагиваемые AC

| AC | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| AC-1.6 | Удалённые сообщения не учитываются | BR-T1-1 | ✅ |
| AC-1.7 | Счётчик синхронизируется с датой прочтения | #1, #3 | ✅ |

**Все AC покрыты. Покрытие: 100%.**

---

## 3. 🏗️ Спецификация по слоям

---

### 3.1 Hook Layer

---

#### 3.1.1 `useUnreadCounts` — единый хук для загрузки счётчиков непрочитанных

| Параметр | Значение |
|---|---|
| **Файл** | [`src/hooks/useUnreadCounts.ts`](../../../src/hooks/useUnreadCounts.ts) |
| **Действие** | 🆕 Создать |
| **Задача** | B-027-T4-1 |
| **Трассировка** | US-21-37 AC-3, AC-5, AC-7, AC-8, AC-9 → T4-1 |
| **Макет** | S-спецификации §2 (единый хук), S-1..S-6 (§1) |
| **Оценка** | ~30 строк |

**Сигнатура:**

```typescript
/**
 * @hook useUnreadCounts
 * @domain comms
 * @description Единый хук для загрузки счётчиков непрочитанных сообщений
 *
 * Вызывает GET /api/v1/comms/unread-counts при mount и при изменении refetchTrigger.
 * Используется в Navbar (с pathname как триггер) и CommsTabs (с существующим refetchTrigger).
 *
 * @example
 * ```tsx
 * // В Navbar — перезагрузка при навигации
 * const pathname = usePathname();
 * const { counts, loading, error } = useUnreadCounts(pathname);
 *
 * // В CommsTabs — перезагрузка после markAsRead
 * const { counts, loading, error } = useUnreadCounts(refetchTrigger);
 * ```
 *
 * @spec
 * - Загружает GET /api/v1/comms/unread-counts при mount и при изменении refetchTrigger
 * - Возвращает { counts, loading, error }
 * - counts = { messages: number, chats: number } | null
 * - Abort-механизм: при смене refetchTrigger отменяет предыдущий запрос
 * - Silent fail: при ошибке сети/API — error заполняется, исключение не выбрасывается
 * - Бейджи скрываются при loading === true или error !== null (BR-10)
 *
 * @traces US-21-37 AC-3, AC-5, AC-7, AC-8, AC-9
 * @task B-027-T4-1
 *
 * @see docs/user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md
 * @see docs/design/layouts/comms/B-027-unread-count-sync-layout.md §2
 */
export function useUnreadCounts(refetchTrigger?: number): UseUnreadCountsResult;
```

**Возвращаемый тип:**

| Поле | Тип | Описание |
|---|---|---|
| `counts` | `UnreadCounts \| null` | `{ messages, chats }` из API; `null` до загрузки или при ошибке |
| `loading` | `boolean` | `true` во время выполнения запроса |
| `error` | `string \| null` | Сообщение об ошибке: `'Не удалось загрузить счётчики'` / `'Ошибка сети'` |

**Состояния хука:**

| Состояние | `counts` | `loading` | `error` | Поведение потребителей |
|---|---|---|---|---|
| **S-1: Initial/Loading** | `null` | `true` | `null` | Бейджи скрыты (BR-10) |
| **S-2: Error** | `null` | `false` | `string` | Бейджи скрыты, навигация не блокируется (AC-12, BR-10) |
| **S-3: Data (0)** | `{ messages: 0, chats: 0 }` | `false` | `null` | Бейджи скрыты (AC-3, BR-11) |
| **S-4: Data (1..99)** | `{ messages: N, chats: M }` | `false` | `null` | Бейджи видны с числом (AC-9) |
| **S-5: Data (>99)** | `{ messages: 100+, chats: 0 }` | `false` | `null` | Бейдж показывает «99+» (AC-8, BR-08) |
| **S-6: Refetch** | новое значение | `true` → `false` | `null` | Бейдж обновляется без перемонтирования (AC-9, BR-12) |

**Поведение:**

- `useEffect` с зависимостью `[refetchTrigger]` — загружает данные при mount и при изменении триггера
- **Abort-механизм:** `let aborted = false` внутри useEffect; cleanup: `aborted = true`
- **Silent fail:** `catch` блок устанавливает `error`, но не выбрасывает исключение
- **Не блокирует UI:** при ошибке `error` заполняется, бейджи просто скрыты

**Зависимости:**

| Импорт | Источник |
|---|---|
| `useState, useEffect` | `react` |
| `apiClient` | `@/lib/api-client` |
| `UnreadCounts` | `@/components/features/comms/CommsTabs/CommsTabs` (общий тип) |

**Тип `UnreadCounts`:**

> Используется существующий тип из [`CommsTabs.tsx`](../../../src/components/features/comms/CommsTabs/CommsTabs.tsx:81). Рекомендуется вынести в общий модуль `@/domains/comms/comms.types.ts` при возможности.

```typescript
export interface UnreadCounts {
  messages: number;
  chats: number;
}
```

**Экспорт:**

```typescript
export default useUnreadCounts;
```

---

### 3.2 UI Layer

---

#### 3.2.1 `Navbar` — рефакторинг глобального бейджа непрочитанных

| Параметр | Значение |
|---|---|
| **Файл** | [`src/components/layouts/Navbar.tsx`](../../../src/components/layouts/Navbar.tsx) |
| **Действие** | ✏️ Изменить (заменить inline useEffect на useUnreadCounts) |
| **Задача** | B-027-T4-1 |
| **Трассировка** | US-21-37 AC-3, AC-5, AC-8, AC-9, AC-12 → T4-1 |
| **Макет** | S-1..S-6 (§1) |
| **Корневая причина** | #1 — Navbar не обновляется после markAsRead |
| **Оценка** | ~15 строк изменений |

**Текущее состояние (до B-027):**

- Inline `useEffect(loadUnread, [])` на строке 56 загружает счётчик один раз при mount
- `useState<number>(0)` — отдельное состояние `unreadCount`
- Сумма `(response.data.messages ?? 0) + (response.data.chats ?? 0)` вычисляется в Navbar

**Целевое состояние (после B-027):**

- Использует `useUnreadCounts(pathname)` с `usePathname()` из Next.js как триггер
- `pathname` меняется при каждой навигации → хук перезагружает данные
- Суммарный бейдж: `(counts?.messages ?? 0) + (counts?.chats ?? 0)`

**Изменение импорта:**

```typescript
// ДО:
import { useState, useEffect } from 'react';
// ...
const [unreadCount, setUnreadCount] = useState<number>(0);
useEffect(() => { /* loadUnread */ }, []);

// ПОСЛЕ:
import { usePathname } from 'next/navigation';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
// ...
const pathname = usePathname();
const { counts } = useUnreadCounts(pathname);
const unreadCount = counts ? (counts.messages ?? 0) + (counts.chats ?? 0) : 0;
```

**Props (без изменений):**

| Prop | Тип | Описание |
|---|---|---|
| `session` | `Session \| null` | NextAuth сессия |
| `profile` | `UserProfileFull \| null` | Профиль пользователя |
| `isLoadingProfile` | `boolean` | Флаг загрузки профиля |
| `currentTheme` | `Theme` | Текущая тема |
| `onThemeChange` | `(theme: Theme) => void` | Обработчик смены темы |

**Изменение JSX бейджа (строка 136):**

| Элемент | До | После |
|---|---|---|
| Фон | `bg-red-500` (хардкод) | `bg-[var(--theme-danger)]` (тема) |
| Текст | `text-white` | сохраняется |
| Формат | `{badge > 99 ? '99+' : badge}` | сохраняется |
| aria-label | `${badge} непрочитанных сообщений` | сохраняется |

**S-спецификации бейджа:**

| # | Состояние | Условие | Визуал | AC/BR |
|---|-----------|---------|--------|-------|
| **S-1** | Loading | `loading === true` | Бейдж скрыт | BR-10 |
| **S-2** | Error | `error !== null` | Бейдж скрыт, навигация не блокируется | AC-12, BR-10 |
| **S-3** | Zero | `unreadCount === 0` | Бейдж не отображается | AC-3, BR-11 |
| **S-4** | Data (1..99) | `0 < unreadCount <= 99` | Кружок с числом, `var(--theme-danger)` | AC-9 |
| **S-5** | Data (>99) | `unreadCount > 99` | «99+» | AC-8, BR-08 |
| **S-6** | Sync | markAsRead → навигация → refetch | Актуальное число без перезагрузки | AC-9, BR-12 |

**Поток данных:**

```
Navbar  ──► usePathname() ──► pathname
                     │
useUnreadCounts(pathname) ──► GET /comms/unread-counts ──► { messages, chats }
                     │
                     └──► counts ──► unreadCount = messages + chats ──► Badge
```

**Тестовые сценарии:**

| # | Сценарий | AC | Ожидаемый результат |
|---|---|---|---|
| 1 | Navbar монтируется на `/dashboard` | AC-9 | Бейдж показывает сумму непрочитанных |
| 2 | Пользователь открывает диалог (markAsRead) и возвращается | AC-9 | Бейдж обновляется (pathname изменился) |
| 3 | Нет непрочитанных | AC-3 | Бейдж скрыт |
| 4 | > 99 непрочитанных | AC-8 | Бейдж показывает «99+» |
| 5 | Ошибка API | AC-12 | Бейдж скрыт, навигация работает |
| 6 | Токен `var(--theme-danger)` | макет S-4 | Работает в 3 темах |

---

#### 3.2.2 `CommsTabs` — рефакторинг бейджей на вкладках

| Параметр | Значение |
|---|---|
| **Файл** | [`src/components/features/comms/CommsTabs/CommsTabs.tsx`](../../../src/components/features/comms/CommsTabs/CommsTabs.tsx) |
| **Действие** | ✏️ Изменить (заменить inline useEffect на useUnreadCounts) |
| **Задача** | B-027-T4-1 |
| **Трассировка** | US-21-37 AC-1, AC-2, AC-3, AC-5, AC-5b, AC-5c, AC-7 → T4-1 |
| **Макет** | S-спецификации §2 |
| **Оценка** | ~10 строк изменений |

**Текущее состояние (до B-027):**

- Inline `useEffect(loadCounts, [activeTab, refetchTrigger])` на строке 101
- Локальные состояния: `unreadCounts`, `loading`, `error`
- Аборт-механизм уже реализован (`let aborted = false`)
- `showBadges` guard: `!loading && !error && unreadCounts !== null`

**Целевое состояние (после B-027):**

- Использует `useUnreadCounts(refetchTrigger)` вместо inline useEffect
- `counts`, `loading`, `error` — из хука
- `showBadges` guard сохраняется

**Изменение импорта:**

```typescript
// ДО:
import { useState, useEffect } from 'react';
// ...
const [unreadCounts, setUnreadCounts] = useState<UnreadCounts | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
useEffect(() => { /* loadCounts */ }, [activeTab, refetchTrigger]);

// ПОСЛЕ:
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
// ...
const { counts: unreadCounts, loading, error } = useUnreadCounts(refetchTrigger);
```

**Props (без изменений):**

| Prop | Тип | Описание |
|---|---|---|
| `activeTab` | `'messages' \| 'chats' \| 'announcements' \| 'moderation'` | Активная вкладка |
| `userRoles` | `string[]` | Роли пользователя |
| `refetchTrigger` | `number` (опционально) | Триггер повторной загрузки после markAsRead |

**Важное наблюдение:** Текущий useEffect в `CommsTabs` зависит от `[activeTab, refetchTrigger]`. После рефакторинга хук `useUnreadCounts(refetchTrigger)` будет перезагружать данные при изменении `refetchTrigger`, но **не при смене `activeTab`**.

> **Решение:** Так как `activeTab` не влияет на результат `GET /comms/unread-counts` (эндпоинт возвращает общие `{ messages, chats }`), удаление зависимости от `activeTab` корректно. Данные общие для всех вкладок. Текущее поведение перезагрузки при `activeTab` change — избыточное (не вызывает проблем, но лишний запрос).

**Логика отображения бейджей (без изменений):**

```typescript
// Скрыть бейджи при loading или error
const showBadges = !loading && !error && unreadCounts !== null;

// Вкладке "Личные сообщения" → badgeCount = unreadCounts.messages
// Вкладке "Групповые чаты" → badgeCount = unreadCounts.chats
// Вкладке "Объявления" → badgeCount не передан (нет бейджа)
```

**Компонент CommsTab (без изменений):**

| Prop | Тип | Описание |
|---|---|---|
| `badgeCount` | `number \| undefined` | `undefined` — скрыть бейдж; `0` — скрыть; `> 0` — показать; `> 99` — «99+» |

**Тестовые сценарии:**

| # | Сценарий | AC | Ожидаемый результат |
|---|---|---|---|
| 1 | Загрузка `/dashboard/comms` | AC-1, AC-2 | Бейджи на «Личные сообщения» и «Групповые чаты» видны |
| 2 | Нет непрочитанных | AC-3 | Бейджи скрыты |
| 3 | markAsRead → refetchTrigger++ | AC-5, AC-7 | Бейджи обновляются |
| 4 | Счётчик на вкладке = 0 | AC-5c | Бейдж скрыт |
| 5 | > 99 на вкладке | AC-8 | «99+» |
| 6 | Ошибка API | AC-12 | Бейджи скрыты, вкладки работают |

---

## 4. 📐 Поведение (Behaviour Spec)

### 4.1 Сценарий: Пользователь открывает диалог и возвращается в общее пространство

> **AC-9 (US-21-37)** — Глобальный бейдж обновляется после прочтения

```
1. Пользователь на /dashboard (Navbar показывает бейдж "5")
2. Переходит на /dashboard/comms/messages/conv-1
   → useMarkAsRead() вызывает PATCH /conversations/conv-1/read
   → lastReadAt обновлён
3. Возвращается на /dashboard
   → pathname изменился (/dashboard/comms/messages/conv-1 → /dashboard)
   → useUnreadCounts(pathname) refetch
   → GET /comms/unread-counts возвращает { messages: 2, chats: 0 }
   → Бейдж показывает "2"
```

**Ранее (до B-027):** useEffect `[]` в Navbar → бейдж остаётся "5" (причина #1).  
**После B-027:** useUnreadCounts(pathname) → бейдж обновляется до "2".

---

### 4.2 Сценарий: Новый участник чата (AC-10)

> **AC-10 (US-21-37)** — Новый участник чата не видит историю как непрочитанную

```
1. Чат «Общее собрание» существует с 10 сообщениями (A, B участники)
2. C добавляется через addChatParticipant(chatId, C_id)
   → repository: lastReadAt = new Date() (фикс T1-2)
3. C открывает /dashboard/comms
   → GET /comms/unread-counts
   → Для чата «Общее собрание»: message.count({ createdAt > lastReadAt }) = 0
   → chats = 0
   → Бейдж на вкладке «Групповые чаты» скрыт
4. A отправляет новое сообщение
   → createdAt > lastReadAt(C)
5. C снова загружает /comms/unread-counts
   → chats = 1
   → Бейдж показывает "1"
```

**Ранее (до B-027):** lastReadAt = null → `lastReadAt ?? new Date(0)` → все 10 сообщений считались непрочитанными.  
**После B-027:** lastReadAt = now() → только новые сообщения после вступления.

---

### 4.3 Сценарий: Удалённое сообщение не влияет на счётчики (AC-11)

> **AC-11 (US-21-37)** — Удалённые сообщения не учитываются в счётчиках

```
1. A отправил B 3 сообщения (B не открывал диалог)
   → GET /comms/unread-counts: messages = 3
2. A удаляет 1 сообщение (isDeleted = true)
   → GET /comms/unread-counts: message.count({ isDeleted: false, ... }) = 2 (фикс T1-1)
   → messages = 2
   → Бейдж показывает "2"
```

**Ранее (до B-027):** count без `isDeleted` → messages = 3 (удалённое учтено).  
**После B-027:** count с `isDeleted: false` → messages = 2.

---

## 5. 🧪 Тестовые сценарии (для UI-компонентов)

| # | Компонент | Сценарий | AC | Ожидаемый результат |
|---|---|---|---|---|
| 1 | `useUnreadCounts` | Initial mount без триггера | AC-3 | `loading=true` → `counts={...}` |
| 2 | `useUnreadCounts` | API возвращает ошибку | AC-12 | `error !== null`, исключение не выброшено |
| 3 | `useUnreadCounts` | refetchTrigger изменён | AC-7 | Повторный запрос к API |
| 4 | `useUnreadCounts` | Abort при смене триггера | — | Предыдущий запрос отменён |
| 5 | `Navbar` | pathname изменился | AC-9 | Бейдж обновлён |
| 6 | `Navbar` | counts = { messages: 0, chats: 0 } | AC-3 | Бейдж скрыт |
| 7 | `Navbar` | counts.messages + counts.chats > 99 | AC-8 | «99+» |
| 8 | `Navbar` | loading = true | BR-10 | Бейдж скрыт |
| 9 | `Navbar` | error !== null | BR-10 | Бейдж скрыт, навигация не блокируется |
| 10 | `CommsTabs` | counts.messages = 5 | AC-1 | Бейдж «5» на «Личные сообщения» |
| 11 | `CommsTabs` | counts.chats = 3 | AC-2 | Бейдж «3» на «Групповые чаты» |
| 12 | `CommsTabs` | counts.messages = 0 | AC-3, AC-5c | Бейдж скрыт |
| 13 | `CommsTabs` | refetchTrigger изменён | AC-5, AC-7 | Бейджи обновлены |
| 14 | `CommsTabs` | Вкладка «Объявления» | AC-4 | Нет бейджа |

---

## 6. 📁 Дерево файлов

Файлы, которые **создаются** (🆕) и **изменяются** (✏️):

```
src/
├── hooks/
│   └── useUnreadCounts.ts                 🆕  B-027-T4-1: Единый хук для счётчиков
│
├── components/
│   └── layouts/
│       └── Navbar.tsx                     ✏️  B-027-T4-1: useUnreadCounts вместо inline useEffect
│
└── components/
    └── features/
        └── comms/
            └── CommsTabs/
                └── CommsTabs.tsx          ✏️  B-027-T4-1: useUnreadCounts вместо inline useEffect
```

---

## 7. ✅ Чек-лист валидации спецификации

### Полнота

- [x] Все компоненты из плана T4-1 описаны
- [x] Матрица трассировки заполнена
- [x] Все AC из US-21-37, US-21-01, US-21-04 покрыты
- [x] С-спецификации (S-1..S-6) из макета включены
- [x] Серверные требования T1-1/T1-2 отражены как Expected Behaviour

### Соответствие шаблону

- [x] Метаданные (Feature, план, US, REQ, модель данных)
- [x] Матрица трассировки (компактная V2)
- [x] Спецификация по слоям (Hook, UI)
- [x] Поведение (сценарии AC-9, AC-10, AC-11)
- [x] Тестовые сценарии
- [x] Дерево файлов
- [x] Чек-лист валидации

### Соответствие правилам

- [x] Spec-First: спецификация создана до кода
- [x] Трассируемость: каждый компонент → AC → US → задача
- [x] JSDoc-аннотации: `@hook`, `@domain`, `@spec`, `@traces`, `@task`
- [x] Гранулярность L2: сигнатуры, типы, состояния, guard-clauses, TODO

---

## 8. 📝 История изменений

| Дата | Версия | Автор | Изменение |
|---|---|---|---|
| 2026-08-03 | v1.0 | Component Spec | Создание спецификации |

---

## 9. 📎 Ссылки

- **План:** [`docs/plans/REQ-COMMS-003-B027-plan.md`](../../plans/REQ-COMMS-003-B027-plan.md)
- **Макет:** [`docs/design/layouts/comms/B-027-unread-count-sync-layout.md`](../../design/layouts/comms/B-027-unread-count-sync-layout.md)
- **Диагностика:** [`docs/tests/B-027-diagnostic-report.md`](../../tests/B-027-diagnostic-report.md)
- **Предшествующая спецификация:** [`docs/specs/comms/B-026-component-spec.md`](./B-026-component-spec.md)
- **Шаблон:** [`docs/templates/component-spec-template.md`](../../templates/component-spec-template.md)
- **Правила:** [`docs/rules/component-spec-rules.md`](../../rules/component-spec-rules.md)
- **US-21-37:** [`docs/user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md`](../../user-stories/US-21-37-счетчики-непрочитанных-на-вкладках.md)
- **US-21-01:** [`docs/user-stories/US-21-01-просмотр-личных-диалогов.md`](../../user-stories/US-21-01-просмотр-личных-диалогов.md)
- **US-21-04:** [`docs/user-stories/US-21-04-просмотр-списка-групповых-чатов.md`](../../user-stories/US-21-04-просмотр-списка-групповых-чатов.md)
