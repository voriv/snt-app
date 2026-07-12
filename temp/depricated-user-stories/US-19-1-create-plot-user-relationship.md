# US-19-1: Создание связи пользователь-участок

## Формулировка

**Как** Администратор СНТ,  
**я хочу** назначить пользователю роль на участке,  
**чтобы** он получил соответствующие права доступа к данным участка.

---

## Контекст

### Проблема
Пользователи системы не могут быть связаны с участками. Нет возможности назначать роли (владелец, проживает, представитель) для управления правами доступа и отчётности.

### Решение
Предоставить возможность создания связей между пользователями и участками с назначением роли, статуса и дополнительных атрибутов.

### Границы
- **Входит:** Создание одной связи за раз (пользователь + участок + роль)
- **Входит:** Выбор роли из предопределённого списка (owner, resident, representative)
- **Входит:** Указание опционального комментария к связи
- **Входит:** Автоматическое создание записи в истории изменений
- **НЕ входит:** Массовое назначение ролей (US-19-6)
- **НЕ входит:** Изменение существующих связей (US-19-4)
- **НЕ входит:** Просмотр связей (US-19-2, US-19-3)

### Точки входа в форму

Форма создания связи доступна администратору из следующих интерфейсных элементов:

#### Точка входа 1: Страница участка
- **Маршрут:** `/dashboard/plots/[id]` (страница конкретного участка)
- **Элемент:** Кнопка "Добавить владельца/жителя/представителя" в секции "Участники"
- **Поведение:** При клике открывается модальное окно с формой создания связи
- **Автозаполнение:** `plot_id` автоматически заполняется ID текущего участка

#### Точка входа 2: Список участков
- **Маршрут:** `/dashboard/plots` (список всех участков)
- **Элемент:** Кнопка "Добавить связь" для каждого участка в таблице
- **Поведение:** При клике открывается модальное окно с формой создания связи
- **Автозаполнение:** `plot_id` автоматически заполняется ID выбранного участка

#### Точка входа 3: Панель администрирования
- **Маршрут:** `/dashboard/admin/plot-users` или раздел "Администрирование"
- **Элемент:** Кнопка "Новая связь"
- **Поведение:** При клике открывается форма без автозаполнения
- **Автозаполнение:** Нет — пользователь выбирает и пользователя, и участок вручную

---

## Модель данных

### Сущность PlotUserRole

**Новая таблица `plot_users`:**

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| `id` | String | Да | Уникальный ID связи (cuid) |
| `user_id` | String | Да | Ссылка на пользователя (users.id) |
| `plot_id` | String | Да | Ссылка на участок (plots.id) |
| `role` | Integer | Да | Роль: 1=owner, 2=resident, 3=representative |
| `status` | String | Да | Статус: active, pending, expired |
| `comment` | String? | Нет | Комментарий к связи (до 500 символов) |
| `assigned_at` | DateTime | Да | Дата назначения (по умолчанию: now()) |
| `expires_at` | DateTime? | Нет | Дата истечения срока (null = бессрочно) |
| `created_at` | DateTime | Да | Дата создания записи |
| `updated_at` | DateTime | Да | Дата последнего обновления |

**Контекст DBML:**

```dbml
Table plot_users {
  id              varchar       [pk, not null]
  user_id         varchar       [not null, ref: > users]
  plot_id         varchar       [not null, ref: > plots]
  role            integer       [not null]
  status          varchar       [not null, default: 'active']
  comment         varchar
  assigned_at     timestamp     [default: now(), not null]
  expires_at      timestamp?
  created_at      timestamp     [default: now(), not null]
  updated_at      timestamp     [default: now(), not null]
}
```

---

## Функциональные требования

### FR-1: Выбор пользователя и участка

Система предоставляет возможность выбрать пользователя и участок для создания связи.

#### AC-1.1: Выбор пользователя
- **Дано:** Администратор открыл форму создания связи
- **Когда:** Пользователь видит поле выбора пользователя
- **Тогда:** Отображается выпадающий список всех пользователей системы
- **Иначе:** Список включает поле "Выберите пользователя" с value=""

#### AC-1.2: Выбор участка
- **Дано:** Администратор открыл форму создания связи
- **Когда:** Пользователь видит поле выбора участка
- **Тогда:** Отображается выпадающий список всех участков
- **Иначе:** Список включает поле "Выберите участок" с value=""

