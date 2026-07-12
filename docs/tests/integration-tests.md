# 🔗 Integration-тесты: Подход к реализации

## Обзор

Integration-тесты проверяют взаимодействие между слоями приложения с использованием **реальной базы данных**. Они находятся между Unit-тестами (полная изоляция) и E2E-тестами (полный стек).

### Когда использовать Integration-тесты

| Сценарий | Unit | Integration | E2E |
|----------|------|-------------|-----|
| Тестирование бизнес-логики | ✅ | | |
| Тестирование SQL-запросов | | ✅ | |
| Тестирование Prisma-моделей | | ✅ | |
| Тестирование API-контрактов | | ✅ | |
| Проверка с транзакциями | | ✅ | |
| Полный пользовательский поток | | | ✅ |

---

## Стек

| Инструмент | Назначение |
|------------|-----------|
| **Vitest** | Фреймворк для запуска тестов |
| **PostgreSQL (Docker/Podman)** | Тестовая база данных |
| **Prisma Client** | ORM для работы с БД |
| **Supertest** | HTTP-клиент для тестирования API |

---

## Структура

```
tests/integration/
├── setup.ts                    # Настройка тестовой БД
├── global-setup.ts             # Запуск/остановка Docker
├── helpers.ts                  # Утилиты для тестов
├── domains/
│   ├── plot.test.ts
│   ├── plotUser.test.ts
│   ├── roles.test.ts
│   └── userProfile.test.ts
└── shared/
    └── auth.test.ts
```

---

## Настройка тестовой базы данных

### Вариант A: PostgreSQL в Docker/Podman (Рекомендуется)

**docker-compose.test.yml:**

```yaml
version: '3.8'

services:
  test-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: snt_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 5s
      retries: 5
```

**Запуск:**
```bash
# Запуск тестовой БД
docker-compose -f docker-compose.test.yml up -d

# Остановка
docker-compose -f docker-compose.test.yml down
```

---

### Вариант B: SQLite in-memory (Быстрая разработка)

**prisma/schema.test.prisma:**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./test.db"
}
```

**Недостатки:**
- SQL-синтаксис может отличаться от PostgreSQL
- Нет проверки совместимости с production
- Некоторые ограничения (LIMIT/OFFSET)

---

## Конфигурация

### tests/integration/global-setup.ts

```typescript
import { execSync } from 'child_process';

export default function globalSetup() {
  // Запуск PostgreSQL в Docker
  execSync('docker-compose -f docker-compose.test.yml up -d', {
    stdio: 'inherit',
  });

  // Ожидание готовности БД
  let ready = false;
  let attempts = 0;
  while (!ready && attempts < 20) {
    try {
      execSync('docker exec test-db pg_isready -U test', { stdio: 'ignore' });
      ready = true;
    } catch {
      attempts++;
      setTimeout(() => {}, 1000);
    }
  }

  if (!ready) {
    throw new Error('Test database did not start in time');
  }
}
```

### tests/integration/setup.ts

```typescript
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

// Запуск перед всеми тестами
export async function setup() {
  await prisma.$connect();

  // Применяем миграции к тестовой БД
  execSync('npx prisma migrate deploy --schema prisma/schema.test.prisma', {
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://test:test@localhost:5433/snt_test',
    },
  });
}

