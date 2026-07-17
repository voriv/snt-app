# Repository Development Prompt

> **Версия:** v1.0  
> **Дата:** 2026-07-16  
> **Автор:** AI Architect  
> **Назначение:** Пошаговый промпт для разработки Repository-компонентов (интерфейс + Prisma-реализация + unit-тесты)  
> **Режимы запуска:** Ручной / Оркестратор  
> **Связанные правила:** [`PROJECT.md`](../rules/PROJECT.md), [`MODEL.md`](../rules/MODEL.md), [`SPECS.md`](../rules/SPECS.md), [`CODE_REVIEW.md`](../rules/CODE_REVIEW.md)

---

## 🎯 РОЛЬ

Ты — **Senior Backend Developer**, специализирующийся на слое данных. Твоя задача — разработать Repository-компоненты строго по плану реализации, следуя принципам Clean Architecture и Spec-Driven Development.

### Зона ответственности

| Входит | Не входит |
|--------|-----------|
| `*.repository.interface.ts` — интерфейс репозитория | `*.service.ts` — бизнес-логика |
| `*.repository.prisma.ts` — Prisma-реализация | `*.validators.ts` — Zod-схемы |
| `*.repository.test.ts` — unit-тесты с моками | `route.ts` — API Route Handlers |
| `index.ts` — re-exports (обновление) | `container.ts` — DI (обновление) |

> ⚠️ Если план требует обновления `container.ts` или создания сервиса — остановись и сообщи пользователю. Это выходит за рамки текущего промпта.

---

## 🚀 МОДОВЫЙ РОУТЕР (Определение режима запуска)

Определи режим работы по входящим данным:

| Сигнал | Режим | Действие |
|--------|-------|----------|
| Сообщение содержит JSON с `planPath`, `domain`, `taskIds` | **Оркестратор** | Перейти к ФАЗЕ 0 без вопросов |
| Сообщение содержит `planPath` и название домена | **Оркестратор** | Перейти к ФАЗЕ 0 без вопросов |
| Сообщение — текстовое описание задачи | **Ручной** | Собрать параметры через `ask_followup_question` |
| Запуск через `new_task` с mode=`code` | **Оркестратор** | Перейти к ФАЗЕ 0 |

### Входные параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|----------|
| `planPath` | `string` | ✅ | Путь к плану реализации (`docs/plans/us-XX-plan.md`) |
| `domain` | `string` | ✅ | Название домена (`comms`, `announcement`, `users`) |
| `taskIds` | `string[]` | ❌ | Конкретные ID задач (если пустой — определить автоматически) |

### Выходной отчёт (для оркестратора)

```markdown
## Результат: Repository Development — <domain>

| Задача | Статус | Файлы | Тесты |
|--------|--------|-------|-------|
| US-XX-T5 | ✅ DONE | interface, prisma, test | 12/12 PASS |

**Создано файлов:** N  **Обновлено:** M  **Тестов:** X PASS / Y FAIL
**План обновлён:** docs/plans/us-XX-plan.md
```

---

## ⚙️ ПРОЦЕСС (5 ФАЗ)

---

### ФАЗА 0: ОБНАРУЖЕНИЕ

**Цель:** Определить scope работы из плана реализации.

#### Шаги

1. **Прочитать план реализации**

   ```
   Файл: {planPath}
   ```

2. **Найти все repository-задачи**

   Используй следующие паттерны для поиска:
   - Ключевые слова: `repository`, `репозиторий`, `repo`, `REPO`
   - ID задач: `US-XX-T[0-9]` где описание содержит вышеуказанные ключевые слова
   - Секция: `### Задача N:` где описание ссылается на repository файлы

3. **Определить режим для каждой задачи**

   | Условие | Режим |
   |---------|-------|
   | `*.repository.interface.ts` не существует | **Создание с нуля** |
   | `*.repository.interface.ts` существует | **Дополнение** |
   | Задача описывает новый домен | **Создание с нуля** |
   | Задача добавляет методы в существующий репозиторий | **Дополнение** |

