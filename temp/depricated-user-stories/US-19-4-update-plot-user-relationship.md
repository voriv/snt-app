# US-19-4: Редактирование связи пользователь-участок

## Формулировка

**Как** Администратор СНТ,  
**я хочу** редактировать существующие связи пользователей с участками,  
**чтобы** обновлять роли, статусы и сроки действия при изменении обстоятельств.

---

## Контекст

### Проблема
После создания связи между пользователем и участком невозможно изменить роль, статус или срок действия. Например, пользователь может сменить роль с "проживает" на "владелец", или срок действия временной связи может истечь.

### Решение
Создать интерфейс редактирования существующих связей с возможностью изменения роли, статуса, срока действия и комментария с автоматическим сохранением истории изменений.

### Границы
- **Входит:** Изменение роли пользователя на участке
- **Входит:** Изменение статуса связи (active, pending, expired)
- **Входит:** Изменение срока действия (expires_at)
- **Входит:** Изменение комментария к связи
- **Входит:** Автоматическое создание записи в истории изменений
- **НЕ входит:** Создание новой связи (US-19-1)
- **НЕ входит:** Удаление связи (US-19-5)
- **НЕ входит:** Просмотр истории изменений (US-19-6)

### Точки входа в интерфейс

| Номер | Точка входа | Маршрут | Описание |
|-------|-------------|---------|----------|
| TV-1 | Кнопка "Редактировать" | `/dashboard/plots/[id]` | В таблице участников участка |
| TV-2 | Кнопка "Редактировать" | `/dashboard/my-connections` | В таблице связей пользователя |
| TV-3 | Кнопка "Редактировать" | `/dashboard/plots/[id]/participants` | В модальном окне участников |
| TV-4 | Кнопка "Изменить роль" | В бейдже роли | При клике на статус роли |
| TV-5 | Ссылка "Изменить" | В деталях участка | На странице `/dashboard/plots/[id]` |

---

## Модель данных

### Сущность PlotUserRole

**Таблица `plot_users` (связи):**

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| `id` | String | Да | Уникальный ID связи (cuid) |
| `user_id` | String | Да | Ссылка на пользователя (users.id) |
| `plot_id` | String | Да | Ссылка на участок (plots.id) |
| `role` | Integer | Да | Роль: 1=owner, 2=resident, 3=representative |
| `status` | String | Да | Статус: active, pending, expired |
| `comment` | String? | Нет | Комментарий к связи (до 500 символов) |
| `assigned_at` | DateTime | Да | Дата назначения |
| `expires_at` | DateTime? | Нет | Дата истечения срока (null = бессрочно) |
| `created_at` | DateTime | Да | Дата создания записи |
| `updated_at` | DateTime | Да | Дата последнего обновления |

**Таблица `plot_user_history` (история изменений):**

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| `id` | String | Да | Уникальный ID истории (cuid) |
| `plot_user_id` | String | Да | Ссылка на связь (plot_users.id) |
| `user_id` | String | Да | Ссылка на пользователя |
| `plot_id` | String | Да | Ссылка на участок |
| `role` | Integer | Да | Роль на момент изменения |
| `status` | String | Да | Статус на момент изменения |
| `comment` | String? | Нет | Комментарий на момент изменения |
| `changed_by` | String | Да | Кто изменил (users.id) |
| `changed_at` | DateTime | Да | Когда изменено |
| `changed_reason` | String? | Нет | Причина изменения (до 255 символов) |

---

## Функциональные требования

### FR-1: Открытие формы редактирования

Система предоставляет возможность открыть форму редактирования существующей связи.

#### AC-1.1: Кнопка "Редактировать"
- **Дано:** Пользователь находится на странице участка `/dashboard/plots/[id]`
- **Когда:** Пользователь видит таблицу участников и нажимает "Редактировать" для конкретного участника
- **Тогда:** Открывается модальное окно с формой редактирования связи
- **Иначе:** Форма prefill-ится данными существующей связи

#### AC-1.2: Заполнение данных формы
- **Дано:** Форма редактирования открыта
- **Когда:** Пользователь видит форму
- **Тогда:** Отображаются текущие значения:
  - user_id: выбран (только ADMIN может менять)
  - role: выбрана текущая роль
  - status: выбран текущий статус
  - expires_at: выбрана текущая дата (или пустое)
  - comment: текст комментария
- **Иначе:** Все поля доступны для редактирования (кроме id)

