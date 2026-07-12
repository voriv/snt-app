/**
 * @file global-setup.ts
 * @description Глобальная настройка для интеграционных тестов
 * Инициализирует подключение к тестовой базе данных и создаёт системные данные
 *
 * @spec
 * - Подключается к базе данных через Prisma Client
 * - Создаёт таблицы, если они не существуют
 * - Создаёт системные роли один раз перед всеми тестами
 * - Проверяет подключение перед запуск тестов
 * - При ошибке подключения выбрасывает исключение
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Создаёт базовые системные данные для тестов
 * Системные роли и тестовые пользователи должны существовать для работы тестов
 */
async function seedSystemRolesAndUsers(): Promise<void> {
  const systemRoles = [
    { name: 'GUEST', description: 'Гость системы', isSystem: true },
    { name: 'MEMBER', description: 'Член СНТ', isSystem: true },
    { name: 'ADMIN', description: 'Администратор СНТ', isSystem: true },
    { name: 'SUPER_ADMIN', description: 'Супер-администратор', isSystem: true },
  ];

  // Полностью пересоздаём системные роли
  await prisma.role.deleteMany();
  for (const role of systemRoles) {
    await prisma.role.create({
      data: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    });
  }

  // Создаём тестовых пользователей для searchUsers тестов
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test-search-user',
      },
    },
  });
  await prisma.user.create({
    data: {
      email: 'test-search-user1@example.com',
      name: 'Test Search User One',
      password: '$2a$10$test', // Хешированный пароль
    },
  });
  await prisma.user.create({
    data: {
      email: 'test-search-user2@example.com',
      name: 'Test Search User Two',
      password: '$2a$10$test',
    },
  });
}

/**
 * Создаёт системные страницы и API эндпоинты
 */
async function seedSystemPagesAndEndpoints(): Promise<void> {
  // Системные страницы
  const pages = [
    { path: '/dashboard', title: 'Dashboard', groupName: 'Основное', sortOrder: 1 },
    { path: '/profile', title: 'Профиль', groupName: 'Основное', sortOrder: 2 },
    { path: '/plots', title: 'Участки', groupName: 'Участки', sortOrder: 3 },
  ];

  for (const page of pages) {
    const existing = await prisma.page.findUnique({
      where: { path: page.path },
    });

    if (!existing) {
      await prisma.page.create({
        data: {
          path: page.path,
          title: page.title,
          groupName: page.groupName,
          sortOrder: page.sortOrder,
          isActive: true,
        },
      });
    }
  }

  // Системные API эндпоинты
  const endpoints = [
    { method: 'GET', path: '/api/v1/plots', accessType: 'role' },
    { method: 'POST', path: '/api/v1/plots', accessType: 'role' },
    { method: 'GET', path: '/api/v1/members', accessType: 'role' },
    { method: 'POST', path: '/api/v1/members', accessType: 'role' },
    { method: 'GET', path: '/api/v1/profile', accessType: 'role' },
    { method: 'PATCH', path: '/api/v1/profile', accessType: 'role' },
  ];

  for (const ep of endpoints) {
    const existing = await prisma.apiEndpoint.findUnique({
      where: {
        method_path: { method: ep.method, path: ep.path },
      },
    });

    if (!existing) {
      await prisma.apiEndpoint.create({
        data: {
          method: ep.method,
          path: ep.path,
          accessType: ep.accessType,
          isActive: true,
        },
      });
    }
  }
}

/**
 * Создаёт таблицы, если они не существуют
 * Это необходимо для тестовой базы данных, которая может быть чистой
 */
async function ensureTablesExist(): Promise<void> {
  try {
    // Проверяем существование таблицы plot_users через Prisma
    const count = await prisma.plotUserRole.count();
    // Если таблица существует, count вернёт 0 или число, если нет - ошибка
    if (count === undefined || count === null) {
      throw new Error('Table plot_users does not exist');
    }
  } catch {
    // Таблица не существует, создаём её
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "plot_users" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text NOT NULL,
        "plot_id" text NOT NULL,
        "role" integer NOT NULL,
        "status" text NOT NULL DEFAULT 'active',
        "comment" text,
        "assigned_at" timestamp(6) without time zone NOT NULL DEFAULT now(),
        "expires_at" timestamp(6) without time zone,
        "created_at" timestamp(6) without time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp(6) without time zone NOT NULL
      )
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "plot_user_history" (
        "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
        "plot_user_id" text NOT NULL REFERENCES "plot_users"("id") ON DELETE CASCADE,
        "user_id" text NOT NULL,
        "plot_id" text NOT NULL,
        "role" integer NOT NULL,
        "status" text NOT NULL,
        "comment" text,
        "changed_by" text NOT NULL,
        "changed_at" timestamp(6) without time zone NOT NULL DEFAULT now(),
        "changed_reason" text NOT NULL DEFAULT 'Initial assignment',
        "old_values" jsonb,
        "new_values" jsonb
      )
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_plot_role" ON "plot_users"("user_id", "plot_id", "role")
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "plot_user_role_user_id_idx" ON "plot_users"("user_id")
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "plot_user_role_plot_id_idx" ON "plot_users"("plot_id")
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "plot_user_history_plot_user_id_idx" ON "plot_user_history"("plot_user_id")
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "plot_user_history_user_id_idx" ON "plot_user_history"("user_id")
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "plot_user_history_plot_id_idx" ON "plot_user_history"("plot_id")
    `);
  }
}

/**
 * Глобальная функция настройки, запускается один раз перед всеми интеграционными тестами
 *
 * @spec
 * - Подключается к базе данных
 * - Создаёт таблицы, если они не существуют
 * - Очищает все тестовые данные
 * - Создаёт системные роли
 * - Ожидает готовности БД (максимум 30 секунд)
 * - При неудаче выбрасывает ошибку
 */
export default async function globalSetup(): Promise<void> {
  // Подключение к базе данных
  await prisma.$connect();

  // Проверка готовности базы данных
  let ready = false;
  let attempts = 0;
  const maxAttempts = 60;

  while (!ready && attempts < maxAttempts) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      ready = true;
    } catch {
      attempts++;
      // Ждём 500мс между попытками
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  if (!ready) {
    await prisma.$disconnect();
    throw new Error(
      'Test database did not become ready in time. Check DATABASE_URL environment variable.'
    );
  }

  // Создаём таблицы, если они не существуют
  await ensureTablesExist();

  // Очищаем только тестовые данные (не системные роли, страницы и эндпоинты)
  // Порядок важен из-за внешних ключей: сначала таблицы с FK, потом родительские

  // Сохраняем test-search-user пользователей перед очисткой (для тестов roles.test.ts)
  const testSearchUsers = await prisma.user.findMany({
    where: {
      email: {
        contains: 'test-search-user',
      },
    },
  });

  await prisma.plotUserRoleHistory.deleteMany();
  await prisma.plotUserRole.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.plot.deleteMany();
  await prisma.user.deleteMany({
    where: {
      NOT: testSearchUsers.map(u => ({ id: u.id })),
    },
  });
  await prisma.accessConfigVersion.deleteMany();

  // Восстанавливаем test-search-user пользователей
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

  // Создаём системные роли и тестовых пользователей один раз
  await seedSystemRolesAndUsers();

  // Создаём системные страницы и API эндпоинты один раз
  await seedSystemPagesAndEndpoints();
}

/**
 * Глобальная функция очистки, запускается один раз после всех интеграционных тестов
 *
 * @spec
 * - Отключается от базы данных
 */
export async function teardown(): Promise<void> {
  await prisma.$disconnect();
}