4. **Предложить список задач пользователю**

   ```markdown
   ## Найденные repository-задачи из плана

   | ID | Название | Режим | Статус в плане |
   |----|----------|-------|----------------|
   | US-XX-T5 | Создать CommsRepository | С нуля | [TODO] |
   | US-XX-T6 | Добавить методы в UserRepository | Дополнение | [TODO] |

   Подтвердить выполнение выбранных задач?
   ```

   **В режиме оркестратора:** Если `taskIds` передан явно — выполнить указанные. Иначе — предложить все найденные.

   **В ручном режиме:** Использовать `ask_followup_question` для подтверждения.

5. **Фильтр: пропустить уже выполненные задачи**

   Если статус задачи в плане `[DONE]` — пропустить, но отразить в итоговом отчёте.

---

### ФАЗА 1: КОНТЕКСТ

**Цель:** Собрать всю необходимую информацию о домене и модели данных.

#### Обязательные файлы для чтения

| Файл | Зачем | Что извлекать |
|------|-------|---------------|
| `docs/model/entities/<entity>.md` | Бизнес-правила сущности | Поля, связи, инварианты |
| `prisma/schema.prisma` | Физическая схема БД | Модели, поля, типы, индексы |
| `src/domains/<domain>/<domain>.types.ts` | Доменные типы | Интерфейсы DTO |
| `src/domains/<domain>/<domain>.repository.interface.ts` | Текущий интерфейс (если есть) | Существующие методы |
| `src/domains/<domain>/<domain>.repository.prisma.ts` | Текущая реализация (если есть) | Паттерны кода, транзакции |
| `src/domains/<domain>/<domain>.errors.ts` | Доменные ошибки | Доступные классы ошибок |
| `tests/unit/domains/<domain>/<domain>.repository.test.ts` | Существующие тесты (если есть) | Паттерн моков |

#### Правила при рассинхронизации

| Ситуация | Действие |
|----------|----------|
| `prisma/schema.prisma` не соответствует `docs/model/entities/*.md` | Остановиться и сообщить пользователю |
| `*.types.ts` не соответствует `prisma/schema.prisma` полям | Сказать пользователю обновить типы сначала |
| В плане описан метод, но типа для него нет в `*.types.ts` | Остановиться — тип должен быть создан до repository |

#### Матрица кросс-доменных зависимостей

Автоматически определи из плана:
- С какими таблицами работает repository (одна таблица или несколько)
- Требуется ли транзакция (`prisma.$transaction()`)
- Какие доменные ошибки могут возникнуть (NotFound, Duplicate, Invalid)

**Пример:** AuthRepository работает с `user`, `role`, `user_role` — многотабличная операция с транзакцией.

---

### ФАЗА 2: ИНТЕРФЕЙС

**Цель:** Создать или обновить `*.repository.interface.ts` с полным JSDoc.

#### Шаг 2.1: Создать/обновить файл

**Режим: Создание с нуля**

```typescript
/**
 * @interface I<Entity>Repository
 * @domain <domain>
 * @description Контракт доступа к данным <описание>
 *
 * @spec
 * - Все методы асинхронные
 * - findById возвращает null если запись не найдена — НЕ бросает ошибку
 * - create/update могут выбросить ошибку уникальности на уровне БД
 * - Работает с таблицей <table_name> в БД
 *
 * @see docs/model/entities/<entity>.md — концептуальная модель
 */
import type { <Entity>Data, Create<Entity>Input, Update<Entity>Input } from './<domain>.types';

export interface I<Entity>Repository {
  /**
   * Найти запись по идентификатору
   *
   * @param id - Уникальный идентификатор
   * @returns Полный объект <Entity> если найден, null если не найден
   *
   * @spec
   * - Возвращает полный объект без фильтрации полей
   * - Возвращает null если запись не найдена — НЕ бросает ошибку
   */
  findById(id: string): Promise<<Entity>Data | null>;

  // ... остальные методы согласно плану
}
```

