/**
 * Скрипт для регистрации API endpoint PATCH /api/v1/profile/theme
 * Запускается через: npx tsx scripts/add-profile-theme-endpoint.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Проверка и добавление endpoint PATCH /profile/theme...');

  // Проверяем существование записи
  const existing = await prisma.apiEndpoint.findUnique({
    where: {
      method_path: {
        method: 'PATCH',
        path: '/profile/theme',
      },
    },
  });

  if (existing) {
    console.log(`Запись уже существует: ${existing.method} ${existing.path}`);
    console.log(`access_type: ${existing.accessType}, is_active: ${existing.isActive}`);

    // Обновляем если нужно
    if (existing.accessType !== 'owner' || !existing.isActive) {
      await prisma.apiEndpoint.update({
        where: {
          id: existing.id,
        },
        data: {
          accessType: 'owner',
          isActive: true,
        },
      });
      console.log(`Обновлена запись: ${existing.method} ${existing.path}`);
    } else {
      console.log('Запись уже корректна, изменения не нужны');
    }
  } else {
    // Создаем новую запись
    const created = await prisma.apiEndpoint.create({
      data: {
        method: 'PATCH',
        path: '/profile/theme',
        description: 'Обновление темы оформления пользователя',
        accessType: 'owner',
        isActive: true,
      },
    });
    console.log(`Создана новая запись: ${created.method} ${created.path}`);
  }

  console.log('Завершено.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
