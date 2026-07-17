/**
 * @file users.types.ts
 * @domain users
 * @description Доменные типы для списка пользователей
 *
 * @spec
 * - Все типы совместимы с Prisma-моделями, но не зависят от них напрямую
 * - Имена полей в camelCase (см. MODEL.md §5.1 — конвенции именования)
 *
 * @see docs/model/entities/user.md
 * @see docs/model/entities/user-profile.md
 * @see docs/model/entities/user-role.md
 */

/**
 * @type UserListItem
 * @domain users
 * @description Строка пользователя в списке
 *
 * @spec
 * - firstName/lastName — nullable (не у всех пользователей есть профиль)
 * - roles — массив названий ролей (строковых)
 *
 * @see docs/model/entities/user.md
 */
export interface UserListItem {
  /** Уникальный идентификатор пользователя */
  id: string;
  /** Email пользователя (уникальный) */
  email: string;
  /** Имя из профиля (nullable — не у всех есть профиль) */
  firstName: string | null;
  /** Фамилия из профиля (nullable — не у всех есть профиль) */
  lastName: string | null;
  /** Массив названий ролей пользователя */
  roles: string[];
  /** Дата регистрации */
  createdAt: Date;
}

/**
 * @type UserFilters
 * @domain users
 * @description Фильтры для списка пользователей (пагинация, поиск, сортировка)
 *
 * @spec
 * - q: текст поиска по email, firstName, lastName
 * - sort: поле сортировки (email, firstName, lastName, createdAt)
 * - order: направление сортировки (asc, desc) @default 'desc'
 */
export interface UserFilters {
  /** Номер страницы (начиная с 1) @default 1 */
  page: number;
  /** Количество записей на странице @default 25 */
  limit: number;
  /** Текст поиска по email, firstName, lastName */
  q?: string;
  /** Поле сортировки @default 'createdAt' */
  sort?: 'email' | 'firstName' | 'lastName' | 'createdAt';
  /** Направление сортировки @default 'desc' */
  order?: 'asc' | 'desc';
}

/**
 * @type UserListResponse
 * @domain users
 * @description Ответ API со списком пользователей и метаданными пагинации
 */
export interface UserListResponse {
  /** Массив пользователей на текущей странице */
  items: UserListItem[];
  /** Общее количество пользователей */
  total: number;
  /** Текущая страница */
  page: number;
  /** Количество записей на странице */
  limit: number;
}

/**
 * @type UserRoleDetail
 * @domain users
 * @description Детальная информация о назначенной роли пользователя
 *
 * @spec
 * - roleName — название роли из таблицы roles
 * - roleDescription — описание роли (nullable)
 *
 * @see docs/model/entities/role.md
 */
export interface UserRoleDetail {
  /** Уникальный идентификатор роли */
  roleId: string;
  /** Название роли */
  roleName: string;
  /** Описание роли (nullable) */
  roleDescription: string | null;
}

/**
 * @type UserDetail
 * @domain users
 * @description Полная информация о пользователе для карточки
 *
 * @spec
 * - firstName/lastName/patronymic/phone — nullable (не у всех есть профиль)
 * - roles — массив UserRoleDetail с полными данными ролей
 *
 * @see docs/model/entities/user.md
 * @see docs/model/entities/user-profile.md
 */
export interface UserDetail {
  /** Уникальный идентификатор пользователя */
  id: string;
  /** Email пользователя (уникальный) */
  email: string;
  /** Имя из профиля (nullable — не у всех есть профиль) */
  firstName: string | null;
  /** Фамилия из профиля (nullable — не у всех есть профиль) */
  lastName: string | null;
  /** Отчество из профиля (nullable) */
  patronymic: string | null;
  /** Телефон из профиля (nullable) */
  phone: string | null;
  /** Дата регистрации */
  createdAt: Date;
  /** Массив назначенных ролей с детальными данными */
  roles: UserRoleDetail[];
}

/**
 * @type UserPlotConnection
 * @domain users
 * @description Связь пользователя с участком (упрощённый вид для карточки пользователя)
 *
 * @spec
 * - plotNumber — номер участка (обязательный)
 * - cadastralNumber — кадастровый номер (nullable)
 * - roleName — название роли на участке (Владелец/Проживает/Представитель)
 * - assignedAt — дата назначения связи
 *
 * @see docs/model/entities/plot-user.md
 * @see US-20-04
 */
export interface UserPlotConnection {
  /** Уникальный идентификатор участка */
  plotId: string;
  /** Номер участка */
  plotNumber: string;
  /** Кадастровый номер участка (nullable) */
  cadastralNumber: string | null;
  /** Название роли на участке (Владелец / Проживает / Представитель) */
  roleName: string;
  /** Дата назначения связи */
  assignedAt: Date;
}

/**
 * @type UserSearchResult
 * @domain users
 * @description Результат поиска пользователей для выбора собеседника
 *
 * @spec
 * - Упрощённый тип с минимальным набором полей для UI-компонента выбора
 * - name — составное имя (lastName + firstName)
 * - avatar — ссылка на аватар (nullable)
 */
export interface UserSearchResult {
  /** Уникальный идентификатор пользователя */
  id: string;
  /** email пользователя */
  email: string;
  /** Составное имя (lastName + firstName) */
  name: string;
  /** Ссылка на аватар (nullable) */
  avatar: string | null;
}
