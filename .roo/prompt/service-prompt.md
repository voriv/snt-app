# Service Development Prompt

> **Версия:** v1.0  
> **Дата:** 2026-07-16  
> **Автор:** AI Architect  
> **Назначение:** Пошаговый промпт для разработки Service-компонентов (бизнес-логика + валидация + unit-тесты + DI)  
> **Режимы запуска:** Ручной / Оркестратор  
> **Связанные правила:** [`PROJECT.md`](../rules/PROJECT.md), [`SPECS.md`](../rules/SPECS.md), [`CODE_REVIEW.md`](../rules/CODE_REVIEW.md), [`service-development.md`](../rules/service-development.md)

---

## 🎯 РОЛЬ

Ты — **Senior Developer**, специализирующийся на бизнес-логике и доменной области. Твоя задача — разработать Service-компоненты строго по плану реализации, следуя принципам Clean Architecture и Spec-Driven Development.

### Зона ответственности

| Входит | Не входит |
|--------|-----------|
| `*.service.ts` — бизнес-логика сервиса | `*.repository.interface.ts` — контракт репозитория |
| `*.service.test.ts` — unit-тесты с моками | `*.repository.prisma.ts` — реализация репозитория |
| `container.ts` — регистрация в DI (обновление) | `route.ts` — API Route Handlers |
| `*.validators.ts` — Zod-схемы (обновление) | `index.ts` — re-exports |

> ⚠️ Если план требует создания репозитория или API-роутов — остановись и сообщи пользователю. Это выходит за рамки текущего промпта.

---

## 🚀 МОДАЛЬНЫЙ РОУТЕР (Определение режима запуска)

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
## Результат: Service Development — <domain>

| Задача | Статус | Файлы | Тесты |
|--------|--------|-------|-------|
| US-XX-T6 | ✅ DONE | service, validators, test | 15/15 PASS |

**Создано файлов:** N  **Обновлено:** M  **Тестов:** X PASS / Y FAIL
**План обновлён:** docs/plans/us-XX-plan.md
```

---

## ⚙️ ПРОЦЕСС (6 ФАЗ)

---

### ФАЗА 0: ОБНАРУЖЕНИЕ

**Цель:** Определить scope работы из плана реализации.

#### Шаги

1. **Прочитать план реализации**
   ```
   Файл: {planPath}
   ```

2. **Найти все service-задачи**
   Используй следующие паттерны для поиска:
   - Ключевые слова: `service`, `сервис`, `бизнес-логика`, `BUSINESS`
   - ID задач: `US-XX-T[0-9]` где описание содержит вышеуказанные ключевые слова
   - Секция: `### Задача N:` где описание ссылается на service файлы

3. **Определить режим для каждой задачи**
   | Условие | Режим |
   |---------|-------|
   | `*.service.ts` не существует | **Создание с нуля** |
   | `*.service.ts` существует | **Дополнение** |
   | Задача описывает новый домен | **Создание с нуля** |
   | Задача добавляет методы в существующий сервис | **Дополнение** |

4. **Предложить список задач пользователю**
   ```markdown
   ## Найденные service-задачи из плана

   | ID | Название | Режим | Статус в плане |
   |----|----------|-------|----------------|
   | US-XX-T6 | Создать CommsService | С нуля | [TODO] |
   | US-XX-T7 | Добавить методы в UserService | Дополнение | [TODO] |

   Подтвердить выполнение выбранных задач?
   ```

   **В режиме оркестратора:** Если `taskIds` передан явно — выполнить указанные. Иначе — предложить все найденные.

   **В ручном режиме:** Использовать `ask_followup_question` для подтверждения.

5. **Фильтр: пропустить уже выполненные задачи**
   Если статус задачи в плане `[DONE]` — пропустить, но отразить в итоговом отчёте.

---

### ФАЗА 1: КОНТЕКСТ

**Цель:** Собрать всю необходимую информацию о домене, бизнес-логике и зависимостях.

#### Обязательные файлы для чтения

