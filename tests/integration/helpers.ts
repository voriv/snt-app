/**
 * @file helpers.ts
 * @description Утилиты для интеграционных тестов
 * Вспомогательные функции для создания тестовых данных и управления БД
 *
 * @spec
 * - Все функции асинхронные
 * - Используют Prisma Client из setup.ts
 * - Генерируют уникальные данные для предотвращения конфликтов
 */

import { PrismaClient } from '@prisma/client';

/**
 * Создаёт уникальный суффикс для тестовых данных
 *
 * @returns Уникальная строка на основе timestamp и random
 */
export function createUniqueSuffix(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 7);
  return `${timestamp}-${random}`;
}

/**
 * Создаёт уникальное имя пользователя для тестов
 *
 * @param prefix - Префикс имени (по умолчанию 'Test')
 * @returns Уникальное имя
 */
export function createUniqueName(prefix = 'Test'): string {
  return `${prefix}-${createUniqueSuffix()}`;
}

/**
 * Создаёт уникальный email для тестов
 *
 * @param prefix - Префикс email (по умолчанию 'test')
 * @returns Уникальный email
 */
export function createUniqueEmail(prefix = 'test'): string {
  return `${prefix}-${createUniqueSuffix()}@example.com`;
}

/**
 * Создаёт уникальный номер участка для тестов
 *
 * @returns Уникальный номер участка
 */
export function createUniquePlotNumber(): string {
  return `INT-${createUniqueSuffix()}`;
}

/**
 * Создаёт уникальный кадастровый номер для тестов
 *
 * @returns Уникальный кадастровый номер в формате XX:XX:XXXXXXX:XXX (ровно 7 цифр в третьем сегменте)
 * @description Использует random string с высокой энтропией для максимальной уникальности
 */
export function createUniqueCadastralNumber(): string {
  // Генерируем полностью случайный 7-символьный суффикс для третьего сегмента
  // Используем только цифры (0-9) для соответствия валидации кадастрового номера
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  // Формируем кадастровый номер: 50:50:XXXXXXX:001
  return `50:50:${result}:001`;
}

/**
 * Создаёт тестовый пароль для пользователей
 *
 * @returns Тестовый пароль
 */
export function createTestPassword(): string {
  return 'TestPassword123!';
}

/**
 * Очищает все таблицы базы данных в правильном порядке
 * Используется для изоляции тестов
 *
 * @param prisma - Экземпляр Prisma Client
 */
/**
 * Системные данные, которые НЕ должны очищаться при cleanup
 */
const SYSTEM_ROLE_NAMES = ['GUEST', 'MEMBER', 'ADMIN', 'SUPER_ADMIN'];
const SYSTEM_PAGE_PATHS = ['/dashboard', '/profile', '/plots'];
const SYSTEM_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/plots' },
  { method: 'POST', path: '/api/v1/plots' },
  { method: 'GET', path: '/api/v1/members' },
  { method: 'POST', path: '/api/v1/members' },
  { method: 'GET', path: '/api/v1/profile' },
  { method: 'PATCH', path: '/api/v1/profile' },
];

/**
 * Создает транзакцию с автоматическим откатом для изоляции тестов
 *
 * @param prisma - Экземпляр Prisma Client
 * @param fn - Функция, которая будет выполнена внутри транзакции
 * @returns Результат выполнения функции
 */
export async function withTransaction<T>(
  prisma: PrismaClient,
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      return fn(tx as Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>);
    },
    {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

/**
 * Создаёт транзакцию с автоматическим откатом и предварительной очисткой для изоляции тестов
 * Используется для полной изоляции тестов
 *
 * @param prisma - Экземпляр Prisma Client
 * @param fn - Функция, которая будет выполнена внутри транзакции
 * @returns Результат выполнения функции
 */
export async function withIsolatedTest<T>(
  prisma: PrismaClient,
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      // Очистка перед каждым тестом
      await tx.plotUserRoleHistory.deleteMany();
      await tx.plotUserRole.deleteMany();
      await tx.roleApiEndpoint.deleteMany();
      await tx.rolePage.deleteMany();
      await tx.userRole.deleteMany();
      await tx.userProfile.deleteMany();
      await tx.plot.deleteMany();
      await tx.user.deleteMany();
      await tx.accessConfigVersion.deleteMany();

      // Очистка не-системных данных
      await tx.role.deleteMany({
        where: { name: { notIn: SYSTEM_ROLE_NAMES } },
      });
      await tx.page.deleteMany({
        where: { path: { notIn: SYSTEM_PAGE_PATHS } },
      });
      await tx.apiEndpoint.deleteMany({
        where: {
          NOT: SYSTEM_ENDPOINTS.map(ep => ({
            method: ep.method,
            path: ep.path,
          })),
        },
      });

      // Выполнение теста
      return fn(tx as Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>);
    },
    {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 30000,
    }
  );
}