#### AC-1.3: Поиск пользователя в списке
- **Дано:** В списке более 10 пользователей
- **Когда:** Пользователь вводит текст в поле поиска
- **Тогда:** Список фильтруется по email и полному имени (firstName + lastName)
- **Иначе:** Результат отображается моментально (< 100 мс)

---

### FR-2: Выбор роли

Система предоставляет возможность выбрать роль для связи.

#### AC-2.1: Доступные роли
- **Дано:** Администратор открыл форму создания связи
- **Когда:** Пользователь видит поле выбора роли
- **Тогда:** Отображаются варианты:
  - `1` — Владелец (OWNER)
  - `2` — Проживает (RESIDENT)
  - `3` — Представитель (REPRESENTATIVE)
- **Иначе:** Каждый вариант имеет понятное название на русском языке

#### AC-2.2: Валидация выбора роли
- **Дано:** Форма создана
- **Когда:** Пользователь не выбрал роль
- **Тогда:** Поле подсвечивается красным при отправке
- **Иначе:** Сообщение ошибки: "Выберите роль для связи"

---

### FR-3: Опциональные поля

Система предоставляет возможность указать дополнительные данные связи.

#### AC-3.1: Поле "Дата истечения"
- **Дано:** Администратор открыл форму
- **Когда:** Пользователь видит поле "Дата истечения"
- **Тогда:** Поле пустое по умолчанию (бессрочная связь)
- **Иначе:** Пользователь может выбрать дату из календаря

#### AC-3.2: Поле "Комментарий"
- **Дано:** Администратор открыл форму
- **Когда:** Пользователь видит поле "Комментарий"
- **Тогда:** Поле имеет placeholder "Описание назначения (необязательно)"
- **Иначе:** Максимальная длина — 500 символов

---

### FR-4: Создание связи

Система создаёт новую запись в `plot_users` и запись в истории.

#### AC-4.1: Отправка формы
- **Дано:** Пользователь заполнил все обязательные поля:
  - user_id: выбран
  - plot_id: выбран
  - role: выбран (1, 2 или 3)
- **Когда:** Пользователь нажал кнопку "Создать связь"
- **Тогда:** Выполняется POST запрос к `POST /api/v1/plot-users` с телом:
  ```json
  {
    "user_id": "clx...",
    "plot_id": "clx...",
    "role": 1,
    "comment": "Новый собственник участка",
    "expires_at": null
  }
  ```
- **Иначе:** Поля comment и expires_at не отправляются если пусты

#### AC-4.2: Блокировка кнопки при загрузке
- **Дано:** Форма отправляется
- **Когда:** Запрос активен
- **Тогда:**
  - Кнопка заблокирована (`disabled`)
  - Текст кнопки: "Создание..."
- **Иначе:** Пользователь не может отправить форму повторно

#### AC-4.3: Успешное создание
- **Дано:** `POST /api/v1/plot-users` вернул `201 Created`
- **Когда:** Ответ `{ success: true, data: PlotUserRole }`
- **Тогда:**
  - Форма закрывается
  - Показывается уведомление: "Связь создана"
  - Пользователь перенаправляется на страницу участка (если открыта)
- **Иначе:** Если страница не открыта — остаётся на текущей

#### AC-4.4: Создание записи в истории
- **Дано:** Связь успешно создана
- **Когда:** Запись в `plot_users` сохранена
- **Тогда:** Автоматически создаётся запись в `plot_user_history`:
  - `plot_user_id`: ID созданной связи
  - `role`, `status`, `comment`: скопированы из plot_users
  - `changed_by`: ID администратора, создавшего связь
  - `changed_at`: timestamp создания
  - `changed_reason`: "Initial assignment"
- **Иначе:** История создаётся транзакционно с основным созданием

---

### FR-5: Валидация данных

Система валидирует данные перед созданием связи.

#### AC-5.1: Проверка существования пользователя
- **Дано:** Пользователь вводит user_id
- **Когда:** user_id не существует в БД
- **Тогда:** Возвращается ошибка `404 NotFound` с сообщением "Пользователь не найден"
- **Иначе:** Ошибка отображается в форме

#### AC-5.2: Проверка существования участка
- **Дано:** Пользователь вводит plot_id
- **Когда:** plot_id не существует в БД
- **Тогда:** Возвращается ошибка `404 NotFound` с сообщением "Участок не найден"
- **Иначе:** Ошибка отображается в форме