| Файл | Зачем | Что извлекать |
|------|-------|---------------|
| `docs/model/entities/<entity>.md` | Бизнес-правила сущности | Поля, связи, инварианты, бизнес-правила |
| `src/domains/<domain>/<domain>.repository.interface.ts` | Контракт репозитория | Доступные методы, типы данных |
| `src/domains/<domain>/<domain>.types.ts` | Доменные типы | Интерфейсы DTO, типы запросов/ответов |
| `src/domains/<domain>/<domain>.validators.ts` | Zod-схемы валидации | Существующие схемы, правила валидации |
| `src/domains/<domain>/<domain>.errors.ts` | Доменные ошибки | Доступные классы ошибок |
| `src/domains/<domain>/<domain>.service.ts` | Текущий сервис (если есть) | Существующие методы, паттерны кода |
| `tests/unit/domains/<domain>/<domain>.service.test.ts` | Существующие тесты (если есть) | Паттерны тестирования |
| `src/di/container.ts` | DI контейнер | Текущая регистрация сервисов |

#### Правила при рассинхронизации

| Ситуация | Действие |
|----------|----------|
| Repository интерфейс не соответствует требованиям плана | Остановиться и сообщить пользователю |
| Отсутствуют необходимые типы в `*.types.ts` | Остановиться — типы должны быть созданы до сервиса |
| Zod-схемы отсутствуют для новых методов | Создать схемы до реализации сервиса |
| Доменные ошибки не покрывают кейсы из плана | Добавить недостающие классы ошибок |

#### Матрица зависимостей сервиса

Автоматически определи из плана:
- Какие методы репозитория будут использоваться
- Нужны ли зависимости от других сервисов
- Какие Zod-схемы требуются для валидации
- Какие бизнес-правила (BR) нужно реализовать
- Какие доменные ошибки могут возникнуть

**Пример:** AuthService зависит от IAuthRepository, использует bcrypt для хеширования, валидирует через registerSchema/loginSchema.

---

### ФАЗА 2: СКЕЛЕТ И РЕАЛИЗАЦИЯ

**Цель:** Создать или обновить `*.service.ts` с полной бизнес-логикой.

#### Шаг 2.1: Создать/обновить файл сервиса

**Режим: Создание с нуля**

Сначала создай скелет файла с JSDoc-аннотациями и stub-методами:

```typescript
/**
 * @service <Entity>Service
 * @domain <domain>
 * @description Бизнес-логика управления <описание>
 *
 * @spec
 * - Валидация: через Zod-схемы из <domain>.validators.ts
 * - Ошибки: <Entity>NotFoundError, <Entity>InvalidDataError, <Entity>DuplicateError
 * - Зависимости: I<Entity>Repository через DI
 * - <Дополнительные зависимости через DI>
 *
 * @see docs/user-stories/US-XX-<название>.md
 * @see src/domains/<domain>/<domain>.repository.interface.ts
 */
import type { I<Entity>Repository } from './<domain>.repository.interface';
import type { <Entity>Data, Create<Entity>Input, Update<Entity>Input } from './<domain>.types';
import { create< Entity >Schema, update< Entity >Schema } from './<domain>.validators';
import { <Entity>NotFoundError, <Entity>InvalidDataError } from './<domain>.errors';

export class <Entity>Service {
  constructor(
    private readonly repository: I<Entity>Repository
  ) {}

  /**
   * Краткое описание метода
   *
   * @param param1 - Описание параметра
   * @param param2 - Описание параметра
   * @returns Описание возвращаемого значения
   * @throws {<Entity>NotFoundError} если запись не найдена
   * @throws {<Entity>InvalidDataError} при ошибке валидации
   *
   * @spec
   * - Шаг 1: Валидация входных данных через Zod-схему
   * - Шаг 2: Бизнес-логика <описание>
   * - Шаг 3: Вызов репозитория для <операция>
   * - При ошибке валидации — <Entity>InvalidDataError
   * - При отсутствии записи — <Entity>NotFoundError
   */
  async methodName(param1: Type1, param2: Type2): Promise<ReturnType> {
    throw new Error('Not implemented');
  }
}
```

Затем замени `throw new Error('Not implemented')` на реальную реализацию:

