# Требования к Service компонентам

## Статус: На обсуждении

---

## 0. Общие положения

Настоящий документ определяет единые требования к созданию, именованию, структуре, декомпозиции, используемым библиотекам и самодокументированию **Service компонентов** проекта `snt-app`.

Service слой является центральным звеном Clean Architecture / Layered Architecture и содержит **чистую бизнес-логику** приложения.

### 0.1 Связанные документы

| Документ | Назначение |
|----------|------------|
| [`.roo/rules/architecture.md`](../../../../.roo/rules/architecture.md) | Архитектурные правила, spec-driven development |
| [`.roo/rules/change-rules.md`](../../../../.roo/rules/change-rules.md) | Порядок внесения изменений |
| [`docs/specs/component-spec-requirements.md`](../../component-spec-requirements.md) | Требования к спецификациям компонентов |
| [`docs/specs/components/component-requirements.md`](../component-requirements.md) | Общие требования к компонентам проекта |
| [`specs/components/services/spec-service-template.md`](./spec-service-template.md) | Шаблон спецификации Service компонента |
| [`architecture/structure/01-architecture.md`](../../../architecture/structure/01-architecture.md) | Архитектура и технологические решения |

### 0.2 Принципы разработки

1. **Типобезопасность.** Все service функции строго типизированы (TypeScript strict mode).
2. **Чистота логики.** Service не знают о фреймворках, HTTP, UI. Они оперируют доменными моделями.
3. **Разделение ответственности.** Бизнес-логика — только в сервисах. Handlers/Controllers содержат только координирующую логику.
4. **Dependence Inversion.** Service зависят от абстракций (Repositories), а не от конкретных реализаций.
5. **Самодокументирование.** Каждая публичная функция описана JSDoc/TSDoc.
6. **Spec-Driven Development.** Перед созданием или изменением сервиса — создать спецификацию в `specs/services/`.
7. **Одна ответственность.** Каждая функция выполняет одну well-defined бизнес-операцию.

---

## 1. Архитектура Service слоя

### 1.1 Расположение файлов

```
src/services/
├── index.ts                    # Экспорты всех сервисов
├── core-service.ts             # Сервис для домена Core
├── accounting-service.ts       # Сервис для домена Accounting
├── communication-service.ts    # Сервис для домена Communication
├── publications-service.ts     # Сервис для домена Publications
└── _lib/
    ├── errors.ts               # Доменно-специфичные классы ошибок
    ├── validators.ts           # Общие валидаторы
    └── helpers.ts              # Вспомогательные функции
```

### 1.2 Структура service файла

Каждый файл сервиса должен соблюдать следующую структуру:

> ⚠️ Service работает **только через Repository абстракцию**. Прямые вызовы Prisma запрещены.

