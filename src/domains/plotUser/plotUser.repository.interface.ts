/**
 * @interface IPlotUserRoleRepository
 * @domain plotUser
 * @description Контракт доступа к данным связей пользователь-участок
 *
 * @spec
 * - create создаёт запись в plot_users И plot_user_history транзакционно
 * - existsActive проверяет UNIQUE constraint (user_id, plot_id, status='active')
 * - userExists/plotExists возвращают boolean
 * - Все методы асинхронные
 * - Использует Prisma Client
 *
 * @see BR-3 (уникальность активной связи)
 * @see BR-7 (историчность)
 */
export interface IPlotUserRoleRepository {
  /**
   * Создать новую связь пользователь-участок
   *
   * @param data - Данные для создания связи
   * @param changedBy - ID администратора, создавшего связь (для истории)
   * @returns Созданная связь с заполненными системными полями
   * @throws {PlotUserRoleDuplicateError} если активная связь уже существует
   * @throws {NotFoundError} если user не найден
   * @throws {NotFoundError} если plot не найден
   *
   * @spec
   * - Генерирует уникальный id (cuid) автоматически через Prisma
   * - Устанавливает status в 'active' по умолчанию
   * - Устанавливает assignedAt в текущее время (now())
   * - Автоматически создаёт запись в истории (BR-7)
   *
   * @see BR-3 (уникальность активной связи)
   * @see BR-7 (историчность)
   */
  create(
    data: import('./plotUser.types').CreatePlotUserRoleInput,
    changedBy: string
  ): Promise<import('./plotUser.types').PlotUserRole>;

  /**
   * Найти связь по уникальному идентификатору
   *
   * @param id - Уникальный идентификатор связи
   * @param required - Бросать ли ошибку если не найдена
   * @returns Полный объект PlotUserRole с отношениями или null если не найден
   *
   * @spec
   * - Возвращает полный объект без фильтрации полей
   * - Включает user и plot отношения
   * - Не бросает ошибку если не найден и required=false
   */
  findById(
    id: string,
    required?: boolean
  ): Promise<import('./plotUser.types').PlotUserRole | null>;

  /**
   * Найти все связи для пользователя
   *
   * @param userId - Идентификатор пользователя
   * @param includeInactive - включать неактивные связи
   * @returns Массив связей PlotUserRole
   *
   * @spec
   * - Возвращает связи для пользователя
   * - По умолчанию только активные (status = 'active')
   * - Сортирует по assignedAt DESC
   */
  findByUserId(
    userId: string,
    includeInactive?: boolean
  ): Promise<import('./plotUser.types').PlotUserRole[]>;

  /**
   * Найти все связи для участка
   *
   * @param plotId - Идентификатор участка
   * @param includeInactive - включать неактивные связи
   * @returns Массив связей PlotUserRole
   *
   * @spec
   * - Возвращает связи для участка
   * - По умолчанию только активные (status = 'active')
   * - Сортирует по role ASC, assignedAt DESC
   */
  findByPlotId(
    plotId: string,
    includeInactive?: boolean
  ): Promise<import('./plotUser.types').PlotUserRole[]>;

  /**
   * Проверить наличие активной связи для пары user_id, plot_id
   *
   * @param userId - Идентификатор пользователя
   * @param plotId - Идентификатор участка
   * @returns true если активная связь существует, false иначе
   *
   * @spec
   * - Проверяет только активные связи (status = 'active')
   * - Используется для валидации BR-3
   *
   * @deprecated Используйте existsActiveWithRole для проверки уникальности с учётом роли
   * @see BR-3 (уникальность активной связи)
   */
  existsActive(userId: string, plotId: string): Promise<boolean>;

  /**
   * Проверить наличие активной связи с конкретной ролью для пары user_id, plot_id
   *
   * @param userId - Идентификатор пользователя
   * @param plotId - Идентификатор участка
   * @param role - Роль пользователя на участке
   * @returns true если активная связь с этой ролью существует, false иначе
   *
   * @spec
   * - Проверяет только активные связи (status = 'active')
   * - Проверяет уникальность по userId + plotId + role
   * - Позволяет пользователю иметь несколько записей на одном участке с разными ролями
   * - Запрещает дублирование одной и той же роли для одной пары пользователь-участок
   */
  existsActiveWithRole(
    userId: string,
    plotId: string,
    role: number
  ): Promise<boolean>;

  /**
   * Проверить существование пользователя в системе
   *
   * @param userId - Идентификатор пользователя
   * @returns true если пользователь существует, false иначе
   *
   * @spec
   * - Используется для валидации перед созданием связи
   */
  userExists(userId: string): Promise<boolean>;

  /**
   * Проверить существование участка в системе
   *
   * @param plotId - Идентификатор участка
   * @returns true если участок существует, false иначе
   *
   * @spec
   * - Используется для валидации перед созданием связи
   */
  plotExists(plotId: string): Promise<boolean>;

