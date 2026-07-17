# 🛠️ ПРАВИЛА РАЗРАБОТКИ SERVICE

> **Версия:** v1.0  
> **Дата:** 2026-07-16  
> **Назначение:** Системный промпт — правила и контракты для слоя бизнес-логики (Service)  
> **Связанные файлы:** [`PROJECT.md`](PROJECT.md), [`SPECS.md`](SPECS.md), [`CODE_REVIEW.md`](CODE_REVIEW.md)  
> **Детальная инструкция:** [`service-prompt.md`](../prompt/service-prompt.md)

---

## 1. Философия

Service — это слой бизнес-логики, который инкапсулирует доменные правила, валидацию и оркестрацию операций.

```
API Route Handler → Service → Repository Interface
                     (вызывает)   (зависит от)
```

### Принципы

| Принцип | Описание |
|---------|----------|
| **Чистая бизнес-логика** | Сервис содержит только бизнес-правила, без UI/HTTP-логики |
| **Валидация на входе** | Все входные данные валидируются Zod-схемами |
| **Доменные ошибки** | Использовать типизированные ошибки, а не generic `Error` |
| **Зависимость от абстракции** | Service зависит от `I<Entity>Repository`, не от `EntityRepository` |
| **Явная обработка ошибок** | Каждый `catch` явно обрабатывает типы ошибок |
| **Оркестрация сервисов** | При зависимости от других сервисов — вызов через DI |

---

## 2. Стратегия: Создание vs Дополнение

Определи режим работы по состоянию файлов:

| Условие | Режим | Действие |
|---------|-------|----------|
| `*.service.ts` не существует | **Создание с нуля** | Создать сервис + тесты + DI-регистрацию |
| `*.service.ts` существует | **Дополнение** | Добавить методы в существующий файл |

### Определение домена

| Источник | Что извлекать |
|----------|---------------|
| План реализации (`docs/plans/us-XX-plan.md`) | ID задач, описание методов |
| `docs/model/entities/<entity>.md` | Бизнес-правила, инварианты |
| `src/domains/<domain>/<domain>.repository.interface.ts` | Доступные методы репозитория |
| `src/domains/<domain>/<domain>.types.ts` | DTO-типы |
| `src/domains/<domain>/<domain>.validators.ts` | Zod-схемы |
| `src/domains/<domain>/<domain>.errors.ts` | Доменные ошибки |

> ⚠️ Если репозиторий не существует, а сервис требует его — остановись и сообщи пользователю.

---

## 3. Сервис (`*.service.ts`)

### Обязательные JSDoc-теги

| Тег | Уровень | Обязательность |
|-----|---------|----------------|
| `@service` | Файл | ✅ |
| `@domain` | Файл | ✅ |
| `@description` | Файл + каждый метод | ✅ |
| `@spec` | Файл + каждый метод | ✅ |
| `@param` | Каждый метод | ✅ |
| `@returns` | Каждый метод | ✅ |
| `@throws` | Каждый метод (если применимо) | ✅ |
| `@see` | Файл | ✅ |

### Правила методов

| Аспект | Правило |
|--------|---------|
| **Валидация** | Все входные данные через Zod-схемы до бизнес-логики |
| **Бизнес-инварианты** | Проверять до вызова репозитория |
| **Null safety** | Проверять `null` результаты от репозитория |
| **Ошибки** | Доменные ошибки перебрасываются как есть |
| **ЗodError** | Преобразовать в `ValidationError` с сообщениями |
| **Прочие ошибки** | Оборачивать в `ValidationError` |

### Краткий шаблон

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
 */
import type { I<Entity>Repository } from './<domain>.repository.interface';
import { create<Entity>Schema } from './<domain>.validators';
import { <Entity>NotFoundError, <Entity>InvalidDataError } from './<domain>.errors';
import { ZodError } from 'zod';

export class <Entity>Service {
  constructor(private readonly repository: I<Entity>Repository) {}

