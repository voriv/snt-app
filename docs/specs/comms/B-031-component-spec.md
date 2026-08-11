# Спецификация компонент: B-031 «Отсутствует кнопка "Написать" при сбое предзагрузки диалогов»

> **Назначение:** Спецификация компонент и скелетов кода для исправления бага [B-031](../../plans/REQ-COMMS-004-B031-plan.md)  
> **Создано:** `component-spec` режим  
> **Статус:** `[DONE]` (компонент готов, v1.1)

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `comms-bugfix-B031` |
| **Тип** | Bug fix (логическое исправление — разделение состояний) |
| **План реализации** | [`docs/plans/REQ-COMMS-004-B031-plan.md`](../../plans/REQ-COMMS-004-B031-plan.md) |
| **User Stories** | [US-21-02](../../user-stories/US-21-02-начало-нового-личного-диалога.md), [US-21-39](../../user-stories/US-21-39-создание-нового-личного-диалога-при-наличии-других.md) |
| **Требования** | REQ-COMMS-004 |
| **Модель данных** | Без изменений |
| **Макет UI** | [`docs/plans/REQ-COMMS-004-B029-layout.md`](../../plans/REQ-COMMS-004-B029-layout.md) — **новый layout не требуется**, визуал кнопок и Loading-состояние уже описаны в разделах 3-4 layout B-029 |
| **Эталон спeки** | [`docs/specs/comms/B-030-component-spec.md`](./B-030-component-spec.md) (регeрсия из T2-1 B-030) |
| **Debug-отчёт** | [`docs/debug/B-031-debug-report.md`](../../debug/B-031-debug-report.md) |
| **Версия** | `v1.1` |
| **Дата** | `2026-08-05` |
| **Статус** | `[DONE]` |

> **Охват:** Точечное логическое исправление (T1-1): разделение `existingConversations` (Map) и `conversationsLoaded` (флаг). Визуальный макет не меняется (подтверждено UI Designer). Опционально: T2-1 (защита не-null assertion в repository).

---

## 2. 📊 Матрица трассировки

> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | REQ-AC | FR/EC | Задача | Статус |
|---|---|---|---|---|---|---|---|---|
| 1 | `NewConversationPage` — разделение `existingConversations` / `conversationsLoaded` | Page | 🔧 | US-21-39 | AC-05, AC-07 | FR-09, EC-04 | B031-T1-1 | `[DONE]` |
| 2 | `comms.repository.prisma.ts` — защита не-null assertion | Repository | 🔧 | — | — | — | B031-T2-1 | `[DONE]` |
| 3 | `new-conversation.e2e.spec.ts` — тест сбоя предзагрузки | E2E | ✏️ | US-21-39 | AC-05 | EC-04 | B031-T3-1 | `[DONE]` |
| 4 | `comms.repository.b031.test.ts` — тест null-фильтрации (опционально) | Unit | 🆕 | — | — | — | B031-T4-1 | `[DONE]` |

### Проверка покрытия AC/FR/EC

| AC/FR/EC | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| **FR-09** | Предзагрузка списка диалогов | #1 | ✅ |
| **EC-04** | Клик до завершения предзагрузки (Loading) | #1, #3 | ✅ |
| **AC-05** | «Открыть диалог» / «Написать» | #1, #3 | ✅ |
| **AC-07** | «Написать» корректен при пустом Map (409-защита) | #1 | ✅ |

**Покрытие: 100%.**

---

## 3. 🏗️ Спецификация по слоям

---

### 3.1 Page Layer

#### 3.1.1 `NewConversationPage` — Разделение состояний `existingConversations` / `conversationsLoaded`