#### AC-1.3: Права на редактирование
- **Дано:** Администратор или пользователь с правами
- **Когда:** Пользователь видит кнопку "Редактировать"
- **Тогда:** Кнопка отображается только для ADMIN
- **Иначе:** Для обычных пользователей кнопка скрыта

---

### FR-2: Изменение роли

Система позволяет изменить роль пользователя на участке.

#### AC-2.1: Выбор новой роли
- **Дано:** Форма редактирования открыта
- **Когда:** Пользователь меняет значение поля "Роль"
- **Тогда:** Отображаются варианты:
  - `1` — Владелец (OWNER)
  - `2` — Проживает (RESIDENT)
  - `3` — Представитель (REPRESENTATIVE)
- **Иначе:** Выбор сохраняется при валидации

#### AC-2.2: Смена роли
- **Дано:** Пользователь выбрал новую роль
- **Когда:** Пользователь нажимает "Сохранить"
- **Тогда:** Роль обновляется в базе данных
- **Иначе:** Создаётся запись в истории с предыдущим значением

---

### FR-3: Изменение статуса

Система позволяет изменить статус связи.

#### AC-3.1: Выбор нового статуса
- **Дано:** Форма редактирования открыта
- **Когда:** Пользователь меняет значение поля "Статус"
- **Тогда:** Отображаются варианты:
  - `active` — Активно
  - `pending` — Ожидает подтверждения
  - `expired` — Истёк
- **Иначе:** Выбор сохраняется при валидации

#### AC-3.2: Автоматическая экпспирация при истекающем сроке
- **Дано:** Пользователь установил expires_at < today
- **Когда:** Пользователь нажимает "Сохранить"
- **Тогда:** Статус автоматически устанавливается в `expired`
- **Иначе:** Ошибка валидации: "Дата истечения не может быть в прошлом"

---

### FR-4: Изменение срока действия

Система позволяет изменить срок действия связи.

#### AC-4.1: Выбор даты истечения
- **Дано:** Форма редактирования открыта
- **Когда:** Пользователь меняет значение поля "Дата истечения"
- **Тогда:** Можно выбрать дату из календаря
- **Иначе:** Пустое значение = бессрочная связь

#### AC-4.2: Валидация даты истечения
- **Дано:** Пользователь указывает expires_at
- **Когда:** expires_at < assigned_at
- **Тогда:** Поле подсвечивается красным
- **Иначе:** Сообщение: "Дата истечения должна быть позже даты назначения"

---

### FR-5: Изменение комментария

Система позволяет изменить комментарий к связи.

#### AC-5.1: Редактирование комментария
- **Дано:** Форма редактирования открыта
- **Когда:** Пользователь меняет значение поля "Комментарий"
- **Тогда:** Отображается textarea
- **Иначе:** Максимальная длина — 500 символов

#### AC-5.2: Обработка пустого комментария
- **Дано:** Пользователь очищает поле комментария
- **Когда:** Пользователь нажимает "Сохранить"
- **Тогда:** comment устанавливается в null
- **Иначе:** Пустая строка преобразуется в null

---

### FR-6: Сохранение изменений

Система сохраняет изменения и создаёт запись в истории.

#### AC-6.1: Отправка формы редактирования
- **Дано:** Пользователь заполнил форму редактирования
- **Когда:** Пользователь нажимает "Сохранить"
- **Тогда:** Выполняется PATCH запрос к `PATCH /api/v1/plot-users/[id]` с телом:
  ```json
  {
    "role": 2,
    "status": "active",
    "expires_at": "2025-12-31",
    "comment": "Новый комментарий",
    "changed_reason": "Смена роли с владельца на проживающего"
  }
  ```
- **Иначе:** Поля unchanged не отправляются

#### AC-6.2: Блокировка кнопки при загрузке
- **Дано:** Форма отправляется
- **Когда:** Запрос активен
- **Тогда:**
  - Кнопка "Сохранить" заблокирована (`disabled`)
  - Текст кнопки меняется на "Сохранение..."
- **Иначе:** Пользователь не может отправить форму повторно

#### AC-6.3: Успешное сохранение
- **Дано:** `PATCH /api/v1/plot-users/[id]` вернул `200 OK`
- **Когда:** Ответ `{ success: true, data: PlotUserRole }`
- **Тогда:**
  - Модальное окно закрывается
  - Таблица обновляется с новыми данными
  - Показывается уведомление: "Связь успешно обновлена"
- **Иначе:** Если возникла ошибка — форма остаётся открытой