  /**
   * Обновить существующую связь
   *
   * @param id - Уникальный идентификатор связи
   * @param data - Новые данные для обновления
   * @param changedBy - ID администратора, изменившего связь (для истории)
   * @param changedReason - Причина изменения (для истории)
   * @returns Обновлённый объект PlotUserRole
   * @throws {NotFoundError} если связь не найдена
   * @throws {PlotUserRoleDuplicateError} если возникает конфликт уникальности
   *
   * @spec
   * - Обновляет только указанные поля (partial update)
   * - Автоматически устанавливает updatedAt в текущее время
   * - Автоматически создаёт запись в истории (BR-7)
   *
   * @see BR-7 (историчность)
   */
  update(
    id: string,
    data: Partial<import('./plotUser.types').CreatePlotUserRoleInput> & {
      status?: import('./plotUser.types').PlotUserRoleStatus;
    },
    changedBy: string,
    changedReason: string
  ): Promise<import('./plotUser.types').PlotUserRole>;

  /**
   * Деактивировать связь (soft delete)
   *
   * @param id - Уникальный идентификатор связи
   * @param changedBy - ID администратора, деактивировавшего связь
   * @param reason - Причина деактивации (для истории)
   * @returns true если связь была деактивирована, false если не найдена
   *
   * @spec
   * - Устанавливает status в 'expired'
   * - Устанавливает expiresAt в текущее время
   * - Используется вместо физического удаления
   * - Автоматически создаёт запись в истории (BR-7)
   *
   * @see BR-7 (историчность)
   */
  deactivate(
    id: string,
    changedBy: string,
    reason: string
  ): Promise<boolean>;

  /**
   * Физически удалить связь
   *
   * @param id - Уникальный идентификатор связи
   * @throws {NotFoundError} если связь не найдена
   *
   * @spec
   * - Используется для физического удаления записи из БД
   * - Не использует soft delete
   */
  delete(id: string): Promise<void>;

