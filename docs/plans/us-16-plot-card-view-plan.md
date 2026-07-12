# План реализации US-16: Просмотр карточки участка

## Метаданные

| Параметр | Значение |
|----------|----------|
| **US ID** | US-16 |
| **Название** | Просмотр карточки участка |
| **Статус** | [DONE] |
| **Дата создания** | 2026-07-10 |
| **Версия** | 1.0 |

## Ссылки

- **User Story:** `docs/user-stories/US-17-plot-card-view.md`
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
└── app/dashboard/plots/[id]/
    └── page.tsx (существует)
```

## Задачи по слоям

### US-16-T1-DB: Проверка модели данных
- [x] **[DONE]** Модель Plot существует в `prisma/schema.prisma`
- [x] **[DONE]** Entity описание в `docs/model/entities/plot.md`
- [x] **[DONE]** DBML схема обновлена

### US-16-T2-TYPES: Доменные типы
- [x] **[DONE]** Типы в `src/domains/plot/plot.types.ts`:
  - `Plot` interface

### US-16-T3-VALIDATORS: Zod-схемы
- [x] **[DONE]** Схемы в `src/domains/plot/plot.validators.ts`:
  - `createPlotSchema`
  - `updatePlotSchema`

### US-16-T4-ERRORS: Доменные ошибки
- [x] **[DONE]** Ошибки в `src/domains/plot/plot.errors.ts`:
  - `PlotNotFoundError`
  - `PlotDuplicateError`
  - `PlotInvalidDataError`

### US-16-T5-REPO: Репозиторий
- [x] **[DONE]** Интерфейс в `src/domains/plot/plot.repository.interface.ts`:
  - `findAll(): Promise<Plot[]>`
  - `findById(id): Promise<Plot | null>`
- [x] **[DONE]** Реализация в `src/domains/plot/plot.repository.prisma.ts`

### US-16-T6-SERVICE: Сервис
- [x] **[DONE]** Сервис в `src/domains/plot/plot.service.ts`:
  - `findById(id): Promise<Plot>` — с проверкой существования

### US-16-T7-API: API Route Handler
- [x] **[DONE]** GET handler в `src/app/api/v1/plots/[id]/route.ts`:
  - GET /api/v1/plots/:id
  - Возвращает участок по ID
  - Обработка 404 при отсутствии

### US-16-T8-UI: UI-компоненты
- [x] **[DONE]** Компонент PlotForm в `src/components/features/plots/PlotForm.tsx`:
  - Режим редактирования (edit)
  - Поле plotNumber только для чтения

### US-16-T9-PAGE: Страница
- [x] **[DONE]** Страница в `src/app/dashboard/plots/[id]/page.tsx`:
  - Client Component с 'use client'
  - Загрузка данных по ID из URL params
  - Обработка состояний: loading, error, not found
  - Отображение полной информации об участке
  - Форма редактирования с заблокированным номером участка
  - Кнопка возврата к списку

## Матрица AC → Задачи

| AC ID | Описание | Задача | Статус |
|-------|----------|--------|--------|
| AC-5.1 | Страница деталей участка | US-16-T9-PAGE | [DONE] |
| AC-5.2 | Отображение всех полей участка | US-16-T8-UI, US-16-T9-PAGE | [DONE] |
| AC-5.3 | Номер участка только для чтения | US-16-T8-UI | [DONE] |
| AC-5.4 | Переход на страницу деталей | US-16-T9-PAGE (навигация из списка) | [DONE] |
| AC-5.5 | Обработка отсутствия участка | US-16-T9-PAGE | [DONE] |

## Чек-лист валидации

- [x] **Type Check:** `npm run type-check` проходит без ошибок
- [x] **Lint:** `npm run lint` проходит без ошибок
- [x] **API Tests:** `npm run test` для API тестов проходят
- [x] **Component Tests:** Component тесты проходят
- [x] **E2E Tests:** E2E тесты проходят

## История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-10 | Architect | Создание плана реализации для US-16 |
| 2026-07-10 | Code | Реализация всех задач завершена |