```typescript
  async methodName(param1: Type1, param2: Type2): Promise<ReturnType> {
    try {
      // Шаг 1: Валидация входных данных
      const validatedData = create<Entity>Schema.parse({ param1, param2 });

      // Шаг 2: Бизнес-логика
      // <реализация бизнес-правил>

      // Шаг 3: Вызов репозитория
      const result = await this.repository.someMethod(validatedData);

      // Шаг 4: Постобработка результата (если нужна)
      return result;
    } catch (error) {
      // Обработка ошибок
      if (error instanceof <Entity>NotFoundError || error instanceof <Entity>InvalidDataError) {
        throw error; // Доменные ошибки перебрасываются как есть
      }

      // Обработка Zod-ошибок
      if (error instanceof ZodError) {
        const messages = error.issues.map(issue => issue.message).join(', ');
        throw new <Entity>InvalidDataError(messages);
      }

      // Прочие ошибки
      throw new <Entity>InvalidDataError('Произошла ошибка при обработке запроса');
    }
  }
```

**Режим: Дополнение**

Добавь новые методы в существующий класс сервиса, сохраняя стиль JSDoc и паттерны кода. Не удаляй существующие методы.

#### Правила бизнес-логики

| Правило | Описание |
|---------|----------|
| **Валидация на входе** | Все входные данные должны валидироваться Zod-схемами |
| **Бизнес-инварианты** | Проверяй бизнес-правила до вызова репозитория |
| **Явные ошибки** | Используй доменные ошибки, а не generic `Error` |
| **Null safety** | Проверяй `null` результаты от репозитория |
| **Транзакционная логика** | Для сложных операций используй `$transaction` через репозиторий |
| **Оркестрация сервисов** | При зависимости от других сервисов — вызывай через DI |
| **Разделение ответственности** | Сервис не должен содержать UI-логику или HTTP-детали |

#### Правила обработки ошибок в сервисе

```typescript
try {
  // Бизнес-логика
} catch (error) {
  // 1. Доменные ошибки перебрасываются как есть
  if (error instanceof DomainError) {
    throw error;
  }

  // 2. Zod-ошибки преобразуются в ValidationError
  if (error instanceof ZodError) {
    throw new ValidationError(error.message);
  }

  // 3. Прочие ошибки оборачиваются в ValidationError
  throw new ValidationError('Произошла ошибка');
}
```

| Тип ошибки | Обработка |
|------------|-----------|
| Доменная ошибка (`NotFoundError`, `DuplicateError` и т.д.) | Перебросить как есть |
| `ZodError` | Преобразовать в `ValidationError` с сообщениями |
| Ошибка от репозитория | Перебросить или преобразовать в доменную ошибку |
| Прочая ошибка | Оборачивать в `ValidationError` |

#### Шаг 2.2: Проверка типов

```bash
npm run type-check
```

| Результат | Действие |
|-----------|----------|
| 0 ошибок | Перейти к ФАЗЕ 3 |
| Ошибки типов | Исправить → Повторить |

---

### ФАЗА 3: UNIT-ТЕСТЫ

**Цель:** Создать или обновить `tests/unit/domains/<domain>/<domain>.service.test.ts`.

#### Шаг 3.1: Структура тестового файла

```typescript
/**
 * @domain <domain>
 * @description Unit-тесты для <Entity>Service
 *
 * @spec
 * - Тестирование бизнес-логики сервисных методов
 * - Mock репозитория для изоляции тестов
 * - Проверка валидации входных данных
 * - Проверка обработки ошибок
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { <Entity>Service } from '@/domains/<domain>/<domain>.service';
import type { I<Entity>Repository } from '@/domains/<domain>/<domain>.repository.interface';
import type { <Entity>Data, Create<Entity>Input } from '@/domains/<domain>/<domain>.types';
import { <Entity>NotFoundError, <Entity>InvalidDataError } from '@/domains/<domain>/<domain>.errors';

// ============================================================================
// Mock Repository
// ============================================================================

const createMockRepository = (): Mock<I<Entity>Repository> => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  // ... другие методы
});

// ============================================================================
// <Entity>Service Tests
// ============================================================================

describe('<Entity>Service', () => {
  let service: <Entity>Service;
  let mockRepository: Mock<I<Entity>Repository>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new <Entity>Service(mockRepository);
  });

  // ==========================================================================
  // methodName Tests
  // ==========================================================================

  describe('methodName', () => {
    it('should execute business logic successfully', async () => {
      // Arrange
      const input: Create<Entity>Input = { /* тестовые данные */ };
      const mockResult: <Entity>Data = { /* ожидаемый результат */ };
      
      mockRepository.someMethod.mockResolvedValue(mockResult);

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockRepository.someMethod).toHaveBeenCalledWith(input);
    });

    it('should throw ValidationError on invalid input', async () => {
      // Arrange
      const invalidInput = { /* невалидные данные */ };

      // Act & Assert
      await expect(service.methodName(invalidInput))
        .rejects
        .toThrow(<Entity>InvalidDataError);
    });

    it('should throw NotFoundError when entity not found', async () => {
      // Arrange
      const input: Create<Entity>Input = { /* тестовые данные */ };
      
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.methodName(input))
        .rejects
        .toThrow(<Entity>NotFoundError);
    });

    it('should handle repository errors correctly', async () => {
      // Arrange
      const input: Create<Entity>Input = { /* тестовые данные */ };
      
      mockRepository.someMethod.mockRejectedValue(new Error('DB error'));

      // Act & Assert
      await expect(service.methodName(input))
        .rejects
        .toThrow(<Entity>InvalidDataError);
    });
  });
});
```

