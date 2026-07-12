# US-15: Редактирование участка - Спецификации компонентов

## Введение

Это документ содержит спецификации компонентов для реализации User Story US-15 "Редактирование участка". Документ создан в соответствии с правилами SPECS.md (Spec-Driven Development).

## Список изменяемых компонентов

### Repository слой

**Файлы:**
1. `src/domains/plot/plot.repository.interface.ts`
2. `src/domains/plot/plot.repository.prisma.ts`

**Требуемые изменения:**

#### 1. IPlotRepository

Метод `update()` уже существует, требуется обновить JSDoc аннотации:

```typescript
/**
 * Обновить участок
 * 
 * @param id - Уникальный идентификатор участка
 * @param data - Данные для обновления (без plotNumber)
 * @returns Обновленный участок
 * @throws {PlotNotFoundError} если участок не найден
 * @throws {PlotDuplicateError} при дубликате cadastralNumber
 * 
 * @spec
 * - plotNumber не может быть изменён (исключение из UpdatePlotData)
 * - Проверка уникальности cadastralNumber выполняется в Service слое
 * - Возвращает полный объект Plot без фильтрации полей
 */
update(id: string, data: UpdatePlotData): Promise<Plot>;
```

#### 2. PlotRepositoryPrisma

Метод `update()` реализован, но требует обновления для корректной обработки ошибок дубликата кадастрового номера:

```typescript
/**
 * Обновить участок в БД
 * 
 * @param id - Уникальный идентификатор участка
 * @param data - Данные для обновления
 * @returns Обновленный участок
 * @throws {PlotNotFoundError} если участок не найден
 * @throws {PlotDuplicateError} при дубликате cadastralNumber
 * 
 * @spec
 * - Исключает plotNumber из данных обновления (неизменяемое поле)
 * - Проверяет уникальность cadastralNumber перед записью
 * - Возвращает ошибку P2002 (P2002: Unique constraint failed) при дубликате
 */
async update(id: string, data: UpdatePlotData): Promise<Plot>
```

---

### Service слой

**Файлы:**
1. `src/domains/plot/plot.service.ts`
2. `src/domains/plot/plot.errors.ts`

**Требуемые изменения:**

#### 1. PlotService.update()

```typescript
/**
 * Обновить участок
 * 
 * @param id - Уникальный идентификатор участка
 * @param data - Данные для обновления
 * @returns Обновленный участок
 * @throws {PlotNotFoundError} если участок не найден
 * @throws {PlotDuplicateError} при дубликате cadastralNumber
 * @throws {PlotInvalidDataError} при ошибке валидации
 * 
 * @spec
 * -plotNumber не может быть изменён (игнорируется при обновлении)
 * - Проверка уникальности cadastralNumber выполняется ТОЛЬКО если поле задано и отличается от текущего
 * - Валидация данных через updatePlotSchema
 * - При обнаружении дубликата бросает PlotDuplicateError с сообщением о кадастровом номере
 */
async update(id: string, data: UpdatePlotData): Promise<Plot>
```

#### 2. PlotDuplicateError

Уточнить сообщение об ошибке для случая дубликата кадастрового номера:

```typescript
/**
 * @class PlotDuplicateError
 * @description Ошибка при попытке создать/обновить участок с дубликатом уникального поля
 * 
 * @spec
 * - Сообщение об ошибке различается для plotNumber и cadastralNumber
 * - Для cadastralNumber: "Участок с кадастровым номером {number} уже существует"
 */
export class PlotDuplicateError extends ConflictError
```

---

### API Router слой

**Файлы:**
1. `src/app/api/v1/plots/[id]/route.ts` - **новый файл**

**Требуемые изменения:**

#### 1. GET /api/v1/plots/:id

```typescript
/**
 * @route GET /api/v1/plots/:id
 * @auth required
 * @role MEMBER, ADMIN
 * @description Возвращает участок по уникальному идентификатору
 *
 * @param id - ID участка (из URL params)
 *
 * @response 200 { success: true, data: Plot }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 500 { success: false, error: { code: 'INTERNAL_ERROR', message: string } }
 *
 * @spec
 * - Возвращает полный объект Plot с полями: id, plotNumber, cadastralNumber, area, address, note, createdAt, updatedAt
 * - plotNumber недоступен для редактирования (только чтение)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
)

```

#### 2. PATCH /api/v1/plots/:id

```typescript
/**
 * @route PATCH /api/v1/plots/:id
 * @auth required
 * @role MEMBER, ADMIN
 * @description Обновляет данные существующего участка
 *
 * @param id - ID участка (из URL params)
 * @body UpdatePlotData { [cadastralNumber?], area, [address?], [note?] }
 *
 * @response 200 { success: true, data: Plot }
 * @response 400 { success: false, error: { code: 'VALIDATION_ERROR', message: string } }
 * @response 401 { success: false, error: { code: 'UNAUTHORIZED', message: string } }
 * @response 403 { success: false, error: { code: 'FORBIDDEN', message: string } }
 * @response 404 { success: false, error: { code: 'NOT_FOUND', message: string } }
 * @response 409 { success: false, error: { code: 'CONFLICT', message: string } }
 * @response 500 { success: false, error: { code: 'INTERNAL_ERROR', message: string } }
 *
 * @spec
 * - plotNumber не может быть изменён (игнорируется в теле запроса)
 * - Валидация тела запроса через Zod-схему updatePlotSchema
 * - При дубликате cadastralNumber → 409 Conflict
 * - При отсутствии участка → 404 Not Found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
)
```

