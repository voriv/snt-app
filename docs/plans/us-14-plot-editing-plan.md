# План реализации US-14: Редактирование участка

## Метаданные

| Параметр | Значение |
|----------|----------|
| **US ID** | US-14 |
| **Название** | Редактирование участка |
| **Статус** | [DONE] |
| **Дата создания** | 2026-07-10 |
| **Версия** | 1.0 |

## Ссылки

- **User Story:** `docs/user-stories/US-15-plot-editing.md`
- **Требования:** `docs/requirements/REQ-PLOT-001.md`
- **Модель данных:** `docs/model/entities/plot.md`

## Дерево файлов

```
src/
├── domains/plot/
│   ├── plot.types.ts (существует)
│   ├── plot.validators.ts (существует)
│   ├── plot.errors.ts (существует)
│   ├── plot.repository.interface.ts (существует)
│   ├── plot.repository.prisma.ts (существует)
│   ├── plot.service.ts (существует)
│   └── index.ts (существует)
├── app/api/v1/plots/[id]/
│   └── route.ts (существует)
├── components/features/plots/
│   ├── PlotForm.tsx (существует)
│   └── index.ts (существует)
└── app/dashboard/plots/
    └── page.tsx (существует)
```

## Задачи по слоям

### US-14-T1-DB: Проверка модели данных
- [x] **[DONE]** Модель Plot существует в `prisma/schema.prisma`
- [x] **[DONE]** Entity описание в `docs/model/entities/plot.md`
- [x] **[DONE]** DBML схема обновлена

### US-14-T2-TYPES: Доменные типы
- [x] **[DONE]** Типы в `src/domains/plot/plot.types.ts`:
  - `Plot` interface
  - `CreatePlotData` interface
  - `UpdatePlotData` interface (все поля опциональны)
  - `PlotSearchFilters` interface

### US-14-T3-VALIDATORS: Zod-схемы
- [x] **[DONE]** Схемы в `src/domains/plot/plot.validators.ts`:
  - `createPlotSchema`
  - `updatePlotSchema` (все поля опциональны)

### US-14-T4-ERRORS: Доменные ошибки
- [x] **[DONE]** Ошибки в `src/domains/plot/plot.errors.ts`:
  - `PlotNotFoundError`
  - `PlotDuplicateError`
  - `PlotInvalidDataError`

### US-14-T5-REPO: Репозиторий
- [x] **[DONE]** Интерфейс в `src/domains/plot/plot.repository.interface.ts`:
  - `findAll(): Promise<Plot[]>`
  - `findById(id): Promise<Plot | null>`
  - `findByPlotNumber(plotNumber): Promise<Plot | null>`
  - `create(data): Promise<Plot>`
  - `update(id, data): Promise<Plot>` (исключает plotNumber)
  - `delete(id): Promise<void>`
  - `existsByCadastralNumber(cadastralNumber): Promise<boolean>`
  - `existsByCadastralNumberExcludingId(cadastralNumber, excludeId): Promise<boolean>`
  - `search(filters): Promise<Plot[]>`
- [x] **[DONE]** Реализация в `src/domains/plot/plot.repository.prisma.ts`

### US-14-T6-SERVICE: Сервис
- [x] **[DONE]** Сервис в `src/domains/plot/plot.service.ts`:
  - `findAll(): Promise<Plot[]>`
  - `findById(id): Promise<Plot>`
  - `create(data): Promise<Plot>`
  - `update(id, data): Promise<Plot>` — исключает plotNumber, проверяет уникальность cadastralNumber
  - `delete(id): Promise<void>`
  - `search(filters): Promise<Plot[]>`

### US-14-T7-API: API Route Handler
- [x] **[DONE]** PATCH handler в `src/app/api/v1/plots/[id]/route.ts`:
  - PATCH /api/v1/plots/:id
  - Обновление участка
  - Исключение plotNumber из данных
  - Обработка ошибок валидации (400)
  - Обработка дубликатов (409)

### US-14-T8-UI: UI-компоненты
- [x] **[DONE]** Компонент PlotForm в `src/components/features/plots/PlotForm.tsx`:
  - Форма с валидацией
  - Режим редактирования (edit)
  - Поле plotNumber только для чтения
  - Поля: cadastralNumber, area, address, note

### US-14-T9-PAGE: Страница
- [x] **[DONE]** Страница в `src/app/dashboard/plots/page.tsx`:
  - Inline редактирование через PlotForm
  - Обработка успешного обновления
  - Обработка ошибок (дубликат, валидация)
  - Обновление списка после обновления

## Матрица AC → Задачи

| AC ID | Описание | Задача | Статус |
|-------|----------|--------|--------|
| AC-3.1 | Начало редактирования | US-14-T8-UI, US-14-T9-PAGE | [DONE] |
| AC-3.2 | Обновление данных участка | US-14-T6-SERVICE, US-14-T8-UI | [DONE] |
| AC-3.3 | Номер участка неизменяем | US-14-T6-SERVICE, US-14-T8-UI | [DONE] |
| AC-3.4 | Валидация при обновлении | US-14-T3-VALIDATORS, US-14-T6-SERVICE | [DONE] |
| AC-3.5 | Проверка уникальности cadastralNumber | US-14-T5-REPO, US-14-T6-SERVICE | [DONE] |

## Чек-лист валидации

- [x] **Type Check:** `npm run type-check` проходит без ошибок
- [x] **Lint:** `npm run lint` проходит без ошибок
- [x] **API Tests:** `npm run test` для API тестов проходят
- [x] **Component Tests:** Component тесты проходят
- [x] **E2E Tests:** E2E тесты проходят

## История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-10 | Architect | Создание плана реализации для US-14 |
| 2026-07-10 | Code | Реализация всех задач завершена |