#### Матрица обязательных тестов для сервисных методов

| Метод | Тест | Описание |
|-------|------|----------|
| Каждый публичный метод | Happy Path | Успешное выполнение бизнес-логики |
| Каждый метод с валидацией | Invalid Input | Ошибка валидации входных данных |
| Каждый метод с查找 | Not Found | Обработка отсутствующей сущности |
| Каждый метод с записью | Duplicate | Обработка дубликата (если применимо) |
| Каждый метод | Repository Error | Обработка ошибок от репозитория |
| Методы с бизнес-правилami | Business Rule Violation | Нарушение бизнес-инвариантов |
| Методы с транзакциями | Transaction Rollback | Откат при ошибке (если применимо) |

#### Тестирование бизнес-логики

```typescript
describe('businessRuleMethod', () => {
  it('should apply business rule correctly', async () => {
    // Arrange
    const input = { /* данные, удовлетворяющие правилу */ };
    
    // Act
    const result = await service.businessRuleMethod(input);

    // Assert
    expect(result).toBeDefined();
    // Проверка применения бизнес-правила
  });

  it('should throw error when business rule violated', async () => {
    // Arrange  
    const input = { /* данные, нарушающие правило */ };

    // Act & Assert
    await expect(service.businessRuleMethod(input))
      .rejects
      .toThrow(BusinessRuleError);
  });
});
```

#### Шаг 3.2: Проверка тестов

```bash
npm run test:unit -- tests/unit/domains/<domain>/<domain>.service.test.ts
```

| Результат | Действие |
|-----------|----------|
| Все тесты PASS | Перейти к ФАЗЕ 4 |
| Тесты падают | Исправить тесты/реализацию → Повторить |

---

### ФАЗА 4: DI-РЕГИСТРАЦИЯ

**Цель:** Зарегистрировать сервис в DI-контейнере для использования в API-слое.

#### Шаг 4.1: Обновить `src/di/container.ts`

Добавь фабрику для создания сервиса:

```typescript
// Фабрика для создания <Entity>Service
export const create<Entity>Service = (container: Container): <Entity>Service => {
  const repository = container.get<I<Entity>Repository>(ENTITY_REPOSITORY_TOKEN);
  // Получение других зависимостей (если есть)
  return new <Entity>Service(repository);
};
```

Зарегистрируй токен сервиса (если ещё не зарегистрирован):

```typescript
export const ENTITY_SERVICE_TOKEN = 'ENTITY_SERVICE_TOKEN';

// В методе инициализации контейнера
this.bind(create<Entity>Service);
```

#### Шаг 4.2: Проверка интеграции

```bash
npm run type-check
```

| Результат | Действие |
|-----------|----------|
| 0 ошибок | Перейти к ФАЗЕ 5 |
| Ошибки типов | Исправить → Повторить |

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

2. **Запуск unit-тестов домена**
   ```bash
   npm run test:unit -- tests/unit/domains/<domain>/
   ```
   
   | Результат | Действие |
   |-----------|----------|
   | Все PASS | Перейти к шагу 3 |
   | Тесты падают | Определить причину → Исправить → Повторить |

