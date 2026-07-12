# Спецификация компонентов: Plot UserRole (US-19-1)

**Дата:** 2026-07-04  
**Версия:** 1.0

---

## 📁 Структура проекта для данного домена

```
src/
├── domains/
│   └── plotUser/                    # Новая папка домена
│       ├── index.ts                 # Публичный API домена
│       ├── plotUser.types.ts        # Типы сущностей и DTO
│       ├── plotUser.validators.ts   # Zod-схемы валидации
│       ├── plotUser.errors.ts       # Классы доменных ошибок
│       ├── plotUser.repository.interface.ts  # Интерфейс репозитория
│       ├── plotUser.repository.prisma.ts   # Реализация Prisma репозитория
│       └── plotUser.service.ts      # Бизнес-логика
│
├── app/
│   └── api/v1/
│       └── plot-users/
│           └── route.ts             # API endpoint для создания связи
│
├── components/
│   └── features/
│       └── plotUser/
│           ├── PlotUserRoleForm.tsx           # Форма создания связи
│           ├── PlotUserRoleSelect.tsx         # Компонент выбора пользователей и участков
│           ├── PlotUserRoleHistory.tsx        # Компонент просмотра истории (опционально)
│           ├── PlotUserRoleCard.tsx           # Карточка связи (для списка)
│           └── index.ts                       # Публичный API компонентов
│
└── app/dashboard/
    ├── plots/
    │   ├── page.tsx               # Список участков — добавить кнопку действия
    │   └── [id]/
    │       └── page.tsx           # Страница участка — добавить секцию участников
    └── admin/
        └── plot-users/
            └── page.tsx           # Панель администрирования связей
```

---

## 🗄️ Модель данных (Prisma Schema)

### Модель `PlotUserRole`

```prisma
// prisma/schema.prisma

model PlotUserRole {
  id            String    @id @default(cuid())
  userId        String    @map("user_id")
  plotId        String    @map("plot_id")
  role          Int       @default(1)  // 1=owner, 2=resident, 3=representative
  status        String    @default("active")  // active, pending, expired
  comment       String?   @map("comment")
  assignedAt    DateTime  @default(now()) @map("assigned_at")
  expiresAt     DateTime? @map("expires_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  plot          Plot      @relation(fields: [plotId], references: [id], onDelete: Cascade)
  history       PlotUserRoleHistory[]
  
  @@unique([userId, plotId, status], name: "unique_active_user_plot")
  @@index([userId])
  @@index([plotId])
  @@map("plot_users")
}
```

### Модель `PlotUserRoleHistory`

```prisma
// prisma/schema.prisma

model PlotUserRoleHistory {
  id           String    @id @default(cuid())
  plotUserId   String    @map("plot_user_id")
  userId       String    @map("user_id")
  plotId       String    @map("plot_id")
  role         Int       @map("role")
  status       String    @map("status")
  comment      String?   @map("comment")
  changedBy    String    @map("changed_by")
  changedAt    DateTime  @map("changed_at")
  changedReason String   @map("changed_reason")
  
  plotUserRole PlotUserRole @relation(fields: [plotUserId], references: [id], onDelete: Cascade)
  
  @@index([plotUserId])
  @@index([userId])
  @@index([plotId])
  @@map("plot_user_history")
}
```

---

## 🏗️ Domain Layer

### 1. Типы (`plotUser.types.ts`)