**Обработка ошибок:**

```typescript
/**
 * Стандартизированная обработка ошибок для PATCH/GET
 */
function errorResponse(error: unknown): NextResponse {
  // 409 Conflict - дубликат cadastralNumber
  if (error instanceof PlotDuplicateError) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: error.message } },
      { status: 409 },
    );
  }

  // 404 Not Found
  if (error instanceof PlotNotFoundError) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: error.message } },
      { status: 404 },
    );
  }

  // 400 Validation Error
  if (error instanceof PlotInvalidDataError) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: error.message } },
      { status: 400 },
    );
  }

  // 500 Internal Error
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка обновления участка' } },
    { status: 500 },
  );
}
```

---

### UI Components слой

**Файлы:**
1. `src/components/features/plots/PlotList.tsx`
2. `src/components/features/plots/PlotForm.tsx`
3. `src/components/features/plots/PlotFormModal.tsx`

**Требуемые изменения:**

#### 1. PlotList.tsx

**Добавить колонку "Действия" с кнопками:**

```typescript
/**
 * @component PlotList
 * @category features
 * @description Таблица списка земельных участков с кнопками управления
 *
 * @spec
 * - Отображает кнопки "Редактировать" и "Удалить" для каждого участка
 * - Кнопка "Редактировать" видна всем авторизованным пользователям
 * - Кнопка "Удалить" видна только пользователям с ролью ADMIN (RBAC)
 * - При клике на "Редактировать" вызывает onEditPlot с id участка
 * - При клике на "Удалить" вызывает onDeletePlot с id участка
 *
 * @data-flow
 * - Данные загружаются через usePlotList hook
 * - onEditPlot передаёт id участка для открытия формы редактирования
 */
interface PlotListProps {
  plots: Plot[];
  onEditPlot: (plotId: string) => void;
  onDeletePlot: (plotId: string) => void;
  isLoading?: boolean;
}
```

**Кнопка редактирования:**

```typescript
/**
 * @component EditButton
 * @description Кнопка редактирования участка
 * 
 * @spec
 * - Отображается рядом с кнопкой "Удалить"
 * - При клике вызывает onEditPlot(plot.id)
 * - Icon: pencil/pen
 */
```

#### 2. PlotForm.tsx

**Добавить режим редактирования:**

```typescript
/**
 * @component PlotForm
 * @category features
 * @description Форма создания/редактирования земельного участка
 *
 * @param mode - Режим работы: 'create' или 'edit'
 * @param plot - Данные участка для редактирования (только для mode='edit')
 *
 * @spec
 * - При mode='create':
 *   - Поля: plotNumber (обязательно), cadastralNumber, area, address, note
 *   - plotNumber редактируемый
 *   - Заголовок: "Новый участок"
 *   - Кнопка: "Создать"
 *
 * - При mode='edit':
 *   - plotNumber readonly (неизменяемое поле)
 *   - Поля: cadastralNumber, area, address, note (все редактируемые)
 *   - Заголовок: "Редактировать участок №{plot.plotNumber}"
 *   - Кнопка: "Сохранить"
 *   - При загрузке: кнопка блокируется, текст "Сохранение..."
 *
 * - Обработка ошибок:
 *   - При 400: ошибки отображаются под соответствующими полями
 *   - При 409 (дубликат cadastralNumber): поле подсвечивается красным, сообщение "Участок с таким кадастровым номером уже существует"
 *   - При 500: показывается alert с ошибкой
 */
interface PlotFormProps {
  mode: 'create' | 'edit';
  plot?: Plot; // Только для mode='edit'
  onSave: (data: CreatePlotData | UpdatePlotData) => Promise<void>;
  onCancel?: () => void;
}
```

**Поле plotNumber в режиме edit:**

```typescript
/**
 * @component ReadonlyField
 * @description Поле в режиме "только чтение"
 * 
 * @spec
 * - При mode='edit' отображает plotNumber без возможности редактирования
 * - label: "Номер участка"
 * - value: plot.plotNumber
 * - disabled: true
 */
```

#### 3. PlotFormModal.tsx

**Убедиться, что компонент корректно передаёт режим редактирования:**

```typescript
/**
 * @component PlotFormModal
 * @category features
 * @description Модальное окно формы создания/редактирования участка
 *
 * @spec
 * - При mode='edit' передаёт plot в PlotForm для предзаполнения
 * - PlotForm сам управляет загрузкой данных через API (GET /api/v1/plots/:id)
 */
```

---

## Валидация и типы данных

### UpdatePlotData

