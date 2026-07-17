# 📦 ПРАВИЛА РАЗРАБОТКИ REPOSITORY

> **Версия:** v1.0  
> **Дата:** 2026-07-16  
> **Назначение:** Системный промпт — правила и контракты для слоя данных (Repository)  
> **Связанные файлы:** [`PROJECT.md`](PROJECT.md), [`MODEL.md`](MODEL.md), [`SPECS.md`](SPECS.md), [`CODE_REVIEW.md`](CODE_REVIEW.md)  
> **Детальная инструкция:** [`repository-prompt.md`](../prompt/repository-prompt.md)

---

## 1. Философия

Repository — это абстракция над базой данных, которая скрывает детали хранения от бизнес-логики.

```
Service → Repository Interface ← Repository Implementation (Prisma)
         (зависит от)            (реализует)
```

### Принципы

| Принцип | Описание |
|---------|----------|
| **Зависимость от абстракции** | Service зависит от `I<Entity>Repository`, не от `EntityRepository` |
| **Явный выбор полей** | Всегда использовать `select`, не `include` без причины |
| **Доменные типы** | Repository возвращает доменные типы, не Prisma-генерированные |
| **null ≠ error** | `findById` возвращает `null` — это не ошибка, а факт отсутствия |
| **Одна таблица = один метод** | Каждый метод работает с одной таблицей (кроме транзакций) |

---

## 2. Стратегия: Создание vs Дополнение

Определи режим работы по состоянию файлов:

| Условие | Режим | Действие |
|---------|-------|----------|
| `*.repository.interface.ts` не существует | **Создание с нуля** | Создать интерфейс + реализацию + тесты |
| `*.repository.interface.ts` существует | **Дополнение** | Добавить методы в существующие файлы |

### Определение домена

| Источник | Что извлекать |
|----------|---------------|
| План реализации (`docs/plans/us-XX-plan.md`) | ID задач, описание методов |
| `docs/model/entities/<entity>.md` | Поля, связи, инварианты |
| `prisma/schema.prisma` | Модели, типы, индексы |
| `src/domains/<domain>/<domain>.types.ts` | DTO-типы |

> ⚠️ Если `prisma/schema.prisma` не соответствует `docs/model/entities/*.md` — остановись и сообщи пользователю.

---

## 3. Интерфейс (`*.repository.interface.ts`)

### Обязательные JSDoc-теги

| Тег | Уровень | Обязательность |
|-----|---------|----------------|
| `@interface` | Файл | ✅ |
| `@domain` | Файл | ✅ |
| `@description` | Файл + каждый метод | ✅ |
| `@spec` | Файл + каждый метод | ✅ |
| `@param` | Каждый метод | ✅ |
| `@returns` | Каждый метод | ✅ |
| `@throws` | Каждый метод (если применимо) | ✅ |
| `@see` | Файл | ✅ |

### Правила методов

| Метод | Возвращает | Бросает ошибку | Описание |
|-------|-----------|----------------|----------|
| `findById` | `Entity \| null` | ❌ Нет | null = запись отсутствует |
| `findAll` | `Entity[]` | ❌ Нет | пустой массив = записей нет |
| `findBy<Field>` | `Entity \| null` | ❌ Нет | поиск по одному полю |
| `create` | `Entity` | ✅ P2002 → DuplicateError | валидация в Service, не в Repo |
| `update` | `Entity` | ✅ P2025 → NotFoundError | частичное обновление |
| `delete` | `void` | ✅ P2025 → NotFoundError | физическое удаление |
| `exists` | `boolean` | ❌ Нет | true/false |

### Краткий шаблон

```typescript
/**
 * @interface I<Entity>Repository
 * @domain <domain>
 * @description Контракт доступа к данным <описание>
 *
 * @spec
 * - Все методы асинхронные
 * - findById возвращает null если не найдена — НЕ бросает ошибку
 *
 * @see docs/model/entities/<entity>.md
 */
export interface I<Entity>Repository {
  findById(id: string): Promise<Entity | null>;
  create(data: CreateInput): Promise<Entity>;
  // ...
}
```

### Чек-лист

- [ ] JSDoc заполнен для файла и каждого метода
- [ ] Методы соответствуют плану реализации
- [ ] Использует типы из `*.types.ts` (не Prisma-генерированные)
- [ ] `npm run type-check` — 0 ошибок