#### AC-5.3: Проверка дубликата активной связи
- **Дано:** Пользователь пытается создать связь (user_id=X, plot_id=Y, status=active)
- **Когда:** Уже существует активная связь для этой пары
- **Тогда:** Возвращается ошибка `409 Conflict` с сообщением "Для этого пользователя и участка уже существует активная связь"
- **Иначе:** Пользователь может назначить дополнительные роли (см. BR-1)

#### AC-5.4: Проверка expires_at
- **Дано:** Пользователь указывает expires_at
- **Когда:** expires_at < assigned_at (в прошлом)
- **Тогда:** Возвращается ошибка `400 Bad Request` с сообщением "Дата истечения должна быть позже даты назначения"
- **Иначе:** Поле принимает валидные даты

---

## Бизнес-правила и валидация

| ID | Правило | Описание | Валидация |
|----|---------|----------|-----------|
| BR-1 | Множественные роли разрешены | Пользователь может иметь несколько активных ролей на одном участке | Нет ограничения по количеству активных связей на (user_id, plot_id) |
| BR-2 | Множественные владельцы разрешены | Участок может иметь несколько активных владельцев | Нет ограничения по количеству активных связей с role=1 на plot_id |
| BR-3 | Уникальность активной связи | На одну пару (user_id, plot_id) может быть только одна активная запись | UNIQUE constraint: (user_id, plot_id, status='active') |
| BR-4 | Обязательность полей | user_id, plot_id, role, status обязательны | Zod validation + DB NOT NULL |
| BR-5 | Значения роли | role должен быть 1, 2 или 3 | Zod enum: [1, 2, 3] |
| BR-6 | Значения статуса | status должен быть active, pending или expired | Zod enum: ['active', 'pending', 'expired'] |
| BR-7 | Историчность | Каждая запись в plot_users автоматически дублируется в истории | Trigger или сервисный лог |
| BR-8 | Бессрочные связи | expires_at может быть null | NULLable field |

### Zod-схема

```typescript
import { z } from 'zod';

export const plotUserRoleRoleEnum = z.enum([1, 2, 3], {
  errorMap: () => ({ message: 'Роль должна быть 1 (владелец), 2 (проживает) или 3 (представитель)' })
});

export const plotUserRoleStatusEnum = z.enum(['active', 'pending', 'expired'], {
  errorMap: () => ({ message: 'Статус должен быть active, pending или expired' })
});

export const createPlotUserRoleSchema = z.object({
  user_id: z.string().cuid('Пользователь не найден'),
  plot_id: z.string().cuid('Участок не найден'),
  role: plotUserRoleRoleEnum,
  status: plotUserRoleStatusEnum.default('active'),
  comment: z.string().max(500, 'Комментарий не может превышать 500 символов').optional().or(z.literal('')).transform(val => val || null),
  expires_at: z.string().datetime().optional().or(z.literal('')).transform(val => val || null),
});

export type CreatePlotUserRoleData = z.infer<typeof createPlotUserRoleSchema>;
```

---

## Граничные случаи (Edge Cases)

| # | Ситуация | Ожидаемое поведение |
|---|----------|---------------------|
| 1 | Пользователь уже имеет роль на этом участке | Если статус другой (pending/expired) — создать новую связь; если active — вернуть 409 Conflict |
| 2 | Создание связи с несколькими владельцами | Разрешить (для совместной собственности) |
| 3 | expires_at в прошлом | Вернуть 400 Bad Request с сообщением "Дата истечения не может быть в прошлом" |
| 4 | Параллельное создание двух связей для одной пары | Второй запрос вернёт 409 Conflict (благодаря UNIQUE constraint) |
| 5 | API недоступно при создании | Показывается ошибка "Не удалось создать связь. Проверьте интернет-соединение" |
| 6 | Максимальная длина комментария (500 символов) | Ошибка валидации на клиенте и сервере |
| 7 | Пользователь с удалённой учетной записью | user_id не найдётся → 404 NotFound |
| 8 | Участок с удалёнными данными | plot_id не найдётся → 404 NotFound |

---

## Обработка ошибок

