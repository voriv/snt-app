# US-19-2: Спецификации компонентов — Просмотр участников участка

## Анализ текущего состояния

### Существующие компоненты домена plotUser

| Слой | Файл | Состояние | Гап для US-19-2 |
|------|------|-----------|-----------------|
| Types | [`plotUser.types.ts`](../src/domains/plotUser/plotUser.types.ts) | `PlotUserRoleWithRelations` есть user (email, firstName, lastName) | Нет phone для tooltip (AC-2.3) |
| Repository Interface | [`plotUser.repository.interface.ts`](../src/domains/plotUser/plotUser.repository.interface.ts) | `findByPlotId` (базовый), `findWithPagination` (без поиска) | Нет `findByPlot` с фильтрами, нет `searchByName`, нет `findWithUser` |
| Repository Prisma | [`plotUser.repository.prisma.ts`](../src/domains/plotUser/plotUser.repository.prisma.ts) | Реализованы базовые методы | Те же гапы |
| Service | [`plotUser.service.ts`](../src/domains/plotUser/plotUser.service.ts) | `findByPlotId`, `findWithPagination` | Нет `findByPlot` с фильтрами, нет `searchByName` |
| API | [`plot-users/route.ts`](../src/app/api/v1/plot-users/route.ts) | GET /plot-users с фильтром plotId | Нет эндпоинта /plots/[id]/participants |
| UI | [`PlotUserList.tsx`](../src/components/features/plotUser/PlotUserList.tsx) | Простая таблица | Нет фильтров, поиска, пагинации, tooltip |

### Концептуальная модель данных (docs/model/entities/plot-user.md)

Сущность `PlotUserRole` (таблица `plot_users`):
- `role`: 1=owner, 2=resident, 3=representative
- `status`: active, pending, expired
- `comment`: до 500 символов
- `assigned_at`: дата назначения
- `expires_at`: null = бессрочно

Связи:
- `User` (users) — email, name
- `UserProfile` (user_profiles) — first_name, last_name, phone
- `Plot` (plots) — plot_number, address

**Важно:** UserProfile поля first_name, last_name, phone — все nullable в Prisma-схеме.

---

## Изменения по слоям

### 1. Types (plotUser.types.ts)

#### Новый тип: PlotUserRoleParticipantFilter

```typescript
/**
 * @type PlotUserRoleParticipantFilter
 * @domain plotUser
 * @description Фильтры для списка участников участка
 *
 * @spec
 * - role: фильтр по роли (1=owner, 2=resident, 3=representative)
 * - status: фильтр по статусу (active, pending, expired)
 * - search: поисковый запрос по имени/email
 * - page: номер страницы (с 1)
 * - limit: записей на странице (по умолчанию 25)
 *
 * @see US-19-2 FR-3 (фильтр по роли)
 * @see US-19-2 FR-4 (фильтр по статусу)
 * @see US-19-2 FR-5 (поиск)
 */
export interface PlotUserRoleParticipantFilter {
  role?: PlotUserRoleRole;
  status?: PlotUserRoleStatus;
  search?: string;
  page?: number;
  limit?: number;
}
```

#### Новый тип: PlotUserRoleParticipant

Расширяет `PlotUserRoleWithRelations`, добавляя phone пользователя для tooltip:

```typescript
/**
 * @type PlotUserRoleParticipant
 * @domain plotUser
 * @description Связь с расширенной информацией о пользователе для списка участников
 *
 * @spec
 * - user.email: всегда есть
 * - user.firstName, user.lastName: null если нет профиля
 * - user.phone: null если нет профиля или телефона
 * - При отсутствии профиля: отображается только email (AC-2.2)
 *
 * @see US-19-2 AC-2.1 (отображение имени)
 * @see US-19-2 AC-2.3 (телефон в tooltip)
 */
export interface PlotUserRoleParticipant extends PlotUserRole {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
}
```

---

### 2. Repository

#### IPlotUserRoleRepository — добавить методы

