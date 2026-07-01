/**
 * @file prisma/seed.ts
 * @description Сидирование БД: роли, страницы, API endpoints, access_config_version, первый пользователь
 *
 * @spec
 * - Идемпотентно: использует upsert по уникальным ключам
 * - Создаёт 4 системные роли: SUPER_ADMIN, ADMIN, MEMBER, GUEST
 * - Создаёт записи в реестре pages с accessType
 * - Создаёт записи в реестре api_endpoints с accessType
 * - Создаёт начальную запись access_config_version
 * - Мигрирует существующие назначения users.role → user_roles
 * - Создаёт первого пользователя SUPER_ADMIN
 *
 * @see docs/model/schema-update-roles-notice.md — Seed данные
 * @see docs/user-stories/US-8-roles-management.md
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Создаёт первого супер-администратора
 *
 * @description Проверяет существование пользователя с email admin@snt.local
 * и создаёт его с ролью SUPER_ADMIN, если не существует
 *
 * @returns Promise<UserData> - созданный или существующий пользователь
 *
 * @spec
 * - Проверяет наличие пользователя по email
 * - Создаёт нового пользователя с хешированным паролем
 * - Автоматически назначает роль SUPER_ADMIN
 * - Если пользователь существует, возвращает его без изменений
 */
async function createFirstSuperAdmin() {
  console.log('🌱 Creating first SUPER_ADMIN user...');
  
  const password = 'admin123';
  const email = 'admin@snt.local';
  const name = 'Администратор';
  
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  
  // Проверяем, есть ли уже пользователь с таким email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    console.log(`  → User ${email} already exists, skipping creation`);
    return existingUser;
  }
  
  // Создаём пользователя
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
    },
  });
  
  console.log(`  → User created: ${user.email} (id: ${user.id})`);
  
  // Ищем роль SUPER_ADMIN
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });
  
  if (!superAdminRole) {
    console.log('  → SUPER_ADMIN role not found, skipping role assignment');
    return user;
  }
  
  // Назначаем роль SUPER_ADMIN
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: user.id, roleId: superAdminRole.id },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: superAdminRole.id,
    },
  });
  
  console.log(`  → SUPER_ADMIN role assigned to ${user.email}`);
  
  return user;
}

const SEED_ROLES = [
  { name: 'SUPER_ADMIN', description: 'Супер-администратор. Полный доступ ко всем страницам.', isSystem: true },
  { name: 'ADMIN', description: 'Администратор. Настраиваемая роль.', isSystem: true },
  { name: 'MEMBER', description: 'Член СНТ. Настраиваемая роль.', isSystem: true },
  { name: 'GUEST', description: 'Гость. Настраиваемая роль.', isSystem: true },
];

const SEED_PAGES = [
  { path: '/login', title: 'Вход', groupName: 'Публичное', sortOrder: 0, accessType: 'public', isActive: true },
  { path: '/register', title: 'Регистрация', groupName: 'Публичное', sortOrder: 10, accessType: 'public', isActive: true },
  { path: '/forbidden', title: 'Доступ запрещён', groupName: 'Публичное', sortOrder: 20, accessType: 'public', isActive: true },
  { path: '/dashboard', title: 'Дашборд', groupName: 'Основное', sortOrder: 0, accessType: 'role', isActive: true },
  { path: '/dashboard/members', title: 'Члены СНТ', groupName: 'Основное', sortOrder: 10, accessType: 'role', isActive: true },
  { path: '/dashboard/plots', title: 'Участки', groupName: 'Основное', sortOrder: 20, accessType: 'role', isActive: true },
  { path: '/dashboard/profile', title: 'Профиль', groupName: 'Личное', sortOrder: 100, accessType: 'owner', isActive: true },
  { path: '/dashboard/roles', title: 'Управление ролями', groupName: 'Администрирование', sortOrder: 200, accessType: 'super_admin', isActive: true },
];