```typescript
/**
 * @type PlotUserRoleRole
 * @domain plotUser
 * @description Роли пользователя на участке
 */
export type PlotUserRoleRole = 1 | 2 | 3;

/**
 * @type PlotUserRoleStatus
 * @domain plotUser
 * @description Статус связи пользователь-участок
 */
export type PlotUserRoleStatus = 'active' | 'pending' | 'expired';

/**
 * @type PlotUserRole
 * @domain plotUser
 * @description Сущность связи пользователь-участок
 *
 * @spec
 * - Бизнес-ключ: нет (id генерируется cuid())
 * - Инварианты: user_id и plot_id обязательны
 * - role: 1=owner, 2=resident, 3=representative
 * - status: active, pending, expired
 */
export interface PlotUserRole {
  id: string;
  userId: string;
  plotId: string;
  role: PlotUserRoleRole;
  status: PlotUserRoleStatus;
  comment: string | null;
  assignedAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @type CreatePlotUserRoleInput
 * @domain plotUser
 * @description Данные для создания связи пользователь-участок
 *
 * @spec
 * - userId:required - cuid
 * - plotId:required - cuid
 * - role:required - 1|2|3
 * - status:optional - default 'active'
 * - comment:optional - max 500 chars
 * - expiresAt:optional - datetime or null
 */
export interface CreatePlotUserRoleInput {
  userId: string;
  plotId: string;
  role: PlotUserRoleRole;
  status?: PlotUserRoleStatus;
  comment?: string | null;
  expiresAt?: Date | null;
}

/**
 * @type UpdatePlotUserRoleInput
 * @domain plotUser
 * @description Данные для обновления связи пользователь-участок
 *
 * @spec
 * - Все поля опциональны
 */
export interface UpdatePlotUserRoleInput {
  role?: PlotUserRoleRole;
  status?: PlotUserRoleStatus;
  comment?: string | null;
  expiresAt?: Date | null;
}

/**
 * @type PlotUserRoleWithRelations
 * @domain plotUser
 * @description Расширенная связь с отношениями пользователей и участков
 */
export interface PlotUserRoleWithRelations extends PlotUserRole {
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  plot?: {
    id: string;
    plotNumber: string;
    address: string | null;
  } | null;
}

/**
 * @type PlotUserRoleHistory
 * @domain plotUser
 * @description История изменений связи пользователь-участок
 */
export interface PlotUserRoleHistory {
  id: string;
  plotUserId: string;
  userId: string;
  plotId: string;
  role: PlotUserRoleRole;
  status: PlotUserRoleStatus;
  comment: string | null;
  changedBy: string;
  changedAt: Date;
  changedReason: string;
}
```

---

### 2. Валидация (`plotUser.validators.ts`)

```typescript
import { z } from 'zod';

/**
 * @validator plotUserRoleRoleEnum
 * @domain plotUser
 * @description Zod схема для роли пользователя на участке
 *
 * @spec
 * - 1 = OWNER (владелец)
 * - 2 = RESIDENT (проживает)
 * - 3 = REPRESENTATIVE (представитель)
 * - Сообщение об ошибке на русском языке
 */
export const plotUserRoleRoleEnum = z.enum([1, 2, 3], {
  errorMap: () => ({
    message: 'Роль должна быть 1 (владелец), 2 (проживает) или 3 (представитель)',
  }),
});

/**
 * @validator plotUserRoleStatusEnum
 * @domain plotUser
 * @description Zod схема для статуса связи пользователь-участок
 *
 * @spec
 * - active: активная связь
 * - pending: ожидает подтверждения
 * - expired: истёк срок
 * - Сообщение об ошибке на русском языке
 */
export const plotUserRoleStatusEnum = z.enum(['active', 'pending', 'expired'], {
  errorMap: () => ({
    message: 'Статус должен быть active, pending или expired',
  }),
});

/**
 * @validator createPlotUserRoleSchema
 * @domain plotUser
 * @description Zod схема для валидации данных создания связи
 *
 * @spec
 * - user_id:required - cuid
 * - plot_id:required - cuid
 * - role:required - 1|2|3
 * - status:optional - default 'active'
 * - comment:optional - max 500 chars
 * - expires_at:optional - datetime or null
 * - transform: empty string → null
 */
export const createPlotUserRoleSchema = z
  .object({
    userId: z.string().cuid('Пользователь не найден'),
    plotId: z.string().cuid('Участок не найден'),
    role: plotUserRoleRoleEnum,
    status: plotUserRoleStatusEnum.optional().default('active'),
    comment: z
      .string()
      .max(500, 'Комментарий не может превышать 500 символов')
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? null : val)),
    expiresAt: z
      .string()
      .datetime()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? null : val)),
  })
  .strict();

export const createPlotUserRoleInputType = createPlotUserRoleSchema.omit({
  role: true,
  status: true,
}).extend({
  role: plotUserRoleRoleEnum,
  status: plotUserRoleStatusEnum.optional().default('active'),
});

/**
 * @validator updatePlotUserRoleSchema
 * @domain plotUser
 * @description Zod схема для валидации данных обновления связи
 *
 * @spec
 * - Все поля опциональны
 * - При передаче должны проходить валидацию
 */
export const updatePlotUserRoleSchema = z
  .object({
    role: plotUserRoleRoleEnum.optional(),
    status: plotUserRoleStatusEnum.optional(),
    comment: z
      .string()
      .max(500, 'Комментарий не может превышать 500 символов')
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? null : val)),
    expiresAt: z
      .string()
      .datetime()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? null : val)),
  })
  .strict();
```