| Параметр | Значение |
|---|---|
| **Файл** | [`src/app/dashboard/comms/messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) |
| **Действие** | 🔧 Изменить состояния и логику отрисовки кнопок |
| **Задача** | B031-T1-1 |
| **Трассировка** | US-21-39 → AC-05, AC-07 → FR-09, EC-04 |

**Корневая причина (из debug-отчёта B-031):**

B-030 (T2-1) заменил выражение `mappingReady` на строгое `existingConversations !== undefined`, убрав fallback `\|\| !conversationsLoading`. При этом `existingConversations` инициализируется как `undefined` и устанавливается в `Map` **только** при успешном ответе API. При ошибке/сбое `catch {}` молча глотает исключение, и состояние остаётся `undefined` → `mappingReady = false` навсегда → для всех пользователей отображается Loading-плейсхолдер, а ветка «Написать» недостижима.

**Текущее состояние (баг):**

```typescript
// page.tsx:77-79 — existingConversations может быть undefined
const [existingConversations, setExistingConversations] = useState<
  Map<string, string> | undefined
>(undefined);

// page.tsx:106-130 — предзагрузка без гарантированного завершения
useEffect(() => {
  if (status !== 'authenticated') return;
  let aborted = false;
  const load = async () => {
    try {
      const response = await apiClient.get<ConversationListResponse>('/conversations');
      if (!aborted && response.success && response.data?.items) {
        const map = new Map<string, string>();
        for (const item of response.data.items) {
          if (item.participantId) {
            map.set(item.participantId, item.conversationId);
          }
        }
        setExistingConversations(map);  // ← только при успехе
      }
      // ← при ошибке или пустых данных — НИЧЕГО не делаем
    } catch {
      // ← silently fail — existingConversations остаётся undefined!
    }
    // ← нет finally
  };
  load();
  return () => { aborted = true; };
}, [status]);

// page.tsx:~340 — mappingReady = false навсегда при сбое
const mappingReady = existingConversations !== undefined;

// page.tsx:~444 — кнопки зависят от mappingReady
{!mappingReady ? (
  /* Loading — при сбое остаётся навсегда! */
) : conversationId ? (
  /* «Открыть диалог» */
) : (
  /* «Написать» */
)}
```

**Целевое состояние:**

```typescript
// page.tsx:77-79 — existingConversations всегда Map (никогда undefined)
const [existingConversations, setExistingConversations] = useState<
  Map<string, string>
>(new Map());

// page.tsx:~81 — отдельный флаг «предзагрузка завершена»
const [conversationsLoaded, setConversationsLoaded] = useState(false);

// page.tsx:106-130 — предзагрузка с гарантированным завершением
useEffect(() => {
  if (status !== 'authenticated') return;
  let aborted = false;
  const load = async () => {
    try {
      const response = await apiClient.get<ConversationListResponse>('/conversations');
      if (!aborted && response.success && response.data?.items) {
        const map = new Map<string, string>();
        for (const item of response.data.items) {
          if (item.participantId) {
            map.set(item.participantId, item.conversationId);
          }
        }
        setExistingConversations(map);
      } else if (!aborted) {
        // Не-успешный ответ или пустые данные — mapping пуст, но загрузка завершена
        setExistingConversations(new Map());
      }
    } catch {
      // Ошибка сети/HTTP — mapping пуст, но загрузка завершена
      if (!aborted) {
        setExistingConversations(new Map());
      }
    } finally {
      if (!aborted) {
        setConversationsLoaded(true);
      }
    }
  };
  load();
  return () => { aborted = true; };
}, [status]);

// page.tsx:~340 — mappingReady всегда true (Map инициализирован)
// Для блокировки кнопок используется conversationsLoaded
const mappingReady = existingConversations !== undefined; // всегда true
const isMappingLoading = !conversationsLoaded; // блокирует кнопки до завершения

// page.tsx:~444 — кнопки зависят от conversationsLoaded
{!conversationsLoaded ? (
  /* Loading: предзагрузка ещё не завершена (EC-04) */
  <Button variant="secondary" size="sm" isLoading disabled aria-label="Загрузка">
    <span role="status" aria-label="Загрузка" className="sr-only">
      Загрузка диалогов
    </span>
  </Button>
) : conversationId ? (
  /* «Открыть диалог» — только если есть реальный диалог в Map */
  <Button variant="secondary" size="sm" onClick={handleOpenConversation}
    aria-label={`Открыть диалог с ${userName || user.email}`}>
    Открыть диалог
  </Button>
) : (
  /* «Написать» — безопасен через 409/AC-07 */
  <Button variant="primary" size="sm" onClick={() => handleSelectUser(user)}
    aria-label={`Написать ${userName || user.email}`}>
    Написать
  </Button>
)}
```

> **Связь с layout B-029:** визуал кнопок и Loading-состояние описаны в [`REQ-COMMS-004-B029-layout.md`](../../plans/REQ-COMMS-004-B029-layout.md) разделы 3 («Спецификация двух типов кнопок») и 4 («Состояния»). B-031 не изменяет визуал — только логику переключения между состояниями.

**Экранная логика кнопок (таблица):**

| `conversationsLoaded` | `conversationId = existingConversations?.get(user.id)` | Кнопка |
|---|---|---|
| `false` | — | `<Button isLoading disabled>` (Loading, клик заблокирован — **EC-04**) |
| `true` | есть (не `undefined`) | **«Открыть диалог»** (`variant="secondary"`, редирект — **AC-05, AC-06**) |
| `true` | нет (`undefined`) | **«Написать»** (`variant="primary"`, POST — **AC-1, AC-5, AC-07**) |

> **Ключевой принцип:** кнопка «Написать» для нового собеседника НЕ требует данных из Map — даже если Map пуст, клик корректен, так как backend вернёт 409 при существующем диалоге (AC-07). Поэтому `conversationsLoaded` (а не `mappingReady`) определяет, когда кнопки перестают быть в Loading.

**Важно (предупреждение валидатора):**

Проп `existingConversations` в `UserSelectorList` становится **не-optional**: тип `Map<string, string>`, а не `Map<string, string> | undefined`. Компонент всегда получает валидный Map (порождаемый `new Map()`). Если `UserSelectorList` принимает этот prop — обновить его сигнатуру.

**Изменение `mappingReady` → `conversationsLoaded`:**

В B-030 `mappingReady` передавалось как prop в `UserSelectorList` для блокировки кнопок. В B-031:
- `mappingReady` остаётся как внутренняя переменная (всегда `true`, так как `existingConversations` — всегда Map)
- Для блокировки кнопок используется `conversationsLoaded` — отдельный флаг загрузки
- Если `mappingReady` передавался как prop в `UserSelectorList` — заменить на `conversationsLoaded` (или `isMappingLoading = !conversationsLoaded`)
- Если это только внутреннее состояние страницы — пропсы `UserSelectorList` не меняются, кроме типа Map (не-optional)

**Чек-лист T1-1 (все выполнено):**

- [x] Убрать `| undefined` из типа `existingConversations`: `useState<Map<string, string>>(new Map())`
- [x] Обновить тип prop `existingConversations` в `UserSelectorList` на `Map<string, string>` (не-optional)
- [x] Добавить состояние `conversationsLoaded`: `useState(false)`
- [x] Добавить ветку `else if (!aborted)` в `try` для не-успешных ответов
- [x] Добавить `setExistingConversations(new Map())` в `catch` (с проверкой `!aborted`)
- [x] Добавить `finally { if (!aborted) setConversationsLoaded(true) }`
- [x] Заменить `{!mappingReady ? ...` на `{!conversationsLoaded ? ...` в отрисовке кнопок
- [x] Убедиться, что `conversationId = existingConversations?.get(user.id)` корректно работает с пустым Map
- [x] Обновить JSDoc-комментарии в `useEffect` и `handleSelectUser`
- [x] `mappingReady` передавался как prop — заменён на `conversationsLoaded` (в `UserSelectorList`)

**Покрывает AC:**

- **EC-04:** Клик до завершения предзагрузки — кнопки в Loading до `conversationsLoaded=true`
- **AC-05:** «Открыть диалог» только при наличии реального диалога (через Map)
- **AC-07:** «Написать» корректен даже при пустом Map (409-защита на backend)
- **FR-09:** Предзагрузка списка диалогов

---

### 3.2 Repository Layer (опционально)

#### 3.2.1 `CommsRepositoryPrisma.getUserConversations` — Защита не-null assertion

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/comms/comms.repository.prisma.ts`](../../../src/domains/comms/comms.repository.prisma.ts) |
| **Строка** | [`:184`](../../../src/domains/comms/comms.repository.prisma.ts:184) — `participantMap.get(conversation.id)!` |
| **Действие** | 🔧 Добавить null-безопасную обработку |
| **Задача** | B031-T2-1 |
| **Приоритет** | Опционально (выполнить при подтверждении backend-500 логами) |

**Текущее состояние:**

```typescript
// comms.repository.prisma.ts:184 — не-null assertion — кандидат на TypeError → 500
const participant = participantMap.get(conversation.id)!;
```

**Целевое состояние:**

```typescript
// comms.repository.prisma.ts:182 — pattern: return null + filter
const items = (await Promise.all(
  conversations.map(async (conversation) => {
    const participant = participantMap.get(conversation.id);
    if (!participant) {
      console.warn(
        `[CommsRepository] Participant not found for conversation ${conversation.id}, skipping`
      );
      return null;
    }
    const peerId = peerByConversation.get(conversation.id) ?? '';
    // ... построить item (без изменений)
    return { conversationId: conversation.id, participantId: peerId, ... };
  })
)).filter((item): item is NonNullable<typeof item> => item !== null);
```

> **Важно:** `Promise.all(.map())` не поддерживает `continue`. Используется паттерн `return null` + `.filter()`.

**Чек-лист T2-1:**

- [x] Заменить `!` assertion на опциональный доступ с проверкой `if (!participant)`
- [x] Использовать `return null` внутри `map()` callback (НЕ `continue`)
- [x] Добавить `.filter((item): item is NonNullable<typeof item> => item !== null)` после `Promise.all()`
- [x] Добавить `console.warn()` для диагностики
- [x] Убедиться, что `participant.lastReadAt` и `participant.userId` доступны только после проверки
- [x] Добавлен JSDoc с `@task B031-T2-1` (ссылки на spec/plan)

---

### 3.3 Test Layer

---

#### 3.3.1 E2E: Сбой предзагрузки (T3-1)

| Параметр | Значение |
|---|---|
| **Файл** | [`tests/e2e/comms/new-conversation.e2e.spec.ts`](../../../tests/e2e/comms/new-conversation.e2e.spec.ts) |
| **Действие** | ✏️ Добавить тест |
| **Задача** | B031-T3-1 |

**Целевой тест:**

```typescript
/**
 * @spec B031-T3-1 — e2e-тест: кнопка «Написать» при сбое предзагрузки диалогов
 * @traces B-031, EC-04, AC-05
 *
 * Сценарий:
 * 1. Создать тестового пользователя через POST /api/v1/test/users
 * 2. Заблокировать GET /conversations (mock или intercept)
 * 3. Открыть /dashboard/comms/messages/new
 * 4. Убедиться, что кнопки НЕ остаются в Loading навсегда
 * 5. Найти созданного пользователя → кнопка «Написать» должна появиться
 * 6. Клик «Написать» → диалог создаётся (201) или редирект на 409
 */
test('должен показать кнопку "Написать" при сбое предзагрузки диалогов (B-031)', async ({ page, request }) => {
  // Arrange: создать тестового пользователя для поиска
  const testUser = await request.post('/api/v1/test/users', {
    data: {
      email: `test-b031-${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    },
  });

  // Заблокировать GET /conversations
  await page.route('**/api/v1/conversations', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 500, body: '{"success":false,"error":"Internal Server Error"}' });
    } else {
      route.continue(); // POST проходит нормально
    }
  });

  // Act: открыть страницу
  await page.goto('/dashboard/comms/messages/new');

  // Assert: кнопки НЕ остаются в Loading навсегда
  const loadingButtons = page.locator('button[aria-label="Загрузка"]');
  await expect(loadingButtons).toHaveCount(0, { timeout: 10000 });

  // Ищем созданного пользователя
  const searchInput = page.getByPlaceholder(/поиск/i);
  await searchInput.fill('Test');
  await page.waitForSelector('[data-testid="user-list-item"]', { timeout: 5000 });

  // Проверка: кнопка «Написать» присутствует
  const writeButtons = page.locator('button:has-text("Написать")');
  await expect(writeButtons.first()).toBeVisible();
});
```

**Ассерты:**

| # | Ассер | Ожидаемый результат | AC |
|---|---|---|---|
| 1 | `loadingButtons.toHaveCount(0, { timeout })` | Loading-кнопки исчезают после сбоя (не застревают) | EC-04 |
| 2 | `writeButtons.first().toBeVisible()` | Кнопка «Написать» появляется для нового собеседника | AC-05 |

**Изоляция данных:**
- Уникальный email с `Date.now()` гарантирует отсутствие коллизий
- Пользователь создаётся через `/api/v1/test/users`
- `page.route()` изолирует сбой на уровне клиента

**Чек-лист T3-1 (выполнено):**

- [x] Тест добавлен в `tests/e2e/comms/new-conversation.e2e.spec.ts`
- [x] Создан тестовый пользователь через `POST /api/v1/test/users` перед поиском
- [x] `page.route()` блокирует `GET /conversations` (500), пропускает `POST`
- [x] Явные ожидания (`expect(...).toHaveCount(0, { timeout })`) вместо `waitForTimeout()`
- [x] Проверено, что кнопка «Написать» появляется
- [x] Тест проходит локально (chromium) и в CI

> **Примечание (реализация):** таймаут ожидания результата поиска увеличен до 15с — в dev-режиме первый запрос `/api/v1/users/search` компилируется лениво (Next.js on-demand). Всё ещё явное ожидание, `waitForTimeout()` не используется.

---

#### 3.3.2 Unit: Null-фильтрация в `getUserConversations` (T4-1, опционально)

| Параметр | Значение |
|---|---|
| **Файл** | [`tests/unit/domains/comms/comms.repository.b031.test.ts`](../../../tests/unit/domains/comms/comms.repository.b031.test.ts) |
| **Действие** | 🆕 Создать новый тест-файл |
| **Задача** | B031-T4-1 |

**Целевой тест:**

```typescript
/**
 * @spec B031-T4-1 — unit-тест: null-фильтрация при отсутствии участника
 * @traces B-031, T2-1
 */