```typescript
// ================================
// 1. Импорт зависимостей
// ================================
import type { PlotRepository } from '@/repositories/plot-repository';
import { z } from 'zod';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../_lib/errors';

// ================================
// 2. Типы и интерфейсы
// ================================
export interface CreatePlotInput {
  number: string;
  area: number;
  address: string;
  ownerId: string;
}

export interface UpdatePlotInput extends Partial<CreatePlotInput> {
  id: string;
}

export interface PlotsWithMembers {
  plot: Plot;
  members: Member[];
}

// ================================
// 3. Zod схемы валидации
// ================================
const createPlotSchema = z.object({
  number: z.string().min(1).max(20),
  area: z.number().positive(),
  address: z.string().min(1).max(200),
  ownerId: z.string().uuid(),
}).strict();

// ================================
// 4. Service класс с DI
// ================================
export class PlotService {
  constructor(
    private plotRepository: PlotRepository,
  ) {}

  /**
   * Создаёт новый участок с валидацией данных.
   *
   * @remarks
   * При создании участка автоматически создаётся запись в истории изменений.
   * Если участок с таким номером уже существует — выбрасывается ConflictError.
   *
   * @param input - Входные данные для создания участка
   * @param userId - ID пользователя, создающего участок
   * @returns Созданный участок с связанные данными
   * @throws ValidationError, ConflictError если валидация не пройдена
   *
   * @example
   * ```typescript
   * const service = createPlotService(plotRepository);
   * const plot = await service.create(
   *   { number: '001', area: 600, address: 'ул. Садовая, 1' },
   *   'user-123'
   * );
   * ```
   *
   * @public
   */
  async create(
    input: unknown,
    userId: string
  ): Promise<Plot> {
    const parsed = createPlotSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('input', 'Невалидные данные');
    }

    // Проверка уникальности через Repository
    const isUnique = await this.plotRepository.isNumberUnique(parsed.data.number);
    if (!isUnique) {
      throw new ConflictError('plot-number', `Участок "${parsed.data.number}" уже существует`);
    }

    // Создание через Repository
    return this.plotRepository.create({
      ...parsed.data,
      createdBy: userId,
    });
  }

  /**
   * Получает участок по ID с участниками.
   *
   * @param id - ID участка
   * @returns Участок с участниками или null
   * @throws NotFoundError если участок не найден
   *
   * @public
   */
  async getByIdWithMembers(id: string): Promise<PlotsWithMembers | null> {
    const result = await this.plotRepository.findByIdWithMembers(id);
    if (!result) {
      throw new NotFoundError('Plot', id);
    }
    return result;
  }

  /**
   * Обновляет данные участка.
   *
   * @param input - Данные для обновления
   * @param userId - ID пользователя, выполняющего обновление
   * @returns Обновлённый участок
   * @throws NotFoundError, ConflictError если участок не найден
   *
   * @public
   */
  async update(
    input: unknown,
    userId: string
  ): Promise<Plot> {
    const parsed = createPlotSchema.partial().extend({ id: z.string().uuid() }).safeParse(input);
    if (!parsed.success) {
      throw new ValidationError('input', 'Невалидные данные');
    }

    // Проверка существования через Repository
    const existing = await this.plotRepository.findById(parsed.data.id);
    if (!existing) {
      throw new NotFoundError('Plot', parsed.data.id);
    }

    // Валидация уникальности номера (если номер меняется)
    if (parsed.data.number && parsed.data.number !== existing.number) {
      const isUnique = await this.plotRepository.isNumberUnique(parsed.data.number, parsed.data.id);
      if (!isUnique) {
        throw new ConflictError('plot-number', `Участок "${parsed.data.number}" уже существует`);
      }
    }

    return this.plotRepository.update(parsed.data.id, {
      ...parsed.data,
      updatedBy: userId,
    });
  }

  /**
   * Удаляет участок.
   *
   * @remarks
   * При удалении участка все связанные записи участников также удаляются (CASCADE).
   *
   * @param id - ID участка для удаления
   * @param userId - ID пользователя, выполняющего удаление
   * @throws NotFoundError если участок не найден
   *
   * @public
   */
  async delete(id: string): Promise<void> {
    const existing = await this.plotRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Plot', id);
    }

    await this.plotRepository.delete(id);
  }
}

// ================================
// 5. Factory для создания сервиса
// ================================

export function createPlotService(repository: PlotRepository): PlotService {
  return new PlotService(repository);
}
```

### 1.3 Правила разделения по файлам

| Критерий | Правило |
|----------|---------|
| **По доменам** | Каждый домен имеет свой сервис (`core-service.ts`, `accounting-service.ts`) |
| **По поддоменам** | Если сервис > 300 строк — разделить на подмодули |
| **Общие утилиты** | Общие функции выносить в `src/services/_lib/` |

#### Структура большого сервиса

```typescript
// src/services/core.ts
export * from './core/plot';
export * from './core/member';
export * from './core/user';
```

```typescript
// src/services/core/plot.ts
export async function createPlotService(...) { ... }
export async function getPlotService(...) { ... }
```

