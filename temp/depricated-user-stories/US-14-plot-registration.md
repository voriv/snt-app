# US-14: Регистрация участка

## Формулировка

**As a** член СНТ (Member) или Администратор,  
**I want to** зарегистрировать новый земельный участок, —  
**So that** он был учтен в системе и к нему можно было привязать договоры и платежи.

## Контекст

### Проблема
Новые участки не могут быть добавлены в систему, вся регистрация ведётся вне приложения.

### Решение
Создать форму регистрации участка с валидацией полей и проверкой уникальности.

### Границы
- Форма регистрации доступна на странице `/dashboard/plots` (модальное окно или отдельная страница)
- Валидация на клиенте (Zod) и сервере (Service layer)
- Проверка уникальности номерa и кадастрового номера

## Модель данных

### Сущность Plot (создание)

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| `plot_number` | String | Да | Номер участка (уникальный) |
| `cadastral _number` | String? | Нет | Кадастровый номер (формат `XX:XX:XXXXXXX:XXX`) |
| `area` | Decimal | Да | Площадь участка (> 0, м²) |
| `address` | String? | Нет | Адрес участка |
| `note` | String? | Нет | Примечание / описание |

## Функциональные требования

### FR-1: Форма регистрации

Пользователь открывает форму для создания нового участка.

#### AC-1.1: Открытие формы
- **Дано:** Пользователь на странице `/dashboard/plots` (US-13)
- **Когда:** Пользователь нажимает кнопку «Добавить участок»
- **Тогда:** Открывается форма регистрации (модальное окно или страница `/dashboard/plots/new`)
- **Иначе:** Форма содержит все поля из таблицы выше

#### AC-1.2: Поля формы
- **Дано:** Форма регистрации открыта
- **Когда:** Пользователь видит форму
- **Тогда:** Отображаются поля:
  | Поле | Тип ввода | Обязательное | Placeholder | Валидация |
  |------|-----------|-------------|-------------|-----------|
  | Номер участка | text | Да | "Введите номер участка" | minLength: 1 |
  | Кадастровый номер | text | Нет | "XX:XX:XXXXXXX:XXX" | regex: `/^\d{2}:\d{2}:\d{7}:\d{3}$/` |
  | Площадь | number | Да | "Введите площадь (м²)" | min: 0.01 |
  | Адрес | text | Нет | "Введите адрес" | — |
- **Иначе:** Обязательные поля помечены символом `*`

#### AC-1.3: Валидация на клиенте
- **Дано:** Пользователь вводит данные в форму
- **Когда:** Пользователь теряет фокус (onBlur) или нажимает «Создать»
- **Тогда:**
  - Если `plot_number` пустой — показывается «Номер участка обязателен»
  - Если `cadstral_number` введён и не соответствует формату — «Кадастровый номер должен соответствовать формату XX:XX:XXXXXXX:XXX»
  - Если `area` ≤ 0 — «Площадь должна быть больше 0»
- **Иначе:** Ошибки отображаются под соответствующими полями

### FR-2: Отправка формы

Пользователь отправляет данные для создания участка.

#### AC-2.1: POST-запрос
- **Дано:** Пользователь заполнил форму и нажал «Создать»
- **Когда:** Клик по кнопке «Создать»
- **Тогда:** Выполняется `POST /api/v1/plots` с телом:
```json
{
  "plot_number": "42",
  "cadstral_number": "50:00:0000001:42",
  "area": 12.5,
  "address": "д. Березки, уч. 42",
  "note": "Земельный участок"
}
```
- **Иначе:** Если `cadstral_number`, `address`, `note` пустые — не отправляются (или отправляются как `null`)

#### AC-2.2: Блокировка кнопки при загрузке
- **Дано:** Форма отправляется
- **Когда:** Запрос активен (`isLoading = true`)
- **Тогда:**
  - Кнопка «Создать» заблокирована (`disabled`)
  - Текст кнопки меняется на «Создание...» или показывается спиннер
- **Иначе:** Пользователь не может отправить форму повторно

#### AC-2.3: Успешное создание
- **Дано:** `POST /api/v1/plots` вернул `201 Created`
- **Когда:** Ответ `{ success: true, data: Plot }`
- **Тогда:**
  - Форма закрывается
  - Показывается уведомление: «Участок №[plot_number] успешно создан»
  - Список участков на странице обновляется (refetch)
