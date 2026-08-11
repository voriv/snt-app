# Спецификация компонент: B-030 «Поиск по email + создание нового диалога при наличии другого»

> **Назначение:** Спецификация компонент и скелетов кода для исправления бага [B-030](../../plans/REQ-COMMS-004-B030-plan.md)  
> **Создано:** `component-spec` режим  
> **Статус:** `[DRAFT]`

---

## 1. 📋 Метаданные

| Параметр | Значение |
|---|---|
| **Feature** | `comms-bugfix-B030` |
| **Тип** | Bug fix (точечное исправление) |
| **План реализации** | [`docs/plans/REQ-COMMS-004-B030-plan.md`](../../plans/REQ-COMMS-004-B030-plan.md) |
| **User Stories** | [US-21-02](../../user-stories/US-21-02-начало-нового-личного-диалога.md), [US-21-39](../../user-stories/US-21-39-создание-нового-личного-диалога-при-наличии-других.md) |
| **Требования** | REQ-COMMS-004 |
| **Модель данных** | Без изменений |
| **Макет UI** | [`docs/plans/REQ-COMMS-004-B030-layout.md`](../../plans/REQ-COMMS-004-B030-layout.md) (визуал не меняется) |
| **Эталон спeки** | [`docs/specs/comms/B-029-component-spec.md`](./B-029-component-spec.md) |
| **Версия** | `v1.0` |
| **Дата** | `2026-08-04` |
| **Статус** | `[DRAFT]` |

> **Охват:** Точечные исправления: T1-1 (email-фильтр в repository), T2-1 (mappingReady в page), T3-1/T4-1/T5-1 (тесты). Визуальный макет не меняется (подтверждено ui-designer).

---

## 2. 📊 Матрица трассировки

> Действия: 🆕 — создать файл, ✏️ — добавить в существующий, 🔧 — изменить существующее.

| # | Компонент | Слой | Действие | US | REQ-AC | FR/EC | Задача | Статус |
|---|---|---|---|---|---|---|---|---|
| 1 | `UsersRepositoryPrisma.searchUsers` — email-фильтр | Repository | ✏️ | US-21-02 | — | — | B030-T1-1 | `[TODO]` |
| 2 | `NewConversationPage` — `mappingReady` выражение | Page | 🔧 | US-21-39 | AC-05 | FR-09, EC-04 | B030-T2-1 | `[TODO]` |
| 3 | `new-conversation.e2e.spec.ts` — тест email-поиска | E2E | ✏️ | US-21-02 | AC-1.5 | — | B030-T3-1 | `[TODO]` |
| 4 | `new-conversation.e2e.spec.ts` — тест US-21-39 | E2E | ✏️ | US-21-39 | AC-05 | FR-09 | B030-T4-1 | `[TODO]` |
| 5 | `users.repository.test.ts` — тест email-ветки | Unit | ✏️ | US-21-02 | — | — | B030-T5-1 | `[TODO]` |

### Проверка покрытия AC/FR/EC

| AC/FR/EC | Описание | Покрыт в строке | Статус |
|---|---|---|---|
| **FR-09** | Предзагрузка списка диалогов | #2 | ✅ |
| **EC-04** | Клик до завершения предзагрузки (Loading) | #2, #4 | ✅ |
| **AC-05** | «Открыть диалог» / «Написать» | #2, #4 | ✅ |
| **AC-1.5** | Поиск пользователя (расширение email) | #1, #3, #5 | ✅ |

**Покрытие: 100%.**

---

## 3. 🏗️ Спецификация по слоям

---

### 3.1 Repository Layer

#### 3.1.1 `UsersRepositoryPrisma.searchUsers` — email-фильтр

| Параметр | Значение |
|---|---|
| **Файл** | [`src/domains/users/users.repository.prisma.ts`](../../../src/domains/users/users.repository.prisma.ts) |
| **Строка** | [`:225`](../../../src/domains/users/users.repository.prisma.ts:225) — ветка email в `OR` |
| **Действие** | ✏️ Документация (JSDoc). Код подтверждается без изменений. |
| **Задача** | B030-T1-1 |

**Текущее состояние:** email **уже включён** в `OR`-фильтр [`searchUsers()`](../../../src/domains/users/users.repository.prisma.ts:214):

```typescript
// users.repository.prisma.ts:222-229
where: {
  id: { not: excludeUserId },
  OR: [
    { email: { contains: query, mode: 'insensitive' as const } },        // ← уже есть
    { name: { not: null, contains: query, mode: 'insensitive' as const } },
    { profile: { first_name: { contains: query, mode: 'insensitive' as const } } },
    { profile: { last_name: { contains: query, mode: 'insensitive' as const } } },
  ],
},
```

