❌ Сложнее имплементировать корректно
# План реализации: US-21-28: Создание объявления

> **Шаблон используется для декомпозиции User Story на технические задачи по слоям архитектуры.**
> План создаётся на этапе PLAN и передаётся в Code-режим для выполнения.
> Статусы задач: `[TODO]` → `[IN PROGRESS]` → `[DONE]`

---

## 📋 Метаданные

| Параметр       | Значение                          |
| -------------- | --------------------------------- |
| **US-ID**      | `US-21-28`                        |
| **Название**   | Создание объявления               |
| **Версия плана** | `v1.0`                            |
| **Дата создания** | `2026-07-15`                      |
| **Статус**     | `[DONE]`                   |
| **Зависит от** | `US-21-27` (Просмотр списка объявлений) |

---

## 📎 Ссылки

- **User Story:** [`docs/user-stories/US-21-28-создание-объявления.md`](../user-stories/US-21-28-создание-объявления.md)
- **Требования (REQ):** `docs/requirements/REQ-COMMS-001.md`
- **Модель данных:** `docs/model/entities/announcement.md`

---

## 📁 Дерево файлов

```
src/
├── domains/
│   └── announcement/
│       ├── announcement.types.ts         # ДОБАВИТЬ: AnnouncementCreateInput
│       ├── announcement.validators.ts    # ДОБАВИТЬ: AnnouncementCreateSchema
│       ├── announcement.repository.interface.ts  # ДОБАВИТЬ: create()
│       ├── announcement.repository.prisma.ts     # ДОБАВИТЬ: реализация create()
│       └── announcement.service.ts       # ДОБАВИТЬ: createAnnouncement()
│
├── app/
│   └── api/v1/
│       └── announcements/
│           └── route.ts                  # ДОБАВИТЬ: POST обработчик
│
├── components/
│   └── features/
│       └── announcements/
│           └── AnnouncementForm/         # СОЗДАТЬ: компонент формы
│               ├── AnnouncementForm.tsx
│               └── index.ts
│
├── app/
│   └── dashboard/
│       └── announcements/
│           └── create/                   # СОЗДАТЬ: страница создания
│               └── page.tsx
```

---

## 📦 Задачи по слоям

### Слой 1: Types (Доменные типы)

#### Задача 1: Добавить тип AnnouncementCreateInput

**Статус:** `[TODO]`
**Целевое состояние:** Тип `AnnouncementCreateInput` определён в `announcement.types.ts`

**Чек-лист:**
- [ ] Добавить интерфейс `AnnouncementCreateInput` с полями:
  - `title: string` — обязательный заголовок
  - `content?: string` — опциональное содержание
- [ ] JSDoc аннотация `@type`, `@domain`, `@description`, `@spec`
- [ ] Добавить ре-экспорт в `index.ts`
- [ ] `npm run type-check` — 0 ошибок

---

### Слой 2: Validators (Zod-схемы)

#### Задача 1: Создать Zod-схему AnnouncementCreateSchema

**Статус:** `[TODO]`
**Целевое состояние:** Схема `AnnouncementCreateSchema` валидирует данные создания

**Чек-лист:**
- [ ] Создать `AnnouncementCreateSchema` с валидацией:
  - `title`: string, min(1), max(200)
  - `content`: string, max(5000), optional, transform empty to null
- [ ] Все сообщения об ошибках на русском языке
- [ ] JSDoc аннотация `@schema`, `@domain`, `@spec`
- [ ] Экспортировать тип `AnnouncementCreateInput` из schema
- [ ] `npm run type-check` — 0 ошибок

---

### Слой 3: Errors (Доменные ошибки)

**Статус:** `[SKIP]`
**Обоснование:** Ошибки `AnnouncementNotFoundError` и `AnnouncementInvalidDataError` уже существуют в `announcement.errors.ts` от US-21-27. Для создания достаточно `AnnouncementInvalidDataError`.

---

### Слой 4: Repository (Интерфейс + Реализация)

#### Задача 1: Добавить метод create в интерфейс

**Статус:** `[TODO]`
**Целевое состояние:** Метод `create(data: AnnouncementCreateInput)` добавлен в `IAnnouncementRepository`

**Чек-лист:**
- [ ] Добавить метод `create(data: AnnouncementCreateInput): Promise<Announcement>` в интерфейс
- [ ] JSDoc аннотация `@param`, `@returns`, `@spec`
- [ ] `npm run type-check` — 0 ошибок (после реализации)

#### Задача 2: Реализовать метод create в Prisma репозитории

**Статус:** `[TODO]`
**Целевое состояние:** Метод `create()` в `AnnouncementRepositoryPrisma` создаёт запись в БД

**Чек-лист:**
- [ ] Реализовать `create(data)` через `prisma.announcement.create()`
- [ ] Установить `status: 'DRAFT'` по умолчанию
- [ ] Установить `authorId` из входных данных
- [ ] JSDoc аннотация `@param`, `@returns`
- [ ] `npm run type-check` — 0 ошибок

---

### Слой 5: Service (Бизнес-логика)

#### Задача 1: Добавить метод createAnnouncement в сервис

**Статус:** `[DONE]` ✅
**Целевое состояние:** Метод `createAnnouncement(data, authorId)` в `AnnouncementService`

**Чек-лист:**
- [x] Создать метод `createAnnouncement(data: AnnouncementCreateInput, authorId: string): Promise<Announcement>`
- [x] Валидация через `AnnouncementCreateSchema.parse(data)`
- [x] Передача `authorId` в repository.create()
- [x] Обработка ошибок Zod → `AnnouncementInvalidDataError`
- [x] JSDoc аннотация `@param`, `@returns`, `@throws`, `@spec`
- [x] `npm run type-check` — 0 ошибок

