# US-15: Редактирование участка

## Формулировка

**As a** Администратор СНТ,  
**I want to** изменять данные существующего земельного участка, —  
**So that** информация об участках оставалась актуальной.

## Контекст

### Проблема
После регистрации участка невозможно исправить ошибки в данных (например, неверная площадь или адрес).

### Решение
Создать форму редактирования участка с возможностью изменения всех полей, кроме номера участка.

### Границы
- Редактирование доступно на странице списка участков (кнопка «Редактировать» в строке)
- Форма переиспользует `PlotForm` из US-14 с режимом `edit`
- Номер участка (`plot_number`) недоступен для изменения после создания

## Модель данных

### Сущность Plot (обновление)

| Поле | Тип | Изменяемое | Описание |
|------|-----|-----------|----------|
| `plot_number` | String | ❌ Нет | Номер участка неизменяем |
| `cadstral_number` | String? | Да | Можно добавить или изменить |
| `area` | Decimal | Да | Можно изменить |
| `address` | String? | Да | Можно изменить |
| `note` | String? | Да | Можно изменить |

## Функциональные требования

### FR-1: Открытие формы редактирования

Пользователь может открыть форму для редактирования участка.

#### AC-1.1: Кнопка «Редактировать»
- **Дано:** Пользователь на странице `/dashboard/plots` (US-13)
- **Когда:** В строке таблицы участка есть кнопка «Редактировать»
- **Тогда:**
  - Кнопка отображается рядом с кнопкой «Удалить»
  - Кнопка «Удалить» отображается только если у пользователя есть право на удаление (RBAC)
- **Иначе:** Если нет прав на редактирование — кнопка скрыта

#### AC-1.2: Загрузка данных участка
- **Дано:** Пользователь нажимает «Редактировать»
- **Когда:** Клик по кнопке
- **Тогда:**
  - Выполняется `GET /api/v1/plots/:id` через `apiClient`
  - Открывается форма `PlotForm` с `mode="edit"` и предзаполненными данными
- **Иначе:** Если участок не найден (404) — показывается сообщение «Участок не найден» и редирект на `/dashboard/plots`

#### AC-1.3: Предзаполнение формы
- **Дано:** Форма редактирования открыта с данными участка
- **Когда:** Данные загружены
- **Тогда:** Поля формы заполняются значениями:
  | Поле | Значение | Режим |
  |------|----------|-------|
  | `plot_number` | Текущий номер | Readonly (нельзя изменить) |
  | `cadstral_number` | Текущее значение или пусто | Editable |
  | `area` | Текущая площадь | Editable |
  | `address` | Текущий адрес или пусто | Editable |
  | `note` | Текущее примечание или пусто | Editable |

### FR-2: Сохранение изменений

Пользователь может сохранить изменения в участке.

#### AC-2.1: PATCH-запрос
- **Дано:** Пользователь изменил данные в форме
- **Когда:** Клик по кнопке «Сохранить»
- **Тогда:** Выполняется `PATCH /api/v1/plots/:id` с телом:
```json
{
  "cadstral_number": "50:00:0000001:43",
  "area": 15.0,
  "address": "д. Березки, уч. 42 (изменён)",
  "note": "Обновлённое примечание"
}
```
- **Иначе:** `plot_number` не отправляется (неизменяемое поле)

#### AC-2.2: Блокировка кнопки при загрузке
- **Дано:** Форма отправляется
- **Когда:** Запрос активен (`isLoading = true`)
- **Тогда:**
  - Кнопка «Сохранить» заблокирована (`disabled`)
  - Текст кнопки: «Сохранение...»
- **Иначе:** Пользователь не может отправить форму повторно

#### AC-2.3: Успешное обновление
- **Дано:** `PATCH /api/v1/plots/:id` вернул `200 OK`
- **Когда:** Ответ `{ success: true, data: Plot }`
- **Тогда:**
  - Форма закрывается
  - Показывается уведомление: «Участок №[plot_number] успешно обновлён»
  - Данные в таблице обновляются (refetch или optimistic update)
