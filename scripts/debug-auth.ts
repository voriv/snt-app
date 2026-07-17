/**
 * @file debug-auth.ts
 * @description Диагностический скрипт для проверки состояния auth и RBAC
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== DIAGNOSTIC REPORT ===\n');

  // 1. Check users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  console.log(`Users: ${users.length}`);
  users.forEach(u => console.log(`  - ${u.email} (id: ${u.id}, name: ${u.name})`));

  // 2. Check user_roles
  const userRoles = await prisma.userRole.findMany({
    include: {
      user: { select: { email: true } },
      role: { select: { name: true } },
    },
  });
  console.log(`\nUser-Role assignments: ${userRoles.length}`);
  userRoles.forEach(ur => 
    console.log(`  - ${ur.user.email} → ${ur.role.name}`)
  );

  // 3. Check roles
  const roles = await prisma.role.findMany({
    select: { id: true, name: true, isSystem: true },
  });
  console.log(`\nRoles: ${roles.length}`);
  roles.forEach(r => console.log(`  - ${r.name} (system: ${r.isSystem})`));

  // 4. Check api_endpoints
  const endpoints = await prisma.apiEndpoint.findMany({
    where: { isActive: true },
    select: { method: true, path: true, accessType: true, isActive: true },
    orderBy: [{ method: 'asc' }, { path: 'asc' }],
  });
  console.log(`\nActive API endpoints: ${endpoints.length}`);
  endpoints.forEach(e => console.log(`  - ${e.method} ${e.path} (${e.accessType})`));

  // 5. Check role_api_endpoints for SUPER_ADMIN
  const superAdminRole = roles.find(r => r.name === 'SUPER_ADMIN');
  if (superAdminRole) {
    const roleEndpoints = await prisma.roleApiEndpoint.findMany({
      where: { roleId: superAdminRole.id },
      include: {
        role: { select: { name: true } },
        apiEndpoint: { select: { method: true, path: true, accessType: true } },
      },
    });
    console.log(`\nRole-ApiEndpoint assignments for SUPER_ADMIN: ${roleEndpoints.length}`);
    roleEndpoints.forEach(re =>
      console.log(`  - SUPER_ADMIN → ${re.apiEndpoint.method} ${re.apiEndpoint.path} (${re.apiEndpoint.accessType})`)
    );
  }

  // 6. Check pages
  const pages = await prisma.page.findMany({
    where: { isActive: true },
    select: { path: true, accessType: true },
  });
  console.log(`\nActive Pages: ${pages.length}`);
  pages.forEach(p => console.log(`  - ${p.path} (${p.accessType})`));

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