- **Иначе:** Данные добавляются в таблицу без перезагрузки

#### AC-2.4: Ошибка дубликата номера
- **Дано:** `plot_number` уже существует в БД
- **Когда:** Сервер возвращает `409 Conflict`
- **Тогда:**
  - Поле `plot_number` подсвечивается красным
  - Сообщение: «Участок с номером [plot_number] уже существует»
- **Иначе:** Форма остаётся открытой для исправления

#### AC-2.5: Ошибка дубликата кадастрового номера
- **Дано:** `cadstral_number` уже существует в БД
- **Когда:** Сервер возвращает `409 Conflict`
- **Тогда:**
  - Поле `cadstral_number` подсвечивается красным
  - Сообщение: «Участок с таким кадастровым номером уже существует»
- **Иначе:** Форма остаётся открытой для исправления

#### AC-2.6: Ошибка валидации
- **Дано:** Данные не проходят валидацию на сервере
- **Когда:** Сервер возвращает `400 Bad Request`
- **Тогда:**
  - Ошибки отображаются под соответствующими полями
  - Сообщение содержит описание каждой ошибки
- **Иначе:** Форма остаётся открытой

### FR-3: Отмена создания

Пользователь может отменить создание участка.

#### AC-3.1: Кнопка «Отмена»
- **Дано:** Форма регистрации открыта
- **Когда:** Пользователь нажимает «Отмена»
- **Тогда:**
  - Форма закрывается
  - Данные формы сбрасываются
  - Никакие запросы не отправляются

## Бизнес-правила и валидация

| ID | Правило | Описание | Источник |
|----|---------|----------|----------|
| BR-1 | Уникальность номера | `plot_number` должен быть уникальным в СНТ | DB Unique Constraint |
| BR-2 | Уникальность кадастра | `cadstral_number` должен быть уникальным (если указан) | DB Unique Constraint |
| BR-3 | Формат кадастра | Формат: `XX:XX:XXXXXXX:XXX` (19 символов с двоеточиями) | Regex: `/^\d{2}:\d{2}:\d{7}:\d{3}$/` |
| BR-4 | Площадь > 0 | `area` должно быть строго больше 0 | Валидация Zod |
| BR-5 | Обязательность номера | `plot_number` обязателен | Валидация Zod |

### Zod-схема

```typescript
export const createPlotSchema = z.object({
  plot_number: z.string().min(1, 'Номер участка обязателен'),
  cadstral_number: z
    .string()
    .refine(
      (val) => !val || /^\d{2}:\d{2}:\d{7}:\d{3}$/.test(val),
      'Кадастровый номер должен соответствовать формату XX:XX:XXXXXXX:XXX'
    )
    .optional()
    .or(z.literal('').transform(() => null)),
  area: z.coerce.number().positive('Площадь должна быть больше 0'),
  address: z.string().optional().or(z.literal('').transform(() => null)),
  note: z.string().optional().or(z.literal('').transform(() => null)),
});
```

## Граничные случаи (Edge Cases)

| Сценарий | Ожидаемое поведение |
|----------|-------------------|
| Пустой `cadstral_number` | Поле не отправляется на сервер (или null) |
| Ввод букв в поле «Площадь» | `number` input блокирует ввод, валидация наBlur |
| Одновременное создание двух участков с одинаковым номером | Второй получит 409 Conflict |
| Максимальная длина `note` (1000 символов) | Ограничение на уровне Zod + maxLength input |
| Отсутствие интернета при отправке | Ошибка сети, форма не блокируется |

## Обработка ошибок

| Код | Ситуация | Сообщение | Действие |
|-----|----------|-----------|----------|
| 400 | Ошибка валидации | «Ошибка валидации: [поле] — [описание]» | Подсветить поле |
| 401 | Не авторизован | — | Редирект на `/login` |
| 403 | Нет прав на создание | «У вас нет прав для создания участков» | Скрыть кнопку |
| 409 | Дубликат номера/кастра | «Участок с таким номером/кадастровым номером уже существует» | Подсветить поле |
| 500 | Внутренняя ошибка | «Ошибка создания участка. Попробуйте позже.» | Показать alert |

## Влияние на слои архитектуры

### Repository

**`src/domains/plot/plot.repository.interface.ts` (добавление методов):**
```typescript
export interface IPlotRepository {
  create(data: CreatePlotData): Promise<Plot>;
  existsByPlotNumber(plotNumber: string): Promise<boolean>;
  existsByCadstralNumber(cadstralNumber: string): Promise<boolean>;
}
```

