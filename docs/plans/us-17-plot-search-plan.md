# План реализации US-17: Поиск участков

## Метаданные

| Параметр | Значение |
|----------|----------|
| **US ID** | US-17 |
| **Название** | Поиск участков |
| **Статус** | [DONE] |
| **Дата создания** | 2026-07-10 |
| **Версия** | 1.0 |

## Ссылки

- **User Story:** `docs/user-stories/US-18-plot-search.md`
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
├── app/api/v1/plots/search/
│   └── route.ts (существует)
├── components/features/plots/
│   ├── PlotSearch.tsx (существует)
│   └── index.ts (существует)
└── app/dashboard/plots/
    └── page.tsx (существует)
```

## Задачи по слоям

### US-17-T1-DB: Проверка модели данных
- [x] **[DONE]** Модель Plot существует в `prisma/schema.prisma`
- [x] **[DONE]** Entity описание в `docs/model/entities/plot.md`
- [x] **[DONE]** DBML схема обновлена

### US-17-T2-TYPES: Доменные типы
- [x] **[DONE]** Типы в `src/domains/plot/plot.types.ts`:
  - `PlotSearchFilters` interface

### US-17-T3-VALIDATORS: Zod-схемы
- [x] **[DONE]** Валидация фильтров (опциональная, валидация в сервисе)

### US-17-T4-ERRORS: Доменные ошибки
- [x] **[DONE]** Ошибки в `src/domains/plot/plot.errors.ts`:
  - `PlotNotFoundError`
  - `PlotDuplicateError`
  - `PlotInvalidDataError`

### US-17-T5-REPO: Репозиторий
- [x] **[DONE]** Интерфейс в `src/domains/plot/plot.repository.interface.ts`:
  - `search(filters): Promise<Plot[]>`
- [x] **[DONE]** Реализация в `src/domains/plot/plot.repository.prisma.ts`:
  - Поиск с ILIKE для частичного совпадения
  - Case-insensitive поиск
  - Обрезка длинных запросов
  - Сортировка по plotNumber ASC

### US-17-T6-SERVICE: Сервис
- [x] **[DONE]** Сервис в `src/domains/plot/plot.service.ts`:
  - `search(filters): Promise<Plot[]>` — фильтрация по number, cadastral, note

### US-17-T7-API: API Route Handler
- [x] **[DONE]** GET handler в `src/app/api/v1/plots/search/route.ts`:
  - GET /api/v1/plots/search
  - Получение query параметров
  - Возврат списка найденных участков

### US-17-T8-UI: UI-компоненты
- [x] **[DONE]** Компонент PlotSearch в `src/components/features/plots/PlotSearch.tsx`:
  - Поля поиска: number, cadastral, note
  - Автоматический поиск при вводе
  - Кнопка сброса фильтров

### US-17-T9-PAGE: Страница
- [x] **[DONE]** Страница в `src/app/dashboard/plots/page.tsx`:
  - Интеграция PlotSearch
  - Отображение результатов поиска
  - Сброс поиска при очистке фильтров
  - Возврат полного списка после сброса

## Матрица AC → Задачи

| AC ID | Описание | Задача | Статус |
|-------|----------|--------|--------|
| AC-6.1 | Поиск по номеру участка | US-17-T5-REPO, US-17-T6-SERVICE, US-17-T8-UI | [DONE] |
| AC-6.2 | Поиск по кадастровому номеру | US-17-T5-REPO, US-17-T6-SERVICE, US-17-T8-UI | [DONE] |
| AC-6.3 | Поиск по примечанию | US-17-T5-REPO, US-17-T6-SERVICE, US-17-T8-UI | [DONE] |
| AC-6.4 | Комбинированный поиск | US-17-T5-REPO, US-17-T6-SERVICE | [DONE] |
| AC-6.5 | Сброс поиска | US-17-T8-UI, US-17-T9-PAGE | [DONE] |
| AC-6.6 | Пустой поиск | US-17-T9-PAGE | [DONE] |

## Чек-лист валидации

- [x] **Type Check:** `npm run type-check` проходит без ошибок
- [x] **Lint:** `npm run lint` проходит без ошибок
- [x] **API Tests:** `npm run test` для API тестов проходят
- [x] **Component Tests:** Component тесты проходят
- [x] **E2E Tests:** E2E тесты проходят

## История изменений

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-07-10 | Architect | Создание плана реализации для US-17 |
| 2026-07-10 | Code | Реализация всех задач завершена |
