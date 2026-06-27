# Требования к Repository компонентам

## Статус: На обсуждении

---

## 0. Общие положения

Настоящий документ определяет единые требования к созданию, именованию, структуре, интерфейсам и самодокументированию **Repository компонентов** (Data Access Layer) проекта.

Repository слой выступает изолированным мостом между бизнес-логикой (Service слой) и базой данных. Его главная задача — абстрагировать физическое хранение данных и обеспечить предсказуемый интерфейс доступа к сущностям.

### 0.1 Связанные документы

| Документ | Назначение |
|----------|------------|
| [`.roo/rules/architecture.md`](../../../../.roo/rules/architecture.md) | Архитектурные правила, специфика Clean Architecture |
| [`.roo/rules/change-rules.md`](../../../../.roo/rules/change-rules.md) | Порядок внесения изменений |
| [`docs/specs/components/component-requirements.md`](../component-requirements.md) | Общие требования к компонентам проекта |
| [`docs/specs/components/services/service-component-requirements.md`](../services/service-component-requirements.md) | Требования к Service компонентам |

### 0.2 Принципы разработки

1. **Изоляция данных (Dependency Inversion).** Service слои зависят от *абстракций* (интерфейсов Repository), а не от конкретной реализации. Прямое использование ORM (Prisma, TypeORM и др.) в сервисах **запрещено**.
2. **Чистые интерфейсы.** Интерфейсы Repository описывают *что* мы получаем (Domain-объекты или DTO), а не *как* это хранится.
3. **Безопасность.** Строгая типизация и защита от SQL-инъекций.
4. **Управление транзакциями.** Repository предоставляет явные механизмы для работы в рамках транзакций.
5. **Spec-Driven Development.** Создание и изменение репозиториев начинается с обновления соответствующих спецификаций в `specs/models/`.

---

## 1. Архитектура и расположение

### 1.1 Структура директорий

Рекомендуемая структура слоя репозиториев:

```
src/repositories/
├── index.ts                  # Barrel exports (интерфейсы + factory)
├── <entity>-repository.ts    # Интерфейс репозитория (контракт)
├── _types/                   # Общие типы репозиториев (пагинация и т.д.)
│   └── pagination.ts
├── _lib/                     # Общее (ошибки, утилиты)
│   └── errors.ts
└── _impl/                    # Конкретные реализации (скрыты от внешних сущностей)
    ├── index.ts              # Импорт реализаций
    ├── base-repository.ts    # Базовый класс
    ├── <entity>-repository-impl.ts  # Реализация через ORM/DB
    └── raw-queries.ts        # Хелперы для сырых SQL запросов
```

### 1.2 Разделение слоев

| Файл | Назначение | Доступ из Service |
|------|------------|-------------------|
| `<entity>-repository.ts` | Интерфейс | **Да** (через `import type`) |
| `_impl/*.ts` | Реализация | **Нет** (скрыто) |
| `index.ts` | Экспорты | **Да** (Factory и Интерфейсы) |

> ⚠️ Service слой должен импортировать только интерфейс. Реализация внедряется через контейнер зависимостей или Factory-функцию в точках входа (Controllers/Hooks).

---

## 2. Интерфейсы

### 2.1 Общие правила

1. Каждый домен (сущность) имеет свой интерфейс, суффикс которого `-Repository`.
2. Все публичные методы асинхронны (`Promise<T>`).
3. Методы не должны возвращать специфичные типы ORM (например, `Prisma.PlotInclude`). Возвращаемые типы — это Чистые Domain-объекты или DTO.

### 2.2 Структура интерфейса

```typescript
// src/repositories/<entity>-repository.ts

import type { Entity } from '@/types';
import type { PaginationOptions } from './_types/pagination';

export interface CreateEntityData {
  field1: string;
  field2: number;
  // ... поля для создания
}

export interface UpdateEntityData extends Partial<CreateEntityData> {
  id: string;
}

/**
 * Интерфейс репозитория для работы с сущностью.
 *
 * @remarks
 * Контракт для доступа к данным. Реализация не должна зависеть от бизнес-логики.
 */
export interface EntityRepository {
  /** Создать новую запись */
  create(data: CreateEntityData): Promise<Entity>;

  /** Найти по первичному ключу */
  findById(id: string): Promise<Entity | null>;

  /** Найти по уникальному полю */
  findByUniqueField(field: string): Promise<Entity | null>;

  /** Найти записи с пагинацией */
  findAll(query: PaginationOptions): Promise<PaginatedResult<Entity>>;

  /** Обновить существующую запись */
  update(id: string, data: Partial<CreateEntityData>): Promise<Entity>;

  /** Удалить запись */
  delete(id: string): Promise<void>;

  /** Проверка существования/уникальности */
  exists(field: string, value: string): Promise<boolean>;
}
```

### 2.3 Расширенные методы (Relations)

Если необходимо загрузить связанные сущности, методы именуются по паттерну `find...With...`.

```typescript
export interface EntityRepository {
  // ...
  /** Найти сущность с предзагруженными связями */
  findByIdWithRelations(id: string): Promise<EntityWithRelations | null>;
}
```

---

## 3. Реализация

### 3.1 Общие требования

1. **Копирование данных.** Запрещено возвращать объекты ORM напрямую, если они содержат методы ORM. Использовать `toObject()`, `Object.assign()` или явное маппирование в чистые объекты.
2. **Mapping.** Если ORM возвращает объект, отличающийся от Domain-объекта (например, camelCase vs snake_case), маппинг должен происходить внутри Repository.

