# US-19-5: Удаление связи пользователь-участок

## Формулировка

**Как** Администратор СНТ,  
**я хочу** удалять существующие связи пользователей с участками,  
**чтобы** освобождать участки от ненужных участников и поддерживать актуальность данных.

---

## Контекст

### Проблема
После создания связи между пользователем и участком невозможно удалить эту связь. Например, пользователь может переехать с участка, или его роль может быть аннулирована.

### Решение
Создать интерфейс удаления существующих связей с возможностью soft delete (деактивации) или hard delete (полного удаления) с автоматическим созданием записи в истории изменений.

### Границы
- **Входит:** Soft delete (установка status='expired')
- **Входит:** Hard delete (полное удаление из БД)
- **Входит:** Автоматическое создание записи в истории изменений
- **Входит:** Подтверждение перед удалением
- **НЕ входит:** Создание новой связи (US-19-1)
- **НЕ входит:** Редактирование связи (US-19-4)
- **НЕ входит:** Просмотр истории изменений (US-19-6)

### Точки входа в интерфейс

| Номер | Точка входа | Маршрут | Описание |
|-------|-------------|---------|----------|
| TV-1 | Кнопка "Удалить" | `/dashboard/plots/[id]` | В таблице участников участка |
| TV-2 | Кнопка "Удалить" | `/dashboard/my-connections` | В таблице связей пользователя |
| TV-3 | Кнопка "Удалить" | `/dashboard/plots/[id]/participants` | В модальном окне участников |
| TV-4 | Контекстное меню | При длительном нажатии | Мобильное меню |
| TV-5 | Блок действий | В карточке пользователя | В разделе администрирования |

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

### FR-1: Подтверждение перед удалением

Система требует подтверждения перед удалением связи.

#### AC-1.1: Диалог подтверждения
- **Дано:** Пользователь нажимает кнопку "Удалить"
- **Когда:** Пользователь видит диалог подтверждения
- **Тогда:** Показывается модальное окно с заголовком "Подтверждение удаления"
- **Иначе:** Сообщение: "Вы действительно хотите удалить связь между [Пользователь] и [Участок]?"

#### AC-1.2: Индикация типа удаления
- **Дано:** Диалог подтверждения открыт
- **Когда:** Пользователь видит диалог
- **Тогда:** Отображается информация о типе удаления:
  - **Soft delete:** "Связь будет деактивирована (статус 'истёк')"
  - **Hard delete:** "Связь будет удалена навсегда (необратимо)"
- **Иначе:** По умолчанию — soft delete

#### AC-1.3: Подтверждение через кнопку
- **Дано:** Диалог подтверждения открыт
- **Когда:** Пользователь нажимает кнопку "Подтвердить удаление"
- **Тогда:**
  - Выполняется удаление (soft или hard)
  - Диалог закрывается
  - Таблица обновляется
- **Иначе:** Диалог закрывается без удаления

#### AC-1.4: Отмена удаления
- **Дано:** Диалог подтверждения открыт
- **Когда:** Пользователь нажимает "Отмена" или закрывает диалог
- **Тогда:**
  - Диалог закрывается
  - Связь не удаляется
- **Иначе:** Никаких изменений не происходит

---

### FR-2: Soft delete (деактивация связи)

Система позволяет деактивировать связь путём установки статуса 'expired'.

#### AC-2.1: Выполнение soft delete
- **Дано:** Пользователь подтвердил soft delete
- **Когда:** Выполняется запрос `PATCH /api/v1/plot-users/[id]`
- **Тогда:**
  - `status` устанавливается в 'expired'
  - `updated_at` обновляется
  - Создаётся запись в истории
- **Иначе:** Таблица обновляется с новым статусом

#### AC-2.2: Сохранение истории soft delete
- **Дано:** Soft delete выполнен успешно
- **Когда:** Статус обновлён в базе
- **Тогда:** Создаётся запись в plot_user_history:
  - `status`: 'expired'
  - `changed_reason`: 'Деактивация связи'
  - `changed_by`: ID пользователя, выполнившего удаление
- **Иначе:** История сохраняется транзакционно

#### AC-2.3: Отображение истёкших связей
- **Дано:** Связь имеет status='expired'
- **Когда:** Пользователь видит таблицу
- **Тогда:** Строка отображается с зачёркиванием (strikethrough)
- **Иначе:** Бейдж статуса окрашивается в серый цвет

