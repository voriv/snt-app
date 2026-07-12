# US-13: Просмотр списка участков — План реализации

## Обзор

Этот план описывает детали реализации User Story US-13 для добавления функциональности просмотра списка земельных участков СНТ.

## Контекст

- **Пользователь:** член СНТ (Member)
- **Функциональность:** просмотр списка всех земельных участков в таблице
- **Страница:** `/dashboard/plots`
- **Влияние на существующие компоненты:** Navbar (пункт меню "Участки" уже добавлен)

---

## 1. Модель данных

### Текущая схема `prisma/schema.prisma`

Модель `Plot` уже существует (строки 59-73):

```prisma
model Plot {
  id          String      @id @default(cuid())
  plot_number String      @unique @map("plot_number")
  area        Decimal     @map("area") @db.Decimal(10, 2)
  address     String?     @map("address")
  note        String?     @map("note")
  created_at  DateTime    @default(now()) @map("created_at")
  updated_at  DateTime    @updatedAt @map("updated_at")

  @@map("plots")
}
```

### Требуемые поля согласно US-13

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| `id` | String | Да | Уникальный идентификатор |
| `plot_number` | String | Да | Номер участка |
| `cadastral_number` | String? | Нет | Кадастровый номер |
| `area` | Decimal | Да | Площадь (м²) |
| `address` | String? | Нет | Адрес |
| `note` | String? | Нет | Примечание |

**Важно:** Поле `member_id` **удаляется** в рамках US-13, так как US-13 не включает привязку участников к участкам.

### Требуется обновление Prisma

#### Добавить поле `cadastral_number`

```prisma
cadastral_number String?     @unique @map("cadastral_number") @db.VarChar(20)
```

#### Удалить поле `member_id` и связанные элементы

```prisma
- member_id       String?     @unique @map("member_id")
- member          Member?     @relation(fields: [member_id], references: [id])
```



```prisma
model Plot {
  id              String      @id @default(cuid())
  plot_number     String      @unique @map("plot_number")
  cadastral_number String?     @unique @map("cadastral_number") @db.VarChar(20)
  area            Decimal     @map("area") @db.Decimal(10, 2)
  address         String?     @map("address")
  note            String?     @map("note")
  created_at      DateTime    @default(now()) @map("created_at")
  updated_at      DateTime    @updatedAt @map("updated_at")
  member          Member?     @relation(fields: [member_id], references: [id])

  @@map("plots")
}
```

### Обновление модели данных `docs/model/entities/plot.md`

Добавить поле `cadastral_number` в таблицу полей и обновить конвенции именования.

---

## 2. Domain Layer: `src/domains/plot/`

### 2.1. Типы (`src/domains/plot/plot.types.ts`)

Новый файл.

```typescript
/**
 * @type Plot
 * @domain plot
 * @description Земельный участок СНТ
 *
 * @spec
 * - Бизнес-ключ: нет натурального ключа, идентификация через id
 * - Уникальные поля: plot_number, cadastral_number
 * - Площадь измеряется в квадратных метрах
 *
 * @see docs/model/entities/plot.md — концептуальная модель
 */
export interface Plot {
  /** Уникальный идентификатор. Генерируется автоматически cuid */
  id: string;
  /** Номер участка — уникальное обязательное поле */
  plotNumber: string;
  /** Кадастровый номер — опциональное уникальное поле */
  cadastralNumber: string | null;
  /** Площадь участка в квадратных метрах */
  area: number;
  /** Адрес участка — опциональное поле */
  address: string | null;
  /** Примечание — опциональное поле */
  note: string | null;
  /** Дата создания записи */
  createdAt: Date;
  /** Дата последнего обновления */
  updatedAt: Date;
}

/**
 * @type CreatePlotData
 * @domain plot
 * @description Данные для создания нового земельного участка
 *
 * @spec
 * - plotNumber обязателен и должен быть уникальным
 * - area обязателен и должен быть положительным числом
 * - Остальные поля опциональны
 */
export interface CreatePlotData {
  /** Номер участка — обязателен */
  plotNumber: string;
  /** Кадастровый номер — опционально */
  cadastralNumber?: string | null;
  /** Площадь участка в м² — обязателен, должен быть > 0 */
  area: number;
  /** Адрес участка — опционально */
  address?: string | null;
  /** Примечание — опционально */
  note?: string | null;
}

/**
 * @type UpdatePlotData
 * @domain plot
 * @description Данные для обновления земельного участка
 *
 * @spec
 * - Все поля опциональны
 */
export interface UpdatePlotData {
  plotNumber?: string | null;
  cadastralNumber?: string | null;
  area?: number;
  address?: string | null;
  note?: string | null;
}
```

