# План реализации US-13: Создание участка

## Метаданные

| Параметр | Значение |
|----------|----------|
| **US ID** | US-13 |
| **Название** | Создание участка |
| **Статус** | [DONE] |
| **Дата создания** | 2026-07-10 |
| **Версия** | 1.0 |

## Ссылки

- **User Story:** `docs/user-stories/US-14-plot-creation.md`
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
├── app/api/v1/plots/
│   └── route.ts (существует)
├── components/features/plots/
│   ├── PlotForm.tsx (существует)
│   ├── PlotFormModal.tsx (существует)
│   └── index.ts (существует)
└── app/dashboard/plots/
    └── page.tsx (существует)
```

## Задачи по слоям

### US-13-T1-DB: Проверка модели данных
- [x] **[DONE]** Модель Plot существует в `prisma/schema.prisma`
- [x] **[DONE]** Entity описание в `docs/model/entities/plot.md`
- [x] **[DONE]** DBML схема обновлена

### US-13-T2-TYPES: Доменные типы
- [x] **[DONE]** Типы в `src/domains/plot/plot.types.ts`:
  - `Plot` interface
  - `CreatePlotData` interface
  - `UpdatePlotData` interface
  - `PlotSearchFilters` interface

### US-13-T3-VALIDATORS: Zod-схемы
- [x] **[DONE]** Схемы в `src/domains/plot/plot.validators.ts`:
  - `createPlotSchema`
  - `updatePlotSchema`

### US-13-T4-ERRORS: Доменные ошибки
- [x] **[DONE]** Ошибки в `src/domains/plot/plot.errors.ts`:
  - `PlotNotFoundError`
  - `PlotDuplicateError`
  - `PlotInvalidDataError`

### US-13-T5-REPO: Репозиторий
- [x] **[DONE]** Интерфейс в `src/domains/plot/plot.repository.interface.ts`:
  - `findAll(): Promise<Plot[]>`
  - `findById(id): Promise<Plot | null>`
  - `findByPlotNumber(plotNumber): Promise<Plot | null>`
  - `create(data): Promise<Plot>`
  - `update(id, data): Promise<Plot>`
  - `delete(id): Promise<void>`
  - `existsByCadastralNumber(cadastralNumber): Promise<boolean>`
  - `existsByCadastralNumberExcludingId(cadastralNumber, excludeId): Promise<boolean>`
  - `search(filters): Promise<Plot[]>`
- [x] **[DONE]** Реализация в `src/domains/plot/plot.repository.prisma.ts`

### US-13-T6-SERVICE: Сервис
- [x] **[DONE]** Сервис в `src/domains/plot/plot.service.ts`:
  - `findAll(): Promise<Plot[]>`
  - `findById(id): Promise<Plot>`
  - `create(data): Promise<Plot>` — с валидацией и проверкой уникальности
  - `update(id, data): Promise<Plot>`
  - `delete(id): Promise<void>`
  - `search(filters): Promise<Plot[]>`

### US-13-T7-API: API Route Handler
- [x] **[DONE]** POST handler в `src/app/api/v1/plots/route.ts`:
  - POST /api/v1/plots
  - Создание нового участка
  - Обработка дубликатов (409)
  - Обработка ошибок валидации (400)

### US-13-T8-UI: UI-компоненты
- [x] **[DONE]** Компонент PlotForm в `src/components/features/plots/PlotForm.tsx`:
  - Форма с валидацией
  - Поля: plotNumber, cadastralNumber, area, address, note
- [x] **[DONE]** Компонент PlotFormModal в `src/components/features/plots/PlotFormModal.tsx`:
  - Модальное окно создания участка
  - Интеграция с PlotForm

### US-13-T9-PAGE: Страница
- [x] **[DONE]** Страница в `src/app/dashboard/plots/page.tsx`:
  - Открытие модального окна создания
  - Обработка успешного создания
  - Обновление списка после создания

## Матрица AC → Задачи

| AC ID | Описание | Задача | Статус |
|-------|----------|--------|--------|
| AC-2.1 | Создание участка с минимальными данными | US-13-T6-SERVICE, US-13-T8-UI | [DONE] |
| AC-2.2 | Валидация уникальности номера участка | US-13-T5-REPO, US-13-T6-SERVICE | [DONE] |
| AC-2.3 | Валидация уникальности кадастрового номера | US-13-T5-REPO, US-13-T6-SERVICE | [DONE] |
| AC-2.4 | Валидация формата кадастрового номера | US-13-T3-VALIDATORS | [DONE] |
| AC-2.5 | Валидация обязательных полей | US-13-T3-VALIDATORS | [DONE] |

## Чек-лист валидации

- [x] **Type Check:** `npm run type-check` проходит без ошибок
- [x] **Lint:** `npm run lint` проходит без ошибок
- [x] **API Tests:** `npm run test` для API тестов проходят
- [x] **Component Tests:** Component тесты проходят
- [x] **E2E Tests:** E2E тесты проходят

## История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-10 | Architect | Создание плана реализации для US-13 |
| 2026-07-10 | Code | Реализация всех задач завершена |
