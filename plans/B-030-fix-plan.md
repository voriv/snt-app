# План исправления B-030: полная переработка pair_key B-029 + остаточный 500 в POST /conversations

## Диагноз (корень 500)

### Этап 1 — pair_key (B-029, решено ранее)

Есть две причины, обе из одного дефекта дизайна B-029:

1. **Отсутствие колонки в dev-БД** — миграция B-029 не применена (`_prisma_migrations` показывает последней `20260715101908_add_sender_to_message`), поэтому колонки `pair_key` нет. При `createConversation` → `createMany` с полем `pairKey` → SQL-ошибка `column "pair_key" does not exist` → 500.
2. **Дефект дизайна B-029** — даже после применения миграции логика нерабочая: `pair_key` хранится в `conversation_participants` (2 строки на диалог) и обеим строкам присваивается одинаковый `pair_key = sorted(A|B)`. Unique-индекс на `pair_key` не допускает дубликата внутри одного диалога → любой новый DIRECT-диалог всегда падал бы с P2002 → 500.

Подтверждение (дек): миграция применялась к БД с единственным DIRECT-диалогом и падала «Key (pair_key)=(A|B) is duplicated».

## Решение

Перенести `pair_key` из `conversation_participants` в `conversations` (одна строка на диалог), тогда unique-индекс корректен.

## Правки

### 1. `prisma/schema.prisma`
- В модели `ConversationParticipant` удалить поле `pairKey`.
- В модели `Conversation` добавить `pairKey String? @map("pair_key")` (после `createdBy`) + doc-комментарий.
- Обновить doc-комментарий модели.

### 2. Миграция `prisma/migrations/20260804081300_add_unique_direct_conversation_constraint/migration.sql`
- Не добавлять `pair_key` в `conversation_participants`.
- `ALTER TABLE conversations ADD COLUMN pair_key TEXT`
- Backfill в `conversations` из DIRECT-пар (MIN/MAX user_id):
  ```sql
  UPDATE conversations c SET pair_key = sub.pair_key
  FROM (
    SELECT conversation_id, MIN(user_id)::TEXT || '|' || MAX(user_id)::TEXT AS pair_key
    FROM conversation_participants GROUP BY conversation_id
  ) sub
  WHERE c.id = sub.conversation_id AND c.type = 'DIRECT' AND c.pair_key IS NULL;
  ```
- `CREATE UNIQUE INDEX ... ON conversations (pair_key) WHERE pair_key IS NOT NULL`
- `CREATE INDEX ... ON conversation_participants (user_id, conversation_id)`

### 3. `src/domains/comms/comms.repository.prisma.ts`
- `createConversation`: писать `pairKey` в `conversation.create` (в data), убрать из `createMany` каждого участника.
- `findConversationBetween` — оставить текущий рабочий алгоритм без изменений (fast-path по pair_key был протестирован и откачен из-за конфликта с unit-моками; fallback корректно обрабатывает и старые, и новые диалоги).

### 4. `src/domains/comms/comms.repository.interface.ts`
- Обновить doc @b029 (pairKey на уровне conversations).

### 5. `tests/unit/domains/comms/comms.repository.b029.test.ts`
- Обновить мок `conversation.create` → теперь содержит `pairKey`; проверить `conversation.create` data, а не `createMany`.

### 6. Применить к dev-БД
- `prisma migrate resolve --rolled-back` (если нужно) + `npx prisma migrate deploy` + `npx prisma generate`.

### 7. Документация
- Обновить `docs/debug/B-030-debug-report.md` разделом о 500.
- При необходимости `docs/reviews/B-029-repository-review.md`, `docs/plans/REQ-COMMS-004-B029-plan.md`.

## Проверка
- `POST /conversations` для новой пары → 201; для существующей пары → 409 с conversationId (не 500).
- Unit-тесты repository/service проходят.

---

## Этап 2 — остаточный 500 в POST /api/v1/conversations (B-030, решено)

### Симптом (фактический стэк воспроизведён)
После этапа 1 `pair_key`-проблема устранена (новая пара → 201, существующая → 409).
Но e2e-прогон по-прежнему давал `POST /api/v1/conversations → 500`. Воспроизведено авторизованным
запросом по всем веткам:

```
[EMPTY BODY]        → 500  UNKNOWN_ERROR  (ZodError: participantId Required)
[EMPTY PARTICIPANT] → 500  UNKNOWN_ERROR  (ZodError: too_small)
[NONEXISTENT]       → 200  P2003 raw  Foreign key violation (conversation_participants_user_id_fkey)
[SELF]             → 200  P2003 raw  Foreign key violation
[NEW PAIR]         → 201  (работает)
[EXISTING PAIR]    → 409  (работает)
```

### Корневые причины (3 дефекта в обработке ошибок контракта)

| # | Дефект | Файл:строка | Было | Стало |
|---|--------|-------------|-----|-------|
| Д1 | `ZodError` (пустой/нет `participantId`) → **500** | `conversations/route.ts` `errorResponse` не обрабатывал `ZodError` | 500 `UNKNOWN_ERROR` | 400 `VALIDATION_ERROR` |
| Д2 | несуществующий собеседник → **200** с сырым `P2003` | `createConversation.createMany` бросает `P2003`; route → 200 | 200 P2003 | 400 `BAD_REQUEST` (service) / 404 (repository страховка) |
| Д3 | «самому себе»/невалидный участник → **200** P2003 | отсутствие проверки существования собеседника до БД | 200 P2003 | 400 |

### Правки (этап 2)

1. **`src/app/api/v1/conversations/route.ts`**
   - Импорт `ZodError`.
   - В `errorResponse` добавлена ветка `if (error instanceof ZodError) → 400 VALIDATION_ERROR` (до BaseError-ветки).
   - Generic-ветка переведена на `INTERNAL_ERROR` (вместо `UNKNOWN_ERROR`, с 500).

2. **`src/domains/comms/comms.repository.interface.ts`**
   - Добавлен метод `userExists(userId): Promise<boolean>` (doc @b030).

3. **`src/domains/comms/comms.repository.prisma.ts`**
   - Реализован `userExists` (findUnique по `id`, select id).
   - В `catch` `createConversation` добавлена обработка `P2003` → `ParticipantNotFoundError` (страховка; 404 вместо 200 с сырым P2003).

4. **`src/domains/comms/comms.service.ts`**
   - В `startConversation`, после BR-01 (self) и перед `findConversationBetween`, проверка
     `userExists(participantId)` → если нет → `BadRequestError('Пользователь не найден')` (400).

### Проверка после этапа 2 (авторизованный POST)
- новая пара → **201** `{conversationId, isNew:true}`
- существующая пара → **409** `CONVERSATION_ALREADY_EXISTS` + `conversationId`
- пустой body → **400** `VALIDATION_ERROR`
- пустой `participantId` → **400** `VALIDATION_ERROR`
- несуществующий участник → **400** `BAD_REQUEST`
- самому себе → **400**
- Ни в одной ветке 500 (кроме непредвиденных → `INTERNAL_ERROR`).

> Результат зафиксирован: `EMPTY BODY 400 / EMPTY PARTICIPANT 400 / NONEXISTENT 400 / SELF 400 / NEW 201 / EXISTING 409`.
