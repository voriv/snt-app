# Code Review Checklist

## Общее

- [ ] Код следует принципам Clean Architecture / Layered Architecture
- [ ] Используется Dependency Injection (сервисы зависят от интерфейсов, а не реализаций)
- [ ] Нет глобальных мутабельных переменных
- [ ] Все ошибки обрабатываются явно (нет `any`, игнорированных `Promise`, пустых `catch`)

## Требования к режимам

### 🏗️ Architect Mode

- **Редактирует:** только `.md` файлы
- **Может создавать:** спецификации, документацию, правила, User Stories
- **НЕ создает:** код (TypeScript, конфигурационные файлы, Prisma schema)

### 💻 Code Mode

- **Редактирует:** любые файлы с кодом (`.ts`, `.tsx`, `.js`, `.json`, `.prisma`, конфигурационные файлы)
- **Создает:** реализации сервисов, репозиториев, компонентов, API handlers
- **НЕ меняет:** архитектурные решения без согласования в Architect Mode

### 🪲 Debug Mode

- **Используется для:** анализа ошибок, добавления логирования, отладки
- **Добавляет:** консольный логирование, временные исправления

---

## Проверка спецификаций (SDD)

### L1: Code-Spec (JSDoc в коде)

- [ ] Все публичные методы/классы имеют JSDoc аннотации
- [ ] Аннотации содержат `@param`, `@returns`, `@throws` (где применимо)
- [ ] Аннотации содержат `@spec` с описанием ключевых инвариантов
- [ ] Аннотации описывают все варианты ошибок

### L2: User Story (docs/user-stories/*.md)

- [ ] User Story содержит четкое описание функциональности
- [ ] Есть акцептанс-критерии (AC-1, AC-2, ... с Given/When/Then)
- [ ] Описаны граничные случаи (Edge Cases)
- [ ] Описана обработка ошибок
- [ ] Описано влияние на слои архитектуры

### Синхронизация L1 ↔ L2

- [ ] JSDoc аннотации соответствуют требованиям User Story
- [ ] При изменении требований обновлены и L1, и L2 в одном PR

---

## Работа с данными (Model Layer)

### Модель данных

- [ ] Изменения в модели начинаются с `docs/model/schema.dbml`
- [ ] Обновлен `docs/model/entities/<entity>.md`
- [ ] Обновлен `prisma/schema.prisma` с использованием `@map()` для snake_case
- [ ] Создана миграция через `npx prisma migrate dev`
- [ ] Обновлены доменные типы в `<domain>.types.ts`
- [ ] Обновлены репозитории
- [ ] Обновлены сервисы
- [ ] Обновлены API Route Handlers

### Конвенции именования

| Слой | Стиль | Пример |
|------|-------|--------|
| БД (PostgreSQL) | `snake_case` | `user_id`, `created_at` |
| Prisma Schema | `camelCase` с `@map()` | `userId @map("user_id")` |
| TypeScript | `camelCase` | `userId`, `createdAt` |
| API JSON | `camelCase` | `userId`, `createdAt` |

---

## Валидация (Zod)

- [ ] Используется единый подход к обработке опциональных полей
- [ ] Пустые строки преобразуются в `null` (где требуется)
- [ ] Все сообщения об ошибках на русском языке
- [ ] Ограничения (min/max) указаны в сообщениях ошибок

### Шаблон опционального поля

```typescript
/**
 * @description Опциональное строковое поле
 * @spec - nullable: true
 * - transform: empty string → null
 */
export function createOptionalString(
  description: string
): z.ZodOptional<z.ZodString> {
  return z
    .string()
    .min(2, `${description} должно содержать минимум 2 символа`)
    .max(50, `${description} не может превышать 50 символов`)
    .optional()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : val));
}
```

---

## API Layer

### Route Handlers

- [ ] Используют `auth()` для проверки сессии
- [ ] Обрабатывают ошибки через `instanceof BaseError`
- [ ] Возвращают стандартизированный формат: `{ success: true/false, data?, error? }`
- [ ] Используют DI-контейнер для получения сервисов
- [ ] Не содержат бизнес-логики (только вызов сервисов)

### API Client

- [ ] Используется `apiClient` вместо `fetch()` в компонентах
- [ ] Используется `POSTFormData` для загрузки файлов
- [ ] Обрабатываются все статусы ответа (200, 201, 400, 401, 404, 500)

---

## Frontend Components

### Client Components

- [ ] Все страницы являются Client Components с `'use client'`
- [ ] Использование `useSession()` для проверки авторизации
- [ ] Обработка состояний: `loading`, `error`, `data`
- [ ] Отправка данных через `apiClient`
- [ ] Блокировка кнопок при `isLoading`
- [ ] Использование `EmptyState` для пустых списков

### Страницы

- [ ] Все страницы используют `useSession()` вместо `getServerSideProps`
- [ ] Обработка редиректа при отсутствии сессии (через `router.replace`)
- [ ] JSDoc аннотация с `@page`, `@auth`, `@role`, `@spec`, `@data-flow`

---

## Типовая цепочка запроса

```
Page → UI Component → apiClient → API Route Handler → Service → Repository → DB
```

- [ ] Проверено соответствие цепочки для каждой фичи
- [ ] Нет обходных путей (например, прямой fetch в компоненте)

---

## Тестирование

- [ ] Написаны unit-тесты для Service-слоя
- [ ] Тесты покрывают граничные случаи из User Story
- [ ] Repository мокается через интерфейс
- [ ] Сервисы не мокаются при тестировании API Handlers

---

## Команда для проверки

```bash
npm run type-check      # Проверка типов
npm run lint            # Линтинг
npm run test            # Запуск тестов
```