---

## 2. Именование

### 2.1 Именование файлов

Файлы сервисов именуются в **lowercase** с суффиксом `-service`:

```typescript
// ✅ Правильно:
src/services/core-service.ts
src/services/accounting-service.ts
src/services/communication-service.ts

// ❌ Неправильно:
src/services/CoreService.ts
src/services/core.ts
src/services/core.ts.ts
```

### 2.2 Именование функций

Функции сервисов именуются по паттерну `<action><Entity>Service`:

| Действие | Паттерн | Пример |
|----------|---------|--------|
| **Создание** | `create<Entity>Service` | `createPlotService()` |
| **Получение (список)** | `list<Entity>Service` | `listPlotService()` |
| **Получение (один)** | `get<Entity>Service` | `getPlotService()` |
| **Обновление** | `update<Entity>Service` | `updatePlotService()` |
| **Удаление** | `delete<Entity>Service` | `deletePlotService()` |
| **Валидация** | `validate<Entity>Action` | `validatePlotCreation()` |
| **Утилита** | `<action><Entity>Helper` | `calculatePlotArea()` |

### 2.3 Именование input/output типов

```typescript
// ✅ Правильно:
export interface CreatePlotInput { ... }
export interface UpdatePlotInput { ... }
export interface PlotListQuery { ... }
export interface PlotDetail { ... }

// ❌ Неправильно:
export interface PlotCreate { ... }
export interface PlotData { ... }
export type PlotCreateDto { ... }
```

---

## 3. Обработка ошибок

### 3.1 Классы ошибок

Service должны использовать **доменно-специфичные классы ошибок**. Запрещено использовать generic `Error` или `throw new Error('message')`.

```typescript
// src/services/_lib/errors.ts

/** Базовый класс для всех ошибок сервиса */
export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

/** Ошибка валидации данных */
export class ValidationError extends ServiceError {
  constructor(field: string, message: string) {
    super(`Validation error on '${field}': ${message}`);
    this.name = 'ValidationError';
  }
}

/** Ошибка "не найдено" */
export class NotFoundError extends ServiceError {
  constructor(entity: string, id: string) {
    super(`${entity} not found with id: ${id}`);
    this.name = 'NotFoundError';
  }
}

/** Ошибка бизнес-правил */
export class BusinessRuleError extends ServiceError {
  constructor(rule: string, message: string) {
    super(`Business rule '${rule}' violated: ${message}`);
    this.name = 'BusinessRuleError';
  }
}

/** Ошибка конфликтующих изменений */
export class ConflictError extends ServiceError {
  constructor(resource: string, reason: string) {
    super(`Conflict on '${resource}': ${reason}`);
    this.name = 'ConflictError';
  }
}
```

### 3.2 Использование в сервисах

```typescript
import { NotFoundError, ValidationError, BusinessRuleError } from './_lib/errors';
import type { PlotRepository } from '@/repositories/plot-repository';

export class PlotService {
  constructor(private plotRepository: PlotRepository) {}

  async update(input: UpdatePlotInput): Promise<Plot> {
    // Проверка существования через Repository
    const plot = await this.plotRepository.findById(input.id);
    if (!plot) {
      throw new NotFoundError('Plot', input.id);
    }

    // Валидация данных
    if (input.area && input.area <= 0) {
      throw new ValidationError('area', 'Площадь должна быть больше нуля');
    }

    // Проверка бизнес-правил
    if (plot.isLocked) {
      throw new BusinessRuleError('plot-lock', 'Участок заблокирован для изменений');
    }

    // Бизнес-логика...
    return this.plotRepository.update(input.id, input);
  }
}
```

### 3.3 Перехват ошибок в Handlers

```typescript
// В handler/controller сервисы вызываются с перехватом ошибок
export async function GET(request: NextRequest) {
  try {
    const plot = await getPlotService(id);
    return ApiResponse.success(plot);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return ApiResponse.notFound();
    }
    if (error instanceof ValidationError) {
      return ApiResponse.badRequest(error.message);
    }
    return ApiResponse.internal();
  }
}
```