---

## 4. Prisma-реализация (`*.repository.prisma.ts`)

### Обязательные JSDoc-теги

| Тег | Уровень | Обязательность |
|-----|---------|----------------|
| `@class` | Файл | ✅ |
| `@domain` | Файл | ✅ |
| `@description` | Файл + каждый метод | ✅ |
| `@spec` | Файл + каждый метод | ✅ |
| `@param` | Каждый метод | ✅ |
| `@returns` | Каждый метод | ✅ |
| `@throws` | Каждый метод (если применимо) | ✅ |
| `@see` | Файл | ✅ |

### Правила select vs include

| Правило | Описание |
|---------|----------|
| **select — по умолчанию** | Явно перечислять поля. Защита от утечек данных |
| **include — только для связей** | Когда нужны связанные сущности (например, `participants` в `Conversation`) |
| **Никогда без select/include** | Сырой `findMany()` без выбора полей = все поля БД |

### Правила обработки ошибок

| Прisma-ошибка | Доменная ошибка | Когда возникает |
|---------------|----------------|-----------------|
| `P2002` | `DuplicateError` | Нарушение уникального ограничения |
| `P2025` | `NotFoundError` | Record not found при update/delete |
| Другая | Перебросить как есть | Unexpected error — пусть обрабатывает вызывающий |

### Правила транзакций

```typescript
async create(data: CreateInput): Promise<Entity> {
  try {
    const record = await prisma.$transaction(async (tx) => {
      // 1. Найти связанные сущности
      // 2. Создать основную запись
      // 3. Создать связанные записи
      return created;
    });
    return mapToDomain(record);
  } catch (error) {
    if (error.code === 'P2002') throw new DuplicateError(...);
    throw error;
  }
}
```

**Ключевые правила транзакций:**

| Правило | Описание |
|---------|----------|
| **Обёртка в try/catch** | Каждая транзакция обрабатывает P2002 |
| **Откат автоматический** | При ошибке внутри `async (tx)` транзакция откатится |
| **Прозрачность** | Service не должен знать, что используется транзакция |

### Краткий шаблон

```typescript
/**
 * @class <Entity>Repository
 * @domain <domain>
 * @description Реализация через Prisma Client
 *
 * @spec
 * - Использует singleton Prisma Client
 * - Преобразует Prisma-результаты в доменные типы
 *
 * @see *.repository.interface.ts
 */
export class <Entity>Repository implements I<Entity>Repository {
  async findById(id: string): Promise<Entity | null> {
    const record = await prisma.<model>.findUnique({
      where: { id },
      select: { id: true /* ... */ },
    });
    if (!record) return null;
    return { id: record.id /* ... */ };
  }
  // ...
}
```

### Чек-лист

- [ ] JSDoc заполнен
- [ ] `implements I<Entity>Repository`
- [ ] Использует `select` (не `include` без причины)
- [ ] Преобразует Prisma → доменный тип
- [ ] Обработка P2002/P2025 через доменные ошибки
- [ ] Транзакции (если требуется) с try/catch
- [ ] `npm run type-check` — 0 ошибок
- [ ] `npm run test:unit` — существующие тесты не падают

---

## 5. Unit-тесты (`*.repository.test.ts`)

### Паттерн моков

```typescript
// 1. vi.hoisted для моков
const prismaMocks = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
}));

// 2. vi.mock для prisma/client
vi.mock('@/infrastructure/prisma/client', () => ({
  prisma: {
    <model>: {
      findUnique: (...args) => prismaMocks.mockFindUnique(...args),
    },
  },
}));
```

### Обязательная структура

```
describe('EntityRepository')
├── beforeEach — vi.clearAllMocks + new Repository()
├── describe('findById')
│   ├── it('should return entity when found')
│   └── it('should return null when not found')
├── describe('create')
│   ├── it('should create entity successfully')
│   └── it('should throw DuplicateError on P2002')
├── describe('update')
│   ├── it('should update entity')
│   └── it('should throw NotFoundError on P2025')
└── ...
```

### Матрица обязательных тестов