### 2.2. Валидаторы (`src/domains/plot/plot.validators.ts`)

Новый файл.

```typescript
import { z } from 'zod';

/**
 * @function createPlotSchema
 * @domain plot
 * @description Zod-схема для валидации данных создания участка
 *
 * @spec
 * - plotNumber: минимум 1 символ, максимум 50
 * - cadastralNumber: опционально, максимум 20 символов
 * - area: число, должно быть > 0
 * - address: опционально, максимум 200 символов
 * - note: опционально, максимум 500 символов
 */
export const createPlotSchema = z.object({
  plotNumber: z
    .string()
    .min(1, 'Номер участка обязателен')
    .max(50, 'Номер участка не может превышать 50 символов'),
  cadastralNumber: z
    .string()
    .max(20, 'Кадастровый номер не может превышать 20 символов')
    .optional()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : val))
    .nullable(),
  area: z
    .number()
    .positive('Площадь должна быть положительным числом'),
  address: z
    .string()
    .max(200, 'Адрес не может превышать 200 символов')
    .optional()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : val))
    .nullable(),
  note: z
    .string()
    .max(500, 'Примечание не может превышать 500 символов')
    .optional()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : val))
    .nullable(),
});

/**
 * @function updatePlotSchema
 * @domain plot
 * @description Zod-схема для валидации данных обновления участка
 *
 * @spec
 * - Все поля опциональны
 * - Те же правила валидации, что и createPlotSchema
 */
export const updatePlotSchema = z.object({
  plotNumber: z
    .string()
    .min(1, 'Номер участка обязателен')
    .max(50, 'Номер участка не может превышать 50 символов')
    .nullable()
    .optional(),
  cadastralNumber: z
    .string()
    .max(20, 'Кадастровый номер не может превышать 20 символов')
    .optional()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : val))
    .nullable(),
  area: z
    .number()
    .positive('Площадь должна быть положительным числом')
    .optional(),
  address: z
    .string()
    .max(200, 'Адрес не может превышать 200 символов')
    .optional()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : val))
    .nullable(),
  note: z
    .string()
    .max(500, 'Примечание не может превышать 500 символов')
    .optional()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : val))
    .nullable(),
});
```

### 2.3. Ошибки (`src/domains/plot/plot.errors.ts`)

Новый файл.

```typescript
import { BusinessRuleError } from '@/shared/errors';

/**
 * @class PlotNotFoundError
 * @description Ошибка: участок с указанным идентификатором не найден
 */
export class PlotNotFoundError extends BusinessRuleError {
  constructor(id: string) {
    super(`Plot with id ${id} not found`, 'PLOT_NOT_FOUND');
  }
}

/**
 * @class PlotDuplicateError
 * @description Ошибка: участок с таким номером уже существует
 */
export class PlotDuplicateError extends BusinessRuleError {
  constructor(plotNumber: string) {
    super(`Plot with number ${plotNumber} already exists`, 'PLOT_DUPLICATE');
  }
}

/**
 * @class PlotInvalidDataError
 * @description Ошибка: недопустимые данные участка
 */
export class PlotInvalidDataError extends BusinessRuleError {
  constructor(message: string) {
    super(message, 'PLOT_INVALID_DATA');
  }
}
```

### 2.4. Интерфейс репозитория (`src/domains/plot/plot.repository.interface.ts`)

Новый файл.

```typescript
import type { Plot, CreatePlotData, UpdatePlotData } from './plot.types';

/**
 * @interface IPlotRepository
 * @domain plot
 * @description Контракт доступа к данным земельных участков
 *
 * @spec
 * - findAll возвращает все участки, отсортированные по plotNumber ASC
 * - findById возвращает null если участок не найден — НЕ бросает ошибку
 * - create/update могут выбросить PlotDuplicateError при дублировании plotNumber
 */
export interface IPlotRepository {
  findAll(): Promise<Plot[]>;
  findById(id: string): Promise<Plot | null>;
  findByPlotNumber(plotNumber: string): Promise<Plot | null>;
  create(data: CreatePlotData): Promise<Plot>;
  update(id: string, data: UpdatePlotData): Promise<Plot>;
  delete(id: string): Promise<void>;
}
```