#### AC-2.4: Возможность восстановления истёкшей связи
- **Дано:** Связь имеет status='expired'
- **Когда:** ADMIN нажимает "Восстановить"
- **Тогда:** Связь может быть восстановлена (статус 'active')
- **Иначе:** Создается новая запись вместо восстановления старой

---

### FR-3: Hard delete (полное удаление связи)

Система позволяет полностью удалить связь из базы данных.

#### AC-3.1: Выполнение hard delete
- **Дано:** Пользователь подтвердил hard delete
- **Когда:** Выполняется запрос `DELETE /api/v1/plot-users/[id]`
- **Тогда:**
  - Связь удаляется из plot_users
  - Запись в истории сохраняется (status: 'deleted')
- **Иначе:** Связь не удаляется

#### AC-3.2: Сохранение истории hard delete
- **Дано:** Hard delete выполнен успешно
- **Когда:** Связь удалена из базы
- **Тогда:** Создаётся запись в plot_user_history:
  - `status`: 'deleted'
  - `changed_reason`: 'Полное удаление'
  - `changed_by`: ID пользователя, выполнившего удаление
- **Иначе:** История сохраняется транзакционно

#### AC-3.3: Необоротность удаления
- **Дано:** Hard delete выполнен
- **Когда:** Пользователь пытается восстановить удалённую связь
- **Тогда:** Возможно только создание новой связи
- **Иначе:** Данные удалённой связи недоступны

#### AC-3.4: Права на hard delete
- **Дано:** Пользователь видит кнопку "Удалить навсегда"
- **Когда:** Пользователь не имеет права ADMIN
- **Тогда:** Кнопка скрыта или disabled
- **Иначе:** Кнопка отображается только для ADMIN

---

### FR-4: Удаление нескольких связей (batch delete)

Система позволяет удалять несколько связей одновременно (для ADMIN).

#### AC-4.1: Выбор нескольких связей
- **Дано:** Пользователь находится в таблице участников
- **Когда:** Пользователь включает режим множественного выбора
- **Тогда:** Появляются чекбоксы для каждой связи
- **Иначе:** Выбрано 0 связей по умолчанию

#### AC-4.2: Кнопка "Удалить выбранные"
- **Дано:** Пользователь выбрал 1+ связей
- **Когда:** Пользователь нажимает "Удалить выбранные"
- **Тогда:** Показывается диалог с числом выбранных связей
- **Иначе:** Кнопка disabled если выбрано 0

#### AC-4.3: Batch soft delete
- **Дано:** Пользователь выбрал связи и подтвердил soft delete
- **Когда:** Выполняется запрос `PATCH /api/v1/plot-users/batch`
- **Тогда:**
  - Все выбранные связи получают status='expired'
  - Для каждой создаётся запись в истории
- **Иначе:** Все операции выполняются в транзакции

#### AC-4.4: Batch hard delete
- **Дано:** ADMIN выбрал связи и подтвердил hard delete
- **Когда:** Выполняется запрос `DELETE /api/v1/plot-users/batch`
- **Тогда:**
  - Все выбранные связи удаляются
  - Для каждой создаётся запись в истории (status: 'deleted')
- **Иначе:** Ошибки обработки отдельных записей не прерывают batch

#### AC-4.5: Уведомление о результате batch операции
- **Дано:** Batch операция завершена
- **Когда:** Пользователь видит результат
- **Тогда:** Показывается сообщение: "Удалено 3 из 5 связей"
- **Иначе:** Если все成功 — "Все связи успешно удалены"

---

### FR-5: Обработка ошибок при удалении

Система корректно обрабатывает ошибки при удалении.

#### AC-5.1: Ошибка авторизации
- **Дано:** Пользователь не авторизован
- **Когда:** Сервер возвращает `401 Unauthorized`
- **Тогда:** Редирект на `/login`
- **Иначе:** Диалог удаления закрывается

#### AC-5.2: Ошибка не найдено
- **Дано:** Пользователь пытается удалить несуществующую связь
- **Когда:** Сервер возвращает `404 NotFound`
- **Тогда:** Показывается alert: "Связь не найдена"
- **Иначе:** Диалог закрывается, таблица не обновляется

#### AC-5.3: Ошибка удаления связанных записей
- **Дано:** Связь имеет связанные записи в других таблицах
- **Когда:** Сервер возвращает `409 Conflict`
- **Тогда:** Показывается alert: "Невозможно удалить: есть связанные записи"
- **Иначе:** Пользователь видит какие именно связи мешают удалению