| Метод | Happy Path | Edge Case | Ошибка |
|-------|-----------|-----------|--------|
| `findById` | ✅ Найдена → entity | ✅ Не найдена → null | ❌ Нет |
| `findAll` | ✅ Есть → [] | ✅ Нет → [] | ❌ Нет |
| `create` | ✅ Создана | — | ✅ P2002 → DuplicateError |
| `update` | ✅ Обновлена | — | ✅ P2025 → NotFoundError |
| `delete` | ✅ Удалена | — | ✅ P2025 → NotFoundError |
| `exists` | ✅ true | ✅ false | ❌ Нет |

### Тесты транзакций

```typescript
describe('create (with transaction)', () => {
  it('should create in transaction', async () => {
    const txCreate = vi.fn().mockResolvedValueOnce(mockData);
    prismaMocks.mockTransaction.mockImplementation((cb) => cb({ <model>: { create: txCreate } }));
    const result = await repository.create(input);
    expect(result).toEqual(mockData);
  });
});
```

### Чек-лист

- [ ] `vi.hoisted()` + `vi.mock()` для prisma/client
- [ ] `describe` для каждого метода
- [ ] Happy path + edge case + error для каждого метода
- [ ] Тесты транзакций (если применимо)
- [ ] Assertions проверяют вызов Prisma с корректными аргументами
- [ ] `npm run test:unit` — все PASS

---

## 6. Строгие запреты

| # | Запрет | Обоснование |
|---|--------|-------------|
| 1 | ❌ Использовать `any` / `unknown` как обход | `strict: true` |
| 2 | ❌ Пропускать `type-check` после каждого шага | Раннее обнаружение |
| 3 | ❌ Создать реализацию без интерфейса | Clean Architecture |
| 4 | ❌ Использовать `prisma` напрямую в сервисе | Зависимость от абстракции |
| 5 | ❌ Возвращать `undefined` вместо `null` | Контракт: null = отсутствует |
| 6 | ❌ Бросать `Error` напрямую | Использовать доменные ошибки |
| 7 | ❌ Дублировать типы | Использовать `*.types.ts` |
| 8 | ❌ Менять существующие методы без необходимости | Ghost fixes запрещены |
| 9 | ❌ Пропускать JSDoc | Spec-Driven Development |
| 10 | ❌ `export default` | Named exports только |
| 11 | ❌ Запрос без `select` | Явный выбор полей |
| 12 | ❌ Игнорировать ошибки транзакций | Обработка обязательна |

---

## 7. Команды проверки

| Этап | Команда | Ожидаемый результат |
|------|---------|-------------------|
| После интерфейса | `npm run type-check` | 0 ошибок |
| После реализации | `npm run type-check` | 0 ошибок |
| После реализации | `npm run test:unit -- tests/unit/domains/<domain>/` | Существующие тесты не падают |
| После тестов | `npm run type-check` | 0 ошибок |
| После тестов | `npm run test:unit` | Все PASS |
| Финальная верификация | `npm run type-check` + `npm run test:unit` | 0 ошибок + все PASS |

---

## 8. Связь с другими правилами

| Правило | Связь |
|---------|-------|
| [`PROJECT.md`](PROJECT.md) | §7.5 Repository (интерфейс + реализация), §7.7 DI |
| [`MODEL.md`](MODEL.md) | §3 Порядок внесения изменений, §5 Конвенции |
| [`SPECS.md`](SPECS.md) | §5.4 Repository JSDoc-аннотации |
| [`CODE_REVIEW.md`](CODE_REVIEW.md) | Чек-лист проверки Repository |
| [`repository-prompt.md`](../prompt/repository-prompt.md) | Пошаговая инструкция для выполнения |

---

## 9. Референсы

| Домен | Файл | Примечание |
|-------|------|-----------|
| Auth | [`auth.repository.interface.ts`](../../src/domains/auth/auth.repository.interface.ts) | Многотабличная операция |
| Auth | [`auth.repository.prisma.ts`](../../src/domains/auth/auth.repository.prisma.ts) | `prisma.$transaction()` |
| Auth | [`auth.repository.test.ts`](../../tests/unit/domains/auth/auth.repository.test.ts) | Полный паттерн моков |
| UserProfile | [`userProfile.repository.test.ts`](../../tests/unit/domains/userProfile/userProfile.repository.test.ts) | CRUD тесты |

---

**Последнее обновление:** 2026-07-16