#### AC-6.4: Создание записи в истории
- **Дано:** Изменения успешно сохранены
- **Когда:** Запись в plot_users обновлена
- **Тогда:** Автоматически создаётся запись в plot_user_history:
  - `plot_user_id`: ID обновлённой связи
  - `role`, `status`, `comment`: новые значения
  - `changed_by`: ID администратора
  - `changed_at`: timestamp
  - `changed_reason`: причина из формы (если указана)
- **Иначе:** История создаётся транзакционно с основным обновлением

---

### FR-7: Отмена редактирования

Система позволяет отменить редактирование без сохранения.

#### AC-7.1: Кнопка "Отмена"
- **Дано:** Форма редактирования открыта
- **Когда:** Пользователь нажимает "Отмена"
- **Тогда:**
  - Модальное окно закрывается
  - Изменения не сохраняются
  - Любые несохранённые данные теряются
- **Иначе:** Подтверждение перед закрытием (если есть незавершённые изменения)

#### AC-7.2: Подтверждение перед закрытием
- **Дано:** Пользователь ввёл данные и нажимает крестик или кликает вне модалки
- **Когда:** Есть несохранённые изменения
- **Тогда:** Показывается диалог: "Есть несохранённые изменения. Закрыть?"
- **Иначе:** Кнопки "Сохранить" и "Отмена без сохранения"

---

### FR-8: Обработка ошибок при редактировании

Система корректно обрабатывает ошибки при сохранении.

#### AC-8.1: Ошибка валидации
- **Дано:** Пользователь ввёл некорректные данные
- **Когда:** Сервер возвращает `400 Bad Request`
- **Тогда:** Поля с ошибками подсвечиваются красным
- **Иначе:** Отображается сообщение ошибки

#### AC-8.2: Ошибка авторизации
- **Дано:** Пользователь не авторизован
- **Когда:** Сервер возвращает `401 Unauthorized`
- **Тогда:** Редирект на `/login`
- **Иначе:** Модальное окно остаётся открытым

#### AC-8.3: Ошибка не найдено
- **Дано:** Пользователь пытается редактировать несуществующую связь
- **Когда:** Сервер возвращает `404 NotFound`
- **Тогда:** Показывается alert: "Связь не найдена"
- **Иначе:** Модальное окно закрывается, таблица обновляется

---

## Бизнес-правила и валидация

| ID | Правило | Описание | Источник |
|----|---------|----------|----------|
| BR-1 | Только ADMIN может менять роль | Обычные пользователи не могут менять роль | Права доступа |
| BR-2 | Один неактивный участник | На одну пару (user_id, plot_id) может быть только одна неактивная связь | DB constraint |
| BR-3 | Экспирация при истекающем сроке | expires_at < today → status='expired' | Сервисная логика |
| BR-4 | История изменений | Каждое изменение записывается в history | Transaction |
| BR-5 | Максимальная длина комментария | До 500 символов | Zod validation |
| BR-6 | Дата истечения >= сегодня | expires_at >= today (для активных) | Валидация |
| BR-7 | Права доступа | Кнопка "Редактировать" только для ADMIN | UI condition |
| BR-8 | unchanged поля | Поля без изменений не отправляются | Optimized request |

---

## Граничные случаи (Edge Cases)

| # | Ситуация | Ожидаемое поведение |
|---|----------|---------------------|
| 1 | Пользователь меняет роль с owner на resident | Разрешить (создать запись в истории) |
| 2 | Пользователь устанавливает expires_at в прошлом | Ошибка валидации, статус автоматически expired |
| 3 | Пользователь очищает comment | comment становится null |
| 4 | Две попытки одновременного редактирования | Сервер блокирует второй запрос (optimistic locking) |
| 5 | Пользователь не имеет прав на редактирование | Кнопка скрыта или disabled |
| 6 | API недоступно при сохранении | Ошибка network, форма остаётся открытой |
| 7 | Пользователь закрывает форму без сохранения | Подтверждение "Есть несохранённые изменения" |
| 8 | Связь уже удалена другим пользователем | 404 NotFound при сохранении |
| 9 | expires_at установлено на сегодня | Разрешить, статус останется active до конца дня |
| 10 | Очень длинный комментарий (> 500 символов) | Ограничение на уровне input + Zod |

---

## Обработка ошибок