#### AC-5.4: Сеть недоступна при удалении
- **Дано:** Сетевая ошибка при удалении
- **Когда:** Сервер не отвечает
- **Тогда:** Показывается alert: "Ошибка сети. Попробуйте позже"
- **Иначе:** Связь не удаляется

---

## Бизнес-правила и валидация

| ID | Правило | Описание | Источник |
|----|---------|----------|----------|
| BR-1 | Soft delete по умолчанию | По умолчанию используется soft delete | UI выбор по умолчанию |
| BR-2 | Hard delete только для ADMIN | Обычные пользователи могут только деактивировать | Права доступа |
| BR-3 | История сохраняется | Каждое удаление записывается в историю | Transaction |
| BR-4 | Обязательная причина удаления | Причина удаления обязательна для hard delete | Форма подтверждения |
| BR-5 | Не удалять главного владельца | Участок должен иметь минимум 1 владельца | Валидация |
| BR-6 | Batch транзакция | Все операции batch выполняются в одной транзакции | Transactional update |
| BR-7 | Права на удаление | Только ADMIN может удалять связи пользователей | Проверка прав |
| BR-8 | Нельзя удалить свою активную связь | Пользователь не может удалить свою активную связь | Клиентская валидация |

---

## Граничные случаи (Edge Cases)

| # | Ситуация | Ожидаемое поведение |
|---|----------|---------------------|
| 1 | Удаление единственного владельца участка | Ошибка 400: "Нельзя удалить последнего владельца" |
| 2 | Удаление связи с активными платежами | Предупреждение: "У участника есть активные платежи" |
| 3 | Параллельное удаление двумя пользователями | Второй запрос вернёт 404 |
| 4 | Удаление удалённого пользователя | Мягкое удаление, связь деактивируется |
| 5 | Batch delete с 100+ связями | Пагинация batch операций |
| 6 | Hard delete после soft delete | Связь удаляется из БД |
| 7 | Удаление неактивной связи | Soft delete недоступен (уже expired) |
| 8 | Удаление во время сессии | Сессия продолжается, таблица обновляется |
| 9 | Удаление через API без UI | Ошибка 401 |
| 10 | Удаление с правами GUEST | Ошибка 403 |

---

## Обработка ошибок

| Код | Ситуация | Доменная ошибка | Сообщение пользователю |
|-----|----------|-----------------|------------------------|
| 400 | Нельзя удалить последнего владельца | `PlotUserRoleInvalidOperationError` | "Нельзя удалить последнего владельца" |
| 400 | Есть активные платежи | `PlotUserRoleHasActivePaymentsError` | "Нельзя удалить участника с активными платежами" |
| 401 | Не авторизован | `UnauthorizedError` | Редирект на `/login` |
| 403 | Нет прав на удаление | `ForbiddenError` | "У вас нет прав для удаления этой связи" |
| 404 | Связь не найдена | `NotFoundError` | "Связь не найдена" |
| 409 | Конфликт данных | `ConflictError` | "Невозможно удалить: есть связанные записи" |
| 500 | Внутренняя ошибка сервера | `BaseError` | "Ошибка удаления связи. Попробуйте позже" |

---

## Влияние на слои архитектуры

### Repository

**`src/domains/plotUser/plotUser.repository.interface.ts` (добавление методов):**

```typescript
import { PlotUserRole } from './plotUser.types';

export interface IPlotUserRoleRepository {
  // ... существующие методы
  
  /**
   * Soft delete: установить статус expired
   */
  softDelete(id: string, changedBy: string): Promise<PlotUserRole>;
  
  /**
   * Hard delete: полностью удалить связь
   */
  hardDelete(id: string, changedBy: string): Promise<void>;
  
  /**
   * Batch soft delete
   */
  batchSoftDelete(ids: string[], changedBy: string): Promise<{ success: number; failed: number }>;
  
  /**
   * Batch hard delete
   */
  batchHardDelete(ids: string[], changedBy: string): Promise<{ success: number; failed: number }>;
  
  /**
   * Проверка единственного владельца
   */
  isOnlyOwner(plotId: string, userId: string): Promise<boolean>;
  
  /**
   * Проверка наличия активных платежей
   */
  hasActivePayments(userId: string, plotId: string): Promise<boolean>;
}
```