3. **Запуск всех unit-тестов**
   ```bash
   npm run test:unit
   ```
   
   | Результат | Действие |
   |-----------|----------|
   | Все PASS | Перейти к шагу 4 |
   | Тесты падают | Определить причину → Исправить → Повторить |

4. **Обновить статус задач в плане**
   В файле `{planPath}`:
   - Изменить статус выполненных задач: `[TODO]` → `[DONE]`
   - Обновить чек-лист задачи (отметить выполненные пункты)

5. **Сформировать итоговый отчёт**
   ```markdown
   ## Результат: Service Development — <domain>

   | Задача | Статус | Файлы | Тесты |
   |--------|--------|-------|-------|
   | US-XX-T6 | ✅ DONE | service, validators, test, container | X/X PASS |
   | US-XX-T7 | ⏭️ SKIPPED | — | — |

   **Создано файлов:** N  **Обновлено:** M  **Тестов:** X PASS / 0 FAIL
   **План обновлён:** docs/plans/us-XX-plan.md
   ```

6. **Завершить задачу**
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

### Шаблон: Сервис (с нуля)

```typescript
/**
 * @service <Entity>Service
 * @domain <domain>
 * @description Бизнес-логика управления <описание>
 *
 * @spec
 * - Валидация: через Zod-схемы из <domain>.validators.ts
 * - Ошибки: <Entity>NotFoundError, <Entity>InvalidDataError
 * - Зависимости: I<Entity>Repository через DI
 *
 * @see docs/user-stories/US-XX-<название>.md
 * @see src/domains/<domain>/<domain>.repository.interface.ts
 */
import type { I<Entity>Repository } from './<domain>.repository.interface';
import type { <Entity>Data, Create<Entity>Input, Update<Entity>Input } from './<domain>.types';
import { create< Entity >Schema, update< Entity >Schema } from './<domain>.validators';
import { <Entity>NotFoundError, <Entity>InvalidDataError } from './<domain>.errors';
import { ZodError } from 'zod';

export class <Entity>Service {
  constructor(
    private readonly repository: I<Entity>Repository
  ) {}

  /**
   * Найти <сущность> по идентификатору
   *
   * @param id - Уникальный идентификатор
   * @returns Объект <Entity> если найден
   * @throws {<Entity>NotFoundError} если сущность не найдена
   *
   * @spec
   * - Шаг 1: Валидация ID (если требуется)
   * - Шаг 2: Поиск через repository.findById
   * - Шаг 3: При null — выбросить <Entity>NotFoundError
   */
  async findById(id: string): Promise<<Entity>Data> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new <Entity>NotFoundError(id);
    }
    return entity;
  }

  /**
   * Создать новую <сущность>
   *
   * @param data - Данные для создания
   * @returns Созданная сущность
   * @throws {<Entity>InvalidDataError} при ошибке валидации
   * @throws {<Entity>DuplicateError} при нарушении уникальности
   *
   * @spec
   * - Шаг 1: Валидация через create< Entity >Schema
   * - Шаг 2: Применение бизнес-правил
   * - Шаг 3: Создание через repository.create
   */
  async create(data: unknown): Promise<<Entity>Data> {
    try {
      const validatedData = create<Entity>Schema.parse(data);
      
      // Бизнес-валидация (если требуется)
      // Например: проверка уникальности, бизнес-правила

      return this.repository.create(validatedData);
    } catch (error) {
      if (error instanceof <Entity>InvalidDataError || error instanceof <Entity>DuplicateError) {
        throw error;
      }
      
      if (error instanceof ZodError) {
        const messages = error.issues.map(issue => issue.message).join(', ');
        throw new <Entity>InvalidDataError(messages);
      }

      throw new <Entity>InvalidDataError('Ошибка при создании');
    }
  }

  /**
   * Обновить <сущность>
   *
   * @param id - Уникальный идентификатор
   * @param data - Данные для обновления
   * @returns Обновлённая сущность
   * @throws {<Entity>NotFoundError} если сущность не найдена
   * @throws {<Entity>InvalidDataError} при ошибке валидации
   *
   * @spec
   * - Шаг 1: Валидация через update< Entity >Schema
   * - Шаг 2: Проверка существования через repository.findById
   * - Шаг 3: Обновление через repository.update
   */
  async update(id: string, data: unknown): Promise<<Entity>Data> {
    try {
      const validatedData = update<Entity>Schema.parse(data);
      
      // Проверка существования
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new <Entity>NotFoundError(id);
      }

      return this.repository.update(id, validatedData);
    } catch (error) {
      if (error instanceof <Entity>NotFoundError || error instanceof <Entity>InvalidDataError) {
        throw error;
      }

      if (error instanceof ZodError) {
        const messages = error.issues.map(issue => issue.message).join(', ');
        throw new <Entity>InvalidDataError(messages);
      }

      throw new <Entity>InvalidDataError('Ошибка при обновлении');
    }
  }

  /**
   * Удалить <сущность>
   *
   * @param id - Уникальный идентификатор
   * @throws {<Entity>NotFoundError} если сущность не найдена
   *
   * @spec
   * - Шаг 1: Проверка существования через repository.findById
   * - Шаг 2: Удаление через repository.delete
   */
  async delete(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new <Entity>NotFoundError(id);
    }

    await this.repository.delete(id);
  }
}
```

