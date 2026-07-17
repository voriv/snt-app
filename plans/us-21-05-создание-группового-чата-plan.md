# План реализации: US-21-05: Создание группового чата

## 📋 Метаданные

| Параметр | Значение |
|----------|----------|
| **User Story** | US-21-05: Создание группового чата |
| **Версия** | 1.0 |
| **Дата** | 2026-07-14 |
| **Статус** | [TODO] |

---

## 📎 Ссылки

| Тип | Ссылка |
|-----|--------|
| **User Story** | [`docs/user-stories/US-21-05-создание-группового-чата.md`](../../docs/user-stories/US-21-05-создание-группового-чата.md) |
| **Требование** | `FR-REQ-COMMS-001-08` из US-21-05 |
| **Модель данных** | [`docs/model/entities/conversation.md`](../../docs/model/entities/conversation.md) |
| **Эпик** | [`roo/specs/epic-comms-001-backlog.md`](../../.roo/specs/epic-comms-001-backlog.md) |

---

## 📁 Дерево файлов

### Требуется создать:

| Файл | Описание |
|------|----------|
| `src/components/features/chats/CreateChatPage/CreateChatPage.tsx` | Страница создания чата |
| `src/components/features/chats/CreateChatPage/index.ts` | Re-export |
| `src/components/features/chats/ChatForm/ChatForm.tsx` | Форма создания: название, описание, выбор участников |
| `src/components/features/chats/ChatForm/index.ts` | Re-export |
| `src/components/features/chats/ParticipantSelector/ParticipantSelector.tsx` | Список пользователей для выбора |
| `src/components/features/chats/ParticipantSelector/index.ts` | Re-export |
| `src/app/dashboard/chats/new/page.tsx` | Страница создания чата |

### Требуется модифицировать:

| Файл | Описание |
|------|----------|
| `src/domains/comms/comms.types.ts` | Добавить `CreateChatData`, `ChatMemberRole` |
| `src/domains/comms/comms.validators.ts` | Добавить `createChatSchema` |
| `src/domains/comms/comms.errors.ts` | Добавить `ChatNameExistsError`, `TooManyParticipantsError` |
| `src/domains/comms/comms.repository.interface.ts` | Добавить `createChat`, `createChatParticipants` |
| `src/domains/comms/comms.repository.prisma.ts` | Реализовать `createChat`, `createChatParticipants` |
| `src/domains/comms/comms.service.ts` | Добавить `createChat` |
| `src/di/container.ts` | Зарегистрировать фабрики сервисов |
| `src/app/api/v1/chats/route.ts` | Добавить POST endpoint |
| `src/components/features/chats/ChatList/ChatList.tsx` | Добавить кнопку «Создать чат» |

---

## 📦 Задачи по слоям

### T1: Types

| ID | Задача | Статус |
|----|--------|--------|
| T1-1 | Добавить `CreateChatData` тип | [TODO] |
| T1-2 | Добавить `ChatMemberRole` тип | [TODO] |
| T1-3 | Обновить `Conversation` тип для группового чата | [TODO] |

### T2: Validators

| ID | Задача | Статус |
|----|--------|--------|
| T2-1 | Добавить `createChatSchema` (name: 2-100, description: ≤500, participantIds: 2-50) | [TODO] |
| T2-2 | Добавить валидацию уникальности названия (на уровне сервиса/БД) | [TODO] |

### T3: Errors

| ID | Задача | Статус |
|----|--------|--------|
| T3-1 | Добавить `ChatNameExistsError` (наследуется от `ConflictError`) | [TODO] |
| T3-2 | Добавить `TooManyParticipantsError` (наследуется от `ValidationError`) | [TODO] |

### T4: Repository Interface

| ID | Задача | Статус |
|----|--------|--------|
| T4-1 | Добавить `createChat(userId, data)` метод в `ICommsRepository` | [TODO] |
| T4-2 | Добавить `createChatParticipants(chatId, participantIds)` метод | [TODO] |

### T5: Repository Implementation

| ID | Задача | Статус |
|----|--------|--------|
| T5-1 | Реализовать `createChat` через Prisma (transaction для создания conversation + participants) | [TODO] |
| T5-2 | Реализовать `createChatParticipants` для добавления участников | [TODO] |
| T5-3 | Добавить проверку уникальности названия (если требуется) | [TODO] |