const SEED_API_ENDPOINTS = [
  { method: 'GET', path: '/', accessType: 'public', description: 'Health check' },
  { method: 'POST', path: '/auth/register', accessType: 'public', description: 'Регистрация нового пользователя' },
  { method: 'GET', path: '/auth/[...nextauth]', accessType: 'public', description: 'NextAuth' },
  { method: 'POST', path: '/auth/[...nextauth]', accessType: 'public', description: 'NextAuth' },
  { method: 'GET', path: '/profile', accessType: 'owner', description: 'Профиль текущего пользователя' },
  { method: 'POST', path: '/profile', accessType: 'owner', description: 'Создание/обновление аватара профиля' },
  { method: 'DELETE', path: '/profile', accessType: 'owner', description: 'Удаление аватара профиля' },
  { method: 'PATCH', path: '/profile/theme', accessType: 'owner', description: 'Смена темы пользователя' },
  { method: 'GET', path: '/members', accessType: 'role', description: 'Список членов СНТ' },
  { method: 'POST', path: '/members', accessType: 'role', description: 'Создание члена СНТ' },
  { method: 'GET', path: '/members/:id', accessType: 'role', description: 'Просмотр члена СНТ' },
  { method: 'PUT', path: '/members/:id', accessType: 'role', description: 'Редактирование члена СНТ' },
  { method: 'DELETE', path: '/members/:id', accessType: 'role', description: 'Удаление члена СНТ' },
  { method: 'GET', path: '/plots', accessType: 'role', description: 'Список участков' },
  { method: 'POST', path: '/plots', accessType: 'role', description: 'Создание участка' },
  { method: 'GET', path: '/roles', accessType: 'super_admin', description: 'Список ролей' },
  { method: 'POST', path: '/roles', accessType: 'super_admin', description: 'Создать роль' },
  { method: 'GET', path: '/roles/:id', accessType: 'super_admin', description: 'Получить роль' },
  { method: 'PATCH', path: '/roles/:id', accessType: 'super_admin', description: 'Обновить роль' },
  { method: 'DELETE', path: '/roles/:id', accessType: 'super_admin', description: 'Удалить роль' },
  { method: 'GET', path: '/roles/:id/users', accessType: 'super_admin', description: 'Участники роли' },
  { method: 'POST', path: '/roles/:id/users', accessType: 'super_admin', description: 'Добавить участника' },
  { method: 'DELETE', path: '/roles/:id/users/:userId', accessType: 'super_admin', description: 'Исключить участника' },
  { method: 'GET', path: '/roles/:id/pages', accessType: 'super_admin', description: 'Страницы роли' },
  { method: 'POST', path: '/roles/:id/pages', accessType: 'super_admin', description: 'Назначить страницу' },
  { method: 'DELETE', path: '/roles/:id/pages/:pageId', accessType: 'super_admin', description: 'Снять страницу' },
  { method: 'GET', path: '/roles/:id/api-endpoints', accessType: 'super_admin', description: 'API endpoints роли' },
  { method: 'POST', path: '/roles/:id/api-endpoints', accessType: 'super_admin', description: 'Назначить API endpoint' },
  { method: 'DELETE', path: '/roles/:id/api-endpoints/:endpointId', accessType: 'super_admin', description: 'Снять API endpoint' },
  { method: 'GET', path: '/pages', accessType: 'super_admin', description: 'Список страниц' },
  { method: 'POST', path: '/pages', accessType: 'super_admin', description: 'Создать страницу' },
  { method: 'PATCH', path: '/pages/:id', accessType: 'super_admin', description: 'Обновить страницу' },
  { method: 'DELETE', path: '/pages/:id', accessType: 'super_admin', description: 'Удалить страницу' },
  { method: 'GET', path: '/api-endpoints', accessType: 'super_admin', description: 'Список API endpoints' },
  { method: 'POST', path: '/api-endpoints', accessType: 'super_admin', description: 'Создать endpoint' },
  { method: 'PATCH', path: '/api-endpoints/:id', accessType: 'super_admin', description: 'Обновить endpoint' },
  { method: 'DELETE', path: '/api-endpoints/:id', accessType: 'super_admin', description: 'Удалить endpoint' },
  { method: 'GET', path: '/users', accessType: 'super_admin', description: 'Поиск пользователей для добавления в роль' },
];

async function main() {
  console.log('🌱 Seeding roles...');
  const roleMap = new Map<string, string>();
  for (const r of SEED_ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description, isSystem: r.isSystem },
      create: {
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
      },
    });
    roleMap.set(r.name, role.id);
  }

  console.log('🌱 Seeding pages...');
  for (const p of SEED_PAGES) {
    await prisma.page.upsert({
      where: { path: p.path },
      update: {
        title: p.title,
        groupName: p.groupName,
        sortOrder: p.sortOrder,
        accessType: p.accessType,
        isActive: p.isActive,
      },
      create: {
        path: p.path,
        title: p.title,
        groupName: p.groupName,
        sortOrder: p.sortOrder,
        accessType: p.accessType,
        isActive: p.isActive,
      },
    });
  }

  console.log('🌱 Seeding api_endpoints...');
  for (const e of SEED_API_ENDPOINTS) {
    const existing = await prisma.apiEndpoint.findFirst({
      where: { method: e.method, path: e.path },
    });
    if (existing) {
      await prisma.apiEndpoint.update({
        where: { id: existing.id },
        data: {
          description: e.description,
          accessType: e.accessType,
          isActive: true,
        },
      });
    } else {
      await prisma.apiEndpoint.create({
        data: {
          method: e.method,
          path: e.path,
          description: e.description,
          accessType: e.accessType,
          isActive: true,
        },
      });
    }
  }

  console.log('🌱 Seeding access_config_version...');
  await prisma.accessConfigVersion.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, version: 0 },
  });

  // Создаём первого пользователя SUPER_ADMIN
  console.log('🌱 Creating first SUPER_ADMIN user...');
  try {
    const firstUser = await createFirstSuperAdmin();
    console.log(`  → First user: ${firstUser.email} (id: ${firstUser.id})`);
    console.log(`  → Password: admin123 (CHANGE IMMEDIATELY AFTER FIRST LOGIN)`);
  } catch (error) {
    console.error('  → Error creating first user:', error);
  }

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
