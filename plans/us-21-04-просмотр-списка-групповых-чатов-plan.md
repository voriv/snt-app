# План реализации: US-21-04: Просмотр списка групповых чатов

> **Шаблон используется для декомпозиции User Story на технические задачи по слоям архитектуры.**
> Статусы задач: `[TODO]` → `[IN PROGRESS]` → `[DONE]`

---

## 📋 Метаданные

| Параметр       | Значение                                  |
| -------------- | ----------------------------------------- |
| **US-ID**      | `US-21-04`                                |
| **Название**   | Просмотр списка групповых чатов           |
| **Версия плана** | `v1.0`                                    |
| **Дата создания** | `2026-07-14`                              |
| **Статус**     | `[DONE]`                           |
| **Зависит от** | US-21-01 (базовая инфраструктура comms)   |

---

## 📎 Ссылки

- **User Story:** [`docs/user-stories/US-21-04-просмотр-списка-групповых-чатов.md`](../../docs/user-stories/US-21-04-просмотр-списка-групповых-чатов.md)
- **Требования (REQ):** [`docs/requirements/REQ-COMMS-001.md`](../../docs/requirements/REQ-COMMS-001.md)
- **Модель данных:** [`docs/model/entities/conversation.md`](../../docs/model/entities/conversation.md)

---

## 📁 Дерево файлов

### Требуется создать:

```
src/
├── app/
│   ├── api/v1/chats/route.ts                    # 🆕 GET /api/v1/chats
│   └── dashboard/chats/page.tsx                 # 🆕 Страница списка чатов
├── components/
│   └── features/
│       └── chats/
│           ├── ChatCard.tsx                     # 🆕 Карточка одного чата
│           ├── ChatCard/index.ts                # 🆕 Re-export
│           ├── ChatList.tsx                     # 🆕 Список карточек с поиском
│           ├── ChatList/index.ts                # 🆕 Re-export
│           └── index.ts                         # 🆕 Re-export
└── tests/
    ├── unit/domains/comms/comms.service.test.ts # ✏️ Тесты для getUserGroupChats
    └── integration/domains/comms.test.ts        # ✏️ Интеграционные тесты
```

### Требуется модифицировать:

```
src/
├── domains/comms/
│   ├── comms.types.ts                           # ✏️ Добавить ChatListItem
│   ├── comms.repository.interface.ts            # ✏️ getUserGroupChats()
│   ├── comms.repository.prisma.ts              # ✏️ Реализация getUserGroupChats()
│   ├── comms.service.ts                        # ✏️ getUserGroupChats()
│   └── index.ts                                # ✏️ Re-export ChatListItem
```

---

## 📦 Задачи по слоям

> **Ключевое замечание:** US-21-04 использует существующие таблицы `conversation` (с фильтром type='GROUP') и `conversation_participants`. Миграции БД не требуются.

---

### Т1: Types

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-21-04-T1`                                    |
| **Статус** | `[DONE]`                                         |

**Чек-лист:**

- [x] `ChatListItem` с JSDoc (`@type`, `@domain`, `@spec`)
- [x] Поля: `chatId`, `name`, `lastMessagePreview`, `lastMessageAt`, `participantCount`, `unreadCount`
- [x] Re-export в `comms/index.ts`
| **Файл**   | `src/domains/comms/comms.types.ts`               |
| **Действие** | `Изменить`                                       |

**Целевое состояние:**

- Определён тип `ChatListItem` с полями для отображения карточки чата

**Чек-лист:**

- [ ] `ChatListItem` с JSDoc (`@type`, `@domain`, `@spec`)
- [ ] Поля: `chatId`, `name`, `lastMessagePreview`, `lastMessageAt`, `participantCount`, `unreadCount`
- [ ] Re-export в `comms/index.ts`

---

### Т2: Repository Interface

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-21-04-T2`                                    |
| **Статус** | `[DONE]`                                         |

**Чек-лист:**