---

### 3. Ошибки (`plotUser.errors.ts`)

```typescript
import { NotFoundError, ValidationError, ConflictError, BaseError } from '@/shared/errors';

/**
 * @error PlotUserRoleNotFoundError
 * @domain plotUser
 * @description Ошибка: пользователь или участок не найден
 *
 * @spec
 * - HTTP 404 NotFound
 * - Сообщение: "Пользователь не найден" или "Участок не найден"
 *
 * @see AC-5.1, AC-5.2 (проверка существования)
 */
export class PlotUserRoleNotFoundError extends NotFoundError {
  readonly name = 'PlotUserRoleNotFoundError';
  constructor(message: string = 'Связь пользователь-участок не найдена') {
    super(message);
  }
}

/**
 * @error PlotUserRoleDuplicateError
 * @domain plotUser
 * @description Ошибка: активная связь уже существует
 *
 * @spec
 * - HTTP 409 Conflict
 * - Сообщение: "Для этого пользователя и участка уже существует активная связь"
 *
 * @see AC-5.3 (проверка дубликата)
 * @see BR-3 (уникальность активной связи)
 */
export class PlotUserRoleDuplicateError extends ConflictError {
  readonly name = 'PlotUserRoleDuplicateError';
  constructor(message: string = 'Для этого пользователя и участка уже существует активная связь') {
    super(message);
  }
}

/**
 * @error PlotUserRoleInvalidDataError
 * @domain plotUser
 * @description Ошибка: невалидные данные для создания/обновления связи
 *
 * @spec
 * - HTTP 400 Bad Request
 * - Сообщение: "Ошибка валидации: [поле] — [описание]"
 *
 * @see AC-5.4 (проверка expires_at)
 */
export class PlotUserRoleInvalidDataError extends ValidationError {
  readonly name = 'PlotUserRoleInvalidDataError';
  constructor(message: string) {
    super(message);
  }
}

/**
 * @error PlotUserRoleBusinessRuleError
 * @domain plotUser
 * @description Ошибка: нарушение бизнес-правила
 *
 * @spec
 * - HTTP 400 Bad Request или 403 Forbidden
 * - Сообщение о нарушенном бизнес-правиле
 */
export class PlotUserRoleBusinessRuleError extends Error {
  readonly name = 'PlotUserRoleBusinessRuleError';
  constructor(message: string) {
    super(message);
  }
}
```

---

### 4. Репозиторий (`plotUser.repository.interface.ts`)