### 3.2 Обработка ошибок

Repository должна перехватывать специфичные ошибки базы данных и транслировать их в общие ошибки приложения (например, `RepositoryError`, `UniqueConstraintError`).

```typescript
// src/repositories/_lib/errors.ts
export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export class UniqueConstraintError extends RepositoryError {
  constructor(field: string) {
    super(`Duplicate value for field: ${field}`);
    this.name = 'UniqueConstraintError';
  }
}
```

При реализации:
```typescript
async create(data: CreateEntityData): Promise<Entity> {
  try {
    return await orm.entity.create(data);
  } catch (error) {
    if (error.code === 'P2002') { // Пример для Prisma
      throw new UniqueConstraintError('uniqueField');
    }
    throw new RepositoryError(error.message);
  }
}
```

### 3.3 Управление транзакциями

Для операций, требующих атомарности, Repository должны поддерживать инъекцию `TransactionClient`.

```typescript
export interface EntityRepository {
  create(data: CreateEntityData, tx?: TransactionClient): Promise<Entity>;
  // ...
}

// Реализация
async create(data: CreateEntityData, tx?: TransactionClient) {
  const client = tx || orm;
  return await client.entity.create({ data });
}
```

---

## 4. Работа с "сырыми" SQL-запросами

Использование родных SQL-запросов строго регламентировано, чтобы обеспечить безопасность и переносимость.

### 4.1 Когда использовать

Сырые запросы разрешены **только** в следующих случаях:
1. **Аналитика и агрегация:** Сложные запросы с оконными функциями, GROUP BY с фильтрацией, которые ORM генерирует неэффективно.
2. **Массовые операции:** Bulk insert/update (пакеты > 1000 записей), если ORM не оптимизирована для этого.
3. **Специфичные функции БД:** Использование JSONB-полей, полнотекстового поиска (PostgreSQL) и других особенностей БД, недоступных через стандартный API ORM.

### 4.2 Правила безопасности

1. **Только параметризированные запросы.** Строгая конкатенация строк **запрещена**.
2. **Типизация результатов.** Результат всегда должен быть приведен к известному типу.

### 4.3 Пример использования (Prisma)

```typescript
import { Prisma, sql } from '@prisma/client';

// ✅ Правильно: Использование tagged templates для параметров
async function getComplexStats(): Promise<StatsRow[]> {
  const query = sql`
    SELECT category, count(id) as total
    FROM entity
    WHERE status = ${'active'}
    GROUP BY category
  `;

  // Явная типизация результата
  return await db.$queryRawUnsafe<StatsRow[]>(query);
}

// ❌ Неправильно: Строковая конкатенация (SQL Injection risk)
// const query = `SELECT * FROM entity WHERE id = ${id}`;
// await db.$queryRawUnsafe(query);
```

### 4.4 Правила именования методов SQL

Для методов, использующих сырые запросы, используется префикс `query...`:

*   `queryRaw<T>(sql: TemplateStringsArray, ...params: any[]): Promise<T[]>`

---

## 5. Структура проекта и зависимости

### 5.1 Структура файлов

```typescript
// src/repositories/index.ts
// Экспортируем только типы и фабрики. Реализации скрыты.
export type { EntityRepository, Entity } from './entity-repository';
export { createEntityRepository } from './_impl/entity-repository-impl';

// src/repositories/_impl/entity-repository-impl.ts
import type { EntityRepository, Entity, ... } from '../entity-repository';
import { db } from '../_lib/orm-client'; // Единственный вход в БД

export class EntityRepositoryImpl implements EntityRepository {
    // ... реализация
}

export function createEntityRepository(): EntityRepository {
    return new EntityRepositoryImpl();
}
```

### 5.2 Зависимости

| Зависимость | Назначение |
|-------------|------------|
| ORM Client (Prisma/TypeORM) | Основной доступ к БД. Разрешен только в `src/repositories`. |
| `zod` | Валидация входных данных перед отправкой в БД. |

---

## 6. Тестирование

1. **Unit-тесты:**
   *   Проверяют правильность маппинга ORM-сущностей в DTO.
   *   Проверяют логику трансформации ошибок.
2. **Integration-тесты:**
   *   Запускаются против реальной или изолированной базы данных (например, SQLite для Prisma).
   *   Проверяют SQL-генерацию и работу транзакций.
3. **No-Mock Policy:** Для репозиториев запрещены Mock-базы данных. Тесты должны использовать реальную БД в транзакциях с последующим откатом (Rollback).

---

## 7. Самодокументирование

### 7.1 JSDoc

Все публичные методы интерфейсов должны иметь полное JSDoc описание.

```typescript
/**
 * Создает новую запись.
 *
 * @param data - Объект данных для создания
 * @param tx - Опциональная транзакция для выполнения в атомарном контексте
 * @returns Созданная сущность в виде чистого объекта
 * @throws UniqueConstraintError если уже существует запись с такими данными
 */
create(data: CreateEntityData, tx?: TransactionClient): Promise<Entity>;
```

---

## 8. Чек-лист качества

> ℹ️ **Полный чек-лист** Repository-компонента — в [`shared/checklists.md#3-repository`](../../shared/checklists.md#3-repository)

---

## 9. История изменений

> ℹ️ Единый журнал изменений — в [`CHANGELOG.md`](../../CHANGELOG.md)