  /**
   * Найти связи с фильтрацией и пагинацией
   *
   * @param options - Параметры пагинации и фильтрации
   * @returns Объект с данными и метаданными пагинации
   *
   * @spec
   * - Поддерживает фильтрацию по userId, plotId, role, status
   * - Поддерживает пагинацию через limit и offset
   * - Возвращает объект с полями: data, total, page, limit
   * - Сортирует по assignedAt DESC по умолчанию
   */
  findWithPagination(options: {
    limit?: number;
    offset?: number;
    plotId?: string;
    userId?: string;
    role?: number;
    status?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'assignedAt';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{
    data: import('./plotUser.types').PlotUserRole[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Получить все связи для участка с фильтрацией, поиском и пагинацией
   *
   * @param plotId - Идентификатор участка
   * @param filter - Фильтры: role, status, search, page, limit
   * @returns Массив участников участка с информацией о пользователе
   *
   * @spec
   * - JOIN с users и user_profiles (включая phone для tooltip)
   * - Фильтрация по role, status, search (firstName, lastName, email)
   * - Сортировка: active → pending → expired, затем assignedAt DESC (BR-2)
   * - Пагинация: по умолчанию page=1, limit=25 (AC-5.2, BR-6)
   * - search: case-insensitive contains по firstName, lastName, email
   *
   * @see US-19-2 FR-3 (фильтр по роли)
   * @see US-19-2 FR-4 (фильтр по статусу)
   * @see US-19-2 FR-5 (поиск)
   * @see US-19-2 AC-1.3 (сортировка по умолчанию)
   */
  findByPlot(
    plotId: string,
    filter?: import('./plotUser.types').PlotUserRoleParticipantFilter
  ): Promise<import('./plotUser.types').PlotUserRoleParticipant[]>;

  /**
   * Поиск участников по имени пользователя
   *
   * @param plotId - Идентификатор участка
   * @param query - Поисковый запрос (firstName, lastName, email)
   * @returns Массив участников, соответствующих запросу
   *
   * @spec
   * - Case-insensitive contains по firstName, lastName, email
   * - Возвращает participants с расширенной информацией о пользователе
   * - Debounce обрабатывается на UI уровне (300ms)
   *
   * @see US-19-2 FR-5 (поиск по участникам)
   */
  searchByName(
    plotId: string,
    query: string
  ): Promise<import('./plotUser.types').PlotUserRoleParticipant[]>;

  /**
   * Найти связь участника с информацией о пользователе
   *
   * @param plotId - Идентификатор участка
   * @param id - Идентификатор связи plot_users
   * @returns Участник с информацией о пользователе или null
   *
   * @spec
   * - JOIN с users и user_profiles (включая phone)
   * - Возвращает null если не найдена
   */
  findWithUser(
    plotId: string,
    id: string
  ): Promise<import('./plotUser.types').PlotUserRoleParticipant | null>;

  /**
   * Получить все связи пользователя с информацией об участке
   *
   * @param userId - Идентификатор пользователя
   * @param filter - Фильтры: role, status, search, page, limit
   * @returns Массив связей с информацией об участке
   * @throws {PlotUserRoleNotFoundError} если пользователь не найден
   *
   * @spec
   * - JOIN с plots (plotNumber, cadastralNumber, area, address)
   * - Фильтрация по role, status, search (plot_number, plot.address)
   * - Сортировка: active → pending → expired, затем assignedAt DESC (BR-2)
   * - Пагинация: по умолчанию page=1, limit=25 (AC-1.3, Edge Case #3)
   * - Возвращает plot: null если участок удалён (Edge Case #1)
   * - search: case-insensitive contains по plot_number и plot.address
   *
   * @see US-19-3 FR-1 (список связей)
   * @see US-19-3 FR-3 (фильтр по роли)
   * @see US-19-3 FR-4 (фильтр по статусу)
   * @see US-19-3 AC-1.3 (сортировка по умолчанию)
   */
  findByUser(
    userId: string,
    filter?: import('./plotUser.types').PlotUserRoleConnectionFilter
  ): Promise<import('./plotUser.types').PlotUserRoleConnection[]>;

  /**
   * Поиск связей пользователя по номеру участка или адресу
   *
   * @param userId - Идентификатор пользователя
   * @param query - Поисковый запрос (plot_number, plot.address)
   * @returns Массив связей, соответствующих запросу
   * @throws {PlotUserRoleNotFoundError} если пользователь не найден
   *
   * @spec
   * - Case-insensitive contains по plot_number и plot.address
   * - Возвращает связи с информацией об участке
   * - Debounce обрабатывается на UI уровне (300ms)
   * - Сортировка: active → pending → expired, затем assignedAt DESC
   *
   * @see US-19-3 FR-5 (поиск по участку)
   * @see US-19-3 AC-5.2 (поиск по номеру)
   * @see US-19-3 AC-5.3 (поиск по адресу)
   */
  searchByPlot(
    userId: string,
    query: string
  ): Promise<import('./plotUser.types').PlotUserRoleConnection[]>;

  /**
   * Найти связь пользователя с информацией об участке
   *
   * @param userId - Идентификатор пользователя
   * @param id - Идентификатор связи plot_users
   * @returns Связь с информацией об участке или null
   *
   * @spec
   * - JOIN с plots
   * - Возвращает null если не найдена
   * - Используется для модального окна деталей (AC-2.4)
   *
   * @see US-19-3 AC-2.4 (кнопка Подробнее)
   */
  findWithPlot(
    userId: string,
    id: string
  ): Promise<import('./plotUser.types').PlotUserRoleConnection | null>;
}

/**
 * @interface IPlotUserRoleHistoryRepository
 * @domain plotUser
 * @description Контракт доступа к данным истории изменений связей пользователь-участок
 *
 * @spec
 * - Все методы асинхронные
 * - create записывает историю изменений
 * - findAllByPlotUserId возвращает полную историю для конкретной связи
 */
export interface IPlotUserRoleHistoryRepository {
  /**
   * Создать запись в истории изменений
   *
   * @param data - Данные для записи в историю
   * @returns Созданная запись истории
   *
   * @spec
   * - Автоматически генерирует id и changedAt
   * - Сохраняет oldValues и newValues для аудита
   */
  create(
    data: Omit<import('./plotUser.types').PlotUserRoleHistory, 'id' | 'changedAt'> & {
      changedAt?: Date;
    }
  ): Promise<import('./plotUser.types').PlotUserRoleHistory>;

  /**
   * Найти всю историю для конкретной связи
   *
   * @param plotUserId - Идентификатор связи plot_users
   * @returns Массив записей истории, отсортированных по changedAt (по убыванию)
   *
   * @spec
   * - Возвращает все изменения от создания до текущих пор
   * - Сортирует по дате изменения (новые primero)
   * - Возвращает пустой массив если история пуста
   */
  findAllByPlotUserId(
    plotUserId: string
  ): Promise<import('./plotUser.types').PlotUserRoleHistory[]>;

  /**
   * Найти историю пользователя на участке
   *
   * @param userId - Идентификатор пользователя
   * @param plotId - Идентификатор участка
   * @returns Массив записей истории, отсортированных по changedAt (по убыванию)
   *
   * @spec
   * - Возвращает все изменения для пары user-plot
   * - Сортирует по дате изменения (новые primero)
   */
  findByUserIdAndPlotId(
    userId: string,
    plotId: string
  ): Promise<import('./plotUser.types').PlotUserRoleHistory[]>;
}