### 3.4 Чек-лист обработки ошибок

- [ ] Нет generic `throw new Error('message')`
- [ ] Нет обработки `catch (e: any)` без разбора типов
- [ ] Все ошибки явно типизированы
- [ ] Handler перехватывает конкретные классы ошибок
- [ ] Бизнес-правила оборачиваются в `BusinessRuleError`
- [ ] Ошибки БД транслируются в доменные ошибки

---

## 4. Валидация данных

### 4.1 Zod схемы для input

Все входные данные сервисов должны валидироваться через Zod:

```typescript
import { z } from 'zod';

/** Схема входных данных для создания участка */
export const createPlotSchema = z.object({
  number: z.string().min(1, 'Номер участка обязателен').max(20),
  area: z.number().positive('Площадь должна быть положительной'),
  address: z.string().min(1, 'Адрес обязателен').max(200),
  ownerId: z.string().uuid(),
}).strict();

/** Схема для обновления участка */
export const updatePlotSchema = createPlotSchema.partial().extend({
  id: z.string().uuid(),
});

/** Схема запроса на получение списка */
export const listPlotsQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(['number', 'createdAt', 'area']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### 4.2 Валидация в сервисе

```typescript
export async function createPlotService(input: unknown): Promise<Plot> {
  // Валидация входных данных
  const parsed = createPlotSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    throw new ValidationError('input', `Невалидные данные: ${JSON.stringify(fieldErrors)}`);
  }

  // Безопасное использование parsed.data
  const data = parsed.data;
  // ... бизнес-логика
}
```

### 4.3 Бизнес-валидация

Помимо структурной валидации (Zod), сервисы должны выполнять бизнес-правила. Вся работа с БД для проверок — через Repository-абстракцию:

```typescript
import type { PlotRepository } from '@/repositories/plot-repository';

export class PlotService {
  constructor(private plotRepository: PlotRepository) {}

  async create(data: CreatePlotInput): Promise<Plot> {
    // Проверка уникальности через Repository
    const existing = await this.plotRepository.findByNumber(data.number);
    if (existing) {
      throw new ConflictError('plot-number', `Участок с номером "${data.number}" уже существует`);
    }

    // Проверка существования владельца через UserRepository
    const owner = await this.userRepository.findById(data.ownerId);
    if (!owner) {
      throw new NotFoundError('User', data.ownerId);
    }

    // Проверка бизнес-правил (пример)
    if (data.area < 10) {
      throw new BusinessRuleError('min-area', 'Минимальная площадь участка: 10 соток');
    }

    return this.plotRepository.create(data);
  }
}
```

> ℹ️ Все запросы к БД для бизнес-проверок делегируются Repository-репозиториям.

---

## 5. Работа с БД

### 5.1 Обязательное требование

Service **не должен** обращаться к Prisma (или любой другой ORM) напрямую. Весь доступ к данным осуществляется исключительно через Repository-абстракцию.

> ℹ️ Детальные требования к интерфейсам Repository и правилам реализации определяются в отдельной спецификации `docs/specs/components/repositories/repo-component-requirements.md`.

### 5.2 Принципы Repository паттерна

1. **Абстракция данных** — Service работает только с типизированными интерфейсами Repository, не зная о физической реализации
2. **Тестируемость** — Repository должен иметь интерфейс, позволяющий создавать mock/stub реализации для unit-тестов сервисов
3. **Сменяемость реализации** — при замене БД или ORM меняется только реализация Repository, интерфейс остаётся неизменным
4. **Разделение ответственности** — Service содержит бизнес-логику и правила валидации; Repository отвечает за корректный доступ к данным и трансформацию между ORM-моделями и доменными объектами

### 5.3 Интеграция с Service

Repository внедряется в сервис через конструктор (Dependency Injection):

- Интерфейс Repository определяется в `src/repositories/` как TypeScript-интерфейс
- Factory функция создаёт конкретную реализацию Repository и передаёт её в конструктор Service
- Service работает только с абстракцией интерфейса

### 5.4 Транзакции

Для операций, требующих атомарности:

- Service использует транзакции Repository (через метод `$transaction` или эквивалент)
- Все изменения данных в рамках одной бизнес-операции должны выполняться в одной транзакции
- Откат транзакции происходит автоматически при выбросе ошибки

### 5.5 Производительность и сложные запросы

Repository может инкапсулировать оптимизированные SQL-запросы для:

- Сложных агрегаций и аналитики
- Работы с сырыми SQL-запросами (`$queryRaw`, `$executeRaw`)
- Оптимизации N+1 запросов через batch-загрузки

При этом бизнес-логика Service не должна знать о деталях реализации SQL-запросов.

---

## 6. Паттерны сервисов

### 6.1 CRUD сервис

Стандартный набор операций для сущности. Все операции выполняются через Repository-абстракцию:

```typescript
// create — создание новой записи
export async function createUserService(data: CreateUserInput, userId: string): Promise<User>

