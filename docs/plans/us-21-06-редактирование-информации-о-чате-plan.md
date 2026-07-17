# План реализации: US-21-06: Редактирование информации о чате

## 📋 Метаданные

| Параметр | Значение |
|----------|----------|
| **User Story** | US-21-06: Редактирование информации о чате |
| **Epic** | REQ-COMMS-001: Система общения в СНТ |
| **Версия** | 1.0 |
| **Дата создания** | 2026-07-15 |
| **Статус** | [TODO] |

---

## 📎 Ссылки

- **User Story**: [`docs/user-stories/US-21-06-редактирование-информации-о-чате.md`](../../docs/user-stories/US-21-06-редактирование-информации-о-чате.md)
- **Требование**: [`docs/requirements/REQ-COMMS-001.md`](../../docs/requirements/REQ-COMMS-001.md)
- **Модель данных**: [`docs/model/entities/conversation.md`](../../docs/model/entities/conversation.md)

---

## 📁 Дерево файлов

### Требуется создать:

| Файл | Описание |
|------|----------|
| `src/domains/comms/comms.types.ts` | Добавить `UpdateChatData` |
| `src/domains/comms/comms.validators.ts` | Добавить `updateChatSchema` |
| `src/domains/comms/comms.errors.ts` | Добавить `CannotEditChatError` |
| `src/domains/comms/comms.repository.interface.ts` | Добавить `updateChat` метод |
| `src/domains/comms/comms.repository.prisma.ts` | Реализовать `updateChat` |
| `src/domains/comms/comms.service.ts` | Добавить `updateChat` метод |
| `src/app/api/v1/chats/[id]/route.ts` | Создать PATCH endpoint |
| `src/app/dashboard/chats/[id]/edit/page.tsx` | Создать страницу редактирования |
| `src/components/features/chats/EditChatForm/EditChatForm.tsx` | Создать компонент формы |

---

## 📦 Задачи по слоям

### Т1: Types

**Целевое состояние:**
- Добавить интерфейс `UpdateChatData` в `src/domains/comms/comms.types.ts`

**Чек-лист:**
- [ ] Определить интерфейс `UpdateChatData` с полями `name?` и `description?`
- [ ] Добавить JSDoc аннотации

---

### Т2: Validators

**Целевое состояние:**
- Добавить Zod-схему `updateChatSchema` в `src/domains/comms/comms.validators.ts`

**Чек-лист:**
- [ ] Создать схему валидации для частичного обновления чата
- [ ] name: опционально, 2-100 символов
- [ ] description: опционально, 0-500 символов
- [ ] Добавить JSDoc аннотации

---

### Т3: Errors

**Целевое состояние:**
- Добавить класс ошибки `CannotEditChatError` в `src/domains/comms/comms.errors.ts`

**Чек-лист:**
- [ ] Создать класс `CannotEditChatError` наследуемый от `ForbiddenError`
- [ ] Код ошибки: `CANNOT_EDIT_CHAT`
- [ ] HTTP статус: 403
- [ ] Сообщение: "У вас нет прав на редактирование этого чата"
- [ ] Добавить JSDoc аннотации

---

### Т4: Repository Interface

**Целевое состояние:**
- Добавить метод `updateChat` в интерфейс `ICommsRepository`

**Чек-лист:**
- [ ] Определить метод `updateChat(chatId, userId, data): Promise<Conversation>`
- [ ] Добавить JSDoc аннотации с описанием параметров и возвращаемого значения
- [ ] Указать, что выбрасывает `CannotEditChatError` при отсутствии прав

---

### Т5: Repository Implementation

**Целевое состояние:**
- Реализовать метод `updateChat` в `src/domains/comms/comms.repository.prisma.ts`

**Чек-лист:**
- [ ] Найти чат по ID
- [ ] Проверить, что пользователь является creator или admin
- [ ] Обновить поля (name, description)
- [ ] Возвратить обновлённый объект Conversation
- [ ] Добавить JSDoc аннотации