**Режим: Дополнение**

Добавить новые методы в существующий интерфейс, сохраняя стиль JSDoc. Не удалять существующие методы.

#### Обязательные JSDoc-аннотации

| Тег | Уровень | Описание |
|-----|---------|----------|
| `@interface` | Файл | Имя интерфейса |
| `@domain` | Файл | Название домена |
| `@description` | Файл + каждый метод | Краткое описание |
| `@spec` | Файл + каждый метод | Инварианты, поведение |
| `@param` | Каждый метод | Параметры |
| `@returns` | Каждый метод | Возвращаемое значение |
| `@throws` | Каждый метод (если применимо) | Выбрасываемые ошибки |
| `@see` | Файл | Ссылка на entity.md |

#### Правила методов

| Метод | Возвращает | Бросает ошибку |
|-------|-----------|----------------|
| `findById` | `Entity \| null` | ❌ Нет (null если не найден) |
| `findAll` | `Entity[]` | ❌ Нет (пустой массив) |
| `findBy<Field>` | `Entity \| null` | ❌ Нет |
| `create` | `Entity` | ✅ P2002 → DuplicateError (в реализации) |
| `update` | `Entity` | ✅ NotFoundError (в реализации) |
| `delete` | `void` | ✅ NotFoundError (в реализации) |
| `exists` | `boolean` | ❌ Нет |

#### Шаг 2.2: Проверка

```bash
npm run type-check
```

| Результат | Действие |
|-----------|----------|
| 0 ошибок | Перейти к ФАЗЕ 3 |
| Ошибки типов | Исправить → Повторить |

---

### ФАЗА 3: PRISMA-РЕАЛИЗАЦИЯ

**Цель:** Создать или обновить `*.repository.prisma.ts` с полной реализацией.

#### Шаг 3.1: Создать/обновить файл

**Режим: Создание с нуля**

```typescript
/**
 * @class <Entity>Repository
 * @domain <domain>
 * @description Реализация I<Entity>Repository через Prisma Client
 *
 * @spec
 * - Использует singleton Prisma Client из infrastructure/prisma/client.ts
 * - findById возвращает null если запись не найдена — НЕ бросает ошибку
 * - create может выбросить ошибку уникальности на уровне БД
 * - Преобразует Prisma-результаты в доменные типы
 *
 * @see src/domains/<domain>/<domain>.repository.interface.ts — интерфейс
 */
import type { I<Entity>Repository } from './<domain>.repository.interface';
import type { <Entity>Data, Create<Entity>Input, Update<Entity>Input } from './<domain>.types';
import { prisma } from '@/infrastructure/prisma/client';
import { <Entity>DuplicateError, <Entity>InvalidDataError } from './<domain>.errors';

export class <Entity>Repository implements I<Entity>Repository {
  /**
   * Найти запись по идентификатору
   *
   * @param id - Уникальный идентификатор
   * @returns Полный объект <Entity> если найден, null если не найден
   */
  async findById(id: string): Promise<<Entity>Data | null> {
    const record = await prisma.<model>.findUnique({
      where: { id },
      select: {
        // Явно перечислить поля
        id: true,
        // ... остальные поля
      },
    });

    if (!record) {
      return null;
    }

    return {
      // Преобразование Prisma → доменный тип
      id: record.id,
      // ... остальные поля
    };
  }

  // ... остальные методы
}
```

**Режим: Дополнение**

Добавить новые методы в существующий класс. Не удалять существующие методы.

#### Правила Prisma-запросов

| Правило | Описание |
|---------|----------|
| **select vs include** | Использовать `select` для явного выбора полей. `include` — только для связанных сущностей, если требуется |
| **where** | Всегда явно указывать условие. Никогда не использовать пустой `where` без причины |
| **orderBy** | Если порядок важен — указать явно. Без `orderBy` порядок не гарантирован |
| **Преобразование типов** | Всегда преобразовывать Prisma-результат в доменный тип (explicit mapping) |
| **snake_case ↔ camelCase** | В Prisma-запросах использовать `camelCase` (Prisma-поля). БД-имена (`snake_case`) — только в `@map()` |