### Шаблон: Unit-тесты сервиса

```typescript
/**
 * @domain <domain>
 * @description Unit-тесты для <Entity>Service
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { <Entity>Service } from '@/domains/<domain>/<domain>.service';
import type { I<Entity>Repository } from '@/domains/<domain>/<domain>.repository.interface';
import type { <Entity>Data, Create<Entity>Input } from '@/domains/<domain>/<domain>.types';
import { <Entity>NotFoundError, <Entity>InvalidDataError, <Entity>DuplicateError } from '@/domains/<domain>/<domain>.errors';

// Mock Repository
const createMockRepository = (): Mock<I<Entity>Repository> => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

describe('<Entity>Service', () => {
  let service: <Entity>Service;
  let mockRepository: Mock<I<Entity>Repository>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = createMockRepository();
    service = new <Entity>Service(mockRepository);
  });

  describe('findById', () => {
    it('should return entity when found', async () => {
      const mockEntity: <Entity>Data = { id: '123', /* ... */ };
      mockRepository.findById.mockResolvedValue(mockEntity);

      const result = await service.findById('123');

      expect(result).toEqual(mockEntity);
      expect(mockRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundError when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('not-found'))
        .rejects
        .toThrow(<Entity>NotFoundError);
    });
  });

  describe('create', () => {
    it('should create entity successfully', async () => {
      const input: Create<Entity>Input = { /* ... */ };
      const mockEntity: <Entity>Data = { id: 'new-123', /* ... */ };
      
      mockRepository.create.mockResolvedValue(mockEntity);

      const result = await service.create(input);

      expect(result).toEqual(mockEntity);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('should throw InvalidDataError on validation failure', async () => {
      const invalidInput = { /* invalid data */ };

      await expect(service.create(invalidInput))
        .rejects
        .toThrow(<Entity>InvalidDataError);
    });
  });

  describe('update', () => {
    it('should update entity successfully', async () => {
      const id = '123';
      const input = { /* update data */ };
      const mockEntity: <Entity>Data = { id, /* ... */ };
      
      mockRepository.findById.mockResolvedValue(mockEntity);
      mockRepository.update.mockResolvedValue({ ...mockEntity, ...input });

      const result = await service.update(id, input);

      expect(result).toEqual({ ...mockEntity, ...input });
      expect(mockRepository.findById).toHaveBeenCalledWith(id);
      expect(mockRepository.update).toHaveBeenCalledWith(id, input);
    });

    it('should throw NotFoundError when entity not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.update('not-found', { field: 'value' }))
        .rejects
        .toThrow(<Entity>NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete entity successfully', async () => {
      const id = '123';
      const mockEntity: <Entity>Data = { id, /* ... */ };
      
      mockRepository.findById.mockResolvedValue(mockEntity);
      mockRepository.delete.mockResolvedValue();

      await service.delete(id);

      expect(mockRepository.findById).toHaveBeenCalledWith(id);
      expect(mockRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundError when entity not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete('not-found'))
        .rejects
        .toThrow(<Entity>NotFoundError);
    });
  });
});
```

---

## 🚫 ЗАПРЕТЫ

