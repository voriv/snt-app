/**
 * @type PlotUserRoleRole
 * @domain plotUser
 * @description Роли пользователя на участке
 *
 * @spec
 * - 1 = OWNER (владелец)
 * - 2 = RESIDENT (проживает)
 * - 3 = REPRESENTATIVE (представитель)
 *
 * @see BR-5 (значения роли)
 */
export type PlotUserRoleRole = 1 | 2 | 3;

/**
 * @enum PlotUserRoleRoleName
 * @domain plotUser
 * @description Имена ролей для отображения
 */
export const PlotUserRoleRoleName = {
  1: 'OWNER' as const,
  2: 'RESIDENT' as const,
  3: 'REPRESENTATIVE' as const,
} as const;

/**
 * @enum PlotUserRoleRoleLabel
 * @domain plotUser
 * @description Метки ролей на русском языке
 */
export const PlotUserRoleRoleLabel = {
  1: 'Владелец',
  2: 'Проживает',
  3: 'Представитель',
} as const;

/**
 * @type PlotUserRoleStatus
 * @domain plotUser
 * @description Статус связи пользователь-участок
 *
 * @spec
 * - active: активная связь
 * - pending: ожидает подтверждения
 * - expired: истёк срок
 *
 * @see BR-6 (значения статуса)
 */
export type PlotUserRoleStatus = 'active' | 'pending' | 'expired';

/**
 * @enum PlotUserRoleStatusLabel
 * @domain plotUser
 * @description Метки статусов на русском языке
 */
export const PlotUserRoleStatusLabel = {
  active: 'Активен',
  pending: 'Ожидает',
  expired: 'Истёк',
} as const;

/**
 * @type PlotUserRole
 * @domain plotUser
 * @description Связь пользователя с участком
 *
 * @spec
 * - Бизнес-ключ: нет (id генерируется cuid())
 * - Инварианты: user_id и plot_id обязательны
 * - role: 1=owner, 2=resident, 3=representative
 * - status: active, pending, expired
 *
 * @see docs/model/entities/plot-user.md — концептуальная модель
 * @see BR-1 (множественные роли разрешены)
 * @see BR-2 (множественные владельцы разрешены)
 * @see BR-3 (уникальность активной связи)
 */
export interface PlotUserRole {
  /** Уникальный идентификатор связи */
  id: string;
  /** ID пользователя */
  userId: string;
  /** ID участка */
  plotId: string;
  /** Роль пользователя на участке */
  role: PlotUserRoleRole;
  /** Статус связи */
  status: PlotUserRoleStatus;
  /** Комментарий к связи */
  comment: string | null;
  /** Дата назначения */
  assignedAt: Date;
  /** Дата истечения срока (null = бессрочно) */
  expiresAt: Date | null;
  /** Дата создания записи */
  createdAt: Date;
  /** Дата последнего обновления */
  updatedAt: Date;
}

/**
 * @type CreatePlotUserRoleInput
 * @domain plotUser
 * @description Данные для создания связи пользователь-участок
 *
 * @spec
 * - userId: required - cuid
 * - plotId: required - cuid
 * - role: required - 1|2|3
 * - status: optional - default 'active'
 * - comment: optional - max 500 chars
 * - expiresAt: optional - datetime or null
 */
export interface CreatePlotUserRoleInput {
  /** ID пользователя */
  userId: string;
  /** ID участка */
  plotId: string;
  /** Роль пользователя на участке */
  role: PlotUserRoleRole;
  /** Статус связи (по умолчанию: 'active') */
  status?: PlotUserRoleStatus;
  /** Комментарий к связи (до 500 символов) */
  comment?: string | null;
  /** Дата истечения срока */
  expiresAt?: Date | string | null;
}

/**
 * @type UpdatePlotUserRoleInput
 * @domain plotUser
 * @description Данные для обновления связи пользователь-участок
 *
 * @spec
 * - Все поля опциональны
 */
export interface UpdatePlotUserRoleInput {
  /** Роль */
  role?: PlotUserRoleRole;
  /** Статус */
  status?: PlotUserRoleStatus;
  /** Комментарий */
  comment?: string | null;
  /** Дата истечения срока */
  expiresAt?: Date | string | null;
}

/**
 * @type PlotUserRoleWithRelations
 * @domain plotUser
 * @description Расширенная связь с отношениями пользователей и участков
 */
export interface PlotUserRoleWithRelations extends PlotUserRole {
  /** Связанный пользователь */
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  /** Связанный участок */
  plot: {
    id: string;
    plotNumber: string;
    address: string | null;
  } | null;
}

/**
 * @type PlotUserRoleHistory
 * @domain plotUser
 * @description История изменений связи пользователь-участок
 *
 * @spec
 * - Копирует данные из plot_users при каждом изменении
 * - changed_by: ID администратора, создавшего/изменившего запись
 * - changed_at: timestamp изменения
 * - changed_reason: текстовое описание причины
 * - oldValues: предыдущие значения (для аудита)
 * - newValues: новые значения (для аудита)
 *
 * @see BR-7 (историчность)
 */
