# Спецификация компонент: Запрет создания дублирующихся личных диалогов (B-029)

> **Назначение:** Спецификация компонент и скелетов кода для [B-029](../../plans/REQ-COMMS-004-B029-plan.md)  
> **Создано:** `component-spec` режим  
> **Статус:** `[DRAFT]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `comms-duplicate-conversation-prevention` |
| **План реализации** | [`docs/plans/REQ-COMMS-004-B029-plan.md`](../../plans/REQ-COMMS-004-B029-plan.md) |
| **User Stories** | [US-21-38](../../user-stories/US-21-38-продолжение-существующего-личного-диалога.md), [US-21-39](../../user-stories/US-21-39-создание-нового-личного-диалога-при-наличии-других.md) |
| **Требования** | REQ-COMMS-004 |
| **Модель данных** | Без изменений (используются существующие `Conversations`, `ConversationParticipants`) |
| **Макет UI** | [`docs/plans/REQ-COMMS-004-B029-layout.md`](../../plans/REQ-COMMS-004-B029-layout.md) |
| **Версия** | `v1.0` |
| **Дата** | `2026-08-04` |
| **Статус** | `[DRAFT]` |

> **Охват:** Данная спецификация покрывает только UI-слой задачи **T5-1** из плана. Backend-задачи (T1-T4) покрываются отдельными спецификациями слоёв (Repository/Service/API Code modes).

---

## 2. 📊 Матрица трассировки

> Каждая строка связывает компонент с требованиями. Без строки в матрице — нет компонента.
> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | REQ-AC | FR | Задача | Статус |
|---|---|---|---|---|---|---|---|---|
| 1 | `NewConversationPage` — предзагрузка диалогов | Page | 🔧 | US-21-38, US-21-39 | AC-05, AC-07 | FR-09 | B029-T5-1 | `[TODO]` |
| 2 | `NewConversationPage` — `handleSelectUser` с 409 | Page | 🔧 | US-21-38 | AC-06, AC-07 | FR-07, FR-08 | B029-T5-1 | `[TODO]` |
| 3 | `NewConversationPage` — состояния (loading/error/empty) | Page | 🔧 | US-21-39 | AC-05, AC-07 | FR-09 | B029-T5-1 | `[TODO]` |
| 4 | `UserSelectorList` — props `existingConversations` | UI/Feature | 🔧 | US-21-38, US-21-39 | AC-05 | FR-06, FR-09 | B029-T5-1 | `[TODO]` |
| 5 | `UserSelectorList` — кнопка «Открыть диалог» | UI/Feature | 🔧 | US-21-38 | AC-05, AC-06 | FR-06, FR-07 | B029-T5-1 | `[TODO]` |
| 6 | `UserSelectorList` — кнопка «Написать» | UI/Feature | 🔧 | US-21-39 | AC-05 | FR-06 | B029-T5-1 | `[TODO]` |
| 7 | `UserSelectorList` — Loading-состояние кнопок | UI/Feature | 🔧 | US-21-38, US-21-39 | AC-07 (EC-04) | FR-09 | B029-T5-1 | `[TODO]` |
| 8 | `UserSelectorList` — aria-label для доступности | UI/Feature | 🔧 | US-21-38, US-21-39 | NFR-04 | — | B029-T5-1 | `[TODO]` |

### Проверка покрытия AC (REQ-COMMS-004)

#### Frontend AC

| AC | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| **AC-05** | Кнопка «Открыть диалог» для существующих диалогов | #1, #4, #5 | ✅ |
| **AC-06** | Редирект в существующий диалог при клике | #2, #5 | ✅ |
| **AC-07** | Обработка 409 → редирект без ошибки | #2 | ✅ |

#### Functional Requirements (FR)

| FR | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| **FR-06** | Кнопка «Открыть диалог» vs «Написать» | #4, #5, #6 | ✅ |
| **FR-07** | Редирект на существующий диалог | #2, #5 | ✅ |
| **FR-08** | Обработка 409 и редирект | #2 | ✅ |
| **FR-09** | Предзагрузка списка диалогов | #1, #4 | ✅ |

#### Невфункциональные требования (NFR)

| NFR | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| **NFR-04** | Различающиеся aria-label для кнопок | #8 | ✅ |

#### Edge Cases

| EC | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| **EC-04** | Клик до завершения предзагрузки (кнопка Loading) | #3, #7 | ✅ |

**Все AC/FR/NFR/EC покрыты. Покрытие: 100%.**

---

## 3. 🏗️ Спецификация по слоям

---

### 3.1 Page Layer

---

#### 3.1.1 `NewConversationPage` — Страница «Новый диалог»

| Параметр | Значение |
|---|---|
| **Файл** | [`src/app/dashboard/comms/messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) |
| **Действие** | 🔧 Изменить существующую страницу |
| **Задача** | B029-T5-1 |
| **Трассировка** | US-21-38/39 → AC-05, AC-06, AC-07 → FR-06..09 |

