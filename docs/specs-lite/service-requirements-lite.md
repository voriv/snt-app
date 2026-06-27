# Service компоненты — Lite

> 📌 Сокращённая версия. Полная: [`service-component-requirements.md`](../specs/components/services/service-component-requirements.md) (931 строка)

---

## Принципы

1. **Чистая бизнес-логика** — Service не знает о фреймворках, HTTP, UI
2. **DI через конструктор** — Repository внедряется, не создаётся внутри
3. **Zod-валидация** — все входные данные валидируются
4. **Доменные ошибки** — `ValidationError`, `NotFoundError`, `ConflictError`, `BusinessRuleError`
5. **Repository абстракция** — прямой доступ к Prisma **запрещён**
6. **Одна ответственность** — одна функция = одна бизнес-операция

---

## Структура файла

```
src/services/
├── index.ts                    # Barrel exports
├── core-service.ts             # Core домен
├── accounting-service.ts       # Accounting домен
├── _lib/
│   ├── errors.ts               # Классы ошибок
│   ├── validators.ts           # Общие валидаторы
│   └── helpers.ts              # Вспомогательные функции
```

**Шаблон service файла:**
1. Импорт зависимостей
2. Типы и интерфейсы (`CreateXInput`, `UpdateXInput`, `XDetail`)
3. Zod схемы валидации
4. Service класс с DI
5. Factory для создания экземпляра

---

## Именование

| Сущность | Паттерн | Пример |
|----------|---------|--------|
| Файл | `<domain>-service.ts` | `core-service.ts` |
| Функция | `<action><Entity>Service` | `createPlotService()` |
| Input | `CreateXInput`, `UpdateXInput` | `CreatePlotInput` |
| Output | `XDetail`, `XListQuery` | `PlotDetail` |

---

## Ошибки

```typescript
// src/services/_lib/errors.ts
class ServiceError extends Error { }           // Базовый
class ValidationError extends ServiceError { } // Неверные данные
class NotFoundError extends ServiceError { }   // Не найдено
class ConflictError extends ServiceError { }    // Конфликт (дубликат)
class BusinessRuleError extends ServiceError { } // Нарушение бизнес-правила
```

**Запрещено:** `throw new Error('message')`, `catch (e: any)`

---

## Валидация

```typescript
// Zod — структурная валидация
const createPlotSchema = z.object({ number: z.string().min(1).max(20), area: z.number().positive() }).strict();

// Бизнес-валидация — через Repository
const existing = await this.plotRepository.findByNumber(data.number);
if (existing) throw new ConflictError('plot-number', '...');
```

---

## Ключевой паттерн (CRUD)

```typescript
export class PlotService {
  constructor(private plotRepository: PlotRepository) {}  // DI

  /** @throws ValidationError, ConflictError */
  async create(input: unknown, userId: string): Promise<Plot> {
    const parsed = createPlotSchema.safeParse(input);            // 1. Zod валидация
    if (!parsed.success) throw new ValidationError('input', '...');
    const isUnique = await this.plotRepository.isNumberUnique(  // 2. Бизнес-проверка
      parsed.data.number
    );
    if (!isUnique) throw new ConflictError('plot-number', '...');
    return this.plotRepository.create({ ...parsed.data });       // 3. Создание через Repository
  }

  /** @throws NotFoundError */
  async getById(id: string): Promise<Plot> {
    const plot = await this.plotRepository.findById(id);
    if (!plot) throw new NotFoundError('Plot', id);
    return plot;
  }
}

export function createPlotService(repo: PlotRepository): PlotService {
  return new PlotService(repo);                                  // Factory
}
```

---

## Транзакции

Через `Repository.transaction()`:
```typescript
await this.plotRepository.transaction(async (txContext) => {
  // Все операции в рамках одной транзакции
});
```

---

## Тестирование

| Правило | Описание |
|---------|----------|
| Mock Repository | `vi.fn()` для моков, не Prisma |
| Покрытие | ≥80% |
| AAA паттерн | Arrange → Act → Assert |
| Именование | `should throw NotFoundError when plot not found` |

---

## JSDoc — обязательные элементы

`@description`, `@param`, `@returns`, `@throws`, `@public` — для каждой публичной функции

---

📄 Полная спецификация: [`service-component-requirements.md`](../specs/components/services/service-component-requirements.md)
📄 Шаблон спецификации: [`spec-service-template.md`](../specs/components/services/spec-service-template.md)
📄 Чек-лист: [`shared/checklists.md#2-service`](../shared/checklists.md#2-service)
📄 Зависимости: [`shared/dependencies.md#3-service`](../shared/dependencies.md#3-service)