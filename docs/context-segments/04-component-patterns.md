# Паттерны компонентов

> 📌 Контекстный сегмент. Полные версии: [`component-requirements.md`](../specs/components/component-requirements.md), [`service-component-requirements.md`](../specs/components/services/service-component-requirements.md), [`repository-component-requirements.md`](../specs/components/repositories/repository-component-requirements.md)

---

## Architecture: Clean Layered

```
API Router (route.ts) → Service → Repository → Prisma/DB
```

**Правило:** Каждый уровень знает только о нижележащем. Service не знает о HTTP, Repository не знает о бизнес-логике.

---

## Service слой

### Принципы
- Чистая бизнес-логика, без фреймворков, HTTP, UI
- DI через конструктор: Repository внедряется как зависимость
- Весь доступ к БД — **только через Repository абстракцию** (прямые вызовы Prisma запрещены)
- Factory функция для создания экземпляра

### Структура файла сервиса

```typescript
// 1. Импорт зависимостей
import type { PlotRepository } from '@/repositories/plot-repository'
import { z } from 'zod'
import { ValidationError, ConflictError, NotFoundError } from '../_lib/errors'

// 2. Типы и интерфейсы
export interface CreatePlotInput { number: string; area: number; address: string; ownerId: string }

// 3. Zod схемы валидации
const createPlotSchema = z.object({
  number: z.string().min(1).max(20),
  area: z.number().positive(),
  address: z.string().min(1).max(200),
  ownerId: z.string().uuid(),
}).strict()

// 4. Service класс с DI
export class PlotService {
  constructor(private plotRepository: PlotRepository) {}

  async create(input: unknown, userId: string): Promise<Plot> {
    const parsed = createPlotSchema.safeParse(input)              // Zod валидация
    if (!parsed.success) throw new ValidationError('input', '...')

    const isUnique = await this.plotRepository.isNumberUnique(    // Бизнес-проверка
      parsed.data.number
    )
    if (!isUnique) throw new ConflictError('plot-number', '...')

    return this.plotRepository.create({ ...parsed.data })         // Создание через Repository
  }
}

// 5. Factory
export function createPlotService(repo: PlotRepository): PlotService {
  return new PlotService(repo)
}
```

### Расположение файлов

```
src/services/
├── index.ts                    # Barrel exports
├── core-service.ts             # Core домен
├── accounting-service.ts       # Accounting домен
├── communication-service.ts    # Communication домен
├── publications-service.ts     # Publications домен
├── votes-service.ts            # Votes домен
└── _lib/
    ├── errors.ts               # Доменно-специфичные ошибки
    ├── validators.ts           # Общие валидаторы
    └── helpers.ts              # Вспомогательные функции
```

### Паттерны сервисов

| Паттерн | Описание | Когда использовать |
|---------|----------|-------------------|
| **CRUD** | Стандартный create/list/get/update/delete | Для простых сущностей |
| **Композитный** | Агрегирует данные из нескольких Repository | Для dashboard/reports |
| **Транзакционный** | Атомарные операции в `$transaction` | Для финансовых операций |
| **Domain Event** | Публикация события после бизнес-операции | Для уведомлений и side-effects |

---

## Repository слой

### Интерфейс

```typescript
export interface PlotRepository {
  findById(id: string): Promise<Plot | null>
  findByIdWithMembers(id: string): Promise<PlotWithMembers | null>
  findByNumber(number: string): Promise<Plot | null>
  isNumberUnique(number: string, excludeId?: string): Promise<boolean>
  create(data: CreatePlotInput): Promise<Plot>
  update(id: string, data: UpdatePlotInput): Promise<Plot>
  delete(id: string): Promise<boolean>
  findAllActive(txContext?: unknown): Promise<Plot[]>
  transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>
}
```

### Принципы
- Интерфейс в `src/repositories/`, реализация через Prisma
- Транзакции через Prisma `$transaction`
- Маппинг Prisma моделей → доменные типы
- Оптимизация N+1 через batch-загрузки

---

## Доменные ошибки

```typescript
// src/services/_lib/errors.ts
class ServiceError extends Error { ... }

class ValidationError extends ServiceError {
  constructor(field: string, message: string) { ... }
}

class NotFoundError extends ServiceError {
  constructor(entity: string, id: string) { ... }
}

class ConflictError extends ServiceError {
  constructor(resource: string, reason: string) { ... }
}

class BusinessRuleError extends ServiceError {
  constructor(rule: string, message: string) { ... }
}
```

---

## JSDoc шаблон

```typescript
/**
 * Создаёт новый участок с валидацией данных.
 *
 * @param input - Входные данные для создания участка
 * @param userId - ID пользователя, создающего участок
 * @returns Созданный участок
 * @throws ValidationError если валидация не пройдена
 * @throws ConflictError если номер участка уже занят
 *
 * @public
 */
```

---

## Тестирование

- **Unit тесты:** каждый публичный метод сервиса
- **Mock Repository:** `vi.fn()` для имитации Repository интерфейсов
- **AAA паттерн:** Arrange → Act → Assert
- **Минимум 80%** покрытия сервисного слоя

```typescript
const mockRepo = { findByNumber: vi.fn(), create: vi.fn() } as Mock<PlotRepository>

it('should throw ConflictError when number exists', async () => {
  mockRepo.findByNumber.mockResolvedValue({ id: 'existing' })
  await expect(service.create(input, 'user-123')).rejects.toThrow(ConflictError)
})
```

---

📄 Общие требования: [`component-requirements.md`](../specs/components/component-requirements.md)
📄 Service требования: [`service-component-requirements.md`](../specs/components/services/service-component-requirements.md)
📄 Repository требования: [`repository-component-requirements.md`](../specs/components/repositories/repository-component-requirements.md)