/**
 * Очищает все таблицы базы данных в правильном порядке
 * Используется для изоляции тестов
 *
 * @param prisma - Экземпляр Prisma Client
 * @param preserveSystem - Если true, сохраняет системные данные (роли, страницы, эндпоинты)
 */
export async function cleanupDatabase(prisma: PrismaClient, preserveSystem = true): Promise<void> {
  // Порядок очистки с учётом FK ограничений
  // Сначала зависимости, затем родительские таблицы
  // Используем последовательные deleteMany без транзакции для избежания deadlock

  // Сохраняем тестовых пользователей searchUsers (для тестов roles.test.ts) ПЕРЕД очисткой
  const testSearchUsers = await prisma.user.findMany({
    where: {
      email: {
        contains: 'test-search-user',
      },
    },
  });

  await prisma.plotUserRoleHistory.deleteMany();
  await prisma.plotUserRole.deleteMany();
  await prisma.roleApiEndpoint.deleteMany();
  await prisma.rolePage.deleteMany();
  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: {
          contains: 'test-search-user',
        },
      },
    },
  });
  await prisma.userProfile.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.user.deleteMany({
    where: {
      NOT: testSearchUsers.map(u => ({ id: u.id })),
    },
  });
  await prisma.accessConfigVersion.deleteMany();

  // Восстанавливаем тестовых пользователей
  for (const user of testSearchUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        password: user.password,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      update: {},
    });
  }

  // Если preserveSystem=true, очищаем только не-системные записи
  if (preserveSystem) {
    await prisma.role.deleteMany({
      where: { name: { notIn: SYSTEM_ROLE_NAMES } },
    });
    await prisma.page.deleteMany({
      where: { path: { notIn: SYSTEM_PAGE_PATHS } },
    });
    await prisma.apiEndpoint.deleteMany({
      where: {
        NOT: SYSTEM_ENDPOINTS.map(ep => ({
          method: ep.method,
          path: ep.path,
        })),
      },
    });
  } else {
    // Полная очистка без сохранения системных данных
    await prisma.role.deleteMany();
    await prisma.page.deleteMany();
    await prisma.apiEndpoint.deleteMany();
  }
}

/**
 * Создаёт базовые системные данные для тестов
 * Системные роли должны существовать для работы тестов
 *
 * @param prisma - Экземпляр Prisma Client
 */
export async function seedSystemRoles(prisma: PrismaClient): Promise<void> {
  const systemRoles = [
    { name: 'GUEST', description: 'Гость системы', isSystem: true },
    { name: 'MEMBER', description: 'Член СНТ', isSystem: true },
    { name: 'ADMIN', description: 'Администратор СНТ', isSystem: true },
    { name: 'SUPER_ADMIN', description: 'Супер-администратор', isSystem: true },
  ];

  for (const role of systemRoles) {
    const existing = await prisma.role.findUnique({
      where: { name: role.name },
    });

    if (!existing) {
      await prisma.role.create({
        data: {
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
        },
      });
    }
  }
}

/**
 * Инициализирует базу данных для интеграционных тестов
 * Очищает таблицы и создаёт системные данные
 *
 * @param prisma - Экземпляр Prisma Client
 */
export async function initializeTestDatabase(prisma: PrismaClient): Promise<void> {
  await cleanupDatabase(prisma);
  await seedSystemRoles(prisma);
}

/**
 * Ожидает определённое количество миллисекунд
 *
 * @param ms - Количество миллисекунд
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Создаёт пользователя с профилем
 *
 * @param prisma - Экземпляр Prisma Client или транзакционный клиент
 * @param overrides - Перехватываемые поля
 * @returns Созданный пользователь с профилем
 */