| Код | Ситуация | Доменная ошибка | Сообщение пользователю |
|-----|----------|-----------------|------------------------|
| 400 | Ошибка валидации данных | `PlotUserRoleInvalidDataError` | "Ошибка валидации: [поле] — [описание]" |
| 401 | Не авторизован | `UnauthorizedError` | Редирект на `/login` |
| 403 | Нет прав на создание | `ForbiddenError` | "У вас нет прав для создания связей" |
| 404 | Пользователь не найден | `NotFoundError` | "Пользователь не найден" |
| 404 | Участок не найден | `NotFoundError` | "Участок не найден" |
| 409 | Дубликат активной связи | `PlotUserRoleDuplicateError` | "Для этого пользователя и участка уже существует активная связь" |
| 500 | Внутренняя ошибка сервера | `BaseError` | "Ошибка создания связи. Попробуйте позже" |

---

## Влияние на слои архитектуры

### Модель данных

- [x] Новая сущность: `plot_users` (id, user_id, plot_id, role, status, comment, assigned_at, expires_at, created_at, updated_at)
- [x] Новая сущность: `plot_user_history` (id, plot_user_id, user_id, plot_id, role, status, comment, changed_by, changed_at, changed_reason)
- [x] Новый enum: `plot_user_roles` (1=owner, 2=resident, 3=representative)
- [ ] Без изменений

### Repository

**`src/domains/plotUser/plotUser.repository.interface.ts` (создание):**

```typescript
import { PlotUserRole, CreatePlotUserRoleData } from './plotUser.types';

export interface IPlotUserRoleRepository {
  /**
   * Создать новую связь пользователь-участок
   * @throws {NotFoundError} если user или plot не найдены
   * @throws {ConflictError} если активная связь уже существует
   */
  create(data: CreatePlotUserRoleData): Promise<PlotUserRole>;
  
  /**
   * Проверить существование активной связи для пары (user_id, plot_id)
   */
  existsActive(user_id: string, plot_id: string): Promise<boolean>;
  
  /**
   * Проверить существование пользователя
   */
  userExists(userId: string): Promise<boolean>;
  
  /**
   * Проверить существование участка
   */
  plotExists(plotId: string): Promise<boolean>;
}
```

**`src/domains/plotUser/plotUser.repository.prisma.ts` (реализация):**

```typescript
export class PlotUserRoleRepository implements IPlotUserRoleRepository {
  constructor(private prisma: PrismaClient) {}
  
  async create(data: CreatePlotUserRoleData): Promise<PlotUserRole> {
    // Валидация существования user и plot
    // Проверка дубликата
    // Создание записи в plot_users
    // Создание записи в plot_user_history
    // Возврат созданной записи
  }
  
  async existsActive(user_id: string, plot_id: string): Promise<boolean> {
    // Проверка UNIQUE (user_id, plot_id, status='active')
  }
  
  async userExists(userId: string): Promise<boolean> {
    // Проверка существования в users
  }
  
  async plotExists(plotId: string): Promise<boolean> {
    // Проверка существования в plots
  }
}
```

### Service

**`src/domains/plotUser/plotUser.service.ts` (создание):**

```typescript
/**
 * @service PlotUserRoleService
 * @domain plotUser
 * @description Бизнес-логика управления связями пользователей с участками
 *
 * @spec
 * - Валидация: через Zod-схемы из plotUser.validators.ts
 * - Ошибки: PlotUserRoleNotFoundError, PlotUserRoleDuplicateError, PlotUserRoleInvalidDataError
 * - Зависимости: IPlotUserRoleRepository через DI
 */
export class PlotUserRoleService {
  constructor(
    private readonly plotUserRoleRepository: IPlotUserRoleRepository
  ) {}
  
  /**
   * Создать связь пользователь-участок
   * @throws {PlotUserRoleNotFoundError} если user или plot не найдены
   * @throws {PlotUserRoleDuplicateError} если активная связь уже существует
   * @throws {PlotUserRoleInvalidDataError} при ошибке валидации
   */
  async create(data: CreatePlotUserRoleData): Promise<PlotUserRole> {
    // 1. Валидация данных через Zod
    // 2. Проверка существования user
    // 3. Проверка существования plot
    // 4. Проверка дубликата активной связи
    // 5. Вызов repository.create()
    // 6. Возврат созданной связи
  }
}
```

**`src/domains/plotUser/plotUser.errors.ts` (новые ошибки):**

```typescript
import { NotFoundError, ValidationError, ConflictError } from '@/shared/errors';

export class PlotUserRoleNotFoundError extends NotFoundError {
  readonly name = 'PlotUserRoleNotFoundError';
}

export class PlotUserRoleDuplicateError extends ConflictError {
  readonly name = 'PlotUserRoleDuplicateError';
}

export class PlotUserRoleInvalidDataError extends ValidationError {
  readonly name = 'PlotUserRoleInvalidDataError';
}
```