```typescript
import type {
  PlotUserRole,
  CreatePlotUserRoleInput,
  UpdatePlotUserRoleInput,
  PlotUserRoleWithRelations,
  PlotUserRoleHistory,
} from './plotUser.types';

/**
 * @interface IPlotUserRoleRepository
 * @domain plotUser
 * @description Контракт доступа к данным связей пользователь-участок
 *
 * @spec
 * - create создаёт запись в plot_users И plot_user_history транзакционно
 * - existsActive проверяет UNIQUE constraint (user_id, plot_id, status='active')
 * - userExists/plotExists возвращают boolean
 * - Все методы асинхронные
 * - Использует Prisma Client
 *
 * @see BR-3 (уникальность активной связи)
 * @see BR-7 (историчность)
 */
export interface IPlotUserRoleRepository {
  /**
   * Создать новую связь пользователь-участок
   *
   * @param data - Данные для создания связи
   * @param changedBy - ID администратора, создавшего связь (для истории)
   * @returns Созданная связь с заполненными системными полями
   * @throws {NotFoundError} если user не найден
   * @throws {NotFoundError} если plot не найден
   * @throws {ConflictError} если активная связь уже существует
   */
  create(data: CreatePlotUserRoleInput, changedBy: string): Promise<PlotUserRole>;

  /**
   * Найти связь по ID
   *
   * @param id - Уникальный идентификатор связи
   * @returns Связь или null если не найдена
   */
  findById(id: string): Promise<PlotUserRoleWithRelations | null>;

  /**
   * Найти все связи для пользователя
   *
   * @param userId - ID пользователя
   * @param includeInactive - включать неактивные связи
   * @returns Массив связей
   */
  findByUserId(userId: string, includeInactive?: boolean): Promise<PlotUserRoleWithRelations[]>;

  /**
   * Найти все связи для участка
   *
   * @param plotId - ID участка
   * @param includeInactive - включать неактивные связи
   * @returns Массив связей
   */
  findByPlotId(plotId: string, includeInactive?: boolean): Promise<PlotUserRoleWithRelations[]>;

  /**
   * Проверить существование активной связи для пары (user_id, plot_id)
   *
   * @param userId - ID пользователя
   * @param plotId - ID участка
   * @returns true если активная связь существует, иначе false
   *
   * @see BR-3 (уникальность активной связи)
   */
  existsActive(userId: string, plotId: string): Promise<boolean>;

  /**
   * Проверить существование пользователя
   *
   * @param userId - ID пользователя
   * @returns true если пользователь существует, иначе false
   */
  userExists(userId: string): Promise<boolean>;

  /**
   * Проверить существование участка
   *
   * @param plotId - ID участка
   * @returns true если участок существует, иначе false
   */
  plotExists(plotId: string): Promise<boolean>;

  /**
   * Обновить связь пользователь-участок
   *
   * @param id - ID связи
   * @param data - Данные для обновления
   * @param changedBy - ID администратора, изменившего связь (для истории)
   * @returns Обновлённая связь
   * @throws {NotFoundError} если связь не найдена
   */
  update(
    id: string,
    data: UpdatePlotUserRoleInput,
    changedBy: string,
    changedReason: string,
  ): Promise<PlotUserRole>;

  /**
   * Деактивировать связь (мягкое удаление)
   *
   * @param id - ID связи
   * @param changedBy - ID администратора, деактивировавшего связь
   * @param reason - Причина деактивации
   * @returns true если связь деактивирована, иначе false
   */
  deactivate(id: string, changedBy: string, reason: string): Promise<boolean>;

  /**
   * Найти все связи с пагинацией
   *
   * @param options - Параметры пагинации и фильтрации
   * @returns Объект с данными и метаданными пагинации
   */
  findWithPagination(options: {
    limit?: number;
    offset?: number;
    plotId?: string;
    userId?: string;
    role?: number;
    status?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'assignedAt';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    data: PlotUserRoleWithRelations[];
    total: number;
    page: number;
    limit: number;
  }>;
}

/**
 * @interface IPlotUserRoleHistoryRepository
 * @domain plotUser
 * @description Контракт доступа к истории изменений связей пользователь-участок
 *
 * @spec
 * - create создаёт новую запись истории
 * - findAllByPlotUserId возвращает историю для конкретной связи
 * - Все методы асинхронные
 */
export interface IPlotUserRoleHistoryRepository {
  /**
   * Создать запись в истории изменений
   *
   * @param data - Данные для записи истории
   * @returns Созданная запись истории
   */
  create(data: {
    plotUserId: string;
    userId: string;
    plotId: string;
    role: number;
    status: string;
    comment: string | null;
    changedBy: string;
    changedReason: string;
  }): Promise<PlotUserRoleHistory>;

  /**
   * Найти историю для связи пользователь-участок
   *
   * @param plotUserId - ID связи
   * @returns Массив записей истории, отсортированный по changed_at DESC
   */
  findAllByPlotUserId(plotUserId: string): Promise<PlotUserRoleHistory[]>;

  /**
   * Найти историю пользователя на участке
   *
   * @param userId - ID пользователя
   * @param plotId - ID участка
   * @returns Массив записей истории
   */
  findByUserIdAndPlotId(userId: string, plotId: string): Promise<PlotUserRoleHistory[]>;
}
```

---

### 5. Репозиторий Prisma (`plotUser.repository.prisma.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import type {
  IPlotUserRoleRepository,
  IPlotUserRoleHistoryRepository,
} from './plotUser.repository.interface';
import type {
  PlotUserRole,
  CreatePlotUserRoleInput,
  UpdatePlotUserRoleInput,
  PlotUserRoleWithRelations,
  PlotUserRoleHistory,
} from './plotUser.types';
import { PlotUserRoleNotFoundError, PlotUserRoleDuplicateError } from './plotUser.errors';

/**
 * @class PlotUserRoleRepository
 * @domain plotUser
 * @implements IPlotUserRoleRepository
 * @description Реализация репозитория Prisma для связей пользователь-участок
 *
 * @spec
 * - Использует транзакции для создания связи и истории
 * - Проверяет существование user и plot перед созданием
 * - Проверяет уникальность активной связи (BR-3)
 * - Автоматически создаёт запись в истории при создании и обновлении связи
 *
 * @see BR-3 (уникальность активной связи)
 * @see BR-7 (историчность)
 */