1. **`findByPlot(plotId, filter?)`** — основной метод для US-19-2
   - JOIN с users + user_profiles (включая phone)
   - Фильтрация по role, status, search (firstName, lastName, email)
   - Сортировка: active → pending → expired, затем assignedAt DESC (BR-2)
   - Пагинация при > 200 элементов (BR-6)
   - Возвращает `PlotUserRoleParticipant[]`

2. **`searchByName(plotId, query)`** — поиск по имени/email
   - Поиск по firstName, lastName, email (case-insensitive contains)
   - Возвращает `PlotUserRoleParticipant[]`

3. **`findWithUser(plotId, id)`** — одна связь с информацией о пользователе
   - JOIN с users + user_profiles
   - Возвращает `PlotUserRoleParticipant | null`

#### Реализация (plotUser.repository.prisma.ts)

Скелеты методов с `throw new Error('Not implemented')` + полные JSDoc.

---

### 3. Service

#### PlotUserRoleService — добавить методы

1. **`findByPlot(plotId, filter?)`**
   - Валидация существования участка (через plotExists)
   - Делегирование в repository.findByPlot
   - Возвращает `PlotUserRoleParticipant[]`

2. **`searchByName(plotId, query)`**
   - Делегирование в repository.searchByName
   - Возвращает `PlotUserRoleParticipant[]`

---

### 4. API Route Handlers

#### Новый: `src/app/api/v1/plots/[id]/participants/route.ts`

```
GET /api/v1/plots/[id]/participants
```

- Query params: `status`, `role`, `search`, `page`, `limit`
- Response 200: `{ success: true, data: PlotUserRoleParticipant[], total, page, limit, totalPages }`
- Response 401, 403, 404, 500

**Примечание:** US-19-2 также описывает `POST /api/v1/plots/search-participants`, но это избыточно — GET endpoint уже поддерживает `search` query param (как и существующий GET /plot-users). Следуем REST-конвенциям.

#### Не нужен: search-participants/route.ts

GET /plots/[id]/participants?search=... покрывает функциональность поиска (FR-5).

---

### 5. UI Components (все Client Components)

#### Новые компоненты

| Файл | Описание |
|------|----------|
| `ParticipantList.tsx` | Контейнер: загрузка данных, управление состоянием фильтров/поиска, skeleton, EmptyState |
| `ParticipantTable.tsx` | Таблица: №, Пользователь, Роль, Статус, Срок, Комментарий, Назначен, Действия |
| `ParticipantFilters.tsx` | Select для роли + Select для статуса + кнопка "Сбросить" |
| `ParticipantSearch.tsx` | Input с debounce 300мс |
| `ParticipantBadge.tsx` | Badge для статуса (цвет) и роли |
| `ParticipantRow.tsx` | Строка таблицы с tooltip |

#### Обновляемые файлы

| Файл | Изменение |
|------|-----------|
| `src/components/features/plotUser/index.ts` | Добавить экспорты новых компонентов |
| `src/app/dashboard/plots/[id]/page.tsx` | Интеграция ParticipantList под формой участка |

#### Архитектура UI

```mermaid
flowchart TD
    PlotPage[plots/[id]/page.tsx] --> ParticipantList
    ParticipantList --> apiClient[apiClient.get /plots/:id/participants]
    ParticipantList --> ParticipantFilters
    ParticipantList --> ParticipantSearch
    ParticipantList --> ParticipantTable
    ParticipantTable --> ParticipantRow
    ParticipantRow --> ParticipantBadge
    ParticipantList --> EmptyState
```

#### Props контракты

