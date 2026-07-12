# План реализации US-15: Удаление участка

## Метаданные

| Параметр | Значение |
|----------|----------|
| **US ID** | US-15 |
| **Название** | Удаление участка |
| **Статус** | [DONE] |
| **Дата создания** | 2026-07-10 |
| **Версия** | 1.0 |

## Ссылки

- **User Story:** `docs/user-stories/US-16-plot-deletion.md`
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
├── components/ui/
│   └── ConfirmDialog.tsx (существует)
└── app/dashboard/plots/
    └── page.tsx (существует)
```

## Задачи по слоям

### US-15-T1-DB: Проверка модели данных
- [x] **[DONE]** Модель Plot существует в `prisma/schema.prisma`
- [x] **[DONE]** Entity описание в `docs/model/entities/plot.md`
- [x] **[DONE]** DBML схема обновлена

### US-15-T2-TYPES: Доменные типы
- [x] **[DONE]** Типы в `src/domains/plot/plot.types.ts`:
  - `Plot` interface
  - `CreatePlotData` interface
  - `UpdatePlotData` interface
  - `PlotSearchFilters` interface

### US-15-T3-VALIDATORS: Zod-схемы
- [x] **[DONE]** Схемы в `src/domains/plot/plot.validators.ts`:
  - `createPlotSchema`
  - `updatePlotSchema`

### US-15-T4-ERRORS: Доменные ошибки
- [x] **[DONE]** Ошибки в `src/domains/plot/plot.errors.ts`:
  - `PlotNotFoundError`
  - `PlotDuplicateError`
  - `PlotInvalidDataError`

### US-15-T5-REPO: Репозиторий
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

### US-15-T6-SERVICE: Сервис
- [x] **[DONE]** Сервис в `src/domains/plot/plot.service.ts`:
  - `findAll(): Promise<Plot[]>`
  - `findById(id): Promise<Plot>`
  - `create(data): Promise<Plot>`
  - `update(id, data): Promise<Plot>`
  - `delete(id): Promise<void>` — с проверкой существования перед удалением
  - `search(filters): Promise<Plot[]>`

### US-15-T7-API: API Route Handler
- [x] **[DONE]** DELETE handler в `src/app/api/v1/plots/[id]/route.ts`:
  - DELETE /api/v1/plots/:id
  - Удаление участка
  - Возврат 204 No Content при успешном удалении
  - Обработка ошибок (404, 500)

### US-15-T8-UI: UI-компоненты
- [x] **[DONE]** Компонент ConfirmDialog в `src/components/ui/ConfirmDialog.tsx`:
  - Диалог подтверждения удаления
  - Сообщения на русском языке
  - Поддержка состояния загрузки

### US-15-T9-PAGE: Страница
- [x] **[DONE]** Страница в `src/app/dashboard/plots/page.tsx`:
  - Кнопка удаления на участке
  - Открытие ConfirmDialog
  - Обработка успешного удаления (обновление списка)
  - Обработка ошибок (404, сеть)
  - Показ сообщений об ошибках

## Матрица AC → Задачи

| AC ID | Описание | Задача | Статус |
|-------|----------|--------|--------|
| AC-4.1 | Подтверждение удаления | US-15-T8-UI, US-15-T9-PAGE | [DONE] |
| AC-4.2 | Подтверждение удаления | US-15-T6-SERVICE, US-15-T7-API, US-15-T9-PAGE | [DONE] |
| AC-4.3 | Отмена удаления | US-15-T9-PAGE | [DONE] |
| AC-4.4 | Оптимистичное обновление | US-15-T9-PAGE | [DONE] |
| AC-4.5 | Обработка ошибки удаления | US-15-T9-PAGE | [DONE] |

## Чек-лист валидации

- [x] **Type Check:** `npm run type-check` проходит без ошибок
- [x] **Lint:** `npm run lint` проходит без ошибок
- [x] **API Tests:** `npm run test` для API тестов проходят
- [x] **Component Tests:** Component тесты проходят
- [x] **E2E Tests:** E2E тесты проходят

## История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-10 | Architect | Создание плана реализации для US-15 |
| 2026-07-10 | Code | Реализация всех задач завершена |