export class PlotUserRoleRepository implements IPlotUserRoleRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(
    data: CreatePlotUserRoleInput,
    changedBy: string,
  ): Promise<PlotUserRole> {
    // Проверяем существование пользователя
    const userExists = await this.prisma.user.count({
      where: { id: data.userId },
    });
    if (userExists === 0) {
      throw new PlotUserRoleNotFoundError('Пользователь не найден');
    }

    // Проверяем существование участка
    const plotExists = await this.prisma.plot.count({
      where: { id: data.plotId },
    });
    if (plotExists === 0) {
      throw new PlotUserRoleNotFoundError('Участок не найден');
    }

    // Проверяем уникальность активной связи (BR-3)
    const existingActive = await this.prisma.plotUserRole.findFirst({
      where: {
        userId: data.userId,
        plotId: data.plotId,
        status: 'active',
      },
    });

    if (existingActive) {
      throw new PlotUserRoleDuplicateError(
        'Для этого пользователя и участка уже существует активная связь',
      );
    }

    // Создаём транзакцию для создания связи и записи истории
    const result = await this.prisma.$transaction(async (tx) => {
      // Создаём связь
      const plotUserRole = await tx.plotUserRole.create({
        data: {
          userId: data.userId,
          plotId: data.plotId,
          role: data.role,
          status: data.status || 'active',
          comment: data.comment,
          expiresAt: data.expiresAt,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          plot: {
            select: {
              id: true,
              plotNumber: true,
              address: true,
            },
          },
        },
      });

      // Создаём запись в истории
      await tx.plotUserRoleHistory.create({
        data: {
          plotUserId: plotUserRole.id,
          userId: data.userId,
          plotId: data.plotId,
          role: data.role,
          status: data.status || 'active',
          comment: data.comment,
          changedBy,
          changedAt: new Date(),
          changedReason: 'Initial assignment',
        },
      });

      return plotUserRole;
    });

    return result;
  }

  async findById(id: string): Promise<PlotUserRoleWithRelations | null> {
    const plotUserRole = await this.prisma.plotUserRole.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        plot: {
          select: {
            id: true,
            plotNumber: true,
            address: true,
          },
        },
      },
    });

    return plotUserRole;
  }

  async findByUserId(userId: string, includeInactive = false): Promise<PlotUserRoleWithRelations[]> {
    const where: Record<string, unknown> = { userId };
    if (!includeInactive) {
      where.status = 'active';
    }

    return this.prisma.plotUserRole.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        plot: {
          select: {
            id: true,
            plotNumber: true,
            address: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async findByPlotId(plotId: string, includeInactive = false): Promise<PlotUserRoleWithRelations[]> {
    const where: Record<string, unknown> = { plotId };
    if (!includeInactive) {
      where.status = 'active';
    }

    return this.prisma.plotUserRole.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        plot: {
          select: {
            id: true,
            plotNumber: true,
            address: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async existsActive(userId: string, plotId: string): Promise<boolean> {
    const count = await this.prisma.plotUserRole.count({
      where: {
        userId,
        plotId,
        status: 'active',
      },
    });
    return count > 0;
  }

  async userExists(userId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id: userId },
    });
    return count > 0;
  }

  async plotExists(plotId: string): Promise<boolean> {
    const count = await this.prisma.plot.count({
      where: { id: plotId },
    });
    return count > 0;
  }

  async update(
    id: string,
    data: UpdatePlotUserRoleInput,
    changedBy: string,
    changedReason: string,
  ): Promise<PlotUserRole> {
    // Проверяем существование связи
    const existing = await this.prisma.plotUserRole.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new PlotUserRoleNotFoundError('Связь не найдена');
    }

    // Проверяем уникальность активной связи при смене статуса на active
    if (data.status === 'active') {
      const duplicateCheck = await this.prisma.plotUserRole.findFirst({
        where: {
          userId: existing.userId,
          plotId: existing.plotId,
          status: 'active',
          id: { not: id },
        },
      });

      if (duplicateCheck) {
        throw new PlotUserRoleDuplicateError(
          'Для этого пользователя и участка уже существует активная связь',
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.comment !== undefined) updateData.comment = data.comment;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;

    // Создаём транзакцию для обновления и создания истории
    const result = await this.prisma.$transaction(async (tx) => {
      // Создаём запись в истории
      await tx.plotUserRoleHistory.create({
        data: {
          plotUserId: id,
          userId: existing.userId,
          plotId: existing.plotId,
          role: existing.role,
          status: existing.status,
          comment: existing.comment,
          changedBy,
          changedAt: new Date(),
          changedReason,
        },
      });

      // Обновляем связь
      const updated = await tx.plotUserRole.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          plot: {
            select: {
              id: true,
              plotNumber: true,
              address: true,
            },
          },
        },
      });

      return updated;
    });

    return result;
  }

  async deactivate(
    id: string,
    changedBy: string,
    reason: string,
  ): Promise<boolean> {
    const existing = await this.prisma.plotUserRole.findUnique({
      where: { id },
    });

    if (!existing) {
      return false;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Создаём запись в истории
      await tx.plotUserRoleHistory.create({
        data: {
          plotUserId: id,
          userId: existing.userId,
          plotId: existing.plotId,
          role: existing.role,
          status: existing.status,
          comment: existing.comment,
          changedBy,
          changedAt: new Date(),
          changedReason: reason || 'Deactivated',
        },
      });

      // Обновляем статус на expired
      await tx.plotUserRole.update({
        where: { id },
        data: { status: 'expired' },
      });
    });

    return result !== null;
  }

  async findWithPagination(options: {
    limit?: number;
    offset?: number;
    plotId?: string;
    userId?: string;
    role?: number;
    status?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'assignedAt';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    data: PlotUserRoleWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      limit = 20,
      offset = 0,
      plotId,
      userId,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const where: Record<string, unknown> = {};

    if (plotId) where.plotId = plotId;
    if (userId) where.userId = userId;
    if (role !== undefined) where.role = role;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.plotUserRole.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          plot: {
            select: {
              id: true,
              plotNumber: true,
              address: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.plotUserRole.count({ where }),
    ]);

    return {
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }
}

/**
 * @class PlotUserRoleHistoryRepository
 * @domain plotUser
 * @implements IPlotUserRoleHistoryRepository
 * @description Реализация репозитория Prisma для истории изменений связей
 *
 * @spec
   - Все методы асинхронные
   - История сортируется по changed_at DESC
   */
export class PlotUserRoleHistoryRepository implements IPlotUserRoleHistoryRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: {
    plotUserId: string;
    userId: string;
    plotId: string;
    role: number;
    status: string;
    comment: string | null;
    changedBy: string;
    changedReason: string;
  }): Promise<PlotUserRoleHistory> {
    return this.prisma.plotUserRoleHistory.create({
      data: {
        ...data,
        changedAt: new Date(),
      },
    });
  }

  async findAllByPlotUserId(plotUserId: string): Promise<PlotUserRoleHistory[]> {
    return this.prisma.plotUserRoleHistory.findMany({
      where: { plotUserId },
      orderBy: { changedAt: 'desc' },
    });
  }

  async findByUserIdAndPlotId(
    userId: string,
    plotId: string,
  ): Promise<PlotUserRoleHistory[]> {
    return this.prisma.plotUserRoleHistory.findMany({
      where: { userId, plotId },
      orderBy: { changedAt: 'desc' },
    });
  }
}
```

---

### 6. Сервис (`plotUser.service.ts`)

```typescript
import type {
  CreatePlotUserRoleInput,
  UpdatePlotUserRoleInput,
  PlotUserRole,
  PlotUserRoleWithRelations,
} from './plotUser.types';
import type { IPlotUserRoleRepository, IPlotUserRoleHistoryRepository } from './plotUser.repository.interface';
import {
  PlotUserRoleNotFoundError,
  PlotUserRoleDuplicateError,
  PlotUserRoleInvalidDataError,
} from './plotUser.errors';
import {
  createPlotUserRoleSchema,
  updatePlotUserRoleSchema,
} from './plotUser.validators';

/**
 * @service PlotUserRoleService
 * @domain plotUser
 * @description Бизнес-логика управления связями пользователей с участками
 *
 * @spec
 * - Валидация: через Zod-схемы из plotUser.validators.ts
 * - Ошибки: PlotUserRoleNotFoundError, PlotUserRoleDuplicateError, PlotUserRoleInvalidDataError
 * - Зависим