// read (list) — список с пагинацией
export async function listUsersService(query: UserListQuery): Promise<PaginatedResult<User>>

// read (one) — получение одной записи
export async function getUserService(id: string): Promise<User>

// update — обновление записи
export async function updateUserService(id: string, data: UpdateUserInput, userId: string): Promise<User>

// delete — удаление записи
export async function deleteUserService(id: string, userId: string): Promise<void>
```

### 6.2 Композитный сервис

Сервис, агрегирующий данные из нескольких доменов через Repository-интерфейсы:

```typescript
export interface PlotDashboard {
  plot: Plot;
  members: Member[];
  charges: Charge[];
  payments: Payment[];
  notifications: Notification[];
}

export class PlotDashboardService {
  constructor(
    private plotRepository: PlotRepository,
    private memberRepository: MemberRepository,
    private chargeRepository: ChargeRepository,
    private paymentRepository: PaymentRepository,
    private notificationRepository: NotificationRepository,
  ) {}

  async getPlotDashboard(plotId: string): Promise<PlotDashboard> {
    // Параллельная загрузка через Repository — N+1 avoided via parallel execution
    const [plot, members, charges, payments, notifications] = await Promise.all([
      this.plotRepository.findByIdWithMembers(plotId),
      this.memberRepository.findByPlotId(plotId),
      this.chargeRepository.findByPlotId(plotId),
      this.paymentRepository.findByPlotId(plotId),
      this.notificationRepository.findByPlotId(plotId),
    ]);

    if (!plot) {
      throw new NotFoundError('Plot', plotId);
    }

    return {
      plot,
      members,
      charges,
      payments,
      notifications,
    };
  }
}
```

### 6.3 Транзакционный сервис

Сервис, выполняющий серию атомарных операций в рамках одной транзакции БД:

```typescript
export class ChargeProcessingService {
  constructor(
    private plotRepository: PlotRepository,
    private chargeRepository: ChargeRepository,
  ) {}

  /**
   * Обрабатывает ежемесячные начисления для всех активных участков.
   * Все операции выполняются в одной транзакции через Repository.
   */
  async processMonthlyCharges(month: Date): Promise<number> {
    // Транзакция через Repository-абстракцию
    const result = await this.plotRepository.transaction(async (txContext) => {
      // Получаем активные участки через транзакционный контекст
      const plots = await this.plotRepository.findAllActive(txContext);

      let createdCount = 0;
      for (const plot of plots) {
        await this.chargeRepository.create({
          plotId: plot.id,
          month,
          amount: this.calculateMonthlyCharge(plot),
        }, txContext);
        createdCount++;
      }

      return createdCount;
    });

    return result;
  }

