/**
 * @type Theme
 * @domain userProfile
 * @description Тема оформления приложения
 *
 * @spec
 * - Допустимые значения: 'light', 'dark', 'green' (BR-1)
 * - Используется для управления визуальным стилем приложения
 * - Значение по умолчанию: 'light' (BR-2)
 */
export type Theme = 'light' | 'dark' | 'green';

/**
 * @type UserProfile
 * @domain userProfile
 * @description Профиль пользователя в БД (из Prisma)
 *
 * @spec
 * - Бизнес-ключ: id (cuid)
 * - Жизненный цикл: создается при первом редактировании профиля
 * - Инварианты: все поля кроме id, userId и theme опциональны
 * - theme: обязательно, одно из значений 'light', 'dark', 'green'
 *
 * @see docs/model/entities/user-profile.md — концептуальная модель
 */
export interface UserProfileData {
  /** Уникальный идентификатор. Генерируется автоматически cuid */
  id: string;
  /** ID пользователя системы */
  userId: string;
  /** Имя — опциональное, может быть null */
  firstName: string | null;
  /** Отчество — опциональное, 2-50 символов или null */
  middleName: string | null;
  /** Фамилия — опциональная, может быть null */
  lastName: string | null;
  /** Телефон — опциональный, формат E.164 или национальный */
  phone: string | null;
  /** URL аватара — опциональный, JPG/PNG/GIF, max 5MB */
  avatar: string | null;
  /** Биография — опциональная, max 500 символов */
  bio: string | null;
  /** Тема оформления */
  theme: Theme;
  /** Дата создания профиля */
  createdAt: Date;
  /** Дата последнего обновления профиля */
  updatedAt: Date;
}

/**
 * @type UserProfileFull
 * @domain userProfile
 * @description Агрегированный профиль пользователя для отображения в UI
 * Содержит данные из User (email, name, roles, avatar) и UserProfileData
 *
 * @spec
 * - email берется из User
 * - name берется из User (для отображения в навбаре)
 * - roles — массив имён ролей пользователя (RBAC через user_roles)
 * - firstName, lastName, phone, bio — из UserProfile
 * - avatar может быть из UserProfile или User
 */
export interface UserProfileFull {
  /** Уникальный идентификатор профиля */
  id: string;
  /** ID пользователя системы */
  userId: string;
  /** Email пользователя из User */
  email: string;
  /** Отображаемое имя из User */
  name: string | null;
  /** Роли пользователя (имена ролей из RBAC-модели) */
  roles: string[];
  /** Имя — может быть null */
  firstName: string | null;
  /** Отчество */
  middleName: string | null;
  /** Фамилия — может быть null */
  lastName: string | null;
  /** Телефон */
  phone: string | null;
  /** URL аватара */
  avatar: string | null;
  /** Биография */
  bio: string | null;
  /** Тема оформления */
  theme: Theme;
  /** Дата создания учётной записи */
  userCreatedAt: Date;
  /** Дата последнего обновления учётной записи */
  userUpdatedAt: Date;
  /** Дата создания профиля */
  profileCreatedAt: Date;
  /** Дата последнего обновления профиля */
  profileUpdatedAt: Date;
}

/**
 * @type CreateUserProfileInput
 * @domain userProfile
 * @description Входные данные для создания профиля пользователя
 *
 * @spec
 * - Все поля опциональны при создании (BR-1, BR-2)
 * - firstName/lastName могут быть null (автоматическое создание пустого профиля)
 * - Используется при автоматическом создании профиля
 */
export interface CreateUserProfileInput {
  /** Имя — опциональное, 2-50 символов или null */
  firstName?: string | null;
  /** Отчество — опциональное, 2-50 символов или null */
  middleName?: string | null;
  /** Фамилия — опциональная, 2-50 символов или null */
  lastName?: string | null;
  /** Телефон — опциональный */
  phone?: string | null;
  /** Биография — опциональная, max 500 символов */
  bio?: string | null;
}

/**
 * @type UpdateUserProfileInput
 * @domain userProfile
 * @description Входные данные для обновления профиля пользователя
 *
 * @spec
 * - Все поля опциональные — можно обновить только указанные поля
 * - Валидация через Zod-схемы
 * - Email НЕ изменяется в этой US
 * - Пустые строки для firstName/lastName трансформируются в null
 */
export interface UpdateUserProfileInput {
  /** Имя — опциональное, 2-50 символов или null для удаления */
  firstName?: string | null;
  /** Отчество — опциональное, 2-50 символов или null для удаления */
  middleName?: string | null;
  /** Фамилия — опциональное, 2-50 символов или null для удаления */
  lastName?: string | null;
  /** Телефон — опциональный */
  phone?: string | null;
  /** Биография — опциональная, max 500 символов */
  bio?: string | null;
  /** URL аватара — опциональный */
  avatar?: string | null;
}

/**
 * @type UploadAvatarResult
 * @domain userProfile
 * @description Результат загрузки аватара
 */
export interface UploadAvatarResult {
  /** URL загруженного аватара */
  avatarUrl: string;
}