---

### Т6: Service

**Целевое состояние:**
- Добавить метод `updateChat` в `src/domains/comms/comms.service.ts`

**Чек-лист:**
- [ ] Валидация входных данных через `updateChatSchema`
- [ ] Проверка прав пользователя (creator или admin)
- [ ] Проверка на уникальность названия
- [ ] Вызов репозитория
- [ ] Добавить JSDoc аннотации

---

### Т7: API

**Целевое состояние:**
- Создать `/src/app/api/v1/chats/[id]/route.ts` с PATCH endpoint

**Чек-лист:**
- [ ] GET handler для получения чата (для предзаполнения формы)
- [ ] PATCH handler для обновления чата
- [ ] Проверка авторизации
- [ ] Валидация тела запроса
- [ ] Обработка ошибок через `instanceof BaseError`
- [ ] Возврат стандартизированного ответа
- [ ] Добавить JSDoc аннотации

---

### Т8: UI - Компонент формы

**Целевое состояние:**
- Создать `src/components/features/chats/EditChatForm/EditChatForm.tsx`

**Чек-лист:**
- [ ] Клиентский компонент с `'use client'`
- [ ] Props: `chat`, `onSubmit`, `onCancel`, `isLoading`
- [ ] Поля: название (2-100), описание (0-500)
- [ ] Кнопки: "Сохранить" (состояние загрузки), "Отмена"
- [ ] Валидация на стороне клиента
- [ ] ARIA accessibility
- [ ] Добавить JSDoc аннотации

---

### Т9: UI - Страница

**Целевое состояние:**
- Создать `src/app/dashboard/chats/[id]/edit/page.tsx`

**Чек-лист:**
- [ ] Клиентская страница с `'use client'`
- [ ] Маршрут: `/dashboard/chats/[id]/edit`
- [ ] Проверка прав через `useSession()` и API
- [ ] Загрузка чата для предзаполнения формы
- [ ] Отображение ошибки 403 при отсутствии прав
- [ ] Обработка состояний: loading, error
- [ ] Навигация обратно к чату после сохранения/отмены
- [ ] Добавить JSDoc аннотации

---

## 📊 Матрица соответствия AC → Задачи

| AC | Требование | Задачи |
|----|------------|--------|
| AC-1.1 | Проверка прав | Т3, Т4, Т5, Т6, Т7 (PATCH), Т9 |
| AC-1.2 | Поля формы | Т8 |
| AC-1.3 | Сохранение изменений | Т1, Т2, Т6, Т7 (PATCH), Т8 |
| AC-1.4 | Отмена редактирования | Т8, Т9 |

---

## ✅ Чек-лист валидации плана

### Код и типы
- [ ] Все типы определены и аннотированы
- [ ] Валидаторы соответствуют бизнес-правилам
- [ ] Ошибки наследуются от BaseError

### Целостность
- [ ] Repository интерфейс соответствует реализации
- [ ] Service использует репозиторий через интерфейс
- [ ] API вызывает сервис

### Тестирование
- [ ] Unit-тесты для сервиса
- [ ] Интеграционные тесты для API

### Функциональность
- [ ] Проверка прав работает корректно
- [ ] Валидация формы на клиенте и сервере
- [ ] Обработка ошибок отображается пользователю

---

## 📝 История изменений

| Версия | Дата | Автор | Изменение |
|--------|------|-------|-----------|
| 1.0 | 2026-07-15 | ИИ-архитектор | Создание плана |

---

## 📎 Дополнительные ссылки

- [`src/domains/comms/comms.types.ts`](../../src/domains/comms/comms.types.ts)
- [`src/domains/comms/comms.validators.ts`](../../src/domains/comms/comms.validators.ts)
- [`src/domains/comms/comms.errors.ts`](../../src/domains/comms/comms.errors.ts)
- [`src/app/api/v1/chats/route.ts`](../../src/app/api/v1/chats/route.ts)