| Код | Ситуация | Доменная ошибка | Сообщение пользователю |
|-----|----------|-----------------|------------------------|
| 400 | Ошибка валидации | `PlotUserRoleInvalidDataError` | "Ошибка валидации: [поле] — [описание]" |
| 401 | Не авторизован | `UnauthorizedError` | Редирект на `/login` |
| 403 | Нет прав на редактирование | `ForbiddenError` | "У вас нет прав для редактирования этой связи" |
| 404 | Связь не найдена | `NotFoundError` | "Связь не найдена" — модальное окно закрывается |
| 409 | Конфликт данных | `ConflictError` | "Не удалось сохранить: данные изменены" |
| 500 | Внутренняя ошибка сервера | `BaseError` | "Ошибка сохранения изменений. Попробуйте позже" |

---

## Влияние на слои архитектуры

### Repository

**`src/domains/plotUser/plotUser.repository.interface.ts` (добавление методов):**

```typescript
import { PlotUserRole, UpdatePlotUserRoleData } from './plotUser.types';

export interface IPlotUserRoleRepository {
  // ... существующие методы
  
  /**
   * Обновить связь пользователь-участок
   * @throws {NotFoundError} если связь не найдена
   */
  update(id: string, data: UpdatePlotUserRoleData): Promise<PlotUserRole>;
  
  /**
   * Создать запись в истории изменений
   */
  createHistory(history: CreatePlotUserRoleHistoryData): Promise<void>;
  
  /**
   * Получить связь с информацией об участке
   */
  findByIdWithDetails(id: string): Promise<PlotUserRoleWithDetails | null>;
}
```

**`src/domains/plotUser/plotUser.repository.prisma.ts` (реализация):**

```typescript
export class PlotUserRoleRepository implements IPlotUserRoleRepository {
  constructor(private prisma: PrismaClient) {}
  
  async update(
    id: string, 
    data: UpdatePlotUserRoleData
  ): Promise<PlotUserRole> {
    // Найти связь
    // Обновить
    // Создать запись в истории
    // Вернуть обновлённую связь
  }
  
  async createHistory(history: CreatePlotUserRoleHistoryData): Promise<void> {
    // Создать запись в plot_user_history
  }
  
  async findByIdWithDetails(id: string): Promise<PlotUserRoleWithDetails | null> {
    // Найти с JOIN на plots, users, user_profiles
  }
}
```

### Service

**`src/domains/plotUser/plotUser.service.ts` (добавление методов):**

```typescript
/**
 * @service PlotUserRoleService
 * @domain plotUser
 */
export class PlotUserRoleService {
  /**
   * Обновить связь пользователь-участок
   * @throws {PlotUserRoleNotFoundError} если связь не найдена
   * @throws {PlotUserRoleInvalidDataError} при ошибке валидации
   */
  async update(
    id: string, 
    data: UpdatePlotUserRoleData,
    changedBy: string
  ): Promise<PlotUserRole> {
    // 1. Валидация данных через Zod
    // 2. Проверка существования связи
    // 3. Проверка прав доступа
    // 4. Автоматическая экпспирация если expires_at < today
    // 5. Вызов repository.update()
    // 6. Вызов repository.createHistory()
    // 7. Возврат обновлённой связи
  }
  
  /**
   * Получить связь с деталями
   */
  async findByIdWithDetails(id: string): Promise<PlotUserRoleWithDetails | null> {
    // Вызов repository.findByIdWithDetails()
  }
}
```

**`src/domains/plotUser/plotUser.errors.ts` (расширение):**

```typescript
import { NotFoundError, ValidationError, ConflictError } from '@/shared/errors';

export class PlotUserRoleNotFoundError extends NotFoundError {
  readonly name = 'PlotUserRoleNotFoundError';
}

export class PlotUserRoleInvalidDataError extends ValidationError {
  readonly name = 'PlotUserRoleInvalidDataError';
}

export class PlotUserRoleForbiddenError extends ForbiddenError {
  readonly name = 'PlotUserRoleForbiddenError';
}
```

**`src/domains/plotUser/plotUser.validators.ts` (расширение):**

```typescript
import { z } from 'zod';

export const updatePlotUserRoleSchema = z.object({
  role: plotUserRoleRoleEnum.optional(),
  status: plotUserRoleStatusEnum.optional(),
  expires_at: z.string().datetime().optional().or(z.literal('')).transform(val => val || null),
  comment: z.string().max(500, 'Комментарий не может превышать 500 символов').optional().or(z.literal('').transform(() => null)),
  changed_reason: z.string().max(255, 'Причина не может превышать 255 символов').optional().or(z.literal('').transform(() => null)),
});

export type UpdatePlotUserRoleData = z.infer<typeof updatePlotUserRoleSchema>;
```