**`src/domains/plotUser/plotUser.repository.prisma.ts` (реализация):**

```typescript
export class PlotUserRoleRepository implements IPlotUserRoleRepository {
  constructor(private prisma: PrismaClient) {}
  
  async softDelete(id: string, changedBy: string): Promise<PlotUserRole> {
    // Найти связь
    // Обновить status = 'expired'
    // Создать запись в истории
    // Вернуть обновлённую связь
  }
  
  async hardDelete(id: string, changedBy: string): Promise<void> {
    // Создать запись в истории со статусом 'deleted'
    // Удалить связь из plot_users
  }
  
  async batchSoftDelete(
    ids: string[], 
    changedBy: string
  ): Promise<{ success: number; failed: number }> {
    // Транзакция для всех операций soft delete
  }
  
  async batchHardDelete(
    ids: string[], 
    changedBy: string
  ): Promise<{ success: number; failed: number }> {
    // Транзакция для всех операций hard delete
  }
  
  async isOnlyOwner(plotId: string, userId: string): Promise<boolean> {
    // Проверка что пользователь единственный активный владелец
  }
  
  async hasActivePayments(userId: string, plotId: string): Promise<boolean> {
    // Проверка активных платежей через join
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
   * Soft delete связи
   * @throws {NotFoundError} если связь не найдена
   * @throws {ForbiddenError} если нет прав
   * @throws {BusinessRuleError} если нарушены бизнес-правила
   */
  async softDelete(
    id: string, 
    changedBy: string,
    reason?: string
  ): Promise<PlotUserRole> {
    // 1. Проверка существования
    // 2. Проверка прав
    // 3. Проверка единственного владельца
    // 4. Проверка активных платежей
    // 5. Вызов repository.softDelete()
  }
  
  /**
   * Hard delete связи
   * @throws {NotFoundError} если связь не найдена
   * @throws {ForbiddenError} если нет прав
   * @throws {BusinessRuleError} если нарушены бизнес-правила
   */
  async hardDelete(
    id: string, 
    changedBy: string,
    reason: string
  ): Promise<void> {
    // 1. Проверка существования
    // 2. Проверка прав (только ADMIN)
    // 3. Проверка единственного владельца
    // 4. Вызов repository.hardDelete()
  }
  
  /**
   * Batch soft delete
   */
  async batchSoftDelete(
    ids: string[], 
    changedBy: string,
    reason?: string
  ): Promise<{ success: number; failed: number }> {
    // 1. Валидация всех IDs
    // 2. Транзакция для всех операций
    // 3. Возврат результата
  }
  
  /**
   * Batch hard delete
   */
  async batchHardDelete(
    ids: string[], 
    changedBy: string,
    reason: string
  ): Promise<{ success: number; failed: number }> {
    // 1. Валидация всех IDs
    // 2. Транзакция для всех операций
    // 3. Возврат результата
  }
  
  /**
   * Проверка единственного владельца
   */
  async isOnlyOwner(plotId: string, userId: string): Promise<boolean> {
    // Вызов repository.isOnlyOwner()
  }
  
  /**
   * Проверка активных платежей
   */
  async hasActivePayments(userId: string, plotId: string): Promise<boolean> {
    // Вызов repository.hasActivePayments()
  }
}
```

**`src/domains/plotUser/plotUser.errors.ts` (расширение):**

```typescript
import { BusinessRuleError, ForbiddenError } from '@/shared/errors';

export class PlotUserRoleInvalidOperationError extends BusinessRuleError {
  readonly name = 'PlotUserRoleInvalidOperationError';
}

export class PlotUserRoleHasActivePaymentsError extends BusinessRuleError {
  readonly name = 'PlotUserRoleHasActivePaymentsError';
}

export class PlotUserRoleForbiddenDeleteError extends ForbiddenError {
  readonly name = 'PlotUserRoleForbiddenDeleteError';
}
```

### API

**`src/app/api/v1/plot-users/[id]/delete/route.ts`:**

```typescript
/**
 * @route DELETE /api/v1/plot-users/[id]
 * @auth required
 * @description Полностью удаляет связь пользователь-участок
 *
 * @response 200 { success: true, message: 'Связь удалена' }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 403 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 * @response 400 { success: false, error: { code: string, message: string } }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await auth();
  const service = createPlotUserRoleService();
  try {
    const body = await request.json();
    const { reason } = body;
    await service.hardDelete(params.id, user.id, reason || 'Hard delete');
    return NextResponse.json({ success: true, message: 'Связь удалена' });
  } catch (error) {
    // Error handling
  }
}
```

