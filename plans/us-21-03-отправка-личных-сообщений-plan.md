# US-21-03: Отправка личных сообщений — План реализации

## Метаданные

| Параметр | Значение |
|----------|----------|
| **US-ID** | US-21-03 |
| **Название** | Отправка личных сообщений |
| **Версия** | 1.0 |
| **Дата** | 2026-07-14 |
| **Статус** | Done |

## Ссылки

- **User Story:** `docs/user-stories/US-21-03-отправка-личных-сообщений.md`
- **REQ:** `docs/requirements/REQ-COMMS-001.md`
- **Модель:** `docs/model/entities/message.md`

## Дерево файлов

### Требуется создать:
- `src/app/api/v1/conversations/[id]/messages/route.ts` — GET/POST сообщения диалога
- `src/app/api/v1/messages/[id]/route.ts` — DELETE сообщение
- `src/components/features/comms/MessageList/MessageList.tsx` — список сообщений
- `src/components/features/comms/MessageItem/MessageItem.tsx` — элемент сообщения
- `src/components/features/comms/MessageInput/MessageInput.tsx` — форма отправки
- `tests/unit/domains/comms/comms.service.message.test.ts` — unit-тесты service
- `tests/api/messages.test.ts` — интеграционные тесты API сообщений

### Требуется модифицировать:
- `src/domains/comms/comms.types.ts` — добавить `SendMessageData`
- `src/domains/comms/comms.validators.ts` — добавить `sendMessageSchema`
- `src/domains/comms/comms.errors.ts` — добавить `MessageTooLargeError`, `CannotDeleteOthersMessageError`
- `src/domains/comms/comms.repository.interface.ts` — добавить методы для сообщений
- `src/domains/comms/comms.repository.prisma.ts` — реализовать методы
- `src/domains/comms/comms.service.ts` — добавить методы работы с сообщениями
- `src/app/dashboard/messages/[id]/page.tsx` — интегрировать компоненты
- `src/domains/comms/index.ts` — экспорты

---

## Задачи по слоям

### Т1: Types ✅
- [x] Добавить `SendMessageData` тип в `comms.types.ts`
  - [x] `content: string` — текст сообщения
  - [x] `type: 'text' | 'file'` — тип сообщения

### Т2: Validators ✅
- [x] Добавить `sendMessageSchema` в `comms.validators.ts`
  - [x] Валидация `content`: max 4000 символов, не пустое для text
  - [x] Валидация `type`: enum 'text' | 'file'

### Т3: Errors ✅
- [x] Добавить `MessageTooLargeError` в `comms.errors.ts` (ValidationError, 400)
- [x] Добавить `CannotDeleteOthersMessageError` в `comms.errors.ts` (ForbiddenError, 403)

### Т4: Repository Interface ✅
- [x] Добавить `getConversationMessages(conversationId): Promise<Message[]>`
- [x] Добавить `createMessage(data): Promise<Message>`
- [x] Добавить `softDeleteMessage(messageId, deletedBy): Promise<void>`
- [x] Добавить `findMessageById(messageId): Promise<Message | null>`
- [x] Добавить `getMessageSender(messageId): Promise<string | null>`

### Т5: Repository Implementation ✅
- [x] Реализовать `getConversationMessages()` — SELECT messages WHERE conversationId ORDER BY createdAt ASC
- [x] Реализовать `createMessage()` — INSERT message
- [x] Реализовать `softDeleteMessage()` — UPDATE message SET is_deleted=true, deleted_by=..., deleted_at=...
- [x] Реализовать `findMessageById()` — SELECT message WHERE id
- [x] Реализовать `getMessageSender()` — SELECT sender_id FROM message WHERE id

### Т6: Service ✅
- [x] Добавить `getConversationMessages(conversationId, userId)` с проверкой участия
- [x] Добавить `sendMessage(userId, conversationId, data)` с валидацией
- [x] Добавить `deleteMessage(userId, messageId)` с проверкой владения

### Т7: DI Container ✅
- [x] Проверить что методы service доступны через DI

### Т8: API ✅
- [x] `GET /api/v1/conversations/:id/messages` — история сообщений
- [x] `POST /api/v1/conversations/:id/messages` — отправка сообщения
- [x] `DELETE /api/v1/messages/:id` — удаление сообщения

### Т9: UI ✅
- [x] Создать `MessageItem` компонент
- [x] Создать `MessageList` компонент
- [x] Создать `MessageInput` компонент
- [x] Обновить `src/app/dashboard/messages/[id]/page.tsx`

### Т10: Unit-тесты ✅
- [x] Тесты для `sendMessage()` — happy path
- [x] Тесты для `sendMessage()` — пустое сообщение
- [x] Тесты для `sendMessage()` — слишком длинное сообщение
- [x] Тесты для `sendMessage()` — не участник диалога
- [x] Тесты для `deleteMessage()` — happy path
- [x] Тесты для `deleteMessage()` — чужое сообщение
- [x] Тесты для `deleteMessage()` — сообщение не найдено
- [x] Тесты для `getConversationMessages()` — happy path
- [x] Тесты для `getConversationMessages()` — не участник

### Т11: Интеграционные тесты ✅
- [x] Тест getConversationMessages — 200 с сообщениями
- [x] Тест getConversationMessages — 200 пустой массив
- [x] Тест getConversationMessages — ConversationNotFoundError
- [x] Тест getConversationMessages — ConversationAccessDeniedError
- [x] Тест sendMessage — 201 создание
- [x] Тест sendMessage — с replyToId
- [x] Тест sendMessage — ConversationNotFoundError
- [x] Тест sendMessage — ConversationAccessDeniedError
- [x] Тест sendMessage — ValidationError (пустое)
- [x] Тест sendMessage — ошибка (>4000 chars)
- [x] Тест deleteMessage — soft delete (13 тестов пройдено)
- [x] Тест deleteMessage — MessageNotFoundError
- [x] Тест deleteMessage — CannotDeleteOthersMessageError

---

## Матрица AC → Задачи

| AC | Покрытие | Задачи |
|----|----------|--------|
| AC-1.1: Отправка текстового сообщения | Т4, Т5, Т6, Т8, Т9 | Repository + Service + API + UI |
| AC-1.6: Загрузка истории | Т4, Т5, Т6, Т8, Т9 | Repository + Service + API + UI |
| AC-1.8: Удаление своего сообщения | Т3, Т4, Т5, Т6, Т8 | Errors + Repository + Service + API |

---

## Чек-лист валидации

- [x] Все методы сервиса покрыты unit-тестами
- [x] API endpoints возвращают корректные HTTP-статусы
- [x] Проверка участия в диалоге работает
- [x] Проверка владения сообщением работает
- [x] Валидация длины сообщения работает
- [x] Soft delete устанавливает is_deleted + deleted_by + deleted_at
- [x] TypeScript компиляция проходит без ошибок

---

## История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-14 | ИИ-кодер | Создание плана |
| 2026-07-15 | ИИ-оркестратор | Статус: Done — все задачи T1-T11 выполнены |