**Изменение:** Добавить JSDoc-блок к методу `searchUsers`, документирующий поля поиска:

```typescript
/**
 * Поиск пользователей для выбора собеседника
 *
 * @param query - Текст поиска (по email, name, profile.first_name, profile.last_name)
 * @param excludeUserId - ID текущего пользователя (исключается из результатов)
 * @param limit - Максимальное количество результатов (default: 20, max: 50)
 * @returns Массив результатов поиска
 *
 * @search-fields email, name, profile.first_name, profile.last_name
 * @search-mode contains, case-insensitive
 *
 * @spec B030-T1-1 — подтверждение email-фильтра
 * @traces B-030 симптом 1
 */
async searchUsers(query: string, excludeUserId: string, limit: number = 20): Promise<UserSearchResult[]>
```

**Чек-лист T1-1:**

- [ ] JSDoc-блок с `@search-fields` добавлен к `searchUsers`
- [ ] Подтверждено, что email-ветка `{ email: { contains: query, mode: 'insensitive' } }` присутствует в `OR`
- [ ] Подтверждено, что `mode: 'insensitive'` применяется ко всем веткам

---

### 3.2 Page Layer

#### 3.2.1 `NewConversationPage` — Исправление `mappingReady`

| Параметр | Значение |
|---|---|
| **Файл** | [`src/app/dashboard/comms/messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) |
| **Строка** | [`:340`](../../../src/app/dashboard/comms/messages/new/page.tsx:340) — выражение `mappingReady` |
| **Действие** | 🔧 Изменить одну строку |
| **Задача** | B030-T2-1 |
| **Трассировка** | US-21-39 → AC-05 → FR-09, EC-04 |

**Текущее состояние (баг):**

```typescript
// page.tsx:340 — БЫЛО
const mappingReady = existingConversations !== undefined || !conversationsLoading;
```

**Проблема:** При сбое или отмене запроса `GET /conversations` состояние становится `conversationsLoading = false`, `existingConversations = undefined`. Выражение `false || true = true` → mapping считается готовым → `existingConversations?.get(user.id)` всегда `undefined` → все кнопки показываются как «Написать» → повторный POST → 409.

**Целевое состояние (эталон из [`B-029-component-spec.md:613`](./B-029-component-spec.md:613)):**

```typescript
// page.tsx:340 — СТАЛО
const mappingReady = existingConversations !== undefined;
```

**Поведение кнопок в зависимости от `mappingReady`** (из [`REQ-COMMS-004-B030-layout.md`](../../plans/REQ-COMMS-004-B030-layout.md:43)):

| `existingConversations` | `mappingReady` | Кнопки пользователей |
|---|---|---|
| `undefined` | `false` | **Loading** — `<Button isLoading disabled>`; клик заблокирован (**EC-04**) |
| пустой `Map` (диалогов нет) | `true` | **«Написать»** для всех пользователей (**AC-1, AC-5, US-21-39**) |
| `Map` с записями | `true` | **«Открыть диалог»** для существующих (**AC-05/AC-06**); **«Написать»** для отсутствующих |

> **Связь с багом:** исправленное условие корректно удерживает кнопки в Loading до успешного завершения предзагрузки. При ошибке `existingConversations` остаётся `undefined` → кнопки остаются в Loading → пользователь не может случайно создать дублирующий диалог.

**Чек-лист T2-1:**

- [ ] Заменить строку 340 на `const mappingReady = existingConversations !== undefined;`
- [ ] Убедиться, что `UserSelectorList` при `mappingReady = false` показывает `<Button isLoading disabled>` (EC-04) — уже реализовано в B-029
- [ ] Подтвердить, что `setExistingConversations(map)` устанавливает `Map` (не `undefined`) при пустом ответе API — уже реализовано в [`page.tsx:123`](../../../src/app/dashboard/comms/messages/new/page.tsx:123)

**Изменение кода (diff):**

```diff
- const mappingReady = existingConversations !== undefined || !conversationsLoading;
+ const mappingReady = existingConversations !== undefined;
```

---

### 3.3 Test Layer

---

#### 3.3.1 E2E: Поиск по email (T3-1)

| Параметр | Значение |
|---|---|
| **Файл** | [`tests/e2e/comms/new-conversation.e2e.spec.ts`](../../../tests/e2e/comms/new-conversation.e2e.spec.ts) |
| **Действие** | ✏️ Добавить тест в `describe('AC-1.5: Поиск пользователя')` |
| **Задача** | B030-T3-1 |

**Целевой тест:**

```typescript
// tests/e2e/comms/new-conversation.e2e.spec.ts — добавить в describe('AC-1.5')

/**
 * @spec B030-T3-1 — e2e-тест поиска по email
 * @traces B-030 симптом 1, AC-1.5
 */
test('должен найти пользователя по email', async ({ page, request }) => {
  // Arrange: создать пользователя с уникальным email
  const uniqueEmail = `email-search-${Date.now()}@example.com`;
  await request.post('/api/v1/test/users', {
    data: {
      email: uniqueEmail,
      password: 'password123',
      firstName: 'Email',
      lastName: 'Search',
    },
  });

  // Act: открыть страницу и ввести email в поле поиска
  await page.goto(NEW_CONVERSATION_URL);
  const searchInput = page.getByPlaceholder(/поиск/i);
  await searchInput.fill(uniqueEmail);
  await page.waitForTimeout(500);

  // Assert: результат поиска содержит пользователя с данным email
  await expect(page.locator('[role="option"]')).toContainText(uniqueEmail);
});
```

**Ассерты:**

| # | Ассер | Ожидаемый результат |
|---|---|---|
| 1 | `expect('[role="option"]').toContainText(uniqueEmail)` | В результатах поиска присутствует пользователь с указанным email |
| 2 | (неявный) тест не падает | Поиск по email работает корректно |

**Изоляция данных:**

- Уникальный email с `Date.now()` гарантирует отсутствие коллизий между параллельными запусками
- Пользователь создаётся через `/api/v1/test/users` (тестовый эндпоинт)

**Чек-лист T3-1:**

- [ ] Тест добавлен в `describe('AC-1.5: Поиск пользователя')`
- [ ] Используется уникальный email для изоляции
- [ ] Ассерт: результат поиска содержит email найденного пользователя
- [ ] Тест проходит локально и в CI

---

#### 3.3.2 E2E: Новый диалог при наличии других (T4-1)

| Параметр | Значение |
|---|---|
| **Файл** | [`tests/e2e/comms/new-conversation.e2e.spec.ts`](../../../tests/e2e/comms/new-conversation.e2e.spec.ts) |
| **Действие** | ✏️ Добавить тест |
| **Задача** | B030-T4-1 |

**Целевой тест:**

```typescript
// tests/e2e/comms/new-conversation.e2e.spec.ts — добавить

/**
 * @spec B030-T4-1 — e2e-тест US-21-39: новый диалог при наличии других
 * @traces US-21-39, AC-05, FR-09
 *
 * Сценарий:
 * 1. User A имеет диалог с User B
 * 2. User A открывает /dashboard/messages/new
 * 3. Для User B показана кнопка «Открыть диалог»
 * 4. User A ищет User C и видит кнопку «Написать»
 * 5. Клик «Написать» → новый диалог с User C, редирект
 */
test('должен создать новый диалог с C при наличии диалога с B (US-21-39)', async ({ page, request }) => {
  // Arrange: создать двух пользователей
  const suffix = Date.now();
  const userB = await request.post('/api/v1/test/users', {
    data: { email: `b-user-${suffix}@example.com`, password: 'password123', firstName: 'B-User', lastName: 'Test' },
  });
  const userC = await request.post('/api/v1/test/users', {
    data: { email: `c-user-${suffix}@example.com`, password: 'password123', firstName: 'C-User', lastName: 'Test' },
  });

  // Создать диалог A ↔ B
  const profileResp = await request.get('/api/v1/profile');
  const currentUserId = (profileResp.body as any).data.id;
  const participantBId = (userB.body as any).data?.id;
  await request.post('/api/v1/conversations', { data: { participantId: participantBId } });

  // Act 1: открыть страницу нового диалога
  await page.goto(NEW_CONVERSATION_URL);
  const searchInput = page.getByPlaceholder(/поиск/i);

  // Assert 1: поиск B → кнопка «Открыть диалог»
  await searchInput.fill('B-User');
  await page.waitForTimeout(500);
  const optionB = page.locator('[role="option"]').filter({ hasText: 'B-User' });
  await expect(optionB.locator('button')).toContainText('Открыть диалог');

  // Assert 2: поиск C → кнопка «Написать»
  await searchInput.fill('C-User');
  await page.waitForTimeout(500);
  const optionC = page.locator('[role="option"]').filter({ hasText: 'C-User' });
  await expect(optionC.locator('button')).toContainText('Написать');

  // Act 2: кликнуть «Написать» для C
  await optionC.locator('button').click();

  // Assert 3: редирект на новый диалог
  await expect(page).toHaveURL(/.*\/dashboard\/messages\/[a-zA-Z0-9]+/);
});
```

**Ассерты:**

| # | Ассер | Ожидаемый результат | AC |
|---|---|---|---|
| 1 | `optionB.locator('button').toContainText('Открыть диалог')` | Для пользователя с существующим диалогом показана кнопка «Открыть диалог» | AC-05, AC-06 |
| 2 | `optionC.locator('button').toContainText('Написать')` | Для пользователя без диалога показана кнопка «Написать» | AC-05, US-21-39 |
| 3 | `page.toHaveURL(/messages\/[id]/)` | Редирект на страницу нового диалога с User C | AC-1.6 |

**Изоляция данных:**

- `Date.now()` суффикс для email гарантирует уникальность
- Оба пользователя создаются через тестовый API
- Диалог A ↔ B создаётся явно через `POST /conversations`

**Чек-лист T4-1:**

- [ ] Тест добавлен в основной файл
- [ ] Проверена кнопка «Открыть диалог» для B (существующий диалог)
- [ ] Проверена кнопка «Написать» для C (новый диалог)
- [ ] Проверен редирект после клика «Написать»
- [ ] Тест проходит локально и в CI

---

#### 3.3.3 Unit: Email-ветка в `searchUsers` (T5-1)

| Параметр | Значение |
|---|---|
| **Файл** | [`tests/unit/domains/users/users.repository.test.ts`](../../../tests/unit/domains/users/users.repository.test.ts) |
| **Действие** | ✏️ Добавить тест в `describe('searchUsers')` |
| **Задача** | B030-T5-1 |

**Целевой тест:**

```typescript
// tests/unit/domains/users/users.repository.test.ts — добавить в describe('searchUsers')

/**
 * @spec B030-T5-1 — юнит-тест email-ветки фильтра в searchUsers
 * @traces B-030 симптом 1
 */
describe('searchUsers email filtering', () => {
  it('должен найти пользователя по полному email', async () => {
    // Arrange: mock Prisma findMany → возвращает пользователя с указанным email
    const mockPrismaUser = createMockPrismaUser({
      id: 'usr_email',
      email: 'test@example.com',
      profile: { first_name: '', last_name: '' },
    });
    prismaMocks.mockFindMany.mockResolvedValueOnce([mockPrismaUser]);

    // Act: поиск по полному email
    const result = await repository.searchUsers('test@example.com', 'current_user', 20);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'usr_email',
      email: 'test@example.com',
    });
    // Подтвердить, что Prisma получила email-фильтр
    expect(prismaMocks.mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ email: expect.any(Object) }),
          ]),
        }),
      })
    );
  });

  it('должен найти пользователя по частичному email (test@)', async () => {
    const mockPrismaUser = createMockPrismaUser({
      id: 'usr_partial',
      email: 'test@search.com',
      profile: { first_name: '', last_name: '' },
    });
    prismaMocks.mockFindMany.mockResolvedValueOnce([mockPrismaUser]);

    const result = await repository.searchUsers('test@', 'current_user', 20);

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('test@search.com');
  });

  it('должен искать email case-insensitive', async () => {
    const mockPrismaUser = createMockPrismaUser({
      id: 'usr_case',
      email: 'Test@Example.COM',
      profile: { first_name: '', last_name: '' },
    });
    prismaMocks.mockFindMany.mockResolvedValueOnce([mockPrismaUser]);

    const result = await repository.searchUsers('test@example.com', 'current_user', 20);

    expect(result).toHaveLength(1);
  });

  it('не должен возвращать текущего пользователя (excludeUserId)', async () => {
    prismaMocks.mockFindMany.mockResolvedValueOnce([]);

    await repository.searchUsers('query', 'exclude_me', 20);

    // Подтвердить, что where содержит id: { not: 'exclude_me' }
    expect(prismaMocks.mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 'exclude_me' },
        }),
      })
    );
  });
});
```

**Ассерты:**

| # | Тест | Ожидаемый результат |
|---|---|---|
| 1 | Полный email (`test@example.com`) | Найден пользователь с точным совпадением email |
| 2 | Частичный email (`test@`) | Найден пользователь (подтверждает `contains`) |
| 3 | Case-insensitive (`test@example.com` → `Test@Example.COM`) | Найден пользователь (подтверждает `mode: 'insensitive'`) |
| 4 | excludeUserId | `where.id.not` содержит ID текущего пользователя |

**Чек-лист T5-1:**

- [ ] Добавлены 4 тест-кейса в `describe('searchUsers')`
- [ ] Проверено частичное совпадение email (`contains`)
- [ ] Проверен case-insensitive поиск
- [ ] Проверено исключение текущего пользователя
- [ ] Тесты проходят локально

---

## 4. 🔄 Поток данных (изменения)

Поток данных **не изменяется** по сравнению с B-029. Изменяется только логическое выражение `mappingReady`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         B-030 Изменение (T2-1)                               │
└─────────────────────────────────────────────────────────────────────────────┘

  ДО (баг):
    mappingReady = (existingConversations !== undefined) || (!conversationsLoading)
                              ^--- false при сбое           ^--- true при сбое
    → mappingReady = true при ошибке → все кнопки «Написать» → 409

  ПОСЛЕ (исправлено):
    mappingReady = (existingConversations !== undefined)
                              ^--- false при сбое → mappingReady = false
    → кнопки в Loading (EC-04) → клик заблокирован
```