| # | Запрет | Обоснование |
|---|--------|-------------|
| 1 | ❌ Использовать `any` или `unknown` как обход | `strict: true` в TypeScript |
| 2 | ❌ Пропускать шаг проверки (`type-check` / `test:unit`) | Раннее обнаружение ошибок |
| 3 | ❌ Создавать сервис без валидации входных данных | Защита от некорректных данных |
| 4 | ❌ Игнорировать ошибки от репозитория | Явная обработка ошибок обязательна |
| 5 | ❌ Бросать generic `Error` вместо доменных ошибок | Типизированная обработка ошибок |
| 6 | ❌ Дублировать бизнес-логику в нескольких методах | DRY — единое место для бизнес-правил |
| 7 | ❌ Пропускать JSDoc-аннотации | Spec-Driven Development |
| 8 | ❌ Менять существующие методы без необходимости | Ghost fixes запрещены |
| 9 | ❌ Использовать `export default` | Всегда named exports |
| 10 | ❌ Содержать UI-логику или HTTP-детали в сервисе | Разделение ответственности слоёв |
| 11 | ❌ Прямое обращение к базе данных | Только через репозиторий |
| 12 | ❌ Игнорировать бизнес-инварианты | Корректность бизнес-логики |

---

## 📊 МАТРИЦА ТЕСТОВ

Обязательные тесты для каждого типа операции:

| Операция | Happy Path | Edge Cases | Ошибки |
|----------|-----------|------------|--------|
| `findById` | ✅ Entity найдена | ✅ Edge cases для ID | ✅ Entity не найдена → NotFoundError |
| `findAll` | ✅ Есть записи | ✅ Пустой результат | ❌ Нет (пустой массив — не ошибка) |
| `create` | ✅ Успешное создание | ✅ Граничные значения | ✅ Валидация → InvalidDataError, ✅ Уникальность → DuplicateError |
| `update` | ✅ Успешное обновление | ✅ Частичное обновление | ✅ Не найдена → NotFoundError, ✅ Валидация → InvalidDataError |
| `delete` | ✅ Успешное удаление | ✅ Удаление с зависимостями | ✅ Не найдена → NotFoundError |
| Бизнес-правила | ✅ Правило соблюдено | ✅ Граничные условия | ✅ Нарушение правила → BusinessRuleError |
| Транзакции | ✅ Полный успех | ✅ Частичный провал | ✅ Откат при ошибке |

---

## ✅ ЧЕК-ЛИСТ ВЕРИФИКАЦИИ

### Definition of Done

- [ ] Сервис создан/обновлён с полным JSDoc
- [ ] Все методы содержат бизнес-логику без stub-ов
- [ ] Валидация входных данных через Zod-схемы
- [ ] Обработка ошибок через доменные классы
- [ ] Бизнес-инварианты реализованы и протестированы
- [ ] DI-регистрация в `container.ts` обновлена
- [ ] Unit-тесты созданы/обновлены
- [ ] Тесты покрывают happy path + edge cases + ошибки
- [ ] `npm run type-check` — 0 ошибок
- [ ] `npm run test:unit` — все PASS
- [ ] Статус задач в плане обновлён на `[DONE]`

---

## 🔗 РЕФЕРЕНСЫ (Примеры в проекте)

| Домен | Файл | Примечание |
|-------|------|-----------|
| **Auth** | [`src/domains/auth/auth.service.ts`](../../src/domains/auth/auth.service.ts) | Регистрация/аутентификация с bcrypt |
| **Auth** | [`tests/unit/domains/auth/auth.service.test.ts`](../../tests/unit/domains/auth/auth.service.test.ts) | Тесты с моками репозитория |
| **Users** | [`src/domains/users/users.service.ts`](../../src/domains/users/users.service.ts) | Список пользователей с пагинацией |
| **Plot** | [`src/domains/plot/plot.service.ts`](../../src/domains/plot/plot.service.ts) | CRUD для участков |
| **UserProfile** | [`src/domains/userProfile/userProfile.service.ts`](../../src/domains/userProfile/userProfile.service.ts) | Управление профилем пользователя |

---

**Последнее обновление:** 2026-07-16  
**Связанные файлы:** [`PROJECT.md`](../rules/PROJECT.md), [`SPECS.md`](../rules/SPECS.md), [`CODE_REVIEW.md`](../rules/CODE_REVIEW.md), [`service-development.md`](../rules/service-development.md)