// Очистка после каждого теста
export async function teardownEach() {
  // Очищаем все таблицы (с учётом ограничений FK)
  await prisma.$transaction([
    prisma.plotUser.deleteMany(),
    prisma.plotUserRoleHistory.deleteMany(),
    prisma.plotUserRole.deleteMany(),
    prisma.plot.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.roleApiEndpoint.deleteMany(),
    prisma.rolePage.deleteMany(),
    prisma.role.deleteMany(),
    prisma.userProfile.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

// Остановка после всех тестов
export async function teardown() {
  await prisma.$disconnect();
  execSync('docker-compose -f docker-compose.test.yml down', {
    stdio: 'ignore',
  });
}
```

---

## Что тестировать

### 1. Repository Layer

Проверяем прямое взаимодействие с БД через Prisma:

| Метод | Что проверять |
|-------|---------------|
| `create()` | Запись в БД, возвращение корректного объекта |
| `findById()` | Нахождение по ID, null при отсутствии |
| `findAll()` | Сортировка, фильтрация |
| `update()` | Обновление, проверка существования |
| `delete()` | Удаление, проверка существования |
| `search()` | ILIKE-поиск, экранирование специальных символов |
| Транзакции | Атомарность операций |

### 2. Service → Repository

Проверяем взаимодействие сервиса с реальным репозиторием:

| Метод | Что проверять |
|-------|---------------|
| `PlotService.create()` | Бизнес-правила + запись в БД |
| `PlotService.update()` | Проверка уникальности + обновление |
| `PlotService.delete()` | Проверка существования + удаление |
| `PlotUserRoleService.create()` | Все бизнес-правила (BR-1..BR-6) |

### 3. API Route Handler → Full Stack

Проверяем полный запрос от HTTP до БД:

| Эндпоинт | Что проверять |
|----------|---------------|
| `POST /api/v1/plots` | Создание + валидация + уникальность |
| `PATCH /api/v1/plots/:id` | Обновление + проверка существования |
| `DELETE /api/v1/plots/:id` | Удаление + проверка существования |
| `GET /api/v1/plot-users` | Список с пагинацией |
| `POST /api/v1/plot-users` | Создание связи + BR |

---

## Примеры тестов

### Repository-тесты

```typescript
// tests/integration/domains/plot.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  // Очищаем таблицы после каждого теста
  await prisma.plotUser.deleteMany();
  await prisma.plot.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('PlotRepository (Integration)', () => {
  describe('create', () => {
    it('should create a plot record', async () => {
      const plot = await prisma.plot.create({
        data: {
          plotNumber: '100',
          area: 10.5,
        },
      });

      expect(plot.id).toBeDefined();
      expect(plot.plotNumber).toBe('100');
      expect(plot.area).toBe(10.5);
      expect(plot.createdAt).toBeInstanceOf(Date);
    });

    it('should reject duplicate plotNumber', async () => {
      await prisma.plot.create({
        data: { plotNumber: '200', area: 20 },
      });

      await expect(
        prisma.plot.create({
          data: { plotNumber: '200', area: 25 },
        })
      ).rejects.toThrow();
    });

    it('should reject duplicate cadastralNumber', async () => {
      await prisma.plot.create({
        data: {
          plotNumber: '300',
          area: 30,
          cadastralNumber: '50:50:0000001:001',
        },
      });

      await expect(
        prisma.plot.create({
          data: {
            plotNumber: '301',
            area: 31,
            cadastralNumber: '50:50:0000001:001',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return plot by ID', async () => {
      const plot = await prisma.plot.create({
        data: { plotNumber: '400', area: 40 },
      });

      const found = await prisma.plot.findUnique({
        where: { id: plot.id },
      });

      expect(found).not.toBeNull();
      expect(found?.plotNumber).toBe('400');
    });

    it('should return null for non-existent ID', async () => {
      const found = await prisma.plot.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update plot area', async () => {
      const plot = await prisma.plot.create({
        data: { plotNumber: '500', area: 50 },
      });

      const updated = await prisma.plot.update({
        where: { id: plot.id },
        data: { area: 60 },
      });

      expect(updated.area).toBe(60);
      expect(updated.plotNumber).toBe('500'); // Не изменился
    });
  });

  describe('delete', () => {
    it('should delete plot by ID', async () => {
      const plot = await prisma.plot.create({
        data: { plotNumber: '600', area: 70 },
      });

      await prisma.plot.delete({ where: { id: plot.id } });

      const found = await prisma.plot.findUnique({
        where: { id: plot.id },
      });

      expect(found).toBeNull();
    });

    it('should throw on delete non-existent', async () => {
      await expect(
        prisma.plot.delete({ where: { id: 'non-existent' } })
      ).rejects.toThrow();
    });
  });

  describe('search (ILIKE)', () => {
    beforeEach(async () => {
      await prisma.plot.createMany({
        data: [
          { plotNumber: '10', area: 10, address: 'ул. Ленина' },
          { plotNumber: '100', area: 100, address: 'ул. Садовая' },
          { plotNumber: '200', area: 200, address: 'пр. Мира' },
        ],
      });
    });

    it('should find by plotNumber partial match', async () => {
      const results = await prisma.plot.findMany({
        where: {
          plotNumber: {
            contains: '10',
            mode: 'insensitive',
          },
        },
      });

      expect(results).toHaveLength(2);
      expect(results.map(r => r.plotNumber)).toEqual(['10', '100']);
    });

    it('should escape special characters', async () => {
      // Проверка что % и _ экранируются
      await prisma.plot.create({
        data: { plotNumber: '100%', area: 100 },
      });

      const results = await prisma.plot.findMany({
        where: {
          plotNumber: {
            contains: '%',
            mode: 'insensitive',
          },
        },
      });

      // Должен найти только '%' не '100'
      expect(results).toHaveLength(1);
      expect(results[0].plotNumber).toBe('100%');
    });
  });
});
```

### Service + Repository тесты

```typescript
// tests/integration/domains/plot.integration.test.ts
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PlotService } from '@/domains/plot/plot.service';
import { PlotRepositoryPrisma } from '@/domains/plot/plot.repository.prisma';
import {
  PlotNotFoundError,
  PlotDuplicateError,
} from '@/domains/plot/plot.errors';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  await prisma.plotUser.deleteMany();
  await prisma.plot.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('PlotService (Integration)', () => {
  let service: PlotService;

  beforeAll(() => {
    const repo = new PlotRepositoryPrisma(prisma);
    service = new PlotService(repo);
  });

  describe('create', () => {
    it('should create a plot through service layer', async () => {
      const data = { plotNumber: '700', area: 80 };
      const result = await service.create(data);

      expect(result.id).toBeDefined();
      expect(result.plotNumber).toBe('700');

      // Проверяем, что запись реально в БД
      const fromDb = await prisma.plot.findUnique({
        where: { id: result.id },
      });
      expect(fromDb).not.toBeNull();
    });

    it('should throw PlotDuplicateError on duplicate plotNumber', async () => {
      await service.create({ plotNumber: '800', area: 90 });

      await expect(service.create({ plotNumber: '800', area: 95 }))
        .rejects.toThrow(PlotDuplicateError);
    });
  });

  describe('update (real DB)', () => {
    it('should prevent changing plotNumber', async () => {
      const plot = await prisma.plot.create({
        data: { plotNumber: '900', area: 100 },
      });

      // Service игнорирует plotNumber в update
      const result = await service.update(plot.id, {
        plotNumber: '999', // Должно игнорироваться
        area: 150,
      });

      expect(result.plotNumber).toBe('900'); // Остался старый
      expect(result.area).toBe(150);
    });
  });
});
```

### API + Full Stack тесты

```typescript
// tests/integration/domains/plot.api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { app } from '@/app'; // Next.js app (если экспортируется)

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  await prisma.plotUser.deleteMany();
  await prisma.plot.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/v1/plots (Integration)', () => {
  it('should create a plot', async () => {
    const response = await request(app)
      .post('/api/v1/plots')
      .send({ plotNumber: '1000', area: 110 })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.plotNumber).toBe('1000');
  });

  it('should return 400 on invalid data', async () => {
    const response = await request(app)
      .post('/api/v1/plots')
      .send({ plotNumber: '' }) // Невалидно
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('should return 409 on duplicate plotNumber', async () => {
    await request(app)
      .post('/api/v1/plots')
      .send({ plotNumber: '1001', area: 120 })
      .expect(201);

    const response = await request(app)
      .post('/api/v1/plots')
      .send({ plotNumber: '1001', area: 125 })
      .expect(409);

    expect(response.body.success).toBe(false);
  });
});
```

---

## Паттерны тестирования

### Тестовый транзакционный rollback

```typescript
it('should commit transaction on success', async () => {
  const session = await prisma.$beginTransaction();

  try {
    // Создаём данные через сервис
    await service.create({ plotNumber: 'test', area: 50 });

    // Откатываем транзакцию — данные не должны сохраниться
    await session.rollback();

    // Проверяем что данные не сохранились
    const found = await prisma.plot.findUnique({
      where: { plotNumber: 'test' },
    });
    expect(found).toBeNull();
  } catch {
    await session.rollback();
    throw;
  }
});
```

### Изолированные тест-данные

```typescript
// Создаём уникальные данные для каждого теста
const uniqueId = `test-${Date.now()}-${Math.random()}`;

await prisma.plot.create({
  data: { plotNumber: uniqueId, area: 10 },
});
```

### Проверка инвариантов БД

```typescript
it('should maintain referential integrity', async () => {
  // Пытаемся удалить участок с активными связями
  const plot = await prisma.plot.create({
    data: { plotNumber: 'lock-test', area: 50 },
  });

  await prisma.plotUserRole.create({
    data: {
      userId: 'user-1',
      plotId: plot.id,
      role: 1,
      status: 'active',
    },
  });

  // Должна быть FK-ошибка
  await expect(
    prisma.plot.delete({ where: { id: plot.id } })
  ).rejects.toThrow();
});
```

---

## Цели покрытия кода

| Слой | Statement | Branch | Function | Line |
|------|-----------|--------|----------|------|
| **Repository** | 70% | 50% | 70% | 70% |
| **Service (с DB)** | 75% | 60% | 75% | 75% |
| **API + DB** | 70% | 60% | 70% | 70% |

---

## Команды для запуска

```bash
# Все Integration-тесты
npm run test tests/integration/

# Один файл
npm run test tests/integration/domains/plot.test.ts

# С Docker
docker-compose -f docker-compose.test.yml up -d
npm run test tests/integration/
docker-compose -f docker-compose.test.yml down
```

---

## Преимущества и недостатки

### ✅ Преимущества
- Проверка реального взаимодействия с БД
- Выявление проблем с миграциями
- Тестирование транзакций и ограничений FK
- Максимально близко к production

### ❌ Недостатки
- Медленнее Unit-тестов (секунды vs миллисекунды)
- Требуют настройки БД
- Нестабильность при проблемах с инфраструктурой
- Сложнее отлаживать

---

## Связь с другими типами тестов

```mermaid
graph LR
    UNIT[Unit-тесты] --> INTEGRATION[Integration-тесты]
    INTEGRATION --> API[API-тесты]
    INTEGRATION --> E2E[E2E-тесты]

    style UNIT fill:#7bed9f
    style INTEGRATION fill:#ffd32a
    style API fill:#ffa502
    style E2E fill:#ff6b6b
```

- **Unit → Integration:** Unit-мокают репозитории, Integration используют реальный
- **Integration → API:** Integration мокают сессии, API мокают БД для изоляции
- **Integration → E2E:** Integration мокают внешний мир, E2E тестируют полный стек

---

## Связанные документы

| Документ | Связь |
|----------|-------|
| [`README.md`](README.md) | Общий обзор тестирования |
| [`unit-tests.md`](unit-tests.md) | Unit-тесты мокают репозитории, Integration используют реальные |
| [`api-tests.md`](api-tests.md) | API-тесты могут использовать Integration-подход для БД |
| [`e2e-tests.md`](e2e-tests.md) | E2E проверяют полный стек, Integration — только API + БД |
