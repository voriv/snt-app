# Prompt: Добавление нового функционального требования

> Шаблон для постановки задачи AI на добавление новой функциональности в проект snt-app.
> Заполни секции в квадратных скобках и отправь AI.

---

Мне нужно добавить новую функциональность: **[Опишите фичу кратко]**

## Исходные данные

- **Назначение:** [Краткое описание зачем это нужно]
- **Пользователи:** [Кто будет использовать: ADMIN / MEMBER / GUEST]
- **Входные данные:** [Что нужно на вход]
- **Выходные данные:** [Что должно получиться]
- **Бизнес-правила:** [Ограничения, проверки, логики]
- **Зависимости:** [Внешние библиотеки, если нужны]

---

## Инструкция для AI

Прочитай следующие контекстные сегменты перед предложением решения:

1. `docs/context-segments/02-database.md` — есть ли нужные сущности в БД
2. `docs/context-segments/04-component-patterns.md` — как создавать service/repository
3. `docs/context-segments/05-api-patterns.md` — как создавать endpoint
4. `docs/context-segments/03-auth-security.md` — какие нужны права доступа

---

## Задачи

### 1. Анализ существующей модели данных

- Есть ли нужные сущности или нужно создавать новые?
- Если новые — предложи структуру в формате DBML
- Проверь влияние на существующие связи

### 2. Обновление концептуальной модели

- Внести изменения в `specs/models/*.dbml` (если применимо)
- Обновить `specs/models/*.md` — описание сущностей и бизнес-правила
- Обновить `specs/models/relationships.md` — междоменные связи

### 3. Создание спецификации компонента

- Выбери тип компонента (service / repository / API router / UI component)
- Создай спецификацию в `docs/specs/components/` с метаданными и публичным API
- Используй JSDoc для всех публичных функций

### 4. Реализация компонентов

- **Service слой:** бизнес-логика, валидация через Zod, доменные ошибки
- **Repository слой:** интерфейс, Prisma реализация, транзакции
- **API Router:** валидация, Authorization, ApiResponse формат

### 5. Миграция БД

- Если нужны новые таблицы — предложи SQL миграции
- Проверь на уникальность, индексы, foreign keys
- Примени: `pnpm db:generate` → `pnpm db:migrate`

### 6. Тестирование

- Unit тесты для Service слоя (mock Repository)
- Проверь: `pnpm test`

### 7. Чек-лист качества

- Проверь соответствие всем правилам из `docs/shared/checklists.md`

---

## Ограничения

- **Clean Architecture:** API Router → Service → Repository → Prisma
- **TypeScript strict:** нет `any`, `unknown`-bypass, `ts-ignore`
- **Zod валидация:** на всех уровнях
- **Typed errors:** ValidationError, NotFoundError, ConflictError, BusinessRuleError
- **DI через конструктор:** Repository внедряется в Service
- **Repository абстракция:** Service не знает о Prisma напрямую
- **Нет глобального mutable state**
- **Новые зависимости** — только из `docs/shared/dependencies.md`
- **Новые чек-листы** — только в `docs/shared/checklists.md`
- **История изменений** — только в `docs/CHANGELOG.md`

---

## Ссылки для справки

| Что | Где |
|-----|-----|
| Навигация по документации | [`docs/quick-reference.md`](docs/quick-reference.md) |
| Архитектура (кратко) | [`docs/context-segments/01-architecture.md`](docs/context-segments/01-architecture.md) |
| Модель данных (кратко) | [`docs/context-segments/02-database.md`](docs/context-segments/02-database.md) |
| Безопасность (кратко) | [`docs/context-segments/03-auth-security.md`](docs/context-segments/03-auth-security.md) |
| Паттерны компонентов (кратко) | [`docs/context-segments/04-component-patterns.md`](docs/context-segments/04-component-patterns.md) |
| API паттерны (кратко) | [`docs/context-segments/05-api-patterns.md`](docs/context-segments/05-api-patterns.md) |
| WebSocket (кратко) | [`docs/context-segments/06-websocket.md`](docs/context-segments/06-websocket.md) |
| Управление изменениями спецификаций | [`docs/specs/spec-change-management.md`](docs/specs/spec-change-management.md) |
| Чек-листы | [`docs/shared/checklists.md`](docs/shared/checklists.md) |
| Разрешённые зависимости | [`docs/shared/dependencies.md`](docs/shared/dependencies.md) |