- [x] Метод `getUserGroupChats(userId: string): Promise<ChatListItem[]>`
- [x] JSDoc с `@param`, `@returns`, `@spec`
- [x] Фильтр: только type='GROUP', где пользователь участник
- [x] Сортировка: по lastMessageAt DESC
| **Файл**   | `src/domains/comms/comms.repository.interface.ts` |
| **Действие** | `Изменить`                                       |

**Целевое состояние:**

- Метод `getUserGroupChats(userId)` добавлен в `ICommsRepository`

**Чек-лист:**

- [ ] Метод `getUserGroupChats(userId: string): Promise<ChatListItem[]>`
- [ ] JSDoc с `@param`, `@returns`, `@spec`
- [ ] Фильтр: только type='GROUP', где пользователь участник
- [ ] Сортировка: по lastMessageAt DESC

---

### Т3: Repository Implementation

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-21-04-T3`                                    |
| **Статус** | `[DONE]`                                         |

**Чек-лист:**

- [x] Prisma-запрос с фильтром `type = 'GROUP'`
- [x] JOIN с `conversation_participants` для проверки участия
- [x] JOIN с `messages` для последнего сообщения
- [x] COUNT для количества участников
- [x] COUNT для непрочитанных (по `lastReadAt`)
- [x] Сортировка по `lastMessageAt DESC`
- [x] Маппинг в `ChatListItem[]`
| **Файл**   | `src/domains/comms/comms.repository.prisma.ts`   |
| **Действие** | `Изменить`                                       |

**Целевое состояние:**

- Реализован `getUserGroupChats()` на базе Prisma

**Чек-лист:**

- [ ] Prisma-запрос с фильтром `type = 'GROUP'`
- [ ] JOIN с `conversation_participants` для проверки участия
- [ ] JOIN с `messages` для последнего сообщения
- [ ] COUNT для количества участников
- [ ] COUNT для непрочитанных (по `lastReadAt`)
- [ ] Сортировка по `lastMessageAt DESC`
- [ ] Маппинг в `ChatListItem[]`

---

### Т4: Service

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-21-04-T4`                                    |
| **Статус** | `[DONE]`                                         |

**Чек-лист:**

- [x] Метод с JSDoc (`@service`, `@param`, `@returns`, `@spec`)
- [x] Вызов `repository.getUserGroupChats(userId)`
- [x] Обновление `@see` в JSDoc файла
| **Файл**   | `src/domains/comms/comms.service.ts`             |
| **Действие** | `Изменить`                                       |

**Целевое состояние:**

- Метод `getUserGroupChats(userId)` добавлен в `CommsService`

**Чек-лист:**

- [ ] Метод с JSDoc (`@service`, `@param`, `@returns`, `@spec`)
- [ ] Вызов `repository.getUserGroupChats(userId)`
- [ ] Обновление `@see` в JSDoc файла

---

### Т5: API

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-21-04-T5`                                    |
| **Статус** | `[DONE]`                                         |

**Чек-лист:**

- [x] Route handler с JSDoc (`@route`, `@auth`, `@response`, `@spec`)
- [x] `auth()` для проверки авторизации (401 если нет сессии)
- [x] Вызов `commsService.getUserGroupChats(userId)`
- [x] Возврат `{ success: true, data: ChatListItem[] }`
- [x] Обработка ошибок через `instanceof BaseError`
| **Файл**   | `src/app/api/v1/chats/route.ts`                  |
| **Действие** | `Создать`                                        |

**Целевое состояние:**

- `GET /api/v1/chats` — возвращает список групповых чатов пользователя

**Чек-лист:**

- [ ] Route handler с JSDoc (`@route`, `@auth`, `@response`, `@spec`)
- [ ] `auth()` для проверки авторизации (401 если нет сессии)
- [ ] Вызов `commsService.getUserGroupChats(userId)`
- [ ] Возврат `{ success: true, data: ChatListItem[] }`
- [ ] Обработка ошибок через `instanceof BaseError`

---

### Т6: UI - ChatCard

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-21-04-T6`                                    |
| **Статус** | `[DONE]`                                         |