  /**
   * Краткое описание метода
   *
   * @param id - Описание параметра
   * @returns Описание результата
   * @throws {<Entity>NotFoundError} если не найдено
   *
   * @spec
   * - Шаг 1: Валидация входных данных
   * - Шаг 2: Бизнес-логика
   * - Шаг 3: Вызов репозитория
   */
  async methodName(id: string): Promise<ReturnType> {
    try {
      // Валидация
      const validated = create<Entity>Schema.parse({ id });

      // Бизнес-логика
      const entity = await this.repository.findById(validated.id);
      if (!entity) {
        throw new <Entity>NotFoundError(validated.id);
      }

      return entity;
    } catch (error) {
      if (error instanceof <Entity>NotFoundError) throw error;
      if (error instanceof ZodError) {
        throw new <Entity>InvalidDataError(error.message);
      }
      throw new <Entity>InvalidDataError('Ошибка при обработке запроса');
    }
  }
}
```

### Обработка ошибок

```typescript
try {
  // Бизнес-логика
} catch (error) {
  // 1. Доменные ошибки перебрасываются как есть
  if (error instanceof DomainError) throw error;

  // 2. Zod-ошибки преобразуются в ValidationError
  if (error instanceof ZodError) {
    throw new ValidationError(error.message);
  }

  // 3. Прочие ошибки оборачиваются
  throw new ValidationError('Произошла ошибка');
}
```

| Тип ошибки | Обработка |
|------------|-----------|
| Доменная ошибка (`NotFoundError`, `DuplicateError` и т.д.) | Перебросить как есть |
| `ZodError` | Преобразовать в `ValidationError` |
| Ошибка от репозитория | Перебросить или преобразовать |
| Прочая ошибка | Оборачивать в `ValidationError` |

### Чек-лист

- [ ] JSDoc заполнен для файла и каждого метода
- [ ] Методы соответствуют плану реализации
- [ ] Валидация входных данных через Zod
- [ ] Обработка ошибок через доменные классы
- [ ] DI через конструктор
- [ ] `npm run type-check` — 0 ошибок

---

## 4. DI-регистрация (`container.ts`)

### Правила

| Правило | Описание |
|---------|----------|
| **Фабричный паттерн** | Использовать фабрики для создания сервисов |
| **Singleton по умолчанию** | Сервис без состояния — singleton |
| **Явные зависимости** | Все зависимости репозиториев получаются из контейнера |

### Шаблон фабрики

```typescript
// src/di/container.ts

// Токен
export const ENTITY_SERVICE_TOKEN = 'ENTITY_SERVICE_TOKEN';

// Фабрика
export const create<Entity>Service = (container: Container): <Entity>Service => {
  const repository = container.get<I<Entity>Repository>(ENTITY_REPOSITORY_TOKEN);
  return new <Entity>Service(repository);
};

// Регистрация
this.bind(create<Entity>Service);
```

### Чек-лист

- [ ] Фабрика создана
- [ ] Токен зарегистрирован
- [ ] Зависимости получены из контейнера
- [ ] `npm run type-check` — 0 ошибок

---

## 5. Unit-тесты (`*.service.test.ts`)

### Паттерн моков

```typescript
// 1. Создание мока репозитория
const createMockRepository = (): Mock<I<Entity>Repository> => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