- **Иначе:** Строка таблицы обновляется без перезагрузки страницы

#### AC-2.4: Ошибка дубликата кадастрового номера
- **Дано:** Новый `cadstral_number` уже занят другим участком
- **Когда:** Сервер возвращает `409 Conflict`
- **Тогда:**
  - Поле `cadstral_number` подсвечивается красным
  - Сообщение: «Участок с таким кадастровым номером уже существует»
- **Иначе:** Форма остаётся открытой

#### AC-2.5: Ошибка валидации
- **Дано:** Данные не проходят валидацию на сервере
- **Когда:** Сервер возвращает `400 Bad Request`
- **Тогда:** Ошибки отображаются под соответствующими полями
- **Иначе:** Форма остаётся открытой

### FR-3: Отмена редактирования

Пользователь может отменить изменения.

#### AC-3.1: Кнопка «Отмена»
- **Дано:** Форма редактирования открыта
- **Когда:** Пользователь нажимает «Отмена»
- **Тогда:**
  - Форма закрывается
  - Все изменения отменяются
  - Данные в таблице не обновляются

## Бизнес-правила и валидация

| ID | Правило | Описание | Источник |
|----|---------|----------|----------|
| BR-1 | Номер неизменяем | `plot_number` нельзя изменить после создания | Бизнес-правило |
| BR-2 | Уникальность кадастра | Новый `cadstral_number` должен быть уникальным (если указан) | DB Unique Constraint |
| BR-3 | Формат кадастра | Формат: `XX:XX:XXXXXXX:XXX` | Regex: `/^\d{2}:\d{2}:\d{7}:\d{3}$/` |
| BR-4 | Площадь > 0 | `area` должно быть > 0 | Валидация Zod |

## Граничные случаи (Edge Cases)

| Сценарий | Ожидаемое поведение |
|----------|-------------------|
| Участок изменён другим пользователем | При сохранении — 409 Conflict, показать сообщение «Данные устарели. Обновите страницу.» |
| Изменение кадастрового номера на существующий | 409 Conflict с указанием занятого номера |
| Параллельное редактирование | Последний сохранённый результат побеждает (last-write-wins), либо 409 |

## Обработка ошибок

| Код | Ситуация | Сообщение | Действие |
|-----|----------|-----------|----------|
| 400 | Ошибка валидации | «Ошибка валидации: [поле] — [описание]» | Подсветить поле |
| 401 | Не авторизован | — | Редирект на `/login` |
| 403 | Нет прав на редактирование | «У вас нет прав для редактирования» | Скрыть кнопку |
| 404 | Участок не найден | «Участок не найден» | Редирект на `/dashboard/plots` |
| 409 | Дубликат кадастра | «Участок с таким кадастровым номером уже существует» | Подсветить поле |
| 500 | Внутренняя ошибка | «Ошибка обновления участка» | Показать alert |

## Влияние на слои архитектуры

### Repository

**`src/domains/plot/plot.repository.interface.ts` (добавление метода):**
```typescript
export interface IPlotRepository {
  update(id: string, data: UpdatePlotData): Promise<Plot>;
}
```

**`src/domains/plot/plot.repository.prisma.ts`:**
```typescript
export class PlotRepositoryPrisma implements IPlotRepository {
  async update(id: string, data: UpdatePlotData): Promise<Plot> {
    return this.prisma.plot.update({
      where: { id },
      data,
    });
  }
}
```

### Service

