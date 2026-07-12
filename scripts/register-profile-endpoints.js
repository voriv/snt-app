/**
 * Скрипт для регистрации API endpoints профиля пользователя
 * Выполняется через: node scripts/register-profile-endpoints.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const endpoints = [
    {
      method: 'GET',
      path: '/profile',
      description: 'Получить профиль текущего пользователя',
      accessType: 'owner',
      isActive: true,
    },
    {
      method: 'PATCH',
      path: '/profile',
      description: 'Обновить профиль текущего пользователя',
      accessType: 'owner',
      isActive: true,
    },
    {
      method: 'PUT',
      path: '/profile',
      description: 'Полное обновление профиля (REST)',
      accessType: 'owner',
      isActive: true,
    },
    {
      method: 'POST',
      path: '/profile/avatar',
      description: 'Загрузить аватар пользователя',
      accessType: 'owner',
      isActive: true,
    },
    {
      method: 'DELETE',
      path: '/profile/avatar',
      description: 'Удалить аватар пользователя',
      accessType: 'owner',
      isActive: true,
    },
  ];

  console.log('Начало регистрации API endpoints для профиля...');

  for (const endpoint of endpoints) {
    const created = await prisma.apiEndpoint.upsert({
      where: {
        method_path: {
          method: endpoint.method,
          path: endpoint.path,
        },
      },
      update: {
        description: endpoint.description,
        accessType: endpoint.accessType,
        isActive: endpoint.isActive,
      },
      create: {
        method: endpoint.method,
        path: endpoint.path,
        description: endpoint.description,
        accessType: endpoint.accessType,
        isActive: endpoint.isActive,
      },
    });

    console.log(`✓ Зарегистрирован endpoint: ${endpoint.method} ${endpoint.path}`);
  }

  console.log('Регистрация завершена успешно!');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