### 2.5. Реализация репозитория (`src/domains/plot/plot.repository.prisma.ts`)

Новый файл.

```typescript
import { prisma } from '@/infrastructure/prisma/client';
import type { Plot, CreatePlotData, UpdatePlotData } from './plot.types';
import type { IPlotRepository } from './plot.repository.interface';
import { PlotNotFoundError, PlotDuplicateError, PlotInvalidDataError } from './plot.errors';

/**
 * @class PlotRepositoryPrisma
 * @domain plot
 * @description Реализация IPlotRepository с использованием Prisma Client
 *
 * @spec
 * - Использует singleton PrismaClient из infrastructure/prisma/client.ts
 * - Все поля преобразуются из snake_case (БД) в camelCase (TypeScript)
 */
export class PlotRepositoryPrisma implements IPlotRepository {
  async findAll(): Promise<Plot[]> {
    const plots = await prisma.plot.findMany({
      orderBy: { plotNumber: 'asc' },
    });
    return plots.map(this.mapToPlot);
  }

  async findById(id: string): Promise<Plot | null> {
    const plot = await prisma.plot.findUnique({ where: { id } });
    if (!plot) return null;
    return this.mapToPlot(plot);
  }

  async findByPlotNumber(plotNumber: string): Promise<Plot | null> {
    const plot = await prisma.plot.findUnique({ where: { plotNumber } });
    if (!plot) return null;
    return this.mapToPlot(plot);
  }

  async create(data: CreatePlotData): Promise<Plot> {
    try {
      const plot = await prisma.plot.create({
        data: {
          plotNumber: data.plotNumber,
          cadastralNumber: data.cadastralNumber,
          area: data.area,
          address: data.address,
          note: data.note,
        },
      });
      return this.mapToPlot(plot);
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'P2002') {
        throw new PlotDuplicateError(data.plotNumber);
      }
      throw new PlotInvalidDataError('Failed to create plot');
    }
  }

  async update(id: string, data: UpdatePlotData): Promise<Plot> {
    const existing = await this.findById(id);
    if (!existing) throw new PlotNotFoundError(id);

    try {
      const plot = await prisma.plot.update({
        where: { id },
        data: {
          plotNumber: data.plotNumber,
          cadastralNumber: data.cadastralNumber,
          area: data.area,
          address: data.address,
          note: data.note,
        },
      });
      return this.mapToPlot(plot);
    } catch (error: unknown) {
      if (error instanceof PlotNotFoundError || error instanceof PlotDuplicateError) {
        throw error;
      }
      throw new PlotInvalidDataError('Failed to update plot');
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw new PlotNotFoundError(id);
    await prisma.plot.delete({ where: { id } });
  }

  private mapToPlot(plot: {
    id: string;
    plotNumber: string;
    cadastralNumber: string | null;
    area: number;
    address: string | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Plot {
    return {
      id: plot.id,
      plotNumber: plot.plotNumber,
      cadastralNumber: plot.cadastralNumber,
      area: Number(plot.area),
      address: plot.address,
      note: plot.note,
      createdAt: plot.createdAt,
      updatedAt: plot.updatedAt,
    };
  }
}
```

### 2.6. Сервис (`src/domains/plot/plot.service.ts`)

Новый файл.

```typescript
import type { Plot, CreatePlotData, UpdatePlotData } from './plot.types';
import type { IPlotRepository } from './plot.repository.interface';
import { PlotNotFoundError, PlotInvalidDataError } from './plot.errors';

/**
 * @service PlotService
 * @domain plot
 * @description Бизнес-логика управления земельными участками СНТ
 *
 * @spec
 * - Валидация: через Zod-схемы из plot.validators.ts
 * - Ошибки: PlotNotFoundError, PlotDuplicateError, PlotInvalidDataError
 * - Зависимости: IPlotRepository через DI
 * - findAll возвращает все участки без пагинации (MVP)
 */
export class PlotService {
  private readonly plotRepository: IPlotRepository;

  constructor(plotRepository: IPlotRepository) {
    this.plotRepository = plotRepository;
  }

  /**
   * Получить список всех участков
   * @returns Массив всех участков, отсортированный по номеру
   */
  async findAll(): Promise<Plot[]> {
    return this.plotRepository.findAll();
  }

  /**
   * Найти участок по идентификатору
   * @throws {PlotNotFoundError} если участок не найден
   */
  async findById(id: string): Promise<Plot> {
    const plot = await this.plotRepository.findById(id);
    if (!plot) throw new PlotNotFoundError(id);
    return plot;
  }

  /**
   * Создать новый участок
   * @throws {PlotInvalidDataError} если данные невалидны
   */
  async create(data: CreatePlotData): Promise<Plot> {
    if (!data.plotNumber || data.plotNumber.trim() === '') {
      throw new PlotInvalidDataError('Номер участка обязателен');
    }
    if (data.area <= 0) {
      throw new PlotInvalidDataError('Площадь должна быть положительным числом');
    }
    return this.plotRepository.create(data);
  }

  async update(id: string, data: UpdatePlotData): Promise<Plot> {
    return this.plotRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.plotRepository.delete(id);
  }
}
```