**`src/domains/plot/plot.service.ts` (добавление метода):**
```typescript
/**
 * Обновить участок
 * @param id - ID участка
 * @param data - Данные для обновления
 * @throws {PlotNotFoundError} если участок не найден
 * @throws {PlotDuplicateError} при дубликате кадастрового номера
 * @throws {PlotInvalidDataError} при ошибке валидации
 */
async update(id: string, data: UpdatePlotData): Promise<Plot> {
  const existing = await this.plotRepository.findById(id);
  if (!existing) {
    throw new PlotNotFoundError(`Участок с ID ${id} не найден`);
  }
  
  if (data.cadstral_number && data.cadstral_number !== existing.cadstral_number) {
    if (await this.plotRepository.existsByCadstralNumber(data.cadstral_number)) {
      throw new PlotDuplicateError(`Участок с кадастровым номером ${data.cadstral_number} уже существует`);
    }
  }
  
  this.validateUpdateData(data);
  return this.plotRepository.update(id, data);
}
```

### Domain Types

**`src/domains/plot/plot.types.ts` (добавление типа):**
```typescript
/**
 * @type UpdatePlotData
 * @domain plots
 * @description Данные для обновления участка
 *
 * @spec Все поля опциональны кроме cadstral_number, area, plot_number (проверка формата)
 */
export interface UpdatePlotData {
  cadstral_number?: string | null;
  area?: number;
  address?: string | null;
  note?: string | null;
}
```

### Domain Validators

**`src/domains/plot/plot.validators.ts` (добавление схемы):**
```typescript
export const updatePlotSchema = z.object({
  cadstral_number: z
    .string()
    .refine(
      (val) => !val || /^\d{2}:\d{2}:\d{7}:\d{3}$/.test(val),
      'Кадастровый номер должен соответствовать формату XX:XX:XXXXXXX:XXX'
    )
    .optional()
    .or(z.literal('').transform(() => null)),
  area: z.coerce.number().positive('Площадь должна быть больше 0').optional(),
  address: z.string().optional().or(z.literal('').transform(() => null)),
  note: z.string().optional().or(z.literal('').transform(() => null)),
}).partial();
```

### API

**`src/app/api/v1/plots/[id]/route.ts` (новый файл):**
```typescript
/**
 * @route GET /api/v1/plots/:id
 * @auth required
 * @description Возвращает участок по ID
 *
 * @response 200 { success: true, data: Plot }
 * @response 404 { success: false, error: { code: string, message: string } }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const service = createPlotService();
  try {
    const plot = await service.findById(params.id);
    return NextResponse.json({ success: true, data: plot });
  } catch (error) {
    // Error handling
  }
}

/**
 * @route PATCH /api/v1/plots/:id
 * @auth required
 * @description Обновляет данные участка
 *
 * @body UpdatePlotData
 * @response 200 { success: true, data: Plot }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 404 { success: false, error: { code: string, message: string } }
 * @response 409 { success: false, error: { code: string, message: string } }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const service = createPlotService();
  try {
    const body = await request.json();
    const plot = await service.update(params.id, body);
    return NextResponse.json({ success: true, data: plot });
  } catch (error) {
    // Error handling
  }
}
```

## Нефункциональные требования

| Требование | Описание |
|------------|----------|
| Производительность | Ответ сервера < 500 мс |
| Доступность | Все поля имеют `<label>`, ошибки связаны через `aria-describedby` |
| UX | Оптимистичное обновление таблицы после сохранения |
| Локализация | Все сообщения на русском языке |

## Открытые вопросы

| № | Вопрос | Статус |
|---|--------|--------|
| OQ-1 | Нужно ли логирование изменений (audit trail)? | Отложено — на следующей итерации |
| OQ-2 | Нужна ли история версий участка? | Отложено |

## История

| Дата | Изменение | Автор | Описание |
|------|-----------|-------|----------|
| 2026-07-02 | Создание | Architect | Первоначальная версия US-15 |

## Связанные User Stories

| US | Название | Зависимость |
|----|----------|------------|
| US-13 | Просмотр списка участков | Кнопка «Редактировать» в списке |
| US-14 | Регистрация участка | Переиспользует `PlotForm` |
| US-18 | Карточка участка | GET /:id нужен для карточки |