**`src/domains/plotUser/plotUser.validators.ts` (Zod-схемы):**

```typescript
import { z } from 'zod';

// См. секцию Zod-схемы в бизнес-правилах
```

### API

**`src/app/api/v1/plot-users/route.ts` (создание):**

```typescript
/**
 * @route POST /api/v1/plot-users
 * @auth required
 * @description Создаёт новую связь между пользователем и участком
 *
 * @body CreatePlotUserRoleData
 * @response 201 { success: true, data: PlotUserRole }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 * @response 409 { success: false, error: { code: string, message: string } }
 */
export async function POST(request: NextRequest) {
  const service = createPlotUserRoleService();
  try {
    const body = await request.json();
    const plotUserRole = await service.create(body);
    return NextResponse.json({ success: true, data: plotUserRole }, { status: 201 });
  } catch (error) {
    // Error handling: convert domain errors to HTTP responses
  }
}
```

### UI

**Новые компоненты:**

| Файл | Тип | Описание |
|------|-----|----------|
| `src/components/features/plotUser/PlotUserRoleForm.tsx` | Feature | Форма создания/редактирования связи |
| `src/components/features/plotUser/PlotUserRoleForm.stories.tsx` | Storybook | Stories для формы |
| `src/components/features/plotUser/PlotUserRoleSelect.tsx` | Feature | Компонент выбора пользователя и участка |

**`src/components/features/plotUser/PlotUserRoleForm.tsx`:**

```typescript
/**
 * @component PlotUserRoleForm
 * @category features
 * @description Форма создания связи пользователь-участок
 *
 * @spec
 * - Режимы: create
 * - Поля: user_id (Select), plot_id (Select), role (Select), status (Select, default=active),
 *   comment (Textarea, optional), expires_at (DatePicker, optional)
 * - Валидация: Zod-схема на клиенте и сервере
 * - При submit: API-вызов через apiClient, блокировка кнопки при isLoading
 * - При ошибке 409: показ alert с объяснением
 * - При успехе: callback onSubmit + уведомление
 *
 * @example
 * ```tsx
 * <PlotUserRoleForm
 *   mode="create"
 *   onSubmit={handleSuccess}
 *   onCancel={handleCancel}
 *   isLoading={isLoading}
 * />
 * ```
 */
export interface PlotUserRoleFormProps {
  mode: 'create';
  onSubmit: (role: PlotUserRole) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PlotUserRoleForm({ onSubmit, onCancel, isLoading }: PlotUserRoleFormProps) {
  // Реализация
}
```

---

## Нефункциональные требования

| Требование | Описание |
|------------|----------|
| Производительность | Ответ сервера < 500 мс |
| Доступность | Все поля имеют `<label>`, ошибки связаны с полями через `aria-describedby` |
| UX | Блокировка кнопки при загрузке, моментальная валидация на клиенте |
| Безопасность | Авторизация обязательна (next-auth), проверка прав (ADMIN только) |
| Локализация | Все сообщения валидации на русском языке |
| Аудио | История создаётся транзакционно с основной записью |

---

## Открытые вопросы

| № | Вопрос | Допущение |
|---|--------|-----------|
| OQ-1 | Нужно ли подтверждение перед созданием связи? | Пока не реализуем — прямое создание |
| OQ-2 | Какие роли могут создавать связи? | Только ADMIN (MEMBER не может) |
| OQ-3 | Нужно ли выбирать участок по номеру или по ID? | Используем Select с отображением номера и адреса участка |
| OQ-4 | Нужен ли поиск по участку в списке? | Реализуем lazy-search для списков > 10 элементов |

---

## История

| Дата | Автор | Действие |
|------|-------|----------|
| 2026-07-04 | Architect | Создание черновика US-19-1 |

---

## Связанные User Stories

| US | Название | Зависимость |
|----|----------|-------------|
| US-19-2 | Просмотр участников участка | Использует созданные связи |
| US-19-3 | Просмотр связей пользователя | Использует созданные связи |
| US-19-4 | Редактирование связи | Модифицирует созданные связи |
| US-19-5 | Удаление связи | Деактивирует созданные связи |
| US-19-7 | Автоматическое создание владельца | Создаёт связи при регистрации участка |
