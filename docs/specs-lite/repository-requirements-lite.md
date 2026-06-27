# Repository компоненты — Lite

> 📌 Сокращённая версия. Полная: [`repository-component-requirements.md`](../specs/components/repositories/repository-component-requirements.md) (330 строк)

---

## Принципы

1. **Изоляция данных** — Service зависит от абстракций (интерфейсов), не от конкретной реализации
2. **Чистые интерфейсы** — возвращают Domain-объекты/DTO, не ORM-типы
3. **Безопасность** — строгая типизация, параметризированные запросы
4. **Управление транзакциями** — явные механизмы для атомарных операций

---

## Структура файлов

```
src/repositories/
├── index.ts                  # Barrel exports (интерфейсы + factory)
├── <entity>-repository.ts    # Интерфейс (контракт)
├── _types/pagination.ts      # Общие типы пагинации
├── _lib/errors.ts           # RepositoryError, UniqueConstraintError
└── _impl/                   # Конкретные реализации (скрыты)
    ├── index.ts
    ├── base-repository.ts
    ├── <entity>-repository-impl.ts
    └── raw-queries.ts
```

**Service импортирует только интерфейс. Реализация внедряется через Factory.**

---

## Интерфейс (контракт)

```typescript
export interface EntityRepository {
  create(data: CreateEntityData): Promise<Entity>;
  findById(id: string): Promise<Entity | null>;
  findByUniqueField(field: string): Promise<Entity | null>;
  findAll(query: PaginationOptions): Promise<PaginatedResult<Entity>>;
  update(id: string, data: Partial<CreateEntityData>): Promise<Entity>;
  delete(id: string): Promise<void>;
  exists(field: string, value: string): Promise<boolean>;
}
```

**Расширенные методы (Relations):** `findByIdWithRelations(id)` → `EntityWithRelations | null`

---

## Реализация

**Правила:**
1. Запрещено возвращать ORM-объекты напрямую — маппинг в чистые объекты
2. Ошибки БД → доменные ошибки (`RepositoryError`, `UniqueConstraintError`)
3. Поддержка инъекции `TransactionClient` для атомарных операций

```typescript
async create(data: CreateEntityData, tx?: TransactionClient): Promise<Entity> {
  const client = tx || orm;
  return await client.entity.create({ data });
}
```

---

## Сырые SQL-запросы

**Разрешены только:**
1. Аналитика и агрегация (оконные функции, GROUP BY)
2. Массовые операции (bulk >1000 записей)
3. Специфичные функции БД (JSONB, полнотекстовый поиск)

**Правила безопасности:**
- Только параметризированные запросы (tagged templates)
- Явная типизация результата

```typescript
// ✅ Правильно
const query = sql`SELECT category, count(id) as total FROM entity WHERE status = ${'active'} GROUP BY category`;
// ❌ Запрещено: строковая конкатенация
```

**Именование методов SQL:** префикс `query...` — `queryRaw<T>(...)`

---

## Тестирование

| Тип | Описание |
|-----|----------|
| Unit | Маппинг ORM → DTO, трансформация ошибок |
| Integration | Реальная БД в транзакциях с откатом |
| **No-Mock** | Запрещены Mock-базы данных |

---

📄 Полная спецификация: [`repository-component-requirements.md`](../specs/components/repositories/repository-component-requirements.md)
📄 Зависимости: [`shared/dependencies.md#5-repository`](../shared/dependencies.md#5-repository)