export interface PlotUserRoleHistory {
  /** Уникальный идентификатор записи истории */
  id: string;
  /** ID связи в plot_users */
  plotUserId: string;
  /** ID пользователя (копия) */
  userId: string;
  /** ID участка (копия) */
  plotId: string;
  /** Роль на момент изменения */
  role: PlotUserRoleRole;
  /** Статус на момент изменения */
  status: PlotUserRoleStatus;
  /** Комментарий на момент изменения */
  comment: string | null;
  /** ID администратора, создавшего изменение */
  changedBy: string;
  /** Дата изменения */
  changedAt: Date;
  /** Причина изменения */
  changedReason: string;
  /** Предыдущие значения (JSON) */
  oldValues: Record<string, unknown> | null;
  /** Новые значения (JSON) */
  newValues: Record<string, unknown> | null;
}

/**
 * @type PlotUserRoleListFilters
 * @domain plotUser
 * @description Фильтры для поиска связей
 */
export interface PlotUserRoleListFilters {
  /** Фильтр по ID пользователя */
  userId?: string;
  /** Фильтр по ID участка */
  plotId?: string;
  /** Фильтр по роли */
  role?: PlotUserRoleRole;
  /** Фильтр по статусу */
  status?: PlotUserRoleStatus;
  /** Номер страницы (для пагинации) */
  page?: number;
  /** Количество записей на странице (для пагинации) */
  limit?: number;
}

/**
 * @type PaginatedResponse
 * @domain plotUser
 * @description Ответ с пагинацией
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * @type PlotUserRoleParticipantFilter
 * @domain plotUser
 * @description Фильтры для списка участников участка
 *
 * @spec
 * - role: фильтр по роли (1=owner, 2=resident, 3=representative)
 * - status: фильтр по статусу (active, pending, expired)
 * - search: поисковый запрос по имени/email
 * - page: номер страницы (с 1)
 * - limit: записей на странице (по умолчанию 25)
 *
 * @see US-19-2 FR-3 (фильтр по роли)
 * @see US-19-2 FR-4 (фильтр по статусу)
 * @see US-19-2 FR-5 (поиск)
 */
export interface PlotUserRoleParticipantFilter {
  /** Фильтр по роли (1=owner, 2=resident, 3=representative) */
  role?: PlotUserRoleRole;
  /** Фильтр по статусу (active, pending, expired) */
  status?: PlotUserRoleStatus;
  /** Поисковый запрос по имени/email */
  search?: string;
  /** Номер страницы (с 1) */
  page?: number;
  /** Записей на странице (по умолчанию 25) */
  limit?: number;
}

/**
 * @type PlotUserRoleConnection
 * @domain plotUser
 * @description Связь пользователя с участком + информация об участке для списка связей пользователя
 *
 * @spec
 * - Расширяет PlotUserRole данными участка
 * - plot: null если участок удалён (Edge Case #1)
 * - Используется в US-19-3 для отображения списка связей текущего пользователя
 *
 * @see US-19-3 FR-1 (список связей)
 * @see US-19-3 AC-1.2 (столбцы таблицы)
 * @see docs/model/entities/plot-user.md
 */
export interface PlotUserRoleConnection extends PlotUserRole {
  /** Связанный участок (null если удалён) */
  plot: {
    id: string;
    plotNumber: string;
    cadastralNumber: string | null;
    area: number | null;
    address: string | null;
  } | null;
}

/**
 * @type PlotUserRoleConnectionFilter
 * @domain plotUser
 * @description Фильтры для списка связей пользователя
 *
 * @spec
 * - role: фильтр по роли (1=owner, 2=resident, 3=representative)
 * - status: фильтр по статусу (active, pending, expired)
 * - search: поисковый запрос по номеру участка или адресу
 * - page: номер страницы (с 1)
 * - limit: записей на странице (по умолчанию 25)
 *
 * @see US-19-3 FR-3 (фильтр по роли)
 * @see US-19-3 FR-4 (фильтр по статусу)
 * @see US-19-3 FR-5 (поиск по участку)
 */
export interface PlotUserRoleConnectionFilter {
  /** Фильтр по роли (1=owner, 2=resident, 3=representative) */
  role?: PlotUserRoleRole;
  /** Фильтр по статусу (active, pending, expired) */
  status?: PlotUserRoleStatus;
  /** Поисковый запрос по номеру участка или адресу */
  search?: string;
  /** Номер страницы (с 1) */
  page?: number;
  /** Записей на странице (по умолчанию 25) */
  limit?: number;
}

/**
 * @type PlotUserRoleParticipant
 * @domain plotUser
 * @description Связь с расширенной информацией о пользователе для списка участников
 *
 * @spec
 * - user.email: всегда есть
 * - user.firstName, user.lastName: null если нет профиля (AC-2.2)
 * - user.phone: null если нет профиля или телефона (AC-2.3)
 * - При отсутствии профиля: отображается только email (AC-2.2)
 *
 * @see US-19-2 AC-2.1 (отображение имени)
 * @see US-19-2 AC-2.3 (телефон в tooltip)
 */
export interface PlotUserRoleParticipant extends PlotUserRole {
  /** Расширенная информация о пользователе с email и phone */
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
}