it('должен пропустить диалог с отсутствующим участником и вернуть результат без null', async () => {
  // Arrange: mock participantMap без одного из участников
  // Act: await repository.getUserConversations(userId)
  // Assert: результат не содержит проблемный диалог (null-элемент отфильтрован)
  // Assert: items.length === ожидаемое количество (без проблемного диалога)
  // Assert: !items.some(item => item === null) — нет null в итоговом массиве
});
```

**Чек-лист T4-1 (выполнено):**

- [x] Добавлен тест с mock-данными (участник отсутствует в participantMap)
- [x] Метод не бросает исключение
- [x] Проблемный диалог исключён из результатов
- [x] Итоговый массив не содержит null-элементов

> **Примечание (реализация):** для избежания конфликта по именам моков создан ОТДЕЛЬНЫЙ файл `comms.repository.b031.test.ts` (а не модификация существующего b029-файла) с префиксом `b031` у всех моков (`b031Mocks`), что гарантирует изоляцию и совместимость с существующим b029-файлом.

---

## 4. 🔄 Поток данных (изменения)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       B-031 Изменение (T1-1)                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  ДО (баг из B-030 T2-1):
    existingConversations: Map<string, string> | undefined = undefined
    mappingReady = existingConversations !== undefined

    При успехе API: existingConversations = Map → mappingReady = true → кнопки работают
    При сбое API:   existingConversations = undefined → mappingReady = false → Loading навсегда!

  ПОСЛЕ (исправлено):
    existingConversations: Map<string, string> = new Map()   // всегда Map
    conversationsLoaded: boolean = false                    // отдельный флаг

    try { /* загрузка */ }
    catch { setExistingConversations(new Map()) }           // пустой Map при сбое
    finally { setConversationsLoaded(true) }                // всегда завершается

    Кнопки: !conversationsLoaded → Loading (временно)
            conversationsLoaded && conversationId → «Открыть диалог»
            conversationsLoaded && !conversationId → «Написать»
```

