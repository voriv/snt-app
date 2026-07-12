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
  { path: '/dashboard/plots', title: 'Участки', groupName: 'Основное', sortOrder: 10, accessType: 'role', isActive: true },
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
  { method: 'GET', path: '/plots', accessType: 'role', description: 'Список участков' },
  { method: 'POST', path: '/plots', accessType: 'role', description: 'Создание участка' },
  { method: 'GET', path: '/plots/:id', accessType: 'role', description: 'Просмотр участка' },
  { method: 'PATCH', path: '/plots/:id', accessType: 'role', description: 'Редактирование участка' },
  { method: 'DELETE', path: '/plots/:id', accessType: 'role', description: 'Удаление участка' },
  // Roles management
  { method: 'GET', path: '/roles', accessType: 'super_admin', description: 'Список ролей' },
  { method: 'POST', path: '/roles', accessType: 'super_admin', description: 'Создание роли' },
  { method: 'GET', path: '/roles/:id', accessType: 'super_admin', description: 'Просмотр роли' },
  { method: 'PATCH', path: '/roles/:id', accessType: 'super_admin', description: 'Редактирование роли' },
  { method: 'DELETE', path: '/roles/:id', accessType: 'super_admin', description: 'Удаление роли' },
  { method: 'PATCH', path: '/roles/:id/pages', accessType: 'super_admin', description: 'Назначение страниц роли' },
  { method: 'DELETE', path: '/roles/:id/pages/:pageId', accessType: 'super_admin', description: 'Отзыв страницы у роли' },
  { method: 'PATCH', path: '/roles/:id/api-endpoints', accessType: 'super_admin', description: 'Назначение API endpoints роли' },
  { method: 'DELETE', path: '/roles/:id/api-endpoints/:apiEndpointId', accessType: 'super_admin', description: 'Отзыв API endpoint у роли' },
  // Pages management
  { method: 'GET', path: '/pages', accessType: 'super_admin', description: 'Список страниц' },
  { method: 'POST', path: '/pages', accessType: 'super_admin', description: 'Создание страницы' },
  { method: 'GET', path: '/pages/:id', accessType: 'super_admin', description: 'Просмотр страницы' },
  { method: 'PATCH', path: '/pages/:id', accessType: 'super_admin', description: 'Редактирование страницы' },
  { method: 'DELETE', path: '/pages/:id', accessType: 'super_admin', description: 'Удаление страницы' },
  // API Endpoints management
  { method: 'GET', path: '/api-endpoints', accessType: 'super_admin', description: 'Список API endpoints' },
  { method: 'POST', path: '/api-endpoints', accessType: 'super_admin', description: 'Создание API endpoint' },
  { method: 'GET', path: '/api-endpoints/:id', accessType: 'super_admin', description: 'Просмотр API endpoint' },
  { method: 'PATCH', path: '/api-endpoints/:id', accessType: 'super_admin', description: 'Редактирование API endpoint' },
  { method: 'DELETE', path: '/api-endpoints/:id', accessType: 'super_admin', description: 'Удаление API endpoint' },
  // Users management
  { method: 'GET', path: '/users', accessType: 'super_admin', description: 'Поиск пользователей' },
  // Plot Users management
  { method: 'GET', path: '/plot-users', accessType: 'role', description: 'Список связей пользователь-участок' },
  { method: 'POST', path: '/plot-users', accessType: 'role', description: 'Создание связи пользователь-участок' },
  { method: 'GET', path: '/plot-users/:id', accessType: 'role', description: 'Просмотр связи пользователь-участок' },
  { method: 'PATCH', path: '/plot-users/:id', accessType: 'role', description: 'Редактирование связи пользователь-участок' },
  { method: 'DELETE', path: '/plot-users/:id', accessType: 'role', description: 'Удаление связи пользователь-участок' },
  { method: 'GET', path: '/plot-users/users', accessType: 'role', description: 'Список пользователей для формы связи' },
  // Plot Participants management
  { method: 'GET', path: '/plots/:id/participants', accessType: 'role', description: 'Список участников участка' },
  { method: 'DELETE', path: '/plots/:id/participants/:participantId', accessType: 'role', description: 'Удаление участника из участка' },
];