---

## 5. ✅ Чек-лист проверки

### Spec-файл

- [x] Матрица трассировки покрывает T1-1, T2-1, T3-1, T4-1, T5-1
- [x] Матрица трассировки покрывает FR-09, EC-04, AC-05, AC-1.5
- [x] Каждый компонент имеет TASK-ID (B030-T*)
- [x] Визуальный макет подтверждён как неизменный

### Архитектура

- [x] DDD-архитектура соблюдена
- [x] Изменения точечные (1 строка page + JSDoc repository + тесты)
- [x] API/Service/Prisma Schema без изменений
- [x] Переиспользование макета B-029

### Тесты

- [x] E2E-тест email-поиска (T3-1) специфицирован
- [x] E2E-тест US-21-39 (T4-1) специфицирован
- [x] Unit-тест email-ветки (T5-1) специфицирован
- [x] Изоляция данных (уникальные email) указана
- [x] Ассерты определены для каждого теста

---

## 6. 📁 Список файлов

### Изменяемые

| Файл | Действие | Задача | Описание изменений |
|---|---|---|---|
| [`src/domains/users/users.repository.prisma.ts`](../../../src/domains/users/users.repository.prisma.ts) | ✏️ | T1-1 | JSDoc к `searchUsers` (документация email-фильтра) |
| [`src/app/dashboard/comms/messages/new/page.tsx`](../../../src/app/dashboard/comms/messages/new/page.tsx) | 🔧 | T2-1 | Строка 340: `mappingReady = existingConversations !== undefined` |
| [`tests/e2e/comms/new-conversation.e2e.spec.ts`](../../../tests/e2e/comms/new-conversation.e2e.spec.ts) | ✏️ | T3-1 | Тест «поиск по email» |
| [`tests/e2e/comms/new-conversation.e2e.spec.ts`](../../../tests/e2e/comms/new-conversation.e2e.spec.ts) | ✏️ | T4-1 | Тест «новый диалог при наличии других» |
| [`tests/unit/domains/users/users.repository.test.ts`](../../../tests/unit/domains/users/users.repository.test.ts) | ✏️ | T5-1 | 4 тест-кейса email-ветки `searchUsers` |