### 2.7. Re-export (`src/domains/plot/index.ts`)

Новый файл.

```typescript
export type { Plot, CreatePlotData, UpdatePlotData } from './plot.types';
export { createPlotSchema, updatePlotSchema } from './plot.validators';
export { PlotNotFoundError, PlotDuplicateError, PlotInvalidDataError } from './plot.errors';
export type { IPlotRepository } from './plot.repository.interface';
export { PlotRepositoryPrisma } from './plot.repository.prisma';
export { PlotService } from './plot.service';
```

---

## 3. Удаление `member_id` из существующего кода

Так как US-13 не включает привязку участников к участкам, необходимо удалить `member_id` из всех существующих файлов, где он используется.

### 3.1. `prisma/schema.prisma`

**Удалить:**
```prisma
- member_id       String?     @unique @map("member_id")
- member          Member?     @relation(fields: [member_id], references: [id])
```

**Результат:**
```prisma
model Plot {
  id              String      @id @default(cuid())
  plot_number     String      @unique @map("plot_number")
  cadastral_number String?    @unique @map("cadastral_number") @db.VarChar(20)
  area            Decimal     @map("area") @db.Decimal(10, 2)
  address         String?     @map("address")
  note            String?     @map("note")
  created_at      DateTime    @default(now()) @map("created_at")
  updated_at      DateTime    @updatedAt @map("updated_at")

  @@map("plots")
}
```

### 3.2. `docs/model/schema.dbml`

**Удалить:**
```dbml
- Plots member_id:Integer [notes: "ID участника, к которому привязан участок"]
```

### 3.3. `docs/model/entities/plot.md`

**Удалить секцию "Связи":**
```markdown
- ## Связи
- ### С Member
- | Связь | Тип | Описание |
- |-------|-----|----------|
- | Member | belongs_to | Участок может быть привязан к одному участнику |
```

**Изменить таблицу полей:** удалить строку с `member_id`.

---

## 4. DI Container: `src/di/container.ts`

### Требуемые изменения

Добавить импорт в начало файла:

```typescript
import { PlotService } from '@/domains/plot/plot.service';
import { PlotRepositoryPrisma } from '@/domains/plot/plot.repository.prisma';
import type { IPlotRepository } from '@/domains/plot/plot.repository.interface';
```

Добавить factory-функцию:

```typescript
/**
 * Фабрика для создания PlotService с внедрёнными зависимостями
 * @returns Экземпляр PlotService
 */
export function createPlotService(): PlotService {
  const repository: IPlotRepository = new PlotRepositoryPrisma();
  return new PlotService(repository);
}
```

Добавить в класс `Container`:

```typescript
private plotService: PlotService | null = null;

getPlotService(): PlotService {
  if (!this.plotService) {
    this.plotService = createPlotService();
  }
  return this.plotService;
}
```

---

## 4. API Layer: `src/app/api/v1/plots/route.ts`

Текущий файл содержит TODO-заглушки. Требуется полная реализация.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createPlotService } from '@/di/container';
import { createPlotSchema } from '@/domains/plot/plot.validators';
import type { CreatePlotData } from '@/domains/plot/plot.types';

