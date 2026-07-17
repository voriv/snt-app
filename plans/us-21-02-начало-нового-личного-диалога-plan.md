# План реализации: US-21-02 (Начало нового личного диалога)

## Метаданные
| Параметр | Значение |
|----------|----------|
| **User Story ID** | US-21-02 |
| **Название** | Начало нового личного диалога |
| **Эпик** | REQ-COMMS-001 — Система общения в СНТ |
| **Дата создания** | 2026-07-14 |
| **Статус плана** |待 |

---

## Ссылки
- **User Story:** [`docs/user-stories/US-21-02-начало-нового-личного-диалога.md`](../../docs/user-stories/US-21-02-начало-нового-личного-диалога.md)
- **Требование:** [`docs/requirements/REQ-COMMS-001.md`](../../docs/requirements/REQ-COMMS-001.md)
- **Модель данных:** [`docs/model/schema.dbml`](../../docs/model/schema.dbml), [`docs/model/entities/conversation.md`](../../docs/model/entities/conversation.md)

---

## Дерево файлов

### Требуется создать:
```
src/
├── domains/
│   └── comms/
│       ├── comms.types.ts (добавить CreateConversationData, CreateConversationResult)
│       ├── comms.validators.ts (добавить createConversationSchema)
│       ├── comms.errors.ts (добавить 3 новых ошибки)
│       ├── comms.repository.interface.ts (добавить 2 новых метода)
│       └── comms.repository.prisma.ts (реализовать 2 новых метода)
├── app/
│   └── api/
│       └── v1/
│           ├── conversations/
│           │   └── route.ts (добавить POST метод)
│           └── users/
│               └── search/
│                   └── route.ts (новый файл)
└── app/
    └── dashboard/
        └── messages/
            └── new/
                └── page.tsx (новый файл)
```

### Требуется модифицировать:
```
src/
├── components/features/comms/
│   └── index.ts (экспорт UserSelectorList)
└── domains/comms/
    └── index.ts (экспорт новых типов)
```

---

## Задачи по слоям архитектуры

### Т1: Model & Database
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T1-01 | [TODO] | Проверить актуальность модели conversations, conversation_participants | [ ] DBML схема актуальна [ ] Prisma schema актуальна |

### Т2: Types
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T2-01 | [TODO] | Добавить в `comms.types.ts` | [ ] CreateConversationData { participantId: string } [ ] CreateConversationResult { conversationId: string, isNew: boolean } |

### Т3: Validators
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T3-01 | [TODO] | Добавить в `comms.validators.ts` | [ ] createConversationSchema: z.object({ participantId: z.string().min(1) }) [ ] Russian error messages |

### Т4: Errors
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T4-01 | [TODO] | Добавить в `comms.errors.ts` | [ ] ConversationAlreadyExistsError (409) [ ] CannotMessageSelfError (400) [ ] CannotMessageBlockedUserError (400) |

### Т5: Repository
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T5-01 | [DONE] | Интерфейс `ICommsRepository` | [x] findConversationBetween(userAId: string, userBId: string): Promise<Conversation | null> [x] createConversation(participantIds: string[]): Promise<Conversation> |
| US-21-02-T5-02 | [DONE] | Реализация в `comms.repository.prisma.ts` | [x] findConversationBetween: query conversation where participantIds = [userA, userB] [x] createConversation: transaction: create conversation + 2 participants |

### Т6: Service
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T6-01 | [DONE] | Метод `CommsService.startConversation` | [x] Проверка на себя (CANNOT_MESSAGE_SELF) [ ] Проверка на блокировку (CANNOT_MESSAGE_BLOCKED_USER — TODO US-21-22) [x] Поиск существующего диалога (CONVERSATION_ALREADY_EXISTS) [x] Создание нового диалога |

### Т7: DI
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T7-01 | [DONE] | Метод startConversation уже зарегистрирован | [ ] Проверяю createCommsService() в container.ts |

### Т8: API
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T8-01 | [DONE] | POST `/api/v1/conversations` | [x] Auth check [x] Zod validation [x] Service call [x] Response: { success: true, data: CreateConversationResult } [x] Errors: 400, 403, 409 |
| US-21-02-T8-02 | [DONE] | GET `/api/v1/users/search` | [x] Auth check [x] Query params: q (min 2 chars) [x] Search by name/email [x] Exclude current user [ ] Exclude blocked users — TODO US-21-22 [x] Response: { success: true, data: UserSearchResult[] } |

### Т9: UI
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T9-01 | [DONE] | `UserSelectorList` component | [x] Props: onSelectUser, isLoading [x] Debounce search 300ms [x] EmptyState: «Нет доступных пользователей» / «Пользователь не найден» [x] Avatar, name, email в строке [x] Keyboard navigation |
| US-21-02-T9-02 | [DONE] | `NewConversationPage` page | [x] Route: /dashboard/messages/new [x] Auth check + redirect [x] Search + list [x] Button «Назад» к /dashboard/messages [x] Loading/error states |
| US-21-02-T9-03 | [DONE] | Обновление `ConversationEmptyState` | [x] Кнопка «Написать сообщение» ведёт на /dashboard/messages/new |

### Т10: Integration tests
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T10-01 | [DONE] | API integration tests | [x] POST /conversations: happy path [x] POST /conversations: conversation already exists [x] POST /conversations: message self [ ] POST /conversations: blocked user — TODO US-21-22 [ ] GET /users/search: basic search [ ] GET /users/search: exclude self [ ] GET /users/search: exclude blocked |

### Т11: E2E tests
| ID | Статус | Целевое состояние | Чек-лист |
|----|--------|-------------------|----------|
| US-21-02-T11-01 | [DONE] | E2E test suite | [x] Opens /dashboard/messages/new [x] Search finds users [x] Creates new conversation [x] Redirects to existing conversation [ ] Blocked users not visible (TODO US-21-22) [x] Self not visible |

---

## Матрица AC → Задачи

| AC ID | Название | Задачи |
|-------|----------|--------|
| AC-1.1 | Открытие страницы | T9-02 |
| AC-1.2 | Поиск пользователя | T8-02, T9-01 |
| AC-1.3 | Создание нового диалога | T5-02, T6-01, T8-01, T10-01 |
| AC-1.4 | Редирект в существующий диалог | T5-01, T6-01, T8-01, T10-01 |
| AC-1.5 | Блокировка выбора себя | T8-02, T9-01 |
| AC-1.6 | Блокировка заблокированного | T8-02, T9-01 |

---

## Открытые вопросы

| # | Вопрос | Статус |
|---|--------|--------|
| 1 | Нужен ли новый endpoint для поиска или использовать существующий `/api/v1/users` с query param? | Решено: новый endpoint `/api/v1/users/search` |
| 2 | Какой формат ответного тела для поиска пользователей? | Решено: `{ id, name, email, avatar }` |

---

## Чек-лист валидации перед передачей в Code Mode

- [ ] Задачи декомпозированы на все слои
- [ ] Матрица AC → Задачи полная
- [ ] Открытые вопросы рассмотрены
- [ ] План согласован с пользователем
- [ ] Все зависимости учтены

---

## История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-14 | Architect | Создание плана реализации |

---

**Последнее обновление:** 2026-07-14