**Примечание:** Метод реализован в `src/domains/announcement/announcement.service.ts` (строка 83)

---

### Слой 6: DI Container

**Статус:** `[SKIP]`
**Обоснование:** `AnnouncementService` уже зарегистрирован в DI-контейнере от US-21-27.

---

### Слой 7: API Route Handlers

#### Задача 1: Добавить POST обработчик в announcements/route.ts

**Статус:** `[TODO]`
**Целевое состояние:** `POST /api/v1/announcements` создаёт черновик объявления

**Чек-лист:**
- [ ] Добавить `POST` handler в `src/app/api/v1/announcements/route.ts`
- [ ] Проверка авторизации через `auth()`
- [ ] Проверка роли (MODERATOR, ADMIN) — BR-28-01
- [ ] Парсинг тела запроса
- [ ] Вызов `announcementService.createAnnouncement(data, session.user.id)`
- [ ] Возврат 201 с `{ success: true, data: Announcement }`
- [ ] Обработка ошибок: 400 (ValidationError), 401 (Unauthorized), 500
- [ ] JSDoc аннотация `@route`, `@auth`, `@body`, `@response`, `@spec`
- [ ] `npm run type-check` — 0 ошибок

---

### Слой 8: UI Components

#### Задача 1: Создать компонент AnnouncementForm

**Статус:** `[TODO]`
**Целевое состояние:** Компонент формы для создания объявления

**Чек-лист:**
- [ ] Создать `src/components/features/announcements/AnnouncementForm/AnnouncementForm.tsx`
- [ ] Поля формы:
  - `title` (обязательное, max 200) — Input
  - `content` (опциональное, max 5000) — Textarea
- [ ] Счётчик символов для обоих полей
- [ ] Валидация на клиенте (отображение ошибок)
- [ ] Кнопка "Сохранить как черновик"
- [ ] Состояния: loading, error, success
- [ ] Блокировка кнопки при isLoading
- [ ] Отправка через `apiClient.post('/announcements', data)`
- [ ] Редирект на список после успешного создания
- [ ] JSDoc аннотация `@component`, `@category`, `@spec`
- [ ] `npm run type-check` — 0 ошибок

---

### Слой 9: Pages

#### Задача 1: Создать страницу /dashboard/announcements/create

**Статус:** `[TODO]`
**Целевое состояние:** Страница создания объявления с формой

**Чек-лист:**
- [ ] Создать `src/app/dashboard/announcements/create/page.tsx`
- [ ] `'use client'` директива
- [ ] `useSession()` для проверки авторизации
- [ ] Редирект на `/login` если нет сессии
- [ ] Редирект на `/dashboard/announcements` если нет прав (не модератор/админ)
- [ ] Отрисовка `AnnouncementForm`
- [ ] JSDoc аннотация `@page`, `@auth`, `@role`, `@spec`, `@data-flow`
- [ ] `npm run type-check` — 0 ошибок

---

## 📊 Матрица соответствия AC → Задачи

| AC | Описание | Задачи |
|----|----------|--------|
| AC-28.1 | Создание объявления с заголовком и содержанием | Слой 5 (Service), Слой 7 (API), Слой 8 (UI), Слой 9 (Page) |
| AC-28.2 | Валидация заголовка | Слой 2 (Validators), Слой 8 (UI) |
| AC-28.3 | Валидация содержания | Слой 2 (Validators), Слой 8 (UI) |
| AC-28.4 | Сохранение как черновик | Слой 4 (Repository), Слой 5 (Service), Слой 7 (API) |
| BR-28-01 | Право создания (модератор/админ) | Слой 7 (API) |
| BR-28-05 | Статус по умолчанию DRAFT | Слой 4 (Repository) |

---

## ✅ Чек-лист валидации плана

### Код и типы
- [ ] Все новые типы имеют JSDoc аннотации
- [ ] Все методы имеют JSDoc с `@param`, `@returns`, `@throws`, `@spec`
- [ ] `npm run type-check` — 0 ошибок

### Целостность
- [ ] Repository соответствует интерфейсу
- [ ] Service использует Zod валидацию
- [ ] API Route Handler использует Service через DI
- [ ] UI использует apiClient для запросов

### Тестирование
- [ ] Unit-тесты для Service.createAnnouncement()
- [ ] Unit-тесты для AnnouncementCreateSchema

### Функциональность
- [ ] Создание работает с минимальными данными (только title)
- [ ] Создание работает с полным контентом
- [ ] Валидация отклоняет пустой заголовок
- [ ] Валидация отклоняет заголовок >200 символов
- [ ] Валидация отклоняет содержание >5000 символов
- [ ] Объявление создаётся со статусом DRAFT

---

## 📝 История изменений

| Версия | Дата | Автор | Описание |
|--------|------|-------|----------|
| 1.0 | 2026-07-16 | Service-Prompt | Синхронизация статуса Service-слоя: `[TODO]` → `[DONE]` — метод `createAnnouncement` обнаружен в реализации |
| 0.1 | 2026-07-15 | Architect | Первичный план реализации |

---

## 📎 Дополнительные ссылки

- US-21-27: [`docs/user-stories/US-21-27-просмотр-списка-объявлений.md`](../user-stories/US-21-27-просмотр-списка-объявлений.md)
- Модель Announcement: [`docs/model/entities/announcement.md`](../model/entities/announcement.md)
- API Client: [`src/lib/api-client.ts`](../../src/lib/api-client.ts)