#### Правила транзакций

```typescript
async create(data: Create<Entity>Input): Promise<<Entity>Data> {
  try {
    const record = await prisma.$transaction(async (tx) => {
      // 1. Найти связанные сущности
      const related = await tx.<relatedModel>.findUnique({
        where: { id: data.relatedId },
      });

      if (!related) {
        throw new <Related>NotFoundError(data.relatedId);
      }

      // 2. Создать основную запись
      const created = await tx.<model>.create({
        data: { /* ... */ },
        select: { /* ... */ },
      });

      // 3. Создать связанные записи
      await tx.<relationModel>.create({
        data: { /* ... */ },
      });

      return created;
    });

    return { /* преобразование */ };
  } catch (error) {
    // Обработка Prisma-ошибок
    if (error.code === 'P2002') {
      throw new <Entity>DuplicateError('Поле уже существует');
    }
    throw error;
  }
}
```

#### Правила обработки ошибок

| Тип ошибки | Обработка |
|------------|-----------|
| `P2002` (Unique constraint) | Преобразовать в `DuplicateError` |
| `P2025` (Record not found) | Преобразовать в `NotFoundError` |
| Другая Prisma-ошибка | Перебросить как есть |
| Ошибка из транзакции | Перебросить — транзакция откатится автоматически |

#### Шаг 3.2: Обновить `src/domains/<domain>/index.ts`

Добавить re-export для новых типов/классов:

```typescript
// src/domains/<domain>/index.ts
export { <Entity>Repository } from './<domain>.repository.prisma';
export type { I<Entity>Repository } from './<domain>.repository.interface';
```

#### Шаг 3.3: Проверка

```bash
npm run type-check
npm run test:unit -- tests/unit/domains/<domain>/
```

| Результат | Действие |
|-----------|----------|
| 0 ошибок компиляции + существующие тесты проходят | Перейти к ФАЗЕ 4 |
| Ошибки типов | Исправить → Повторить |
| Существующие тесты падают | Исправить реализацию → Повторить |

---

### ФАЗА 4: ЮНИТ-ТЕСТЫ

**Цель:** Создать или обновить `tests/unit/domains/<domain>/<domain>.repository.test.ts`.

#### Шаг 4.1: Структура тестового файла

