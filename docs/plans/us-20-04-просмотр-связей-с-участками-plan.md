# План реализации: US-20-04: Просмотр связей с участками

> **Шаблон используется для декомпозиции User Story на технические задачи по слоям архитектуры.**  
> Статусы задач: `[TODO]` → `[IN PROGRESS]` → `[DONE]`

---

## 📋 Метаданные

| Параметр       | Значение                          |
| -------------- | --------------------------------- |
| **US-ID**      | `US-20-04`                        |
| **Название**   | Просмотр связей с участками       |
| **Версия плана** | `v1.0`                            |
| **Дата создания** | `2026-07-13`                     |
| **Статус**     | `[NOT STARTED]`                   |
| **Зависит от** | `US-20-03`                        |

---

## 📎 Ссылки

- **User Story:** [`docs/user-stories/US-20-04-просмотр-связей-с-участками.md`](../user-stories/US-20-04-просмотр-связей-с-участками.md)
- **Требования (REQ):** `docs/requirements/REQ-USERS-001.md`
- **Модель данных:** `docs/model/entities/plot_user.md`, `docs/model/entities/plot.md`

---

## 📁 Дерево файлов

```
src/
├── domains/
│   └── users/
│       ├── users.types.ts                 ✏️  Добавить UserPlotConnection
│       ├── users.service.ts               ✏️  Добавить findUserPlotConnections
│       └── index.ts                       ✏️  Обновить re-export
│
├── di/
│   └── container.ts                       ✏️  Добавить PlotUserService в createUsersService
│
├── app/
│   └── api/v1/users/[id]/
│       └── connections/
│           └── route.ts                   🆕  GET /api/v1/users/[id]/connections
│
├── components/
│   └── features/
│       └── users/
│           ├── UserConnectionsList/
│           │   ├── UserConnectionsList.tsx 🆕  Таблица связей с участками
│           │   └── index.ts                🆕  Re-export
│           ├── UserCard/
│           │   └── UserCard.tsx            ✏️  Добавить раздел связей
│           └── index.ts                   ✏️  Добавить export UserConnectionsList
```

---

## 📋 Задачи по слоям архитектуры

### T1: Types — Добавить UserPlotConnection

**ID:** US-20-04-T1-types  
**Статус:** `[TODO]`

**Целевое состояние:** В `users.types.ts` добавлен новый тип `UserPlotConnection`.

**Чек-лист:**
- [ ] Добавить `UserPlotConnection` в `users.types.ts`:
  ```typescript
  export interface UserPlotConnection {
    plotId: string;
    plotNumber: string;
    cadastralNumber: string | null;
    roleName: string;
    assignedAt: Date;
  }
  ```
- [ ] Обновить `users/index.ts` — добавить `UserPlotConnection` в ре-экспорт

---

### T2: Service — Добавить findUserPlotConnections в UsersService

**ID:** US-20-04-T2-service  
**Статус:** `[TODO]`  
**Зависит от:** T1

**Целевое состояние:** `UsersService` имеет метод `findUserPlotConnections(userId)`, который использует `PlotUserService` для получения данных.

**Чек-лист:**
- [ ] Добавить зависимость от `PlotUserService` в конструктор `UsersService`
- [ ] Добавить метод `findUserPlotConnections(userId)` с JSDoc:
  - валидация через `userIdParamSchema`
  - делегирование в `plotUserService.findByUserId(userId)`
  - трансформация `PlotUserRole[]` → `UserPlotConnection[]`
  - обогащение данных о участках (plotNumber, cadastralNumber) через PlotRepository

---

### T3: DI — Добавить PlotUserService в createUsersService

**ID:** US-20-04-T3-di  
**Статус:** `[TODO]`  
**Зависит от:** T2

**Целевое состояние:** `createUsersService()` передает `PlotUserService` в конструктор `UsersService`.

**Чек-лист:**
- [ ] Добавить `getPlotUserService()` в `createUsersService()`
- [ ] Передавать `PlotUserService` в конструктор `UsersService`

---

### T4: API Route Handler — GET /api/v1/users/[id]/connections

**ID:** US-20-04-T4-api  
**Статус:** `[TODO]`  
**Зависит от:** T3

**Целевое состояние:** Создан `GET /api/v1/users/[id]/connections` с защитой роли SUPER_ADMIN.

**Чек-лист:**
- [ ] Создать `src/app/api/v1/users/[id]/connections/route.ts`
- [ ] JSDoc: `@route GET /api/v1/users/:id/connections`
- [ ] Валидация `id` из params
- [ ] Вызов `usersService.findUserPlotConnections(id)`
- [ ] Обработка ошибок через `instanceof BaseError`
- [ ] Защита через `withRoleGuard`
- [ ] Возврат стандартизированного ответа `{ success: true, data: UserPlotConnection[] }`

---

### T5: UI — Создать UserConnectionsList

**ID:** US-20-04-T5-ui  
**Статус:** `[TODO]`

**Целевое состояние:** Создан компонент `UserConnectionsList` с таблицей связей.

**Чек-лист:**
- [ ] Создать `src/components/features/users/UserConnectionsList/UserConnectionsList.tsx`
- [ ] `'use client'` + JSDoc
- [ ] Загрузка данных через `apiClient.get<UserPlotConnection[]>(/users/${userId}/connections)`
- [ ] Таблица с колонками: Номер участка, Кадастровый номер, Роль, Дата назначения
- [ ] Состояния: loading (скелетон), error, empty (EmptyState)
- [ ] Клик по строке → `router.push(/dashboard/plots/${plotId})`
- [ ] Доступность: `aria-label` для ссылок на участки

---

### T6: UI — Обновить UserCard

**ID:** US-20-04-T6-card  
**Статус:** `[TODO]`  
**Зависит от:** T5

**Целевое состояние:** В `UserCard` добавлен раздел «Связи с участками» с компонентом `UserConnectionsList`.

**Чек-лист:**
- [ ] Добавить импорт `UserConnectionsList` в `UserCard`
- [ ] Добавить секцию «Связи с участками» после секции «Роли»
- [ ] Передать `userId` в `UserConnectionsList`

---

### T7: UI — Обновить index.ts

**ID:** US-20-04-T7-index  
**Статус:** `[TODO]`  
**Зависит от:** T5

**Целевое состояние:** `UserConnectionsList` экспортируется из `src/components/features/users/index.ts`.

**Чек-лист:**
- [ ] Добавить `export { UserConnectionsList } from './UserConnectionsList'`

---

## 🔍 Матрица AC → Задачи

| AC | Описание | Покрытие |
|----|----------|----------|
| AC-1.1 | Отображение списка связей | T4 + T5 + T6 |
| AC-1.2 | У пользователя нет связей | T5 (EmptyState) |
| AC-1.3 | Навигация к карточке участка | T5 (клик по строке) |
| AC-1.4 | Связи только для просмотра | T5 (нет кнопок редактирования) |

---

## ✅ Чек-лист валидации

Перед передачей в Code-режим:

- [ ] Все задачи декомпозированы на атомарные шаги
- [ ] Зависимости между задачами указаны
- [ ] AC покрыты задачами
- [ ] Используется существующий `PlotUserService` (Вариант А из US)
- [ ] Защита роли SUPER_ADMIN на API
- [ ] Тип `UserPlotConnection` соответствует требованиям US

---

## 📜 История изменений

| Дата | Автор | Действие |
|------|-------|----------|
| 2026-07-13 | ИИ-архитектор | Создание плана |

---

**Последнее обновление:** 2026-07-13