**Чек-лист:**

- [x] `'use client'`
- [x] JSDoc (`@component`, `@category`, `@spec`)
- [x] Пропсы: `ChatListItem` + `onClick`
- [x] Название чата (title)
- [x] Превью последнего сообщения (обрезанное до 60 символов)
- [x] Время последнего сообщения (форматирование)
- [x] Количество участников (иконка + число)
- [x] Бейдж непрочитанных (если > 0)
- [x] Click → переход на `/dashboard/chats/:chatId`
- [x] ARIA-метки, focus-ring
| **Файл**   | `src/components/features/chats/ChatCard.tsx`     |
| **Действие** | `Создать`                                        |

**Целевое состояние:**

- Компонент карточки чата с названием, превью, временем, участниками, бейджем

**Чек-лист:**

- [ ] `'use client'`
- [ ] JSDoc (`@component`, `@category`, `@spec`)
- [ ] Пропсы: `ChatListItem` + `onClick`
- [ ] Название чата (title)
- [ ] Превью последнего сообщения (обрезанное до 60 символов)
- [ ] Время последнего сообщения (форматирование)
- [ ] Количество участников (иконка + число)
- [ ] Бейдж непрочитанных (если > 0)
- [ ] Click → переход на `/dashboard/chats/:chatId`
- [ ] ARIA-метки, focus-ring

---

### Т7: UI - ChatList

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-21-04-T7`                                    |
| **Статус** | `[DONE]`                                         |

**Чек-лист:**

- [x] `'use client'`
- [x] JSDoc (`@component`, `@category`, `@spec`)
- [x] Загрузка данных через `apiClient.get('/chats')`
- [x] Состояния: `isLoading`, `error`, `data`
- [x] Поиск по названию (debounce 300ms, фильтрация на клиенте)
- [x] `EmptyState` когда нет чатов (текст + кнопка «Создать чат»)
- [x] Рендер `ChatCard` для каждого чата
- [x] Сортировка по времени (уже на бэкенде)
| **Файл**   | `src/components/features/chats/ChatList.tsx`     |
| **Действие** | `Создать`                                        |

**Целевое состояние:**

- Компонент списка чатов с поиском и состояниями

**Чек-лист:**

- [ ] `'use client'`
- [ ] JSDoc (`@component`, `@category`, `@spec`)
- [ ] Загрузка данных через `apiClient.get('/chats')`
- [ ] Состояния: `loading`, `error`, `empty`, `data`
- [ ] Поиск по названию (debounce 300ms, фильтрация на клиенте)
- [ ] `EmptyState` когда нет чатов (текст + кнопка «Создать чат»)
- [ ] Рендер `ChatCard` для каждого чата
- [ ] Сортировка по времени (уже на бэкенде)

---

### Т8: Pages

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-21-04-T8`                                    |
| **Статус** | `[DONE]`                                         |

**Чек-лист:**

- [x] `'use client'`
- [x] JSDoc (`@page`, `@auth`, `@role`, `@spec`, `@data-flow`)
- [x] `useSession()` для проверки авторизации
- [x] Рендер `ChatList` компонента
- [x] Обработка редиректа на `/login` если нет сессии
| **Файл**   | `src/app/dashboard/chats/page.tsx`               |
| **Действие** | `Создать`                                        |

**Целевое состояние:**

- Страница `/dashboard/chats` со списком групповых чатов

**Чек-лист:**

- [ ] `'use client'`
- [ ] JSDoc (`@page`, `@auth`, `@role`, `@spec`, `@data-flow`)
- [ ] `useSession()` для проверки авторизации
- [ ] Рендер `ChatList` компонента
- [ ] Обработка редиректа на `/login` если нет сессии

---

