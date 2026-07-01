'use client';

import Link from 'next/link';
import type { Member } from '@/domains/members';
import { Badge } from '@/components/ui';

interface MemberListProps {
  members: Member[];
}

export function MemberList({ members }: MemberListProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Члены СНТ не найдены</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              ФИО
            </th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Телефон
            </th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Email
            </th>
            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Статус
            </th>
            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Действия</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                {member.lastName} {member.firstName}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {member.phone || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {member.email || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <Badge variant={member.isActive ? 'success' : 'default'}>
                  {member.isActive ? 'Активен' : 'Неактивен'}
                </Badge>
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <Link
                  href={`/dashboard/members/${member.id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Редактировать
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
