# План создания примеров компонентов

## Цель

Создать минимальные рабочие примеры ключевых паттернов Codebase для использования как reference при разработке и AI-контексте.

## Выбранные примеры (3 штуки)

| # | Пример | Связанные specs | Что иллюстрирует |
|---|--------|-----------------|------------------|
| 1 | `service-crud` | `service-component-requirements.md`, `repository-component-requirements.md` | DI через конструктор, Zod валидация, классы ошибок, CRUD паттерн |
| 2 | `api-router-auth` | `api-router-requirements.md`, `auth.md` | Middleware авторизации, единый формат ответов, error handling |
| 3 | `ui-component` | `ui-component-requirements.md`, `component-requirements.md` | Правило 50 строк, декомпозиция на подкомпоненты, custom hooks |

---

## Структура папки `examples/`

```
examples/
├── README.md                          # Введение и навигация
├── service-crud/                      # Пример 1: CRUD Service
│   ├── README.md                      # Описание паттерна
│   ├── plot.repository.interface.ts   # Repository интерфейс
│   ├── plot.repository.ts             # Repository реализация (Prisma)
│   ├── plot.input.schemas.ts          # Zod схемы валидации
│   ├── plot.service.ts                # Service с DI и бизнес-логикой
│   └── plot.types.ts                  # TypeScript типы
├── api-router-auth/                   # Пример 2: API Router с авторизацией
│   ├── README.md                      # Описание паттерна
│   ├── response.utils.ts              # Утилиты форматирования ответов
│   ├── auth.utils.ts                  # Middleware авторизации
│   └── plots.route.ts                 # Route файл с хендлерами
└── ui-component/                      # Пример 3: UI Компонент
    ├── README.md                      # Описание паттерна
    ├── PlotCard.tsx                   # Основной компонент (< 50 строк)
    ├── PlotCard.Header.tsx            # Подкомпонент Header
    ├── PlotCard.Body.tsx              # Подкомпонент Body
    ├── PlotCard.Footer.tsx            # Подкомпонент Footer
    └── usePlotActions.ts              # Custom hook для действий
```

---

## Детальное описание каждого примера

### 1. `service-crud` — CRUD Service паттерн

**Файлы:**

| Файл | Назначение | Ключевые паттерны |
|------|------------|-------------------|
| `plot.repository.interface.ts` | Интерфейс репозитория | Интерфейс отдельный от реализации, JSDoc аннотации |
| `plot.repository.ts` | Реализация через Prisma | Error mapping (Prisma codes → domain errors), try/catch |
| `plot.input.schemas.ts` | Zod схемы валидации | createSchema, updateSchema, listQuerySchema |
| `plot.service.ts` | Бизнес-логика | DI через конструктор, валидация входных данных, транзакции |
| `plot.types.ts` | TypeScript типы | Вынесенные interface для input/output |

**Ключевые моменты:**
- DI зависимостей через конструктор
- Zod валидация на входе сервисных методов
- Классы ошибок из `src/services/_lib/errors.ts` (ValidationError, NotFoundError, ConflictError, BusinessRuleError)
- JSDoc аннотации для всех публичных методов
- Разделение Repository интерфейс ↔ реализация

---

### 2. `api-router-auth` — API Router с авторизацией

**Файлы:**

| Файл | Назначение | Ключевые паттерны |
|------|------------|-------------------|
| `response.utils.ts` | Утилиты ответов | `successResponse()`, `errorResponse()` — единый формат |
| `auth.utils.ts` | Middleware авторизации | `requireAuth()`, `requireRole()` — проверка прав |
| `plots.route.ts` | Route файл | Handler функции, валидация query params, error handling |

**Ключевые моменты:**
- Единый формат успешных ответов `{ success: true, data: {...} }`
- Единый формат ошибок `{ success: false, error: { code, message } }`
- Middleware для проверки авторизации и ролей
- Zod валидация query parameters и request body
- Error handler конвертирует ServiceError в HTTP статус
- Пагинация: `page`, `limit`, `offset` параметры

---

### 3. `ui-component` — UI Компонент с декомпозицией

**Файлы:**

| Файл | Назначение | Ключевые паттерны |
|------|------------|-------------------|
| `PlotCard.tsx` | Основной компонент | Composition pattern, пропсы в подкомпоненты |
| `PlotCard.Header.tsx` | Header подкомпонент | < 50 строк, own styles |
| `PlotCard.Body.tsx` | Body подкомпонент | Display logic |
| `PlotCard.Footer.tsx` | Footer подкомпонент | Actions buttons |
| `usePlotActions.ts` | Custom hook | Side effects, API calls separation |

**Ключевые моменты:**
- Правило 50 строк — каждый подкомпонент < 50 строк
- Custom hook для всей логики действий (отделение side effects)
- Props интерфейсы с JSDoc
- A11y атрибуты (aria-labels, roles)
- Tailwind CSS стилизация
- Адаптивность (responsive breakpoints)

---

## Порядок создания

1. **`service-crud`** — базовый паттерн, остальные примеры зависят от него
2. **`api-router-auth`** — использует Service паттерн + добавляет авторизацию
3. **`ui-component`** — презентационный слой, независимый но демонстрирующий паттерны

---

## Соответствие требованиям specs

| Требование | Где реализовано |
|------------|-----------------|
| DI через конструктор | `plot.service.ts` — constructor dependency injection |
| Zod валидация | `plot.input.schemas.ts` — schemas для create/update |
| Классы ошибок | Использует `ServiceError`, `ValidationError`, `NotFoundError` |
| JSDoc аннотации | Все публичные функции и интерфейсы |
| Rule 50 lines | Все `.tsx` файлы < 50 строк |
| Разделение слоёв | Repository ↔ Service ↔ Handler/Component |
| TypeScript strict | No `any`, full type safety |

---

## Что НЕ включено (потому что минимальные примеры)

- ❌ Unit тесты
- ❌ E2E тесты
- ❌ Мок-объекты
- ❌ Полный цикл регистрации/входа (только авторизация middleware)
- ❌ WebSocket клиент
- ❌ File storage

---

## Следующий шаг

После утверждения этого плана — переключиться в **Code Mode** для создания файлов.