// 2. Настройка перед каждым тестом
beforeEach(() => {
  vi.clearAllMocks();
  mockRepository = createMockRepository();
  service = new <Entity>Service(mockRepository);
});
```

### Обязательная структура

```
describe('EntityService')
├── beforeEach — clearAllMocks + new Service(mockRepo)
├── describe('findById')
│   ├── it('should return entity when found')
│   └── it('should throw NotFoundError when not found')
├── describe('create')
│   ├── it('should create entity successfully')
│   └── it('should throw InvalidDataError on validation failure')
├── describe('update')
│   ├── it('should update entity')
│   └── it('should throw NotFoundError when not found')
└── ...
```

### Матрица обязательных тестов

| Метод | Happy Path | Edge Case | Ошибка |
|-------|-----------|-----------|--------|
| `findById` | ✅ Найдена → entity | — | ✅ Не найдена → NotFoundError |
| `findAll` | ✅ Есть → [] | ✅ Нет → [] | ❌ Нет |
| `create` | ✅ Создана | ✅ Границы | ✅ Валидация → InvalidDataError, ✅ Дубликат → DuplicateError |
| `update` | ✅ Обновлена | ✅ Частичное | ✅ Не найдена → NotFoundError, ✅ Валидация |
| `delete` | ✅ Удалена | ✅ Зависимости | ✅ Не найдена → NotFoundError |
| Бизнес-правила | ✅ Соблюдено | ✅ Границы | ✅ Нарушение → BusinessRuleError |

### Чек-лист

- [ ] `vi.clearAllMocks()` в `beforeEach`
- [ ] `describe` для каждого метода
- [ ] Happy path + edge case + error для каждого метода
- [ ] Моки репозитория для всех вызываемых методов
- [ ] Assertions проверяют вызов репозитория с корректными аргументами
- [ ] `npm run test:unit` — все PASS

---

## 6. Строгие запреты

| # | Запрет | Обоснование |
|---|--------|-------------|
| 1 | ❌ Использовать `any` / `unknown` как обход | `strict: true` |
| 2 | ❌ Пропускать `type-check` после каждого шага | Раннее обнаружение |
| 3 | ❌ Сервис без валидации входных данных | Защита от некорректных данных |
| 4 | ❌ Прямое обращение к БД | Только через репозиторий |
| 5 | ❌ Возвращать `undefined` вместо `null` | Контракт: null = отсутствует |
| 6 | ❌ Бросать `Error` напрямую | Использовать доменные ошибки |
| 7 | ❌ Дублировать бизнес-логику | DRY |
| 8 | ❌ Менять существующие методы без необходимости | Ghost fixes запрещены |
| 9 | ❌ Пропускать JSDoc | Spec-Driven Development |
| 10 | ❌ `export default` | Named exports только |
| 11 | ❌ UI/HTTP-логика в сервисе | Разделение ответственности |
| 12 | ❌ Игнорировать бизнес-инварианты | Корректность логики |

---

## 7. Команды проверки

| Этап | Команда | Ожидаемый результат |
|------|---------|-------------------|
| После скелета | `npm run type-check` | 0 ошибок |
| После реализации | `npm run type-check` | 0 ошибок |
| После тестов | `npm run type-check` | 0 ошибок |
| После тестов | `npm run test:unit -- tests/unit/domains/<domain>/` | Все PASS |
| Финальная верификация | `npm run type-check` + `npm run test:unit` | 0 ошибок + все PASS |

---

## 8. Связь с другими правилами

| Правило | Связь |
|---------|-------|
| [`PROJECT.md`](PROJECT.md) | §7.6 Service (бизнес-логика) |
| [`SPECS.md`](SPECS.md) | §5.3 Service JSDoc-аннотации |
| [`CODE_REVIEW.md`](CODE_REVIEW.md) | Чек-лист проверки Service |
| [`service-prompt.md`](../prompt/service-prompt.md) | Пошаговая инструкция для выполнения |

---

## 9. Референсы

| Домен | Файл | Примечание |
|-------|------|-----------|
| Auth | [`auth.service.ts`](../../src/domains/auth/auth.service.ts) | Регистрация/аутентификация с bcrypt |
| Users | [`users.service.ts`](../../src/domains/users/users.service.ts) | Список пользователей с пагинацией |
| Plot | [`plot.service.ts`](../../src/domains/plot/plot.service.ts) | CRUD для участков |

---

**Последнее обновление:** 2026-07-16