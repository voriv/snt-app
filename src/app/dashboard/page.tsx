/**
 * @page /dashboard
 * @auth required
 * @description Главная страница дашборда пользователя
 *
 * @spec
 * - Отображает статистику СНТ (члены, участки, документы, голосования)
 * - Доступна только авторизованным пользователям
 * - Карточки ведут на соответствующие разделы
 *
 * @data-flow
 * - Server Component
 * - Статистика hardcoded в текущей версии
 * - Карточки являются ссылками на соответствующие страницы
 */
'use client';

import Link from 'next/link';

const stats = [
  { name: 'Члены СНТ', href: '/dashboard/members', value: '0' },
  { name: 'Участки', href: '/dashboard/plots', value: '0' },
  { name: 'Документы', href: '/dashboard/documents', value: '0' },
  { name: 'Голосования', href: '/dashboard/votes', value: '0' },
];

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Дашборд
          </h2>
        </div>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="relative bg-white pt-6 px-4 shadow sm:rounded-lg sm:px-10"
            >
              <dt>
                <p className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </p>
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stat.value}
              </dd>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