### Service

**`src/domains/plot/plot.service.ts` (добавление методов):**
```typescript
export class PlotService {
  /**
   * Создать новый участок
   * @throws {PlotDuplicateError} при дубликате номера или кадра
   * @throws {PlotInvalidDataError} при ошибке валидации
   */
  async create(data: CreatePlotData): Promise<Plot> {
    this.validateCreateData(data);
    
    if (await this.plotRepository.existsByPlotNumber(data.plot_number)) {
      throw new PlotDuplicateError(`Участок с номером ${data.plot_number} уже существует`);
    }
    
    if (data.cadstral_number && await this.plotRepository.existsByCadstralNumber(data.cadstral_number)) {
      throw new PlotDuplicateError(`Участок с кадастровым номером ${data.cadstral_number} уже существует`);
    }
    
    return this.plotRepository.create(data);
  }
}
```

### Domain Errors

**`src/domains/plot/plot.errors.ts`:**
```typescript
export class PlotDuplicateError extends ConflictError {
  readonly name = 'PlotDuplicateError';
}

export class PlotInvalidDataError extends ValidationError {
  readonly name = 'PlotInvalidDataError';
}
```

### API

**`src/app/api/v1/plots/route.ts` (добавление POST):**
```typescript
/**
 * @route POST /api/v1/plots
 * @auth required
 * @description Создаёт новый земельный участок
 *
 * @body CreatePlotData
 * @response 201 { success: true, data: Plot }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 409 { success: false, error: { code: string, message: string } }
 */
export async function POST(request: NextRequest) {
  const service = createPlotService();
  try {
    const body = await request.json();
    const plot = await service.create(body);
    return NextResponse.json({ success: true, data: plot }, { status: 201 });
  } catch (error) {
    // Error handling: PlotDuplicateError → 409, PlotInvalidDataError → 400
  }
}
```

### UI

**Новые файлы:**

| Файл | Тип | Описание |
|------|-----|----------|
| `src/components/features/plots/PlotForm.tsx` | Feature | Форма регистрации/редактирования участка |
| `src/components/features/plots/PlotForm.stories.tsx` | Storybook | (опционально) Stories для формы |

**`src/components/features/plots/PlotForm.tsx`:**
```typescript
/**
 * @component PlotForm
 * @category features
 * @description Форма создания/редактирования земельного участка
 *
 * @spec
 * - Режимы: create (без prefill), edit (с prefill данными участка)
 * - Валидация: Zod-схема на клиенте и сервере
 * - Поля: plot_number (required), cadstral_number (optional, regex), area (required, >0),
 *   address (optional), note (optional)
 * - При submit: API-вызов через apiClient, блокировка кнопки при isLoading
 * - При ошибке 409: подсветка поля с дубликатом
 *
 * @example
 * ```tsx
 * <PlotForm mode="create" onSubmit={handleSuccess} onCancel={handleCancel} />
 * <PlotForm mode="edit" plot={plot} onSubmit={handleSuccess} onCancel={handleCancel} />
 * ```
 */
export interface PlotFormProps {
  mode: 'create' | 'edit';
  plot?: Plot;
  onSubmit: (plot: Plot) => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

## Нефункциональные требования

| Требование | Описание |
|------------|----------|
| Производительность | Ответ сервера < 500 мс |
| Доступность | Все поля имеют `<label>`, ошибки связаны с полями через `aria-describedby` |
| UX | Валидация на onBlur для мгновенной обратной связи |
| Локализация | Все сообщения валидации на русском языке |

## Открытые вопросы

| № | Вопрос | Статус |
|---|--------|--------|
| OQ-1 | Нужно ли автозаполнение номера при создании? | Отложено — ручной ввод в MVP |
| OQ-2 | Нужно ли автоопределение участника по авторизованному пользователю? | Отложено — ручной выбор |

## История

| Дата | Изменение | Автор | Описание |
|------|-----------|-------|----------|
| 2026-07-02 | Создание | Architect | Первоначальная версия US-14 |

## Связанные User Stories

| US | Название | Зависимость |
|----|----------|------------|
| US-13 | Просмотр списка участков | Форма открывается из списка |
| US-15 | Редактирование участка | Переиспользует PlotForm |
| US-18 | Карточка участка | Созданный участок отображается в списке |