**Текущее состояние:** Страница всегда передаёт `onSelectUser` в `UserSelectorList`, который всегда вызывает `POST /conversations`. Нет предзагрузки диалогов.

**Изменения:**

| Изменение | Описание | AC/FR |
|---|---|---|
| **Предзагрузка диалогов** | `useEffect` при монтировании загружает `GET /api/v1/conversations`, строит `Map<participantId, conversationId>` | FR-09 |
| **Mapping state** | `useState<Map<string, string>>` + флаг `conversationsLoading` | FR-09 |
| **handleSelectUser** | Принимает опциональный `existingConversationId`: если есть — редирект без API; иначе POST с обработкой 409 | FR-07, FR-08 |
| **Обработка 409** | Извлекает `conversationId` из ответа/ошибки → `router.replace()` без показа `ErrorMessage` | AC-07 |
| **Передача в UserSelectorList** | Новый пропс `existingConversations` + `conversationsLoading` | FR-06, FR-09 |

**Состояния страницы:**

| Состояние | Условие | Отображение |
|---|---|---|
| `authLoading` | `useSession().status === 'loading'` | Спиннер авторизации |
| `unauthenticated` | `status === 'unauthenticated'` | Сообщение + редирект на `/login` |
| `conversationsLoading` | Загрузка `GET /conversations` | `UserSelectorList` с кнопками в `isLoading` состоянии |
| `conversationsLoaded` | Mapping готов | `UserSelectorList` с корректными кнопками |
| `creatingDialog` | POST выполняется | Кнопка «Написать» → `isLoading`, остальные `disabled` |
| `error` | Не-409 ошибка POST | `ErrorMessage` с текстом ошибки |
| `redirecting` | Редирект после успеха/409 | Немедленный `router.replace()` |

**Сигнатура `handleSelectUser`:**

```typescript
/**
 * @method handleSelectUser
 * @spec Обработка выбора пользователя для начала/продолжения диалога
 *
 * @traces AC-06, AC-07, FR-07, FR-08
 * @task B029-T5-1
 *
 * @param participantId - ID целевого пользователя
 * @param existingConversationId - ID существующего диалога (если известен)
 *
 * @behavior
 * - Если existingConversationId определён → немедленный редирект без API
 * - Иначе → POST /conversations
 *   - 201 → редирект на новый диалог
 *   - 409 → извлечение conversationId → редирект (без ErrorMessage!)
 *   - Другая ошибка → показать ErrorMessage
 */
const handleSelectUser = async (
  participantId: string,
  existingConversationId?: string
): Promise<void>;
```

**⚠️ Оценка:** ~120 строк модификаций в существующем файле — в пределах допустимого.

---

### 3.2 UI Layer

---

#### 3.2.1 `UserSelectorList` — Список пользователей с двумя типами кнопок

