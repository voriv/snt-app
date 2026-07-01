/**
 * @component ProfileCard
 * @category features
 * @description Компонент отображения информации профиля пользователя
 *
 * @example
 * ```tsx
 * <ProfileCard
 *   user={{ email: 'user@example.com', name: 'Ivan', roles: ['MEMBER'] }}
 *   profile={{ firstName: 'Ivan', lastName: 'Ivanov', phone: '+79990000000', avatar: '/avatars/123.jpg' }}
 * />
 * ```
 *
 * @spec
 * - Отображает аватар (или дефолтный если нет)
 * - Отображает имя пользователя (firstName + lastName)
 * - Отображает email из User
 * - Отображает телефон (если есть)
 * - Отображает bio (если есть)
 * - Показывает статус (активный/неактивный)
 * - При isEditable=true показывает кнопку "Редактировать"
 * - Доступность: правильные aria-labels для аватара
 */
'use client';

import { Card, CardHeader, CardTitle, CardBody, Badge, Button } from '@/components/ui';

export interface ProfileCardProps {
  /** Данные пользователя из session */
  user: {
    /** Email пользователя */
    email: string;
    /** Отображаемое имя пользователя */
    name: string | null;
    /** Массив имён ролей пользователя (RBAC через user_roles) */
    roles: string[];
  };
  /** Данные профиля пользователя */
  profile: {
    /** Имя */
    firstName: string | null;
    /** Фамилия */
    lastName: string | null;
    /** Отчество (опционально) */
    middleName: string | null;
    /** Телефон (опционально) */
    phone: string | null;
    /** URL аватара (опционально) */
    avatar: string | null;
    /** Биография (опционально) */
    bio: string | null;
  };
  /** Показывать ли режим редактирования */
  isEditable?: boolean;
  /** Обработчик нажатия на кнопку "Редактировать" */
  onEdit?: () => void;
}

const ROLE_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' }> = {
  SUPER_ADMIN: { label: 'Супер-админ', variant: 'danger' },
  ADMIN: { label: 'Администратор', variant: 'warning' },
  MEMBER: { label: 'Член СНТ', variant: 'success' },
  GUEST: { label: 'Гость', variant: 'default' },
};

const DEFAULT_ROLE_LABEL: { label: string; variant: 'default' | 'success' | 'warning' | 'danger' } = {
  label: 'Роль',
  variant: 'default',
};

export function ProfileCard({
  user,
  profile,
  isEditable = false,
  onEdit,
}: ProfileCardProps) {
  const roles = user.roles.length > 0 ? user.roles : ['GUEST'];
  const displayName = user.name || `${profile.firstName} ${profile.lastName}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-4">
          <div className="shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={`Аватар ${displayName}`}
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                role="img"
              />
            ) : (
              <div
                className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-gray-200"
                role="img"
                aria-label={`Аватар пользователя ${displayName} (дефолтный)`}
              >
                <svg
                  className="h-10 w-10 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{displayName}</CardTitle>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {roles.map((roleName) => {
                  const info = ROLE_LABELS[roleName] ?? { ...DEFAULT_ROLE_LABEL, label: roleName };
                  return (
                    <Badge key={roleName} variant={info.variant}>
                      {info.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {profile.middleName && (
            <div className="flex items-center text-sm">
              <span className="w-24 text-gray-500 font-medium">Отчество:</span>
              <span className="text-gray-900">{profile.middleName}</span>
            </div>
          )}
          <div className="flex items-center text-sm">
            <span className="w-24 text-gray-500 font-medium">Имя:</span>
            <span className="text-gray-900">{profile.firstName}</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="w-24 text-gray-500 font-medium">Фамилия:</span>
            <span className="text-gray-900">{profile.lastName}</span>
          </div>
          {profile.phone && (
            <div className="flex items-center text-sm">
              <span className="w-24 text-gray-500 font-medium">Телефон:</span>
              <span className="text-gray-900">{profile.phone}</span>
            </div>
          )}
          {profile.bio && (
            <div>
              <div className="flex items-center text-sm mb-1">
                <span className="w-24 text-gray-500 font-medium">О себе:</span>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap text-sm">{profile.bio}</p>
            </div>
          )}
        </div>
        {isEditable && onEdit && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button variant="primary" onClick={onEdit}>
              Редактировать
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