**`src/app/api/v1/plot-users/[id]/expire/route.ts`:**

```typescript
/**
 * @route PATCH /api/v1/plot-users/[id]/expire
 * @auth required
 * @description Деактивирует связь (soft delete)
 *
 * @body { reason?: string }
 * @response 200 { success: true, data: PlotUserRole }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user } = await auth();
  const service = createPlotUserRoleService();
  try {
    const body = await request.json();
    const expired = await service.softDelete(params.id, user.id, body.reason);
    return NextResponse.json({ success: true, data: expired });
  } catch (error) {
    // Error handling
  }
}
```

**`src/app/api/v1/plot-users/batch/route.ts`:**

```typescript
/**
 * @route DELETE /api/v1/plot-users/batch
 * @auth required
 * @description Удаляет несколько связей одновременно
 *
 * @body { ids: string[], mode: 'soft' | 'hard', reason: string }
 * @response 200 { success: true, data: { success: number, failed: number } }
 */
export async function DELETE(request: NextRequest) {
  const { user } = await auth();
  const service = createPlotUserRoleService();
  try {
    const { ids, mode, reason } = await request.json();
    if (mode === 'hard') {
      const result = await service.batchHardDelete(ids, user.id, reason);
      return NextResponse.json({ success: true, data: result });
    } else {
      const result = await service.batchSoftDelete(ids, user.id, reason);
      return NextResponse.json({ success: true, data: result });
    }
  } catch (error) {
    // Error handling
  }
}
```

### UI

**Новые компоненты:**

| Файл | Тип | Описание |
|------|-----|----------|
| `src/components/features/plotUser/DeleteConfirmationModal.tsx` | Feature | Модальное окно подтверждения удаления |
| `src/components/features/plotUser/DeleteConfirmationForm.tsx` | Feature | Форма подтверждения с причиной |
| `src/components/features/plotUser/BatchDeleteDialog.tsx` | Feature | Диалог batch удаления |
| `src/components/features/plotUser/DeleteButton.tsx` | Component | Кнопка удаления |
| `src/components/features/plotUser/SelectableTable.tsx` | Component | Таблица с множественным выбором |

**`src/components/features/plotUser/DeleteConfirmationModal.tsx`:**

```typescript
/**
 * @component DeleteConfirmationModal
 * @category features
 * @description Модальное окно подтверждения удаления связи
 *
 * @spec
 * - Выбор типа удаления (soft/hard)
 * - Ввод причины удаления
 * - Подтверждение через кнопку
 * - Индикация необратимости hard delete
 *
 * @example
 * ```tsx
 * <DeleteConfirmationModal
 *   connectionId="clx..."
 *   mode="soft"
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleConfirm}
 * />
 * ```
 */
export interface DeleteConfirmationModalProps {
  connectionId: string;
  mode: 'soft' | 'hard';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function DeleteConfirmationModal({
  connectionId,
  mode,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  // Модалка подтверждения с выбором типа удаления
}
```

**`src/components/features/plotUser/DeleteButton.tsx`:**

```typescript
/**
 * @component DeleteButton
 * @category components
 * @description Кнопка удаления связи
 */
export interface DeleteButtonProps {
  connectionId: string;
  mode?: 'soft' | 'hard';
  disabled?: boolean;
  isAdmin?: boolean;
  onClick: () => void;
}

export function DeleteButton({
  connectionId,
  mode = 'soft',
  disabled,
  isAdmin,
  onClick,
}: DeleteButtonProps) {
  // Кнопка с проверкой прав и открытием модалки
}
```

**`src/components/features/plotUser/SelectableTable.tsx`:**

```typescript
/**
 * @component SelectableTable
 * @category features
 * @description Таблица с множественным выбором для batch операций
 */
export interface SelectableTableProps {
  data: PlotUserRole[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function SelectableTable({
  data,
  selectedIds,
  onSelect,
  onDeselect,
  onSelectAll,
  onDeselectAll,
}: SelectableTableProps) {
  // Таблица с чекбоксами
}
```

**`src/app/dashboard/plots/[id]/page.tsx` (обновление):**

