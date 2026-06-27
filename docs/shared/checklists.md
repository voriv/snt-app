# Чек-листы для компонентов проекта

## Навигация

| Компонент | Чек-лист |
|-----------|----------|
| [Repository](#1-repository) | [`repository-requirements-lite.md`](../specs-lite/repository-requirements-lite.md) |
| [Service](#2-service) | [`service-requirements-lite.md`](../specs-lite/service-requirements-lite.md) |
| [API Router](#3-api-router) | [`api-router-requirements-lite.md`](../specs-lite/api-router-requirements-lite.md) |
| [UI Component](#4-ui-component) | [`ui-requirements-lite.md`](../specs-lite/ui-requirements-lite.md) |

---

## 1. Repository

### Пред-реализация

- [ ] Интерфейс определён в `src/repositories/<name>.interface.ts`
- [ ] Интерфейс назван `<Entity>RepositoryInterface` или `<Entity>Repository`
- [ ] Все методы возвращают `Promise`
- [ ] Зависимости от ORM скрыты внутри реализации

### Во время реализации

- [ ] Реализация в `src/repositories/<name>.ts`
- [ ] Ошибки базы преобразованы в `RepositoryError` / `UniqueConstraintError`
- [ ] Данные возвращаются как чистые объекты (без методов ORM)
- [ ] Маппинг полей (camelCase ↔ snake_case) внутри Repository
- [ ] Поддержка `TransactionClient` для транзакций

### После реализации

- [ ] JSDoc для каждого публичного метода
- [ ] Интерфейс протестирован
- [ ] Спецификация обновлена (если есть)

---

## 2. Service

### Пред-реализация

- [ ] Интерфейс сервиса определён (опционально)
- [ ] Zod-схемы валидации определены
- [ ] Бизнес-правила описаны в спецификации

### Во время реализации

- [ ] DI через конструктор (Repository инжектируется)
- [ ] Валидация входных данных через Zod
- [ ] Бизнес-правила реализованы явно
- [ ] Ошибки: `ValidationError`, `NotFoundError`, `ConflictError`
- [ ] Нет вызовов Prisma напрямую — только через Repository
- [ ] Транзакции через `Repository.transaction()`

### После реализации

- [ ] JSDoc с `@example` для каждого публичного метода
- [ ] Unit-тесты (≥80% покрытие)
- [ ] Mock Repository через `vi.fn()`, не Prisma

---

## 3. API Router

### Пред-реализация

- [ ] Zod-схема для входящих данных определена
- [ ] Права доступа определены (кто может вызывать)
- [ ] Ответы описаны (status codes, body)

### Во время реализации

- [ ] Валидация через Zod: `safeParse()`
- [ ] Обработка ошибок: `try/catch`
- [ ] Используется `apiResponse.success()` / `apiResponse.error()`
- [ ] Аутентификация: `requireAuth()` или `getServerSession()`
- [ ] Нет бизнес-логики — только вызов сервиса

### После реализации

- [ ] JSDoc для каждого метода (GET, POST, PUT, DELETE)
- [ ] Все status codes покрыты
- [ ] Спецификация обновлена

---

## 4. UI Component

### Пред-реализация

- [ ] Интерфейс Props определён
- [ ] Слоты/children описаны
- [ ] События (callbacks) определены

### Во время реализации

- [ ] `'use client'` для Client Components
- [ ] PascalCase для имени компонента
- [ ] Primary export = имя компонента
- [ ] Используется `cn()` для условных классов
- [ ] Компонент ≤50 строк (при необходимости — декомпозиция)
- [ ] ARIA атрибуты для доступности

### После реализации

- [ ] JSDoc с `@example` (JSX пример)
- [ ] Абсолютные импорты (`@/lib/...`, `@/components/...`)
- [ ] Спецификация обновлена