/**
 * @route GET /api/v1/plots
 * @auth required
 * @description Возвращает список всех земельных участков
 *
 * @response 200 { success: true, data: Plot[] }
 * @response 401 { success: false, error: { code: string, message: string } }
 * @response 500 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Без пагинации в текущей реализации (MVP)
 * - Возвращает все участки, отсортированные по plotNumber ASC
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    const service = createPlotService();
    const plots = await service.findAll();
    return NextResponse.json({ success: true, data: plots });
  } catch (error: unknown) {
    console.error('Error fetching plots:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Ошибка загрузки списка участков' } },
      { status: 500 }
    );
  }
}

/**
 * @route POST /api/v1/plots
 * @auth required
 * @description Создает новый земельный участок
 *
 * @body CreatePlotData
 * @response 201 { success: true, data: Plot }
 * @response 400 { success: false, error: { code: string, message: string } }
 * @response 409 { success: false, error: { code: string, message: string } }
 * @response 401 { success: false, error: { code: string, message: string } }
 *
 * @spec
 * - Валидация тела запроса через Zod-схему
 * - При дублировании plotNumber возвращает 409 Conflict
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = createPlotSchema.parse(body);
    const service = createPlotService();
    const plot = await service.create(validatedData as CreatePlotData);
    return NextResponse.json({ success: true, data: plot }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating plot:', error);
    if (error instanceof Error && 'code' in error && ['PLOT_DUPLICATE', 'PLOT_INVALID_DATA'].includes(error.code)) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: error.code === 'PLOT_DUPLICATE' ? 409 : 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Невалидные данные' } },
      { status: 400 }
    );
  }
}
```

---

## 5. UI Layer

### 5.1. Компонент PlotList (`src/components/features/plots/PlotList.tsx`)

Новый файл. Клиентский компонент.

```typescript
/**
 * @component PlotList
 * @category features
 * @description Таблица списка участков с колонками: номер, кадастр, площадь, адрес
 *
 * @spec
 * - Отображает массив Plot[] в таблице
 * - Пустой массив → EmptyState (обрабатывается на уровне страницы)
 * - Кликабельный номер участка → ссылка на /dashboard/plots/:id
 * - Поля null отображаются как "—"
 * - Семантический HTML: <table>, <thead>, <tbody>
 * - ARIA-лейблы для доступности
 */
'use client';

import Link from 'next/link';
import type { Plot } from '@/domains/plot/plot.types';

export interface PlotListProps {
  plots: Plot[];
}