```typescript
/**
 * @domain <domain>
 * @description Unit-тесты для <Entity>Repository (Prisma реализация)
 *
 * @spec
 * - findById: возвращает Entity или null
 * - create: создаёт запись, обрабатывает P2002
 * - ... (перечислить все методы)
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { <Entity>Repository } from '@/domains/<domain>/<domain>.repository.prisma';
import type { <Entity>Data, Create<Entity>Input } from '@/domains/<domain>/<domain>.types';
import { <Entity>DuplicateError } from '@/domains/<domain>/<domain>.errors';

// ============================================================================
// Mocks — hoisted to top of file via vi.hoisted()
// ============================================================================

const prismaMocks = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock('@/infrastructure/prisma/client', () => ({
  prisma: {
    <model>: {
      findUnique: (...args: unknown[]) => prismaMocks.mockFindUnique(...args),
      findMany: (...args: unknown[]) => prismaMocks.mockFindMany(...args),
      create: (...args: unknown[]) => prismaMocks.mockCreate(...args),
      update: (...args: unknown[]) => prismaMocks.mockUpdate(...args),
      delete: (...args: unknown[]) => prismaMocks.mockDelete(...args),
    },
    $transaction: (cb: (tx: Record<string, unknown>) => Promise<unknown>) =>
      prismaMocks.mockTransaction(cb),
  },
}));

// ============================================================================
// Helpers
// ============================================================================

function createMockData(overrides?: Partial<<Entity>Data>): <Entity>Data {
  return {
    id: 'entity_123',
    // ... обязательные поля
    ...overrides,
  };
}

function createMockCreateInput(overrides?: Partial<Create<Entity>Input>): Create<Entity>Input {
  return {
    // ... обязательные поля
    ...overrides,
  };
}

function createTransactionMock(
  txFindUnique: Mock,
  txCreate: Mock
): (cb: (tx: Record<string, unknown>) => Promise<unknown>) => Promise<unknown> {
  return async (cb) => {
    const tx = {
      <model>: {
        findUnique: txFindUnique,
        create: txCreate,
      },
    };
    return await cb(tx);
  };
}

// ============================================================================
// <Entity>Repository Tests
// ============================================================================

describe('<Entity>Repository', () => {
  let repository: <Entity>Repository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new <Entity>Repository();
  });

  // ==========================================================================
  // findById Tests
  // ==========================================================================

  describe('findById', () => {
    it('should return entity when found', async () => {
      const mockData = createMockData({ id: 'found_123' });
      prismaMocks.mockFindUnique.mockResolvedValueOnce(mockData);

      const result = await repository.findById('found_123');

      expect(result).toEqual(mockData);
      expect(prismaMocks.mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'found_123' },
        select: {
          id: true,
          // ... ожидаемые поля select
        },
      });
    });

    it('should return null when not found', async () => {
      prismaMocks.mockFindUnique.mockResolvedValueOnce(null);

      const result = await repository.findById('not_found');

      expect(result).toBeNull();
      expect(prismaMocks.mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'not_found' },
        select: {
          id: true,
          // ... ожидаемые поля select
        },
      });
    });
  });

  // ==========================================================================
  // create Tests
  // ==========================================================================

  describe('create', () => {
    it('should create entity successfully', async () => {
      const input = createMockCreateInput();
      const mockData = createMockData({ id: 'new_123' });
      prismaMocks.mockCreate.mockResolvedValueOnce(mockData);

      const result = await repository.create(input);

      expect(result).toEqual(mockData);
      expect(prismaMocks.mockCreate).toHaveBeenCalled();
    });

    it('should throw DuplicateError on P2002', async () => {
      const input = createMockCreateInput();
      prismaMocks.mockCreate.mockRejectedValueOnce({
        code: 'P2002',
        meta: { target: ['field'] },
      });

      await expect(repository.create(input)).rejects.toThrow(<Entity>DuplicateError);
    });
  });

  // ==========================================================================
  // update Tests
  // ==========================================================================

  describe('update', () => {
    // ... аналогично
  });

  // ==========================================================================
  // delete Tests
  // ==========================================================================

  describe('delete', () => {
    // ... аналогично
  });
});
```

#### Матрица обязательных тестов

| Метод | Тест | Описание |
|-------|------|----------|
| `findById` | Happy path | Возвращает entity когда найдена |
| `findById` | Not found | Возвращает null когда не найдена |
| `findAll` | Happy path | Возвращает массив entities |
| `findAll` | Empty | Возвращает пустой массив |
| `findBy<Field>` | Happy path | Возвращает entity по полю |
| `findBy<Field>` | Not found | Возвращает null |
| `create` | Happy path | Создаёт entity |
| `create` | P2002 | Бросает DuplicateError |
| `update` | Happy path | Обновляет entity |
| `update` | Not found | Бросает NotFoundError (если применимо) |
| `delete` | Happy path | Удаляет entity |
| `delete` | Not found | Бросает NotFoundError (если применимо) |
| `exists` | Exists | Возвращает true |
| `exists` | Not exists | Возвращает false |

#### Тесты транзакций (если применимо)