  private calculateMonthlyCharge(plot: Plot): number {
    // Бизнес-логика расчёта
    return plot.area * 50; // пример: 50 руб/кв.м
  }
}
```

### 6.4 Domain Event сервис

Сервис, запускающий событие для других компонентов системы:

```typescript
export async function createPlotWithEventsService(data: CreatePlotInput, userId: string): Promise<Plot> {
  const plot = await createPlotService(data, userId);

  // Публикация события (через event bus или внутренний механизм)
  await eventBus.publish(new PlotCreatedEvent({
    plotId: plot.id,
    number: plot.number,
    createdById: userId,
    createdAt: new Date(),
  }));

  return plot;
}
```

---

## 7. Структура проекта Service слоя

### 7.1 Общая структура

```
src/services/
├── index.ts                          # Barrel exports
├── _lib/
│   ├── errors.ts                     # Классы ошибок
│   ├── validators.ts                 # Общие валидаторы
│   └── helpers.ts                    # Вспомогательные функции
├── core-service.ts                   # Core домен
├── accounting-service.ts             # Accounting домен
├── communication-service.ts          # Communication домен
├── publications-service.ts           # Publications домен
└── votes-service.ts                  # Votes домен
```

### 7.2 Barrel exports

```typescript
// src/services/index.ts
export * from './core-service';
export * from './accounting-service';
export * from './communication-service';
export * from './publications-service';
export * from './votes-service';

// Экспорт классов ошибок
export {
  ServiceError,
  ValidationError,
  NotFoundError,
  BusinessRuleError,
  ConflictError,
} from './_lib/errors';
```

### 7.3 Структура большого сервиса (подмодули)

```
src/services/
├── core/
│   ├── index.ts                      # Barrel exports
│   ├── plot-service.ts               # Сервис участков
│   ├── member-service.ts             # Сервис участников
│   └── user-service.ts               # Сервис пользователей
```

---

## 8. Тестирование

### 8.1 Структура тестов

```
src/services/
├── core-service.test.ts
├── accounting-service.test.ts
└── _lib/
    ├── errors.test.ts
    └── validators.test.ts
```

### 8.2 Правила тестирования

| Правило | Описание |
|---------|----------|
| **Unit тесты** | Каждый публичный метод сервиса должен быть протестирован |
| **Mock Repository** | Использовать mock-реализации Repository интерфейсов, а не Prisma |
| **Покрытие** | Минимум 80% покрытия сервисного слоя |
| **Названия тестов** | Описывать сценарий: `should throw NotFoundError when plot not found` |
| **AAA паттерн** | Arrange → Act → Assert в каждом тесте |

### 8.3 Пример теста (кратко)

```typescript
// Mock Repository через vi.fn()
const mockPlotRepository = { findByNumber: vi.fn(), create: vi.fn() } as Mock<PlotRepository>;

it('should create plot with valid input', async () => {
  mockPlotRepository.findByNumber.mockResolvedValue(null);   // Arrange: номер уникален
  mockPlotRepository.create.mockResolvedValue({ id: 'plot-1', number: '001' });
  const result = await service.create({ number: '001', area: 600 }, 'user-123'); // Act
  expect(result.number).toBe('001');                          // Assert
});