```typescript
// ParticipantList
interface ParticipantListProps {
  plotId: string;
  onAddParticipant?: () => void;
  onEditParticipant?: (participant: PlotUserRoleParticipant) => void;
  onDeleteParticipant?: (participant: PlotUserRoleParticipant) => void;
  isAdmin?: boolean; // BR-5: кнопки только для ADMIN
}

// ParticipantTable
interface ParticipantTableProps {
  data: PlotUserRoleParticipant[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  isAdmin?: boolean;
  onEdit?: (participant: PlotUserRoleParticipant) => void;
  onDelete?: (participant: PlotUserRoleParticipant) => void;
  onPageChange: (page: number) => void;
}

// ParticipantFilters
interface ParticipantFiltersProps {
  roleFilter?: PlotUserRoleRole;
  statusFilter?: PlotUserRoleStatus;
  onRoleChange: (role: PlotUserRoleRole | undefined) => void;
  onStatusChange: (status: PlotUserRoleStatus | undefined) => void;
  onReset: () => void;
}

// ParticipantSearch
interface ParticipantSearchProps {
  value: string;
  onChange: (query: string) => void;
  debounceMs?: number; // default: 300
}

// ParticipantBadge
interface ParticipantBadgeProps {
  type: 'role' | 'status';
  value: PlotUserRoleRole | PlotUserRoleStatus;
}

// ParticipantRow
interface ParticipantRowProps {
  participant: PlotUserRoleParticipant;
  index: number;
  isAdmin?: boolean;
  onEdit?: (participant: PlotUserRoleParticipant) => void;
  onDelete?: (participant: PlotUserRoleParticipant) => void;
}
```

---

## Соответствие User Story

| AC | Покрытие |
|----|---------|
| AC-1.1 Открытие списка | ParticipantList загружается при монтировании |
| AC-1.2 Столбцы таблицы | ParticipantTable отображает все колонки |
| AC-1.3 Сортировка по умолчанию | Repository.findByPlot: active→pending→expired, assignedAt DESC |
| AC-2.1 Формат имени | ParticipantRow: "Фамилия Имя (email)" |
| AC-2.2 Нет профиля | ParticipantRow: только email |
| AC-2.3 Телефон в tooltip | ParticipantRow: tooltip с phone |
| AC-3.1-3.4 Фильтр по роли | ParticipantFilters + GET ?role= |
| AC-4.1-4.4 Фильтр по статусу | ParticipantFilters + GET ?status= |
| AC-5.1-5.4 Поиск | ParticipantSearch (debounce 300ms) + GET ?search= |
| AC-6.1 Нет связей | EmptyState "У этого участка пока нет участников" |
| AC-6.2 Фильтр пуст | EmptyState "По вашему запросу ничего не найдено" |
| AC-7.1-7.3 Срок действия | ParticipantRow: "Бессрочно" или DD.MM.YYYY |
| BR-5 Права доступа | isAdmin prop → кнопки только для ADMIN |
| BR-6 Пагинация | При > 200 элементов, 25/страницу |

---

## Файлы для создания/изменения

### Создать (новые)

| # | Файл | Тип |
|---|------|-----|
| 1 | (types добавляются в существующий файл) | — |
| 2 | `src/app/api/v1/plots/[id]/participants/route.ts` | API |
| 3 | `src/components/features/plotUser/ParticipantList.tsx` | UI |
| 4 | `src/components/features/plotUser/ParticipantTable.tsx` | UI |
| 5 | `src/components/features/plotUser/ParticipantFilters.tsx` | UI |
| 6 | `src/components/features/plotUser/ParticipantSearch.tsx` | UI |
| 7 | `src/components/features/plotUser/ParticipantBadge.tsx` | UI |
| 8 | `src/components/features/plotUser/ParticipantRow.tsx` | UI |

### Изменить (скелеты новых методов + JSDoc)

| # | Файл | Изменение |
|---|------|-----------|
| 1 | `src/domains/plotUser/plotUser.types.ts` | +2 типа |
| 2 | `src/domains/plotUser/plotUser.repository.interface.ts` | +3 метода |
| 3 | `src/domains/plotUser/plotUser.repository.prisma.ts` | +3 скелета |
| 4 | `src/domains/plotUser/plotUser.service.ts` | +2 скелета |
| 5 | `src/domains/plotUser/index.ts` | +экспорты типов |
| 6 | `src/components/features/plotUser/index.ts` | +экспорты компонентов |
| 7 | `src/app/dashboard/plots/[id]/page.tsx` | интеграция ParticipantList |

---

## Ограничения

- Все UI-компоненты — Client Components (`'use client'`)
- Скелеты методов содержат только `throw new Error('Not implemented')` + JSDoc
- Запрещено использовать `fetch()` напрямую — только `apiClient`
- Запрещено использовать Server Components
- API-пути в apiClient — относительные (без `/api/v1`)