export async function createTestUserWithProfile(
  prisma: PrismaClient | any,
  overrides?: {
    email?: string;
    name?: string | null;
    first_name?: string;
    last_name?: string;
    theme?: string;
  }
) {
  const email = overrides?.email || createUniqueEmail('user');
  const name = overrides?.name || createUniqueName('User');
  const first_name = overrides?.first_name || 'First';
  const last_name = overrides?.last_name || 'Last';
  const theme = overrides?.theme || 'light';

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: '$2a$10$abcdef', // hash placeholder
      profile: {
        create: {
          first_name,
          last_name,
          theme,
        },
      },
    },
    include: { profile: true },
  });

  return user;
}

/**
 * Создаёт участок для тестов
 *
 * @param prisma - Экземпляр Prisma Client или транзакционный клиент
 * @param overrides - Перехватываемые поля
 * @returns Созданный участок
 */
export async function createTestPlot(
  prisma: PrismaClient | any,
  overrides?: {
    plotNumber?: string;
    cadastralNumber?: string | null;
    area?: number;
    address?: string | null;
    note?: string | null;
  }
) {
  const plotNumber = overrides?.plotNumber || createUniquePlotNumber();
  const cadastralNumber = overrides?.cadastralNumber || createUniqueCadastralNumber();

  const plot = await prisma.plot.create({
    data: {
      plot_number: plotNumber,
      cadastral_number: cadastralNumber,
      area: overrides?.area || 1000,
      address: overrides?.address || 'Test Address',
      note: overrides?.note || 'Test plot',
    },
  });

  return plot;
}

/**
 * Создаёт пользователя с участком и ролью пользователя участка
 *
 * @param prisma - Экземпляр Prisma Client или транзакционный клиент
 * @param role - Роль пользователя на участке (владелец, проживающий)
 * @returns Объект с userId, plotId и plotUserRole
 */
export async function createTestPlotUserRole(
  prisma: PrismaClient | any,
  role: number = 1
) {
  const email = createUniqueEmail('plotuser');
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Plot User',
      password: '$2a$10$abcdef',
      profile: {
        create: {
          first_name: 'Plot',
          last_name: 'User',
          theme: 'light',
        },
      },
    },
    include: { profile: true },
  });

  const plot = await prisma.plot.create({
    data: {
      plot_number: createUniquePlotNumber(),
      cadastral_number: createUniqueCadastralNumber(),
      area: 1000,
      address: 'Test Address',
      note: 'Test plot',
    },
  });

  const plotUserRole = await prisma.plotUserRole.create({
    data: {
      userId: user.id,
      plotId: plot.id,
      role,
    },
  });

  return { userId: user.id, plotId: plot.id, plotUserRole };
}

/**
 * Создаёт страницу для тестов
 *
 * @param prisma - Экземпляр Prisma Client
 * @param overrides - Перехватываемые поля
 * @returns Созданная страница
 */
export async function createTestPage(
  prisma: PrismaClient,
  overrides?: { path?: string; title?: string; sortOrder?: number }
) {
  const path = overrides?.path || `/test-page-${createUniqueSuffix()}`;
  const title = overrides?.title || 'Test Page';
  const sortOrder = overrides?.sortOrder || 1;

  const page = await prisma.page.create({
    data: {
      path,
      title,
      sortOrder,
    },
  });

  return page;
}

/**
 * Создаёт API endpoint для тестов
 *
 * @param prisma - Экземпляр Prisma Client
 * @param overrides - Перехватываемые поля
 * @returns Созданный endpoint
 */
export async function createTestApiEndpoint(
  prisma: PrismaClient,
  overrides?: { method?: string; path?: string }
) {
  const method = overrides?.method || 'GET';
  const path = overrides?.path || `/api/test-${createUniqueSuffix()}`;

  const endpoint = await prisma.apiEndpoint.create({
    data: {
      method,
      path,
      accessType: 'role',
    },
  });

  return endpoint;
}

/**
 * Создаёт роль для тестов
 *
 * @param prisma - Экземпляр Prisma Client
 * @param overrides - Перехватываемые поля
 * @returns Созданная роль
 */
export async function createTestRole(
  prisma: PrismaClient,
  overrides?: { name?: string; description?: string }
) {
  const name = overrides?.name || `TestRole-${createUniqueSuffix()}`;
  const description = overrides?.description || 'Test role';

  const role = await prisma.role.create({
    data: {
      name,
      description,
      isSystem: false,
    },
  });

  return role;
}