it('should throw ConflictError when plot number exists', async () => {
  mockPlotRepository.findByNumber.mockResolvedValue({ id: 'existing-plot' });
  await expect(service.create(input, 'user-123')).rejects.toThrow(ConflictError);
});
```

> 📄 Полный пример теста с импортами и `beforeEach` см. в [`docs/examples/plot-service.test.ts`](../../../examples/plot-service.test.ts)

---

## 9. Самодокументирование (JSDoc/TSDoc)

### 9.1 Обязательные элементы JSDoc

Каждая публичная функция сервиса должна иметь JSDoc:

| Элемент | Требуется | Описание |
|---------|-----------|----------|
| **Описание** | Да | Краткое назначение функции |
| **@remarks** | Опционально | Дополнительная информация, предупреждения |
| **@param** | Да | Все параметры с описанием |
| **@returns** | Да | Описание возвращаемого значения |
| **@throws** | Да | Все выбрасываемые ошибки |
| **@example** | Опционально | Пример использования |
| **@public** | Да | Маркер публичного API |

### 9.2 Шаблон JSDoc для сервиса

```typescript
/**
 * Создаёт новый участок с валидацией данных.
 *
 * @remarks
 * При создании участка автоматически создаётся запись в истории изменений.
 * Если участок с таким номером уже существует — выбрасывается ValidationError.
 *
 * @param input - Входные данные для создания участка
 * @param input.number - Уникальный номер участка
 * @param input.area - Площадь в квадратных метрах
 * @param input.address - Адрес участка
 * @param input.ownerId - ID владельца участка
 * @param userId - ID пользователя, создающего участок
 * @returns Созданный участок
 * @throws ValidationError если валидация не пройдена
 * @throws ConflictError если номер участка уже занят
 *
 * @example
 * ```typescript
 * try {
 *   const plot = await createPlotService(
 *     { number: '001', area: 600, address: 'ул. Садовая, 1', ownerId: 'user-123' },
 *     'user-123'
 *   );
 *   console.log('Создан участок:', plot.number);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Ошибка валидации:', error.message);
 *   }
 * }
 * ```
 *
 * @public
 */
export async function createPlotService(
  input: CreatePlotInput,
  userId: string
): Promise<Plot> {
  // ...
}
```

---

## 10. Чек-лист качества Service компонента

> ℹ️ **Полный чек-лист** Service-компонента — в [`shared/checklists.md#2-service`](../../shared/checklists.md#2-service)

---

## 11. Библиотеки и зависимости

> ℹ️ **Полный справочник** разрешённых/запрещённых зависимостей — в [`shared/dependencies.md#3-service`](../../shared/dependencies.md#3-service)

---

## 12. Примеры

### 12.1 Краткий пример: Service для управления участками

> ⚠️ Ниже — ключевые паттерны. Полный пример с Zod-схемами, всеми методами и factory — см. [`docs/examples/plot-service.ts`](../../../examples/plot-service.ts)

```typescript
// src/services/core/plot-service.ts — ключевые паттерны

export class PlotService {
  constructor(private plotRepository: PlotRepository) {}  // DI через конструктор

  /** @throws ValidationError, ConflictError */
  async create(input: unknown, userId: string): Promise<Plot> {
    const parsed = createPlotSchema.safeParse(input);            // 1. Zod валидация
    if (!parsed.success) throw new ValidationError('input', '...');

    const isUnique = await this.plotRepository.isNumberUnique(  // 2. Проверка бизнес-правила
      parsed.data.number
    );
    if (!isUnique) throw new ConflictError('plot-number', '...');

    return this.plotRepository.create({ ...parsed.data });       // 3. Создание через Repository
  }

  /** @throws NotFoundError */
  async getById(id: string): Promise<Plot> {
    const plot = await this.plotRepository.findById(id);         // 4. Запрос через Repository
    if (!plot) throw new NotFoundError('Plot', id);
    return plot;
  }
}

// Factory для DI
export function createPlotService(repo: PlotRepository): PlotService {
  return new PlotService(repo);
}
```

**Ключевые паттерны, проиллюстрированные примером:**
1. **DI** — Repository внедряется через конструктор
2. **Zod-валидация** — входные данные валидируются перед бизнес-логикой
3. **Доменные ошибки** — `ValidationError`, `NotFoundError`, `ConflictError` вместо generic `Error`
4. **Repository абстракция** — Service не обращается к Prisma напрямую
5. **Factory** — создание экземпляра вынесено в отдельную функцию

---

## 13. История изменений

> ℹ️ Единый журнал изменений — в [`CHANGELOG.md`](../../CHANGELOG.md)