```typescript
/**
 * @type UpdatePlotData
 * @domain plot
 * @description Данные для обновления земельного участка
 *
 * @spec
 * - Все поля опциональны
 * - plotNumber игнорируется при обновлении (неизменяемое поле)
 * - cadastralNumber: при указании должен быть уникальным (проверка в Service слое)
 * - cadastralNumber: формат XX:XX:XXXXXXX:XXX (валидация в updatePlotSchema)
 * - area: должно быть > 0 (валидация в updatePlotSchema)
 */
export interface UpdatePlotData {
  /** Номер участка - игнорируется при обновлении (неизменяемое поле) */
  plotNumber?: string | null;
  /** Кадастровый номер - опционально, должен быть уникальным */
  cadastralNumber?: string | null;
  /** Площадь участка в м² - опционально, должно быть > 0 */
  area?: number;
  /** Адрес участка - опционально */
  address?: string | null;
  /** Примечание - опционально */
  note?: string | null;
}
```

### updatePlotSchema

```typescript
/**
 * @function updatePlotSchema
 * @domain plot
 * @description Zod-схема для валидации данных обновления участка
 *
 * @spec
 * - Все поля опциональны (partial schema)
 * - cadastralNumber: если задан, должен соответствовать формату XX:XX:XXXXXXX:XXX
 * - area: если задано, должно быть > 0
 * - address, note: максимум 200/500 символов
 * - Пустые строки преобразуются в null
 */
export const updatePlotSchema = z.object({
  plotNumber: z
    .string()
    .min(1, 'Номер участка обязателен')
    .max(50, 'Номер участка не может превышать 50 символов')
    .nullable()
    .optional(),
  cadastralNumber: z
    .string()
    .max(20, 'Кадастровый номер не может превышать 20 символов')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .refine(
      (val) => !val || /^\d{2}:\d{2}:\d{7}:\d{3}$/.test(val),
      'Кадастровый номер должен соответствовать формату XX:XX:XXXXXXX:XXX'
    ),
  area: z
    .number()
    .positive('Площадь должна быть положительным числом')
    .optional(),
  address: z
    .string()
    .max(200, 'Адрес не может превышать 200 символов')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val))
    .nullable(),
  note: z
    .string()
    .max(500, 'Примечание не может превышать 500 символов')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val))
    .nullable(),
}).partial();
```

---

## Зависимости между компонентами

```mermaid
flowchart TD
    A[PlotList.tsx] -->|onEditPlot| B[PlotFormModal.tsx]
    B -->|mode='edit', plot| C[PlotForm.tsx]
    C -->|API call| D[apiClient.get('/plots/:id')]
    D --> E[GET /api/v1/plots/:id]
    E --> F[PlotService.findById]
    F --> G[IPlotRepository.findById]
    C -->|API call| H[apiClient.patch('/plots/:id')]
    H --> I[PATCH /api/v1/plots/:id]
    I --> J[PlotService.update]
    J --> K[IPlotRepository.update]
```

---

## Проверка соответствия модели данных

### Концептуальная модель (`docs/model/entities/plot.md`)

| Поле | Тип | Изменяемое | Примечание |
|------|-----|-----------|------------|
| `id` | String | ❌ | Первичный ключ, не изменяется |
| `plot_number` | String | ❌ | Номер участка неизменяем (BR-1) |
| `cadastral_number` | String? | ✅ | Можно добавить или изменить (BR-2, BR-3) |
| `area` | Decimal | ✅ | Можно изменить (BR-4) |
| `address` | String? | ✅ | Можно изменить |
| `note` | String? | ✅ | Можно изменить |
| `created_at` | DateTime | ❌ | Автоматическое поле |
| `updated_at` | DateTime | ✅ | Автоматическое обновление |

### Соответствие TypeScript типах

| Поле | TS тип | Изменяемое | Примечание |
|------|--------|-----------|------------|
| `id` | `string` | ❌ | Первичный ключ |
| `plotNumber` | `string` | ❌ | Readonly в режиме edit |
| `cadastralNumber` | `string \| null` | ✅ | Опциональное, уникальное |
| `area` | `number` | ✅ | Положительное число |
| `address` | `string \| null` | ✅ | Опциональное |
| `note` | `string \| null` | ✅ | Опциональное |

✅ **Соответствие подтверждено** - UpdatePlotData корректно отражает бизнес-правила US-15.

---

## Открытые вопросы

| № | Вопрос | Статус | Решение |
|---|--------|--------|---------|
| OQ-1 | Нужно ли логирование изменений (audit trail)? | Отложено | На следующей итерации |
| OQ-2 | Нужна ли история версий участка? | Отложено | На следующей итерации |

---

## Следующие шаги

1. ✅ Создать скелеты новых методов в repository компонентах
2. ✅ Создать скелеты новых методов в service компонентах
3. ✅ Создать скелеты новых API endpoint'ов
4. ✅ Создать скелеты новых UI компонентов
5. ⏳ Проверить соответствие спецификаций концептуальной модели данных
6. ⏳ Обсудить изменения со мной перед реализацией