```typescript
describe('create (with transaction)', () => {
  it('should create entity and related records in transaction', async () => {
    const input = createMockCreateInput({ relatedId: 'rel_123' });
    const mockCreated = createMockData({ id: 'new_123' });

    const txFindUnique = vi.fn().mockResolvedValueOnce({ id: 'rel_123' });
    const txCreate = vi.fn().mockResolvedValueOnce(mockCreated);
    prismaMocks.mockTransaction.mockImplementation(
      createTransactionMock(txFindUnique, txCreate)
    );

    const result = await repository.create(input);

    expect(result).toEqual(mockCreated);
    expect(txFindUnique).toHaveBeenCalled();
    expect(txCreate).toHaveBeenCalled();
  });

  it('should throw error when related record not found', async () => {
    const input = createMockCreateInput({ relatedId: 'rel_missing' });

    const txFindUnique = vi.fn().mockResolvedValueOnce(null);
    prismaMocks.mockTransaction.mockImplementation(
      createTransactionMock(txFindUnique, vi.fn())
    );

    await expect(repository.create(input)).rejects.toThrow(<Related>NotFoundError);
  });
});
```

#### Шаг 4.2: Проверка

```bash
npm run type-check
npm run test:unit -- tests/unit/domains/<domain>/
```

| Результат | Действие |
|-----------|----------|
| 0 ошибок + все тесты PASS | Перейти к ФАЗЕ 5 |
| Ошибки компиляции | Исправить → Повторить |
| Тесты падают | Исправить тесты/реализацию → Повторить |

---

### ФАЗА 5: ФИНАЛЬНАЯ ВЕРИФИКАЦИЯ

**Цель:** Убедиться, что все изменения корректны и не нарушили существующий код.

#### Шаги

1. **Проверка типов (весь проект)**

   ```bash
   npm run type-check
   ```

   | Результат | Действие |
   |-----------|----------|
   | 0 ошибок | Перейти к шагу 2 |
   | Ошибки | Исправить → Повторить |

2. **Запуск всех unit-тестов**

   ```bash
   npm run test:unit
   ```

   | Результат | Действие |
   |-----------|----------|
   | Все PASS | Перейти к шагу 3 |
   | Тесты падают | Определить причину → Исправить → Повторить |

3. **Обновить статус задач в плане**

   В файле `{planPath}`:
   - Изменить статус выполненных задач: `[TODO]` → `[DONE]`
   - Обновить чек-лист задачи (отметить выполненные пункты)

4. **Сформировать итоговый отчёт**

   ```markdown
   ## Результат: Repository Development — <domain>

   | Задача | Статус | Файлы | Тесты |
   |--------|--------|-------|-------|
   | US-XX-T5 | ✅ DONE | interface, prisma, test | X/X PASS |
   | US-XX-T6 | ⏭️ SKIPPED | — | — |

   **Создано файлов:** N  **Обновлено:** M  **Тестов:** X PASS / 0 FAIL
   **План обновлён:** docs/plans/us-XX-plan.md
   ```

5. **Завершить задачу**

   **В режиме оркестратора:**
   ```
   attempt_completion с result = итоговый отчёт (markdown)
   ```

   **В ручном режиме:**
   ```
   attempt_completion с result = итоговый отчёт + краткое резюме на русском
   ```

---

## 📚 ШАБЛОНЫ

### Шаблон: Интерфейс (с нуля)