export function PlotList({ plots }: PlotListProps): JSX.Element {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">№ участка</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Кадастр</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Площадь (м²)</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Адрес</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {plots.map(plot => (
            <tr key={plot.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link href={`/dashboard/plots/${plot.id}`} className="text-indigo-600 hover:text-indigo-900">
                  {plot.plotNumber}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{plot.cadastralNumber ?? '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap">{plot.area}</td>
              <td className="px-6 py-4 whitespace-nowrap">{plot.address ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5.2. Re-export (`src/components/features/plots/index.ts`)

Новый файл.

```typescript
export { PlotList } from './PlotList';
```

---

## 6. Page: `src/app/(dashboard)/plots/page.tsx`

Новый файл. Клиентская страница.

```typescript
/**
 * @page /dashboard/plots
 * @auth required
 * @description Страница списка земельных участков СНТ
 *
 * @spec
 * - Client Component с 'use client'
 * - Загрузка данных через apiClient GET /api/v1/plots
 * - Пустое состояние: EmptyState с заголовком "Участки не найдены"
 * - Ошибки: сообщение "Ошибка загрузки списка участков" с кнопкой "Повторить"
 * - Состояние загрузки: скелетон таблицы
 * - Кликабельный номер участка → ссылка на /dashboard/plots/:id
 *
 * @data-flow
 * - Client Component → apiClient GET /api/v1/plots → PlotList
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { PlotList } from '@/components/features/plots';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Plot } from '@/domains/plot/plot.types';

interface PlotsPageState {
  plots: Plot[];
  isLoading: boolean;
  error: string | null;
}

/**
 * @component PlotsPage
 * @description Страница списка земельных участков
 */
export default function PlotsPage(): JSX.Element {
  const [state, setState] = useState<PlotsPageState>({
    plots: [],
    isLoading: true,
    error: null,
  });

  const loadPlots = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.get<Plot[]>('/plots');
      if (response.success && response.data) {
        setState({ plots: response.data, isLoading: false, error: null });
      } else {
        setState({
          plots: [],
          isLoading: false,
          error: response.error?.message || 'Ошибка загрузки данных',
        });
      }
    } catch (err) {
      console.error('Failed to load plots:', err);
      setState({
        plots: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Ошибка загрузки списка участков',
      });
    }
  }, []);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

  if (state.isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Участки</h1>
          <Button variant="primary" disabled>Добавить участок</Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Участки</h1>
        </div>
        <EmptyState
          title="Ошибка загрузки"
          description={state.error}
          action={<Button variant="primary" onClick={loadPlots}>Повторить попытку</Button>}
        />
      </div>
    );
  }

  if (state.plots.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Участки</h1>
          <Button variant="primary">Добавить участок</Button>
        </div>
        <EmptyState
          title="Участки не найдены"
          description="Добавьте первый участок, чтобы начать учет"
          action={<Button variant="primary">Добавить участок</Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Участки</h1>
        <Button variant="primary">Добавить участок</Button>
      </div>
      <PlotList plots={state.plots} />
    </div>
  );
}
```

---

## 7. Навигация: `src/components/layouts/Navbar.tsx`

Пункт меню "Участки" уже присутствует (строка 37):

```typescript
{ name: 'Участки', href: '/dashboard/plots' },
```

**Статус:** ✅ Не требует изменений.

---

## Checklist файлов для создания/изменения

| # | Файл | Действие | Статус |
|---|------|----------|--------|
| 1 | `prisma/schema.prisma` | Удалить member_id и member relation; добавить cadastral_number | Изменить |
| 2 | `docs/model/schema.dbml` | Удалить member_id из схемы Plots | Изменить |
| 3 | `docs/model/entities/plot.md` | Удалить member_id и секцию "Связи с Member"; добавить cadastral_number | Изменить |
| 4 | `src/domains/plot/plot.types.ts` | Создать (без memberId) | Новый |
| 5 | `src/domains/plot/plot.validators.ts` | Создать | Новый |
| 6 | `src/domains/plot/plot.errors.ts` | Создать | Новый |
| 7 | `src/domains/plot/plot.repository.interface.ts` | Создать (без memberId методов) | Новый |
| 8 | `src/domains/plot/plot.repository.prisma.ts` | Создать (без memberId) | Новый |
| 9 | `src/domains/plot/plot.service.ts` | Создать (без memberId) | Новый |
| 10 | `src/domains/plot/index.ts` | Создать | Новый |
| 11 | `src/di/container.ts` | Добавить factory + Container метод для PlotService | Изменить |
| 12 | `src/app/api/v1/plots/route.ts` | Заменить TODO-заглушки на реализацию (только GET) | Изменить |
| 13 | `src/components/features/plots/PlotList.tsx` | Создать (без memberId) | Новый |
| 14 | `src/components/features/plots/index.ts` | Создать | Новый |
| 15 | `src/app/(dashboard)/plots/page.tsx` | Создать | Новый |
| 16 | `src/components/layouts/Navbar.tsx` | Добавить "Участки" в navigation | Изменить |

## Порядок шагов для Code mode

### Фаза 1: Удаление member_id

1. **Удаление member_id (Prisma):** Удалить member_id и member relation из prisma/schema.prisma
2. **Удаление member_id (Модель):** Обновить docs/model/schema.dbml и docs/model/entities/plot.md
3. **Миграция БД:** Запустить `npx prisma migrate dev --name remove-member-id-from-plots`

### Фаза 2: Создание нового домена Plot

4. **Domain types:** Создать plot.types.ts (без memberId)
5. **Domain validators:** Создать plot.validators.ts
6. **Domain errors:** Создать plot.errors.ts
7. **Repository interface:** Создать plot.repository.interface.ts (без методов с memberId)
8. **Repository implementation:** Создать plot.repository.prisma.ts (без memberId)
9. **Service:** Создать plot.service.ts (без memberId)
10. **Domain index:** Создать plot/index.ts

### Фаза 3: Интеграция

11. **DI Container:** Обновить container.ts (добавить factory + Container метод)
12. **API Route:** Обновить plots/route.ts (реализация GET, POST excluded from US-13)
13. **UI PlotList:** Создать PlotList.tsx
14. **UI index:** Создать plots/index.ts
15. **Page:** Создать plots/page.tsx
16. **Navbar:** Добавить "Участки" в navigation

### Фаза 4: Проверка

17. **Type Check:** Запустить `npm run type-check`
18. **Lint:** Запустить `npm run lint`
