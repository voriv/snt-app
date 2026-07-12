# Конвенции именования

## Обзор

Этот документ описывает конвенции именования, используемые в проекте СНТ Березки НТ.

## Таблица соответствий

| Слой | Стиль | Пример | Описание |
|------|-------|--------|----------|
| **База данных (PostgreSQL)** | `snake_case` | `user_id`, `created_at` | Имена таблиц и колонок в БД |
| **Prisma Schema** | `camelCase` | `userId`, `createdAt` | Имена моделей и полей в Prisma схеме |
| **Prisma Client (TS)** | `camelCase` | `user.userId`, `createdAt` | Поля в сгенерированном клиенте Prisma |
| **TypeScript домен** | `camelCase` | `userId`, `createdAt` | Типы в доменных слоях |
| **API JSON** | `camelCase` | `userId`, `createdAt` | Поля в JSON ответах API |

## Имена таблиц

Все имена таблиц в базе данных используют `snake_case`:

| Таблица | Описание |
|---------|----------|
| `users` | Пользователи системы |
| `plots` | Участки СНТ |
| `roles` | Настраиваемый реестр ролей (RBAC) |
| `user_roles` | Связь M:N users↔roles |
| `pages` | Реестр страниц приложения |
| `api_endpoints` | Реестр API endpoints с категориями доступа |
| `role_pages` | Связь M:N roles↔pages |
| `role_api_endpoints` | Связь M:N roles↔api_endpoints |
| `access_config_version` | Глобальная версия конфигурации доступа (инвалидация сессий) |

## Правила именования полей

### Идентификаторы
- Первичный ключ: `id` (String, cuid)
- Внешний ключ: `<ref>_id` (например, `user_id`, `member_id`, `plot_id`)

### Стандартные поля
- `created_at` - дата создания записи (DateTime)
- `updated_at` - дата последнего обновления (DateTime)

### Имена полей
- Использование `snake_case` для всех полей в БД
- Отрицательные/булевы значения: `is_`, `has_`, `can_` префиксы
- Даты: поле `date` + суффикс (`start_date`, `end_date`)
- Числовые значения: явное указание (`amount`, `area`, `price`)

## Примеры преобразований

### От БД к TypeScript

```
БД (snake_case)        →   Prisma/TS (camelCase)
─────────────────────────────────────────────────
user_id                →   userId
created_at             →   createdAt
first_name             →   firstName
last_name              →   lastName
is_active              →   isActive
member_id              →   memberId
plot_number            →   plotNumber
start_date             →   startDate
end_date               →   endDate
```

### Пример сущности

| БД | Prisma | TS Домен | API JSON |
|----|--------|----------|----------|
| `members` | `Member` | `Member` | `members` |
| `user_id` | `userId` | `userId: string` | `userId` |
| `created_at` | `createdAt` | `createdAt: Date` | `createdAt` |

## Типы данных

| Тип БД | Тип Prisma | Тип TS | Описание |
|--------|------------|--------|----------|
| `varchar` | `String` | `string` | Строка |
| `text` | `String` | `string` | Текстовое поле |
| `integer` | `Int` | `number` | Целое число |
| `decimal` | `Decimal` | `number` | Число с плавающей точкой |
| `boolean` | `Boolean` | `boolean` | Булево значение |
| `timestamp` | `DateTime` | `Date` | Дата и время |
| `uuid` | `String` | `string` | UUID идентификатор |

## Enums

> Примечание: enum `Role` (GUEST, MEMBER, ADMIN) **удалён** в рамках US-8. Роли теперь хранятся в таблице `roles` как настраиваемый реестр. Системные роли (SUPER_ADMIN, ADMIN, MEMBER, GUEST) создаются при миграции с `is_system = true`.


## Практические рекомендации

1. **При проектировании новой таблицы:**
   - Определите имена полей в snake_case для БД
   - Используйте `@map` для маппинга на snake_case в Prisma
   - Переведите в camelCase при создании TypeScript типов

2. **При написании запросов Prisma:**
   - Используйте camelCase имена полей в коде
   - Prisma автоматически конвертирует в snake_case для БД

3. **При создании API:**
   - Используйте camelCase в JSON запросах и ответах
   - Сервисный слой работает с doменными типами (camelCase)

4. **При работе с датами:**
   - В БД: `created_at`, `updated_at`
   - В коде: `createdAt`, `updatedAt`