| Параметр | Значение |
|---|---|
| **Файл** | [`src/app/dashboard/comms/messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) (встроенный компонент) |
| **Действие** | 🔧 Изменить существующий компонент |
| **Задача** | B029-T5-1 |
| **Трассировка** | US-21-38/39 → AC-05 → FR-06, FR-09 |

> **Примечание:** `UserSelectorList` — встроенный (local) компонент в `page.tsx`, не вынесен в отдельный файл. Это соответствует текущей архитектуре проекта.

**Новые Props:**

| Пропс | Тип | Обязательный | Описание | AC/FR |
|---|---|---|---|---|
| `existingConversations` | `Map<string, string> \| undefined` | ❌ | Mapping participantId → conversationId. `undefined` = ещё загружается. | FR-09 |
| `conversationsLoading` | `boolean` | ❌ | `true` пока mapping загружается. Кнопки в Loading-состоянии. | FR-09, EC-04 |

**Изменённый `onSelectUser` callback:**

| Параметр | Тип | Описание |
|---|---|---|
| `participantId` | `string` | ID целевого пользователя |
| `existingConversationId?` | `string` | ID существующего диалога (передаётся, если mapping содержит запись) |

**Логика выбора кнопки для каждого пользователя:**

```
conversationId = existingConversations?.get(user.id);
mappingReady = existingConversations !== undefined;

IF (!mappingReady) → <Button isLoading> (блокирована, спиннер)
ELSE IF (conversationId !== undefined) → <Button variant="secondary">Открыть диалог</Button>
ELSE → <Button variant="primary">Написать</Button>
```

**Кнопка «Открыть диалог» (существующий диалог):**

| Аспект | Значение |
|---|---|
| **Компонент** | `<Button variant="secondary" size="sm">` |
| **Текст** | «Открыть диалог» |
| **Токены** | `bg-[var(--theme-bg-primary)]`, `text-[var(--theme-text-primary)]`, `border-[var(--theme-border-color)]`, `hover:bg-[var(--theme-bg-secondary)]` |
| **aria-label** | `"Открыть диалог с {user.name \|\| user.email}"` |
| **Действие** | `onClick={() => onSelectUser(user.id, conversationId)}` — немедленный редирект |
| **AC** | AC-05, AC-06 |
| **NFR** | NFR-04 |

**Кнопка «Написать» (нет диалога):**

| Аспект | Значение |
|---|---|
| **Компонент** | `<Button variant="primary" size="sm">` |
| **Текст** | «Написать» |
| **Токены** | `bg-[var(--theme-accent)]`, `text-white`, `hover:opacity-90` |
| **aria-label** | `"Написать {user.name \|\| user.email}"` |
| **Действие** | `onClick={() => onSelectUser(user.id)}` — POST /conversations |
| **AC** | AC-05 |
| **NFR** | NFR-04 |

**Loading-состояние кнопки (mapping ещё загружается):**

| Аспект | Значение |
|---|---|
| **Компонент** | `<Button variant="secondary" isLoading disabled>` |
| **aria-label** | `"Загрузка"` |
| **aria-role** | `role="status"` (для спиннера) |
| **Поведение** | Клик заблокирован (`disabled + isLoading`) |
| **AC** | AC-07 (EC-04) |

**Список результатов (accessibility):**

| Элемент | Атрибут | Описание |
|---|---|---|
| Контейнер списка | `role="listbox" aria-label="Результаты поиска"` | role=listbox для скринридеров |
| Строка пользователя | `role="option"` | Каждая строка — опция listbox |
| Ошибка | `role="alert" aria-live="polite"` | ErrorMessage компонент |

**Доступность (NFR-04):**

| Кнопка | aria-label | Цель |
|---|---|---|
| «Открыть диалог» | `"Открыть диалог с {name \|\| email}"` | Скринридер понимает: переход в существующий диалог |
| «Написать» | `"Написать {name \|\| email}"` | Скринридер понимает: создание нового диалога |

> **Важно:** Различающиеся `aria-label` позволяют пользователям скринридеров различать два типа действий без визуального контекста.

**⚠️ Оценка:** ~60 строк модификаций в существующем компоненте — в пределах допустимого.

---

#### 3.2.2 `ErrorMessage` — Переиспользуемый компонент ошибки

| Параметр | Значение |
|---|---|
| **Файл** | [`src/components/ui/ErrorMessage/ErrorMessage.tsx`](../../../src/components/ui/ErrorMessage/ErrorMessage.tsx) |
| **Действие** | ✅ Уже существует, переиспользуется |
| **Задача** | — |
| **Трассировка** | US-21-39 EC-3 → Неприменимо для 409 |

**Использование:**

```tsx
<ErrorMessage message={error} />
```

- Отображается только для **не-409 ошибок** при POST `/conversations`
- При 409 ошибка **НЕ показывается** (AC-07) — выполняется редирект
- `role="alert" aria-live="polite"` — уже реализовано

---

#### 3.2.3 `EmptyState` — Переиспользуемый компонент пустого состояния

| Параметр | Значение |
|---|---|
| **Файл** | [`src/components/ui/EmptyState/EmptyState.tsx`](../../../src/components/ui/EmptyState/EmptyState.tsx) |
| **Действие** | ✅ Уже существует, переиспользуется |
| **Задача** | — |
| **Трассировка** | US-21-39 EC-2 → AC-05 |

**Использование:**

```tsx
<EmptyState
  title="Нет доступных пользователей"
  description="Попробуйте изменить параметры поиска"
/>
```

- Отображается, когда поиск не вернул пользователей (`users.length === 0` и `query.length >= 2`)

---

#### 3.2.4 `Button` — Переиспользуемый компонент кнопки

| Параметр | Значение |
|---|---|
| **Файл** | [`src/components/ui/Button/Button.tsx`](../../../src/components/ui/Button/Button.tsx) |
| **Действие** | ✅ Уже существует, переиспользуется |
| **Задача** | — |
| **Трассировка** | AC-05, AC-06, NFR-04 |

**Варианты, используемые в B-029:**

| Вариант | Использование | Токены |
|---|---|---|
| `primary` | «Написать» | `bg-[var(--theme-accent)] text-white` |
| `secondary` | «Открыть диалог» | `bg-[var(--theme-bg-primary)] text-[var(--theme-text-primary)] border` |
| `ghost` | Кнопка «Назад» | `bg-transparent text-[var(--theme-text-primary)]` |

**Props, используемые в B-029:**

| Пропс | Значение | Описание |
|---|---|---|
| `isLoading` | `true` для Loading-кнопок | Показывает спиннер, блокирует клик |
| `disabled` | `true` при `isLoading` или `conversationsLoading` | Блокирует клик |
| `aria-label` | Различающийся для двух типов | NFR-04 |

---

## 4. 📐 Адаптивность

| Breakpoint | Поведение |
|---|---|
| **Desktop (≥1024px)** | Блок `max-w-2xl mx-auto`, кнопки выровнены вправо внутри строки-карточки |
| **Tablet/Mobile (<1024px)** | Блок на всю ширину (`w-full`), кнопки — на всю ширину строки снизу (стек) |

Реализуется через Tailwind responsive utilities в `UserSelectorList`.

---

## 5. 🔄 Поток данных

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NewConversationPage Flow (B-029)                      │
└─────────────────────────────────────────────────────────────────────────────┘

1. MOUNT → useEffect:
   - GET /api/v1/conversations
   - response.data.items[] → Map<participantId, conversationId>
   - setExistingConversations(map)
   - Ошибка → молча игнорируется (определяет backend через 409)

2. USER SEARCHES → UserSelectorList:
   - GET /users/search?q=...
   - users[] → отображение строк

3. FOR EACH USER IN LIST:
   IF (existingConversations === undefined) → <Button isLoading>
   ELSE conversationId = existingConversations.get(user.id)
     IF (conversationId) → <Button variant="secondary">Открыть диалог</Button>
     ELSE → <Button variant="primary">Написать</Button>

4. USER CLICKS «Открыть диалог»:
   - handleSelectUser(userId, conversationId)
   - router.replace(`/dashboard/comms/messages/${conversationId}`)
   - Нет API-запроса

5. USER CLICKS «Написать»:
   - handleSelectUser(userId)
   - POST /conversations { participantId: userId }
   - 201 → router.replace(`/dashboard/comms/messages/${newConversationId}`)
   - 409 → extract conversationId → router.replace(...) БЕЗ ErrorMessage (AC-07)
   - Другая ошибка → setError(...) → <ErrorMessage>
```

---

## 6. 📝 Скелеты кода

### 6.1 Изменения в `NewConversationPage`

Файл: [`src/app/dashboard/comms/messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx)

```typescript
/**
 * @file comms/messages/new/page.tsx
 * @description Страница создания нового личного диалога с проверкой существующих
 * @page /dashboard/comms/messages/new
 * @auth required
 *
 * @spec B029-T5-1
 * - Предзагрузка GET /conversations → Map<participantId, conversationId>
 * - Две кнопки: «Открыть диалог» (редирект) / «Написать» (POST)
 * - Обработка 409 → редирект без ErrorMessage (AC-07)
 * - Loading-состояние кнопок при незагруженном mapping (EC-04)
 * - aria-label различается для двух типов кнопок (NFR-04)
 *
 * @traces AC-05, AC-06, AC-07, FR-06..09, NFR-04
 * @task B029-T5-1
 */
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';

/** Результат POST /conversations */
interface CreateConversationResult {
  conversationId: string;
  isNew: boolean;
}

/** Элемент списка диалогов из GET /conversations */
interface ConversationListItem {
  id: string;
  type: string;
  participantId: string;
  // ... другие поля
}

/**
 * Страница создания нового личного диалога
 */
export default function NewConversationPage(): React.JSX.Element {
  const router = useRouter();
  const { status } = useSession();

  // [TODO B029-T5-1] Предзагрузка диалогов для определения существующих
  const [existingConversations, setExistingConversations] = useState<
    Map<string, string> | undefined
  >(undefined);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * @method loadExistingConversations
   * @spec Загрузка списка диалогов текущего пользователя для построения mapping
   *
   * @traces FR-09
   * @task B029-T5-1
   *
   * @behavior
   * - GET /conversations → извлекает DIRECT-диалоги
   * - Строит Map<participantId, conversationId>
   * - Ошибка молча игнорируется (backend гарантирует 409)
   */
  useEffect(() => {
    if (status !== 'authenticated') return;

    let aborted = false;
    const load = async () => {
      try {
        const response = await apiClient.get<{ items: ConversationListItem[] }>(
          '/conversations'
        );
        if (!aborted && response.success && response.data?.items) {
          const map = new Map<string, string>();
          for (const item of response.data.items) {
            if (item.type === 'DIRECT' && item.participantId) {
              map.set(item.participantId, item.id);
            }
          }
          setExistingConversations(map);
        }
      } catch {
        // Silently fail — backend всё равно проверит и вернёт 409 при дубликате
      } finally {
        if (!aborted) {
          setConversationsLoading(false);
        }
      }
    };
    load();
    return () => {
      aborted = true;
    };
  }, [status]);

  /**
   * @method handleSelectUser
   * @spec Обработка выбора пользователя для начала/продолжения диалога
   *
   * @traces AC-06, AC-07, FR-07, FR-08
   * @task B029-T5-1
   *
   * @param participantId - ID целевого пользователя
   * @param existingConversationId - ID существующего диалога (если известен из mapping)
   *
   * @behavior
   * - Если existingConversationId → немедленный редирект без API (AC-06)
   * - POST /conversations → 201 → редирект в новый диалог
   * - POST /conversations → 409 → извлечь conversationId → редирект (AC-07, без ошибки!)
   * - POST /conversations → другая ошибка → ErrorMessage
   */
  const handleSelectUser = useCallback(
    async (participantId: string, existingConversationId?: string): Promise<void> => {
      // AC-06: Если conversationId уже известен → немедленный редирект
      if (existingConversationId) {
        router.replace(`/dashboard/comms/messages/${existingConversationId}`);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.post<CreateConversationResult>(
          '/conversations',
          { participantId }
        );

        if (response.success && response.data?.conversationId) {
          // 201: Новый диалог создан
          router.replace(`/dashboard/comms/messages/${response.data.conversationId}`);
        } else if (response.data?.conversationId) {
          // AC-07: 409 — существующий диалог → редирект БЕЗ ошибки
          router.replace(`/dashboard/comms/messages/${response.data.conversationId}`);
        } else {
          setError(response.error?.message || 'Не удалось начать диалог');
        }
      } catch (err) {
        // P2-2: Обработка 409, если apiClient бросает ошибку при 4xx
        if (err && typeof err === 'object' && 'response' in err) {
          const resp = err as { response?: { status?: number; data?: unknown } };
          if (
            resp?.response?.status === 409 &&
            typeof resp.response.data === 'object' &&
            resp.response.data !== null &&
            'data' in resp.response.data
          ) {
            const innerData = (resp.response.data as { data?: { conversationId?: string } }).data;
            if (innerData?.conversationId) {
              router.replace(`/dashboard/comms/messages/${innerData.conversationId}`);
              setIsLoading(false);
              return;
            }
          }
        }
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // Auth loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--theme-text-secondary)]">Загрузка...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--theme-danger)]">Требуется авторизация</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Новый диалог</h1>

      {/* Ошибка (только не-409) */}
      <ErrorMessage message={error} />

      <UserSelectorList
        onSelectUser={handleSelectUser}
        isLoading={isLoading}
        existingConversations={existingConversations}
        conversationsLoading={conversationsLoading}
      />
    </div>
  );
}

/**
 * @component UserSelectorList
 * @description Список пользователей для выбора собеседника с поиском
 *
 * @spec B029-T5-1
 * - Принимает existingConversations mapping для определения типа кнопки
 * - Две кнопки: «Открыть диалог» (secondary) / «Написать» (primary)
 * - Loading-состояние при незагруженном mapping
 * - aria-label различается для двух типов кнопок (NFR-04)
 *
 * @traces AC-05, FR-06, FR-09, NFR-04
 * @task B029-T5-1
 */
function UserSelectorList({
  onSelectUser,
  isLoading,
  existingConversations,
  conversationsLoading,
}: {
  onSelectUser: (userId: string, conversationId?: string) => void;
  isLoading: boolean;
  existingConversations?: Map<string, string>;
  conversationsLoading: boolean;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<
    | {
        id: string;
        email: string;
        name: string;
        avatar: string | null;
      }[]
    | undefined
  >(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ... searchUsers, handleQueryChange, cleanup useEffect (без изменений) ...

  const isDisabled = isLoading || isSearching;
  const mappingReady = existingConversations !== undefined;

  return (
    <div className="flex flex-col">
      {/* Поле поиска */}
      <div className="mb-4">
        <label
          htmlFor="user-search"
          className="block text-sm font-medium text-[var(--theme-text-primary)] mb-1"
        >
          Найти пользователя
        </label>
        <input
          id="user-search"
          type="text"
          value={query}
          onChange={handleQueryChange}
          disabled={isDisabled}
          placeholder="Введите имя или email (минимум 2 символа)"
          className="w-full px-3 py-2 border border-[var(--theme-input-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent disabled:bg-[var(--theme-bg-secondary)] disabled:cursor-not-allowed"
          aria-label="Найти пользователя"
          autoComplete="off"
          aria-describedby="search-help"
        />
        <p id="search-help" className="mt-1 text-sm text-[var(--theme-text-secondary)]">
          Введите минимум 2 символа для поиска
        </p>
      </div>

      {/* Loading indicator для поиска */}
      {isSearching && (
        <div className="mb-4 text-[var(--theme-text-secondary)]">
          {/* Spinner */}
        </div>
      )}

      {/* Ошибка поиска */}
      {error && !isSearching && <ErrorMessage message={error} />}

      {/* Список результатов */}
      {hasSearched && !isSearching && (
        <div className="border border-[var(--theme-border-color)] rounded-lg overflow-hidden">
          {users === undefined || users.length === 0 ? (
            /* EmptyState */
            query.length < 2 ? (
              <div className="p-6 text-center text-[var(--theme-text-secondary)]">
                <p>Введите имя или email для поиска</p>
              </div>
            ) : (
              <EmptyState
                title="Нет доступных пользователей"
                description="Попробуйте изменить параметры поиска"
              />
            )
          ) : (
            <ul role="listbox" aria-label="Результаты поиска">
              {users.map((user) => {
                const conversationId = existingConversations?.get(user.id);
                const displayName = user.name || user.email;

                return (
                  <li key={user.id} role="option">
                    <div className="flex items-center space-x-3 p-3 hover:bg-[var(--theme-bg-secondary)] transition-colors">
                      {/* Avatar */}
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--theme-bg-secondary)] flex items-center justify-center text-[var(--theme-text-secondary)]">
                          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}

                      {/* Информация */}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-[var(--theme-text-primary)]">
                          {user.name || 'Без имени'}
                        </p>
                        <p className="text-sm text-[var(--theme-text-secondary)]">{user.email}</p>
                      </div>

                      {/* [B029] Две кнопки в зависимости от наличия диалога */}
                      {!mappingReady ? (
                        /* Loading: mapping ещё не загружен (EC-04) */
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading
                          disabled
                          aria-label="Загрузка"
                        >
                          <span role="status" aria-label="Загрузка">
                            {/* Spinner icon aria-hidden */}
                          </span>
                        </Button>
                      ) : conversationId ? (
                        /* AC-05, AC-06: Диалог существует → «Открыть диалог» */
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onSelectUser(user.id, conversationId)}
                          aria-label={`Открыть диалог с ${displayName}`}
                        >
                          Открыть диалог
                        </Button>
                      ) : (
                        /* AC-05: Нет диалога → «Написать» */
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onSelectUser(user.id)}
                          disabled={isLoading}
                          aria-label={`Написать ${displayName}`}
                        >
                          Написать
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 7. ✅ Чек-лист проверки

### Spec-файл

- [x] Матрица трассировки покрывает все AC-05..07 из REQ-COMMS-004
- [x] Матрица трассировки покрывает FR-06..09
- [x] Матрица трассировки покрывает NFR-04, EC-04
- [x] Каждый компонент имеет TASK-ID (B029-T5-1)

### Архитектура

- [x] DDD-архитектура соблюдена (UI-слой не пересекается с Domain)
- [x] `'use client'` наверху клиентского компонента
- [x] `apiClient` для запросов, `useSession()` для авторизации
- [x] Переиспользование существующих DS-компонентов (Button, ErrorMessage, EmptyState)
- [x] `router.replace()` для навигации (не `router.push()`)

### Доступность (NFR-04)

- [x] Различающиеся `aria-label` для двух типов кнопок
- [x] `role="listbox"` + `role="option"` для списка результатов
- [x] `role="alert" aria-live="polite"` для ошибки (через ErrorMessage)
- [x] `role="status"` для спиннера загрузки

### Скелеты кода

- [x] JSDoc с `@spec`, `@traces`, `@task` на каждом элементе
- [x] TypeScript типы определены (`CreateConversationResult`, `ConversationListItem`)
- [x] Обработка 409 в catch-блоке (P2-2)

---

## 8. 📁 Список файлов

### Созданные

| Файл | Описание |
|---|---|
| `docs/specs/comms/B-029-component-spec.md` | Настоящая спецификация |

### Изменяемые (скелеты в spec)

| Файл | Действие | Описание изменений |
|---|---|---|
| `src/app/dashboard/comms/messages/new/page.tsx` | 🔧 | Предзагрузка диалогов, mapping, handleSelectUser с 409, два типа кнопок |

### Переиспользуемые

| Файл | Использование |
|---|---|
| `src/components/ui/Button/Button.tsx` | variant=primary/secondary, isLoading |
| `src/components/ui/ErrorMessage/ErrorMessage.tsx` | Ошибки POST (не-409) |
| `src/components/ui/EmptyState/EmptyState.tsx` | Пустое состояние поиска |

---

## 📎 Ссылки

- **План:** [`docs/plans/REQ-COMMS-004-B029-plan.md`](../../plans/REQ-COMMS-004-B029-plan.md)
- **Макет UI:** [`docs/plans/REQ-COMMS-004-B029-layout.md`](../../plans/REQ-COMMS-004-B029-layout.md)
- **Требование:** [`docs/requirements/REQ-COMMS-004.md`](../../requirements/REQ-COMMS-004.md)
- **User Stories:** [US-21-38](../../user-stories/US-21-38-продолжение-существующего-личного-диалога.md), [US-21-39](../../user-stories/US-21-39-создание-нового-личного-диалога-при-наличии-других.md)
- **Предыдущая spec:** [`docs/specs/comms/B-027-component-spec.md`](./B-027-component-spec.md)