/**
 * Основная функция сидирования
 *
 * @description Создаёт все системные данные: роли, страницы, API endpoints, первого пользователя
 *
 * @returns Promise<void>
 *
 * @spec
 * - Создает роли через upsert
 * - Создает страницы через upsert
 * - Создает API endpoints через upsert
 * - Создает начальную запись access_config_version
 * - Вызывает createFirstSuperAdmin
 */
async function main() {
  console.log('🌱 Starting seeding...');
  
  // Создаём роли
  console.log('Creating roles...');
  for (const role of SEED_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    console.log(`  → Role created: ${role.name}`);
  }
  
  // Создаём страницы
  console.log('Creating pages...');
  for (const page of SEED_PAGES) {
    await prisma.page.upsert({
      where: { path: page.path },
      update: {},
      create: page,
    });
    console.log(`  → Page created: ${page.path}`);
  }
  
  // Создаём API endpoints
  console.log('Creating API endpoints...');
  for (const endpoint of SEED_API_ENDPOINTS) {
    await prisma.apiEndpoint.upsert({
      where: { method_path: { method: endpoint.method, path: endpoint.path } },
      update: {},
      create: endpoint,
    });
    console.log(`  → API endpoint created: ${endpoint.method} ${endpoint.path}`);
  }
  
  // Назначаем SUPER_ADMIN все страницы и API endpoints
  console.log('Assigning pages and API endpoints to SUPER_ADMIN...');
  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'SUPER_ADMIN' },
  });
  
  if (superAdminRole) {
    // Получаем все страницы и назначаем SUPER_ADMIN
    const allPages = await prisma.page.findMany();
    for (const page of allPages) {
      await prisma.rolePage.upsert({
        where: {
          roleId_pageId: {
            roleId: superAdminRole.id,
            pageId: page.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          pageId: page.id,
        },
      });
    }
    console.log(`  → Assigned ${allPages.length} pages to SUPER_ADMIN`);
    
    // Получаем все API endpoints и назначаем SUPER_ADMIN
    const allApiEndpoints = await prisma.apiEndpoint.findMany();
    for (const endpoint of allApiEndpoints) {
      await prisma.roleApiEndpoint.upsert({
        where: {
          roleId_apiEndpointId: {
            roleId: superAdminRole.id,
            apiEndpointId: endpoint.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          apiEndpointId: endpoint.id,
        },
      });
    }
    console.log(`  → Assigned ${allApiEndpoints.length} API endpoints to SUPER_ADMIN`);
    
    // Назначаем новые endpoints для role-based доступа (ADMIN, MEMBER)
    console.log('Assigning role-based API endpoints to ADMIN and MEMBER roles...');
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
    const memberRole = await prisma.role.findUnique({ where: { name: 'MEMBER' } });
    
    // Получаем все endpoints с accessType='role'
    const roleBasedEndpoints = await prisma.apiEndpoint.findMany({
      where: { accessType: 'role' },
    });
    
    for (const endpoint of roleBasedEndpoints) {
      // Назначаем ADMIN
      if (adminRole) {
        await prisma.roleApiEndpoint.upsert({
          where: {
            roleId_apiEndpointId: {
              roleId: adminRole.id,
              apiEndpointId: endpoint.id,
            },
          },
          update: {},
          create: {
            roleId: adminRole.id,
            apiEndpointId: endpoint.id,
          },
        });
      }
      // Назначаем MEMBER
      if (memberRole) {
        await prisma.roleApiEndpoint.upsert({
          where: {
            roleId_apiEndpointId: {
              roleId: memberRole.id,
              apiEndpointId: endpoint.id,
            },
          },
          update: {},
          create: {
            roleId: memberRole.id,
            apiEndpointId: endpoint.id,
          },
        });
      }
    }
    console.log(`  → Assigned ${roleBasedEndpoints.length} role-based endpoints to ADMIN and MEMBER`);
  }
  
  // Создаём начальную запись access_config_version
  await prisma.accessConfigVersion.upsert({
    where: { id: 1 },
    update: {},
    create: { version: BigInt(1) },
  });
  console.log('  → Access config version created');
  
  // Создаём первого супер-администратора
  await createFirstSuperAdmin();
  
  console.log('🎉 Seeding completed!');
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