### Т9: Unit-тесты

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-21-04-T9`                                    |
| **Статус** | `[DONE]`                                         |

**Чек-лист:**

- [x] Happy path — возвращает массив чатов
- [x] Пустой массив когда нет чатов
- [x] Mock repository.getUserGroupChats
| **Файл**   | `tests/unit/domains/comms/comms.service.test.ts` |
| **Действие** | `Изменить`                                       |

**Целевое состояние:**

- Тесты для `getUserGroupChats()` в CommsService

**Чек-лист:**

- [ ] Happy path — возвращает массив чатов
- [ ] Пустой массив когда нет чатов
- [ ] Mock repository.getUserGroupChats

---

### Т10: Интеграционные тесты

| Параметр   | Значение                                         |
| ---------- | ------------------------------------------------ |
| **ID**     | `US-21-04-T10`                                   |
| **Статус** | `[DONE]`                                         |

**Чек-лист:**

- [x] Тест с GROUP диалогами — возвращает чаты
- [x] Тест с DIRECT диалогами — не возвращаются
- [x] Тест с несуществующим пользователем — пустой массив
- [x] Тест с несколькими чатами — сортировка по времени
- [x] Очистка тестовых данных в afterEach
| **Файл**   | `tests/integration/domains/comms.test.ts`        |
| **Действие** | `Изменить`                                       |

**Целевое состояние:**

- Интеграционные тесты для `getUserGroupChats()`

**Чек-лист:**

- [ ] Тест с GROUP диалогами — возвращает чаты
- [ ] Тест с DIRECT диалогами — не возвращаются
- [ ] Тест с несуществующим пользователем — пустой массив
- [ ] Тест с несколькими чатами — сортировка по времени
- [ ] Очистка тестовых данных в afterEach

---

## 📊 Матрица соответствия AC → Задачи

| AC | Описание | Задача | Статус |
|----|----------|--------|--------|
| AC-1.1 | Загрузка списка чатов | T2, T3, T4, T5, T8 | `[DONE]` |
| AC-1.2 | Структура карточки чата | T1, T6 | `[DONE]` |
| AC-1.3 | Переход к чату | T6, T8 | `[DONE]` |
| AC-1.4 | Сортировка по времени | T3 | `[DONE]` |
| AC-1.5 | Поиск по чатам | T7 | `[DONE]` |
| EC-1 | Нет чатов | T7 (EmptyState) | `[DONE]` |
| EC-2 | Медленная сеть | T7 (loading state) | `[DONE]` |
| EC-3 | Ошибка загрузки | T7 (error state) | `[DONE]` |

---

## ✅ Чек-лист валидации плана

Перед передачей плана в Code-режим убедиться:

### Код и типы
- [x] `ChatListItem` тип с JSDoc-аннотациями
- [x] Метод `getUserGroupChats` в repository interface с JSDoc
- [x] Метод `getUserGroupChats` в service с JSDoc
- [x] API Route Handler с JSDoc (`@route GET /api/v1/chats`)
- [x] UI-компоненты с JSDoc (`@component`, `@category`, `@spec`)
- [x] Страница с JSDoc (`@page`, `@auth`, `@spec`, `@data-flow`)

### Целостность
- [ ] Модель данных без изменений (используем существующие таблицы)
- [x] Re-export `ChatListItem` в `comms/index.ts`
- [x] Нет рассинхронизации между L1 (JSDoc) и L2 (User Story)

### Тестирование
- [ ] `npm run type-check` — без ошибок
- [ ] `npm run lint` — без ошибок
- [x] `npm run test` — все тесты проходят

---

## 📝 История изменений

| Дата       | Версия | Автор     | Изменение                   |
| ---------- | ------ | --------- | --------------------------- |
| 2026-07-14 | v1.0   | Architect | Создание плана реализации   |
| 2026-07-15 | v1.1   | Code    | Реализация всех задач завершена   |

---

## 📎 Дополнительные ссылки

- [`SPECS.md`](../../.roo/rules/SPECS.md) — правила управления спецификациями
- [`MODEL.md`](../../.roo/rules/MODEL.md) — правила управления моделью данных
- [`ARCHITECTURE.md`](../../.roo/rules/ARCHITECTURE.md) — правила архитектуры
- [`PROJECT.md`](../../.roo/rules/PROJECT.md) — глобальные правила проекта