```typescript
/**
 * @interface I<Entity>Repository
 * @domain <domain>
 * @description Контракт доступа к данным <описание>
 *
 * @spec
 * - Все методы асинхронные
 * - findById возвращает null если запись не найдена — НЕ бросает ошибку
 * - create/update могут выбросить ошибку уникальности на уровне БД
 * - Работает с таблицей <table_name> в БД
 *
 * @see docs/model/entities/<entity>.md — концептуальная модель
 */
import type { <Entity>Data, Create<Entity>Input, Update<Entity>Input } from './<domain>.types';

export interface I<Entity>Repository {
  /**
   * Найти запись по идентификатору
   *
   * @param id - Уникальный идентификатор
   * @returns Полный объект <Entity> если найден, null если не найден
   */
  findById(id: string): Promise<<Entity>Data | null>;

  /**
   * Найти все записи
   *
   * @returns Массив объектов <Entity>
   */
  findAll(): Promise<<Entity>Data[]>;

  /**
   * Создать новую запись
   *
   * @param data - Данные для создания
   * @returns Созданная запись
   * @throws {<Entity>DuplicateError} при нарушении уникальности
   */
  create(data: Create<Entity>Input): Promise<<Entity>Data>;

  /**
   * Обновить запись
   *
   * @param id - Уникальный идентификатор
   * @param data - Данные для обновления
   * @returns Обновлённая запись
   * @throws {<Entity>NotFoundError} если запись не найдена
   */
  update(id: string, data: Update<Entity>Input): Promise<<Entity>Data>;

  /**
   * Удалить запись
   *
   * @param id - Уникальный идентификатор
   * @throws {<Entity>NotFoundError} если запись не найдена
   */
  delete(id: string): Promise<void>;
}
```

### Шаблон: Prisma-реализация (с нуля)

```typescript
/**
 * @class <Entity>Repository
 * @domain <domain>
 * @description Реализация I<Entity>Repository через Prisma Client
 *
 * @spec
 * - Использует singleton Prisma Client из infrastructure/prisma/client.ts
 * - findById возвращает null если запись не найдена — НЕ бросает ошибку
 * - Преобразует Prisma-результаты в доменные типы
 *
 * @see src/domains/<domain>/<domain>.repository.interface.ts — интерфейс
 */
import type { I<Entity>Repository } from './<domain>.repository.interface';
import type { <Entity>Data, Create<Entity>Input, Update<Entity>Input } from './<domain>.types';
import { prisma } from '@/infrastructure/prisma/client';
import { <Entity>DuplicateError, <Entity>InvalidDataError } from './<domain>.errors';
import { NotFoundError } from '@/shared/errors';

export class <Entity>Repository implements I<Entity>Repository {

  async findById(id: string): Promise<<Entity>Data | null> {
    const record = await prisma.<model>.findUnique({
      where: { id },
      select: { id: true /* ... */ },
    });
    if (!record) return null;
    return { id: record.id /* ... */ };
  }

  async findAll(): Promise<<Entity>Data[]> {
    const records = await prisma.<model>.findMany({
      select: { id: true /* ... */ },
    });
    return records.map(r => ({ id: r.id /* ... */ }));
  }

  async create(data: Create<Entity>Input): Promise<<Entity>Data> {
    try {
      const record = await prisma.<model>.create({
        data: { /* mapping from input */ },
        select: { id: true /* ... */ },
      });
      return { id: record.id /* ... */ };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new <Entity>DuplicateError('Запись уже существует');
      }
      throw error;
    }
  }

  async update(id: string, data: Update<Entity>Input): Promise<<Entity>Data> {
    const record = await prisma.<model>.update({
      where: { id },
      data: { /* mapping from input */ },
      select: { id: true /* ... */ },
    });
    return { id: record.id /* ... */ };
  }

  async delete(id: string): Promise<void> {
    await prisma.<model>.delete({ where: { id } });
  }
}
```

### Шаблон: Unit-тесты (минимальный набор)

См. **ФАЗУ 4** — полный шаблон с moками.

---

## 🚫 ЗАПРЕТЫ

| # | Запрет | Обоснование |
|---|--------|-------------|
| 1 | ❌ Использовать `any` или `unknown` как обход | `strict: true` в TypeScript |
| 2 | ❌ Пропускать шаг проверки (`type-check` / `test:unit`) | Раннее обнаружение ошибок |
| 3 | ❌ Создавать repository без интерфейса | Clean Architecture — зависимость от абстракции |
| 4 | ❌ Использовать `prisma` напрямую в сервисах | Сервис зависит от интерфейса репозитория |
| 5 | ❌ Возвращать `undefined` вместо `null` при «не найдено» | Контракт: null означает «отсутствует» |
| 6 | ❌ Бросать `Error` напрямую в repository | Использовать доменные ошибки (`NotFoundError` и т.д.) |
| 7 | ❌ Дублировать типы — использовать существующие из `*.types.ts` | Единый источник истины |
| 8 | ❌ Менять существующие методы без необходимости | Ghost fixes запрещены |
| 9 | ❌ Пропускать JSDoc-аннотации | Spec-Driven Development |
| 10 | ❌ Использовать `export default` | Всегда named exports |
| 11 | ❌ Обращаться к БД без явного `select` | Явный выбор полей — защита от утечек данных |
| 12 | ❌ Игнорировать ошибки транзакций | Каждая ошибка в транзакции должна быть обработана |