### Не изменяются (явно исключено)

| Файл | Причина |
|---|---|
| API-слоя | API уже возвращает корректные данные |
| Prisma Schema | Без изменений |
| Service-слой | Service работает корректно |
| UI-компоненты (Button, Input и т.д.) | Визуал не меняется |

---

## 7. 📎 Связанные артефакты

| Артефакт | Ссылка |
|---|---|
| План реализации | [`docs/plans/REQ-COMMS-004-B030-plan.md`](../../plans/REQ-COMMS-004-B030-plan.md) |
| Layout (подтверждение визуальной неизменности) | [`docs/plans/REQ-COMMS-004-B030-layout.md`](../../plans/REQ-COMMS-004-B030-layout.md) |
| Эталон спeки компонент (B-029) | [`docs/specs/comms/B-029-component-spec.md`](./B-029-component-spec.md) |
| Debug-отчёт B-030 | [`docs/debug/B-030-debug-report.md`](../../debug/B-030-debug-report.md) |
| User Story US-21-02 | [`docs/user-stories/US-21-02-начало-нового-личного-диалога.md`](../../user-stories/US-21-02-начало-нового-личного-диалога.md) |
| User Story US-21-39 | [`docs/user-stories/US-21-39-создание-нового-личного-диалога-при-наличии-других.md`](../../user-stories/US-21-39-создание-нового-личного-диалога-при-наличии-других.md) |

---

**Последнее обновление:** 2026-08-04  
**Статус:** DRAFT  
**Связанная задача:** B-030