```typescript
/**
 * @page /dashboard/plots/[id]
 * @auth required
 * @description Страница конкретного участка
 */
export default function PlotPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  
  return (
    <div>
      <h1>{plot.plotNumber}</h1>
      <ParticipantList 
        plotId={plot.id} 
        onDeleteParticipant={handleDelete}
        isAdmin={session?.user.role === 'ADMIN'}
      />
    </div>
  );
}
```

---

## Нефункциональные требования

| Требование | Описание |
|------------|----------|
| Производительность | Ответ сервера < 500 мс |
| Доступность | Модалка имеет `aria-modal`, кнопка удаления имеет `aria-label` |
| UX | Подтверждение перед удалением, индикация необратимости, skeleton loader |
| Безопасность | Авторизация обязательна (session), проверка прав (ADMIN для hard delete) |
| Локализация | Все сообщения на русском языке |
|响应性 | Адаптивный дизайн для мобильных устройств |
| Оптимизация | Batch транзакции для минимизации запросов |

---

## Открытые вопросы

| № | Вопрос | Допущение |
|---|--------|-----------|
| OQ-1 | Нужна ли возможность восстановления после soft delete? | Да — через повторное создание связи с историей |
| OQ-2 | Нужна ли обязательная причина для soft delete? | Нет — опционально |
| OQ-3 | Нужна ли обязательная причина для hard delete? | Да — обязательно |
| OQ-4 | Можно ли hard delete активные связи? | Нет — только expired |
| OQ-5 | Batch delete для soft и hard одновременно? | Нет — выбор одного режима на batch |
| OQ-6 | Уведомление участников об удалении? | Отложено — не в MVP |
| OQ-7 | Логирование удалений в отдельную таблицу? | Да — уже есть plot_user_history |

---

## История

| Дата | Автор | Действие |
|------|-------|----------|
| 2026-07-04 | Architect | Создание черновика US-19-5 |

---

## Связанные User Stories

| US | Название | Зависимость |
|----|----------|-------------|
| US-19-1 | Создание связи | Удаление созданных связей |
| US-19-2 | Просмотр участников участка | Удаление из таблицы участников |
| US-19-3 | Просмотр связей пользователя | Удаление из таблицы связей |
| US-19-4 | Редактирование связи | После редактирования можно удалить |
| US-19-6 | Просмотр истории изменений | История удаления отображается в истории |

---

## Интеграционные моменты

### Точки входа в интерфейс (детально)

#### TV-1: Кнопка "Удалить" в таблице участников
- **Расположение:** `/dashboard/plots/[id]`
- **Компонент:** `<ParticipantTable actions>`
- **Действие:** Открывает DeleteConfirmationModal
- **Права:** Только ADMIN

#### TV-2: Кнопка "Удалить" в таблице связей
- **Расположение:** `/dashboard/my-connections`
- **Компонент:** `<UserConnectionsList actions>`
- **Действие:** Открывает DeleteConfirmationModal
- **Права:** ADMIN или владелец связи (soft delete)

#### TV-3: Кнопка "Удалить" в модальном окне участников
- **Расположение:** `/dashboard/plots/[id]/participants`
- **Компонент:** `<Modal actions>`
- **Действие:** Открывает DeleteConfirmationModal
- **Права:** Только ADMIN

#### TV-4: Контекстное меню
- **Расположение:** При долгом нажатии (мобильные)
- **Компонент:** `<LongPressMenu>`
- **Действие:** Открывает DeleteConfirmationModal
- **Права:** Только ADMIN

#### TV-5: Блок действий в карточке пользователя
- **Расположение:** `/dashboard/users/[id]`
- **Компонент:** `<UserCard actions>`
- **Действие:** Открывает DeleteConfirmationModal
- **Права:** ADMIN

---

## Примечания для реализации

1. **Soft delete вместо hard delete:** По умолчанию использовать soft delete для сохранения истории
2. **Hard delete только для CLEANUP:** Использовать hard delete только для миграций или очистки
3. **Подтверждение обязательно:** Всегда требовать подтверждение перед удалением
4. **Причина удаления:** Для hard delete обязательна причина, для soft delete опциональна
5. **Права доступа:** Проверка прав на удаление перед отображением кнопки
6. **Batch операции:** Транзакция для всех операций batch
7. **Рефреш данных:** После удаления обновлять таблицу через refetch
8. **Оптимистичное удаление:** Мгновенное удаление из UI с rollback при ошибке
9. **Мобильная адаптация:** Context menu для мобильных устройств
10. **Доступность:** ARIA атрибуты для модальных окон и кнопок