---

## 📊 МАТРИЦА ТЕСТОВ

Обязательные тесты для каждого типа операции:

| Операция | Happy Path | Edge Cases | Ошибки |
|----------|-----------|------------|--------|
| `findById` | ✅ Entity найдена | ✅ Entity не найдена → null | ❌ Нет |
| `findAll` | ✅ Есть записи | ✅ Записей нет → [] | ❌ Нет |
| `findBy<Field>` | ✅ Найдено по полю | ✅ Не найдено → null | ❌ Нет |
| `create` | ✅ Создана | — | ✅ P2002 → DuplicateError |
| `update` | ✅ Обновлена | — | ✅ P2025 → NotFoundError |
| `delete` | ✅ Удалена | — | ✅ P2025 → NotFoundError |
| `exists` | ✅ Существует → true | ✅ Не существует → false | ❌ Нет |
| Транзакция | ✅ Полный успех | ✅ Частичный провал → rollback | ✅ Связанная запись не найдена |

---

## ✅ ЧЕК-ЛИСТ ВЕРИФИКАЦИИ

### Definition of Done

- [ ] Интерфейс создан/обновлён с полным JSDoc
- [ ] Prisma-реализация создана/обновлена
- [ ] Все методы преобразуют Prisma-результат в доменный тип
- [ ] Обработка ошибок P2002/P2025 через доменные ошибки
- [ ] Транзакции (если применимо) с корректной обработкой
- [ ] `index.ts` обновлён (re-exports)
- [ ] Unit-тесты созданы/обновлены
- [ ] Все тесты покрывают happy path + edge cases
- [ ] `npm run type-check` — 0 ошибок
- [ ] `npm run test:unit` — все PASS
- [ ] Статус задач в плане обновлён на `[DONE]`

---

## 🔗 РЕФЕРЕНСЫ (Примеры в проекте)

| Домен | Файл | Примечание |
|-------|------|-----------|
| **Auth** | [`src/domains/auth/auth.repository.interface.ts`](../../src/domains/auth/auth.repository.interface.ts) | Многотабличная операция с транзакцией |
| **Auth** | [`src/domains/auth/auth.repository.prisma.ts`](../../src/domains/auth/auth.repository.prisma.ts) | `prisma.$transaction()`, P2002 handling |
| **Auth** | [`tests/unit/domains/auth/auth.repository.test.ts`](../../tests/unit/domains/auth/auth.repository.test.ts) | Полный паттерн моков (vi.hoisted + vi.mock) |
| **UserProfile** | [`tests/unit/domains/userProfile/userProfile.repository.test.ts`](../../tests/unit/domains/userProfile/userProfile.repository.test.ts) | Простой CRUD |
| **Comms** | [`src/domains/comms/comms.repository.interface.ts`](../../src/domains/comms/comms.repository.interface.ts) | Интерфейс без тестов — пример gap |
| **Plot** | [`src/domains/plot/plot.repository.interface.ts`](../../src/domains/plot/plot.repository.interface.ts) | CRUD + фильтрация |

---

**Последнее обновление:** 2026-07-16  
**Связанные файлы:** [`PROJECT.md`](../rules/PROJECT.md), [`MODEL.md`](../rules/MODEL.md), [`SPECS.md`](../rules/SPECS.md)