### T6: Service

| ID | Задача | Статус |
|----|--------|--------|
| T6-1 | Добавить `createChat(userId, data)` метод в `CommsService` | [DONE] |
| T6-2 | Валидация через Zod-схему | [DONE] |
| T6-3 | Проверка уникальности названия | [DONE] |
| T6-4 | Транзакция: создание чата + участников | [DONE] |
| T6-5 | Возврат созданного `Conversation` | [DONE] |

### T7: DI

| ID | Задача | Статус |
|----|--------|--------|
| T7-1 | Проверить регистрацию фабрики `CommsService` | [TODO] |

### T8: API

| ID | Задача | Статус |
|----|--------|--------|
| T8-1 | Добавить `POST /api/v1/chats` endpoint | [TODO] |
| T8-2 | Обработка ошибок (`ChatNameExistsError` → 409, `ValidationError` → 400) | [TODO] |
| T8-3 | Возврат созданного чата | [TODO] |

### T9: UI - Страницы

| ID | Задача | Статус |
|----|--------|--------|
| T9-1 | Создать `CreateChatPage.tsx` (страница `/dashboard/chats/new`) | [DONE] |
| T9-2 | Добавить кнопку «Создать чат» в `ChatList.tsx` → `CreateChatPage` | [DONE] |

### T10: UI - Компоненты

| ID | Задача | Статус |
|----|--------|--------|
| T10-1 | Создать `ChatForm.tsx` (название, описание, выбор участников) | [DONE] |
| T10-2 | Создать `ParticipantSelector.tsx` (поиск пользователей, выбор) | [DONE] |
| T10-3 | Валидация: минимум 2 участника, максимум 50 | [DONE] |
| T10-4 | Обработка состояний: loading, error | [DONE] |

### T11: Интеграционные тесты

| ID | Задача | Статус |
|----|--------|--------|
| T11-1 | Интеграционные тесты для `POST /api/v1/chats` | [TODO] |
| T11-2 | Тесты для `createChat` в `CommsService` | [TODO] |

---

## 📊 Матрица соответствия AC → Задачи

| AC | Описание | Задачи |
|----|----------|--------|
| AC-1.1 | Открытие формы создания | T9-1, T10-1 |
| AC-1.2 | Название чата (2-100 символов) | T2-1, T10-3 |
| AC-1.3 | Описание чата (≤500 символов) | T2-1, T10-1 |
| AC-1.4 | Выбор участников (2-50) | T2-1, T10-3 |
| AC-1.5 | Создание чата и переход | T6-1, T8-1, T9-1 |
| AC-1.6 | Создание своего имени как «Создатель» | T5-1, T6-4 |

---

## ✅ Чек-лист валидации плана

### Код и типы
- [ ] Типы `CreateChatData` и `ChatMemberRole` добавлены
- [ ] Zod-схема `createChatSchema` валидирует все поля
- [ ] Ошибки `ChatNameExistsError` и `TooManyParticipantsError` наследуются корректно

### Целостность
- [ ] Repository использует transaction для создания чата + участников
- [ ] Создатель получает роль OWNER автоматически
- [ ] Проверка уникальности названия реализована

### Тестирование
- [ ] Интеграционные тесты покрывают happy path и ошибки

### Функциональность
- [ ] Форма отображается на `/dashboard/chats/new`
- [ ] Валидация минимум 2 участника блокирует кнопку «Создать»
- [ ] После создания — редирект на `/dashboard/chats/:chatId`

---

## 📝 История изменений

| Версия | Дата | Автор | Описание |
|--------|------|-------|----------|
| 1.0 | 2026-07-14 | ИИ-архитектор | Создание плана |

---

## 📎 Дополнительные ссылки

- [`prisma/schema.prisma`](../../prisma/schema.prisma) — текущая схема БД
- [`src/domains/comms/comms.types.ts`](../../src/domains/comms/comms.types.ts) — доменные типы
- [`docs/model/entities/conversation.md`](../../docs/model/entities/conversation.md) — модель Conversation