### API

**`src/app/api/v1/plot-users/[id]/route.ts`:**

```typescript
/**
 * @route PATCH /api/v1/plot-users/[id]
 * @auth required
 * @description Обновляет существующую связь пользователь-участок
 *
 * @body UpdatePlotUserRoleData
 * @response 200 { success: true, data: PlotUserRole }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 * @response 400 { success: false, error: { code: string, message: string } }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await auth(); // get current user from session
  const service = createPlotUserRoleService();
  try {
    const body = await request.json();
    const updated = await service.update(params.id, body, user.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    // Error handling: convert domain errors to HTTP responses
  }
}
```

**`src/app/api/v1/plot-users/[id]/details/route.ts`:**

```typescript
/**
 * @route GET /api/v1/plot-users/[id]/details
 * @auth required
 * @description Возвращает полную информацию о связи для редактирования
 *
 * @response 200 { success: true, data: PlotUserRoleWithDetails }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await auth();
  const service = createPlotUserRoleService();
  try {
    const details = await service.findByIdWithDetails(params.id);
    if (!details) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Связь не найдена' } },
        { status: 404 }
      );
    }
    // Проверка прав доступа
    if (details.user_id !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Нет прав на редактирование' } },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true, data: details });
  } catch (error) {
    // Error handling
  }
}
```

### UI

**Новые компоненты:**

| Файл | Тип | Описание |
|------|-----|----------|
| `src/components/features/plotUser/PlotUserRoleEditForm.tsx` | Feature | Форма редактирования связи |
| `src/components/features/plotUser/PlotUserRoleEditModal.tsx` | Feature | Модальное окно редактирования |
| `src/components/features/plotUser/RoleSelect.tsx` | Component | Select для выбора роли |
| `src/components/features/plotUser/StatusSelect.tsx` | Component | Select для выбора статуса |
| `src/components/features/plotUser/ExpirationDatepicker.tsx` | Component | Календарь для выбора даты истечения |

**`src/components/features/plotUser/PlotUserRoleEditModal.tsx`:**

```typescript
/**
 * @component PlotUserRoleEditModal
 * @category features
 * @description Модальное окно редактирования связи пользователь-участок
 *
 * @spec
 * - Открытие через API GET /api/v1/plot-users/[id]/details
 * - Заполнение формы данными
 * - Валидация на клиенте и сервере
 * - Блокировка кнопки при загрузке
 * - Подтверждение перед закрытием при наличии изменений
 * - Создание записи в истории при успешном сохранении
 *
 * @example
 * ```tsx
 * <PlotUserRoleEditModal
 *   connectionId="clx..."
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */
export interface PlotUserRoleEditModalProps {
  connectionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: PlotUserRole) => void;
}

export function PlotUserRoleEditModal({
  connectionId,
  isOpen,
  onClose,
  onSuccess,
}: PlotUserRoleEditModalProps) {
  // Загрузка данных формы
  // Обработка сохранения
  // Подтверждение перед закрытием
}
```

**`src/components/features/plotUser/PlotUserRoleEditForm.tsx`:**

```typescript
/**
 * @component PlotUserRoleEditForm
 * @category features
 * @description Форма редактирования связи
 */
export interface PlotUserRoleEditFormProps {
  initialData: PlotUserRoleWithDetails;
  isLoading: boolean;
  onChange: () => void;
  onSubmit: (data: UpdatePlotUserRoleData) => void;
  onCancel: () => void;
}

export function PlotUserRoleEditForm({
  initialData,
  isLoading,
  onChange,
  onSubmit,
  onCancel,
}: PlotUserRoleEditFormProps) {
  // Форма с полями: role, status, expires_at, comment, changed_reason
  // Валидация, изменение, отправка
}
```

**`src/components/features/plotUser/RoleSelect.tsx`:**

```typescript
/**
 * @component RoleSelect
 * @category components
 * @description Select для выбора роли
 */
export interface RoleSelectProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function RoleSelect({ value, onChange, disabled }: RoleSelectProps) {
  // Options: 1=Владелец, 2=Проживает, 3=Представитель
}
```

**`src/components/features/plotUser/StatusSelect.tsx`:**

```typescript
/**
 * @component StatusSelect
 * @category components
 * @description Select для выбора статуса
 */
export interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function StatusSelect({ value, onChange, disabled }: StatusSelectProps) {
  // Options: active=Активно, pending=Ожидание, expired=Истёк
}
```

**`src/components/features/plotUser/ExpirationDatepicker.tsx`:**

```typescript
/**
 * @component ExpirationDatepicker
 * @category components
 * @description Календарь для выбора даты истечения
 */
export interface ExpirationDatepickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  minDate?: Date;
}

export function ExpirationDatepicker({
  value,
  onChange,
  disabled,
  minDate,
}: ExpirationDatepickerProps) {
  // Календарь с выбором даты, null = бессрочно
}
```

---

## Нефункциональные требования

| Требование | Описание |
|------------|----------|
| Производительность | Ответ сервера < 500 мс |
| Доступность | Форма имеет `<label>`, ошибки связаны с полями через `aria-describedby` |
| UX | Блокировка кнопки при загрузке, подтв. перед закрытием, skeleton loader |
| Безопасность | Авторизация обязательна (session), проверка прав (ADMIN) |
| Локализация | Все сообщения на русском языке |
|响应性 | Адаптивный дизайн для мобильных устройств |
| Оптимизация | Optimistic locking для предотвращения конфликтов |

---

## Открытые вопросы

| № | Вопрос | Допущение |
|---|--------|-----------|
| OQ-1 | Нужна ли возможность менять user_id? | Нет — только ADMIN через отдельный интерфейс |
| OQ-2 | Нужна ли обязательная причина изменения? | Да — поле changed_reason обязательно для ADMIN |
| OQ-3 | Нужен ли confirm-dialog перед закрытием? | Да — при наличии незавершённых изменений |
| OQ-4 | Нужно ли показывать историю в модальном окне? | Да — отдельная вкладка "История" внутри формы |
| OQ-5 | Нужно ли блокировать редактирование неактивных связей? | Нет — expired можно редактировать для восстановления |
| OQ-6 | Optimistic locking? | Да — версия поля для предотвращения конфликтов |

---

## История

| Дата | Автор | Действие |
|------|-------|----------|
| 2026-07-04 | Architect | Создание черновика US-19-4 |

---

## Связанные User Stories

| US | Название | Зависимость |
|----|----------|-------------|
| US-19-1 | Создание связи | Создаваемые связи можно редактировать |
| US-19-2 | Просмотр участников участка | Редактирование из таблицы участников |
| US-19-3 | Просмотр связей пользователя | Редактирование из таблицы связей |
| US-19-5 | Удаление связи | После редактирования можно удалить |
| US-19-6 | Просмотр истории изменений | История создаётся при каждом редактировании |

---

## Интеграционные моменты

### Точки входа в интерфейс (детально)

#### TV-1: Кнопка "Редактировать" в таблице участников
- **Расположение:** `/dashboard/plots/[id]`
- **Компонент:** `<ParticipantTable actions>`
- **Действие:** Открывает PlotUserRoleEditModal
- **Права:** Только ADMIN

#### TV-2: Кнопка "Редактировать" в таблице связей
- **Расположение:** `/dashboard/my-connections`
- **Компонент:** `<UserConnectionsList actions>`
- **Действие:** Открывает PlotUserRoleEditModal
- **Права:** ADMIN или владелец связи

#### TV-3: Кнопка "Изменить роль" в бейдже
- **Расположение:** В бейдже роли
- **Компонент:** `<RoleBadge onClick={handleEdit}>`
- **Действие:** Открывает модалку только с полем роли
- **Права:** ADMIN

#### TV-4: Ссылка "Изменить" в деталях участка
- **Расположение:** `/dashboard/plots/[id]`
- **Компонент:** `<Section title="Участники">`
- **Действие:** Открывает модалку с полным формой
- **Права:** ADMIN

#### TV-5: Кнопка "Редактировать" в модалке детализации
- **Расположение:** При клике "Подробнее"
- **Компонент:** `<ConnectionModal>`
- **Действие:** Открывает PlotUserRoleEditModal
- **Права:** ADMIN

---

## Примечания для реализации

1. **Оптимистичное обновление:** После успешного сохранения обновлять UI без refetch
2. **Подтверждение перед закрытием:** Проверка `hasChanges` перед onClose
3. **Права доступа:** Проверка user.id == connection.user_id || user.role === 'ADMIN'
4. **Автоэкспирация:** При expires_at < today автоматически set status='expired'
5. **История:** Создание записи транзакционно с обновлением
6. **Адаптивность:** Модалка должна быть адаптивной для мобильных
7. **Доступность:** Все интерактивные элементы должны быть доступны с клавиатуры