---

## 5. ✅ Чек-лист проверки

### Spec-файл

- [x] Матрица трассировки покрывает T1-1, T2-1, T3-1, T4-1
- [x] Матрица трассировки покрывает FR-09, EC-04, AC-05, AC-07
- [x] Каждый компонент имеет TASK-ID (B031-T*)
- [x] Визуальный макет подтверждён как неизменный (layout B-029)
- [x] Описано разделение состояний `existingConversations` / `conversationsLoaded`
- [x] Указан тип prop `existingConversations` как не-optional Map
- [x] Описана экранная логика кнопок (таблица)

### Архитектура

- [x] DDD-архитектура соблюдена
- [x] Изменения точечные (page.tsx: состояния + отрисовка; repository: опционально)
- [x] API/Service/Prisma Schema без изменений
- [x] Переиспользование layout B-029 (разделы 3-4)

### Тесты

- [x] E2E-тест сбоя предзагрузки (T3-1) специфицирован
- [x] Unit-тест null-фильтрации (T4-1) специфицирован (опционально)
- [x] Изоляция данных (уникальные email) указана
- [x] Ассерты определены для каждого теста

---

## 6. 📁 Список файлов

### Изменяемые

| Файл | Действие | Задача | Описание изменений |
|---|---|---|---|
| [`src/app/dashboard/comms/messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) | 🔧 | T1-1 | Разделение `existingConversations` / `conversationsLoaded`; гарантированное завершение предзагрузки; замена `mappingReady` на `conversationsLoaded` в отрисовке кнопок |
| [`src/domains/comms/comms.repository.prisma.ts`](../../../src/domains/comms/comms.repository.prisma.ts) | 🔧 | T2-1 | Защита не-null assertion (опционально) |
| [`tests/e2e/comms/new-conversation.e2e.spec.ts`](../../../tests/e2e/comms/new-conversation.e2e.spec.ts) | ✏️ | T3-1 | E2E-тест: кнопка «Написать» при сбое предзагрузки |
| [`tests/unit/domains/comms/comms.repository.b031.test.ts`](../../../tests/unit/domains/comms/comms.repository.b031.test.ts) | 🆕 | T4-1 | Unit-тест null-фильтрации (опционально) |

### Не изменяются (явно исключено)

| Файл | Причина |
|---|---|
| API-слой | API уже возвращает корректные данные; сбой обрабатывается на клиенте |
| Prisma Schema | Без изменений |
| Service-слой | Service работает корректно |
| UI-компоненты (Button, Input и т.д.) | Визуал не меняется (layout B-029) |
| Типы/валидаторы домена comms | Без изменений |

---

## 7. 📎 Связанные артефакты

| Артефакт | Ссылка |
|---|---|
| План реализации | [`docs/plans/REQ-COMMS-004-B031-plan.md`](../../plans/REQ-COMMS-004-B031-plan.md) |
| Layout (B-029 — визуал не меняется) | [`docs/plans/REQ-COMMS-004-B029-layout.md`](../../plans/REQ-COMMS-004-B029-layout.md) |
| Эталон спeки (B-030 — источник регрессии) | [`docs/specs/comms/B-030-component-spec.md`](./B-030-component-spec.md) |
| Debug-отчёт B-031 | [`docs/debug/B-031-debug-report.md`](../../debug/B-031-debug-report.md) |
| User Story US-21-02 | [`docs/user-stories/US-21-02-начало-нового-личного-диалога.md`](../../user-stories/US-21-02-начало-нового-личного-диалога.md) |
| User Story US-21-39 | [`docs/user-stories/US-21-39-создание-нового-личного-диалога-при-наличии-других.md`](../../user-stories/US-21-39-создание-нового-личного-диалога-при-наличии-других.md) |

---

## 8. 📝 История изменений

| Версия | Дата | Автор | Описание |
|---|---|---|---|
| `v1.0` | `2026-08-05` | component-spec | Первичная версия (DRAFT): спецификация разделения `existingConversations` / `conversationsLoaded` |
| `v1.1` | `2026-08-05` | pages-code | T1-1 реализован. `NewConversationPage`: `existingConversations` всегда `Map`, добавлен флаг `conversationsLoaded`, `finally` гарантирует завершение, кнопки блокируются через `conversationsLoaded`. Строка #1 матрицы `[TODO]` → `[DONE]`, статус компонента → `[DONE]`. Визуал кнопок не менялся (layout B-029, разделы 3-4). |

---

**Последнее обновление:** 2026-08-05
**Статус:** DONE
**Версия:** v1.1
**Связанная задача:** B-031
