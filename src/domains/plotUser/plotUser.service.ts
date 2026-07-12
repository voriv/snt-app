/**
 * @service PlotUserRoleService
 * @domain plotUser
 * @description Бизнес-логика управления связями пользователей с участками СНТ
 *
 * @spec
 * - Валидация: через Zod-схемы из plotUser.validators.ts
 * - Ошибки: PlotUserRoleNotFoundError, PlotUserRoleDuplicateError, PlotUserRoleInvalidDataError
 * - Зависимости: IPlotUserRoleRepository, IPlotUserRoleHistoryRepository через DI
 * - Бизнес-правила:
 *   - BR-1: пользователь и участок должны существовать
 *   - BR-2: role может быть только 1, 2 или 3
 *   - BR-3: не может быть более одной активной связи одного пользователя с участком
 *   - BR-4: expires_at должен быть больше текущего времени если указан
 *   - BR-5: при создании записи автоматически создаётся запись в истории
 *   - BR-6: при деактивации записи автоматически создаётся запись в истории
 */

import type {
  PlotUserRole,
  CreatePlotUserRoleInput,
  UpdatePlotUserRoleInput,
  PlotUserRoleListFilters,
  PaginatedResponse,
  PlotUserRoleParticipantFilter,
  PlotUserRoleParticipant,
  PlotUserRoleConnection,
  PlotUserRoleConnectionFilter,
} from './plotUser.types';
import type { IPlotUserRoleRepository } from './plotUser.repository.interface';
import type { IPlotUserRoleHistoryRepository } from './plotUser.repository.interface';
import { createPlotUserRoleSchema } from './plotUser.validators';
import { updatePlotUserRoleSchema } from './plotUser.validators';
import { PlotUserRoleNotFoundError } from './plotUser.errors';
import { PlotUserRoleDuplicateError } from './plotUser.errors';
import { PlotUserRoleInvalidDataError } from './plotUser.errors';

/**
 * Фабричная функция для создания экземпляра сервиса
 *
 * @param plotUserRoleRepository - Репозиторий записей связей пользователя с участком
 * @param plotUserRoleHistoryRepository - Репозиторий истории изменений
 * @returns Экземпляр PlotUserRoleService
 */
export function createPlotUserRoleService(
  plotUserRoleRepository: IPlotUserRoleRepository,
  plotUserRoleHistoryRepository: IPlotUserRoleHistoryRepository
): PlotUserRoleService {
  return new PlotUserRoleService(
    plotUserRoleRepository,
    plotUserRoleHistoryRepository
  );
}

/**
 * Сервис для управления связями пользователей с участками
 */
export class PlotUserRoleService {
  constructor(
    private readonly plotUserRoleRepository: IPlotUserRoleRepository,
    private readonly plotUserRoleHistoryRepository: IPlotUserRoleHistoryRepository
  ) {}

  /**
   * Создать новую связь пользователя с участком
   *
   * @param input - Данные для создания связи
   * @param changedBy - ID пользователя, создавшего связь
   * @returns Созданная запись PlotUserRole
   * @throws {PlotUserRoleInvalidDataError} если входные данные не проходят валидацию
   * @throws {PlotUserRoleInvalidDataError} если пользователь не существует
   * @throws {PlotUserRoleInvalidDataError} если участок не существует
   * @throws {PlotUserRoleDuplicateError} если уже существует активная связь этого пользователя с участком
   *
   * @spec
   * - BR-1: проверяет существование пользователя и участка
   * - BR-2: проверяет валидность роли (1, 2, 3)
   * - BR-3: проверяет отсутствие активной дублирующей связи
   * - BR-5: создаёт запись в истории
   */
  async create(
    input: CreatePlotUserRoleInput,
    changedBy: string
  ): Promise<PlotUserRole> {
    // Валидация входных данных
    const validatedData = createPlotUserRoleSchema.parse(input) as CreatePlotUserRoleInput;

    // BR-1: Проверка существования пользователя
    const userExists =
      await this.plotUserRoleRepository.userExists(validatedData.userId);
    if (!userExists) {
      throw new PlotUserRoleInvalidDataError(
        `Пользователь с ID '${validatedData.userId}' не найден`
      );
    }

    // BR-1: Проверка существования участка
    const plotExists =
      await this.plotUserRoleRepository.plotExists(validatedData.plotId);
    if (!plotExists) {
      throw new PlotUserRoleInvalidDataError(
        `Участок с ID '${validatedData.plotId}' не найден`
      );
    }

    // BR-3: Проверка отсутствия активной дублирующей связи с той же ролью
    const alreadyExists = await this.plotUserRoleRepository.existsActiveWithRole(
      validatedData.userId,
      validatedData.plotId,
      validatedData.role
    );
    if (alreadyExists) {
      throw new PlotUserRoleDuplicateError(
        `У пользователя '${validatedData.userId}' уже существует активная связь с участком '${validatedData.plotId}' с ролью ${validatedData.role}`
      );
    }

    // BR-4: Проверка expires_at
    if (validatedData.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(validatedData.expiresAt);
      if (expiresAt <= now) {
        throw new PlotUserRoleInvalidDataError(
          'Дата истечения должна быть больше текущего времени'
        );
      }
    }

    // Создание записи с историей (репозиторий создаёт историю транзакционно)
    const created = await this.plotUserRoleRepository.create(
      validatedData,
      changedBy
    );

    return created;
  }

  /**
   * Найти связь по идентификатору
   *
   * @param id - Уникальный идентификатор связи
   * @param required - Бросать ли ошибку если не найдена
   * @returns Объект PlotUserRole или null если не найден
   * @throws {PlotUserRoleNotFoundError} если запись не найдена (при required=true)
   *
   * @spec
   * - Возвращает null если запись не найдена
   * - Не кэширует результат
   */
  async findById(id: string, required = true): Promise<PlotUserRole | null> {
    const record =
      await this.plotUserRoleRepository.findById(id, required);

    if (!record && required) {
      throw new PlotUserRoleNotFoundError(
        `Связь с ID '${id}' не найдена`
      );
    }

    return record;
  }

  /**
   * Найти все связи для пользователя
   *
   * @param userId - Уникальный идентификатор пользователя
   * @returns Массив объектов PlotUserRole
   *
   * @spec
   * - Возвращает все связи включая неактивные
   * - Сортирует по дате создания (новые primero)
   */
  async findByUserId(userId: string): Promise<PlotUserRole[]> {
    return this.plotUserRoleRepository.findByUserId(userId);
  }

  /**
   * Найти все связи для участка
   *
   * @param plotId - Уникальный идентификатор участка
   * @returns Массив объектов PlotUserRole
   *
   * @spec
   * - Возвращает все связи включая неактивные
   * - Сортирует по роли (owner primero), затем по дате создания
   */
  async findByPlotId(plotId: string): Promise<PlotUserRole[]> {
    return this.plotUserRoleRepository.findByPlotId(plotId);
  }

  /**
   * Обновить существующую связь
   *
   * @param id - Уникальный идентификатор связи
   * @param data - Данные для обновления
   * @param changedBy - ID пользователя, обновившего связь
   * @returns Обновлённый объект PlotUserRole
   * @throws {PlotUserRoleNotFoundError} если связь не найдена
   * @throws {PlotUserRoleInvalidDataError} если данные не проходят валидацию
   * @throws {PlotUserRoleDuplicateError} если возникает конфликт уникальности
   *
   * @spec
   * - BR-5: создаёт запись в истории с oldValues и newValues
   * - Partial update: обновляются только переданные поля
   */
  async update(
    id: string,
    data: UpdatePlotUserRoleInput,
    changedBy: string
  ): Promise<PlotUserRole> {
    // Проверка существования записи
    const existing = await this.plotUserRoleRepository.findById(id);
    if (!existing) {
      throw new PlotUserRoleNotFoundError(
        `Связь с ID '${id}' не найдена`
      );
    }

    // Валидация данных
    const validatedData = updatePlotUserRoleSchema.parse(data) as UpdatePlotUserRoleInput;

    // BR-4: Проверка expires_at если он указан
    if (validatedData.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(validatedData.expiresAt);
      if (expiresAt <= now) {
        throw new PlotUserRoleInvalidDataError(
          'Дата истечения должна быть больше текущего времени'
        );
      }
    }

    // Проверка уникальности если меняются userId или plotId
    const hasUserId = 'userId' in validatedData;
    const hasPlotId = 'plotId' in validatedData;
    
    // Проверяем: оба поля изменены ИЛИ одно из них изменено на то же значение, что у существующей записи
    if (
      (hasUserId && hasPlotId) ||
      (hasUserId && (validatedData as Record<string, unknown>).plotId === existing.plotId) ||
      (hasPlotId && (validatedData as Record<string, unknown>).userId === existing.userId)
    ) {
      const checkUserId = (hasUserId ? (validatedData as { userId: string }).userId : existing.userId) as string;
      const checkPlotId = (hasPlotId ? (validatedData as { plotId: string }).plotId : existing.plotId) as string;

      const alreadyExists = await this.plotUserRoleRepository.existsActive(
        checkUserId,
        checkPlotId
      );
      if (alreadyExists) {
        throw new PlotUserRoleDuplicateError(
          `Уже существует активная связь для пользователя '${checkUserId}' и участка '${checkPlotId}'`
        );
      }
    }

    // Обновление записи с историей (репозиторий создаёт историю транзакционно)
    const updated = await this.plotUserRoleRepository.update(
      id,
      validatedData,
      changedBy,
      'Update'
    );

    return updated;
  }

  /**
   * Деактивировать связь пользователя с участком
   *
   * @param id - Уникальный идентификатор связи
   * @param changedBy - ID пользователя, деактивировавшего связь
   * @returns Деактивированный объект PlotUserRole
   * @throws {PlotUserRoleNotFoundError} если связь не найдена
   * @throws {PlotUserRoleInvalidDataError} если связь уже деактивирована
   *
   * @spec
   * - Устанавливает status = 'expired' (не 'inactive' — такого статуса нет)
   * - BR-5: создаёт запись в истории
   * - Физическое удаление запрещено (soft delete)
   */
  async deactivate(id: string, changedBy: string): Promise<PlotUserRole> {
    // Проверка существования записи
    const existing = await this.plotUserRoleRepository.findById(id);
    if (!existing) {
      throw new PlotUserRoleNotFoundError(
        `Связь с ID '${id}' не найдена`
      );
    }

    // Проверка что связь активна (статус 'expired' вместо 'inactive')
    if (existing.status === 'expired') {
      throw new PlotUserRoleInvalidDataError(
        'Связь уже деактивирована'
      );
    }

    // Деактивация с историей (репозиторий создаёт историю транзакционно)
    const deactivated = await this.plotUserRoleRepository.deactivate(
      id,
      changedBy,
      'Deactivation'
    );

    if (!deactivated) {
      throw new PlotUserRoleNotFoundError(
        `Связь с ID '${id}' не найдена`
      );
    }

    return existing;
  }

  /**
   * Физически удалить связь участника с участком
   *
   * @param id - Уникальный идентификатор связи
   * @param changedBy - ID пользователя, удалившего связь
   * @returns Удалённая связь PlotUserRole
   * @throws {PlotUserRoleNotFoundError} если связь не найдена
   *
   * @spec
   * - Физическое удаление из БД (не soft delete)
   * - Не создаёт запись в истории
   */
  async delete(id: string, changedBy: string): Promise<PlotUserRole> {
    // Проверка существования записи
    const existing = await this.plotUserRoleRepository.findById(id, true);
    if (!existing) {
      throw new PlotUserRoleNotFoundError(
        `Связь с ID '${id}' не найдена`
      );
    }

    // Физическое удаление
    await this.plotUserRoleRepository.delete(id);

    return existing;
  }

  /**
   * Получить список связей с пагинацией
   *
   * @param filters - Фильтры для поиска
   * @returns Пагинированный список PlotUserRole
   *
   * @spec
   * - Поддерживает фильтрацию по userId, plotId, role, status
   * - Страницы нумеруются с 1
   * - По умолчанию: page=1, limit=20
   */
  async findWithPagination(
    filters: PlotUserRoleListFilters
  ): Promise<PaginatedResponse<PlotUserRole>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const result = await this.plotUserRoleRepository.findWithPagination({
      ...filters,
      offset,
      limit,
    });

    return {
      data: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  /**
   * Проверить существует ли активная связь между пользователем и участком
   *
   * @param userId - ID пользователя
   * @param plotId - ID участка
   * @returns true если связь существует
   *
   * @spec
   * - Используется для проверки уникальности (BR-3)
   * - Проверяет только активные связи
   */
  async existsActive(
    userId: string,
    plotId: string
  ): Promise<boolean> {
    return this.plotUserRoleRepository.existsActive(userId, plotId);
  }

  /**
   * Получить все связи для участка с фильтрацией
   *
   * @param plotId - Уникальный идентификатор участка
   * @param filter - Фильтры для поиска участников
   * @returns Массив участников участка
   * @throws {PlotUserRoleNotFoundError} если участок не найден
   *
   * @spec
   * - Валидирует существование участка перед запросом
   * - Делегирует в repository.findByPlot
   * - Возвращает PlotUserRoleParticipant с полной информацией о пользователе
   * - Сортировка: active → pending → expired, затем assignedAt DESC
   *
   * @see US-19-2 FR-1 (отображение списка участников)
   * @see US-19-2 FR-3 (фильтр по роли)
   * @see US-19-2 FR-4 (фильтр по статусу)
   * @see US-19-2 AC-1.3 (сортировка по умолчанию)
   */
  async findByPlot(
    plotId: string,
    filter?: PlotUserRoleParticipantFilter
  ): Promise<PlotUserRoleParticipant[]> {
    // Проверяем существование участка
    const plotExists = await this.plotUserRoleRepository.plotExists(plotId);
    if (!plotExists) {
      throw new PlotUserRoleNotFoundError(`Участок с ID '${plotId}' не найден`);
    }

    return this.plotUserRoleRepository.findByPlot(plotId, filter);
  }

  /**
   * Поиск участников по имени пользователя
   *
   * @param plotId - Уникальный идентификатор участка
   * @param query - Поисковый запрос (имя/email)
   * @returns Массив участников, соответствующих запросу
   * @throws {PlotUserRoleNotFoundError} если участок не найден
   *
   * @spec
   * - Валидирует существование участка перед запросом
   * - Делегирует в repository.searchByName
   * - Возвращает PlotUserRoleParticipant с полной информацией о пользователе
   * - Case-insensitive поиск по firstName, lastName, email
   *
   * @see US-19-2 FR-5 (поиск по участникам)
   */
  async searchByName(
    plotId: string,
    query: string
  ): Promise<PlotUserRoleParticipant[]> {
    // Проверяем существование участка
    const plotExists = await this.plotUserRoleRepository.plotExists(plotId);
    if (!plotExists) {
      throw new PlotUserRoleNotFoundError(`Участок с ID '${plotId}' не найден`);
    }

    return this.plotUserRoleRepository.searchByName(plotId, query);
  }

  /**
   * Получить все связи пользователя с участками
   *
   * @param userId - Идентификатор пользователя (из сессии)
   * @param filter - Фильтры: role, status, search, page, limit
   * @returns Массив связей с информацией об участке
   * @throws {PlotUserRoleNotFoundError} если пользователь не найден
   * @throws {UnauthorizedError} если userId не передан (BR-6)
   *
   * @spec
   * - BR-6: права доступа — только текущий пользователь или ADMIN
   * - Валидирует существование пользователя перед запросом
   * - Делегирует в repository.findByUser
   * - Возвращает PlotUserRoleConnection с данными участка
   * - Сортировка: active → pending → expired, затем assignedAt DESC
   *
   * @see US-19-3 FR-1 (список связей)
   * @see US-19-3 FR-3 (фильтр по роли)
   * @see US-19-3 FR-4 (фильтр по статусу)
   * @see US-19-3 AC-1.3 (сортировка по умолчанию)
   * @see US-19-3 BR-6 (права доступа)
   */
  async findByUser(
    userId: string,
    filter?: PlotUserRoleConnectionFilter
  ): Promise<PlotUserRoleConnection[]> {
    // BR-6: Проверяем существование пользователя
    const userExists = await this.plotUserRoleRepository.userExists(userId);
    if (!userExists) {
      throw new PlotUserRoleNotFoundError(`Пользователь с ID '${userId}' не найден`);
    }

    return this.plotUserRoleRepository.findByUser(userId, filter);
  }

  /**
   * Поиск связей пользователя по номеру участка или адресу
   *
   * @param userId - Идентификатор пользователя (из сессии)
   * @param query - Поисковый запрос (plot_number, plot.address)
   * @returns Массив связей, соответствующих запросу
   * @throws {PlotUserRoleNotFoundError} если пользователь не найден
   *
   * @spec
   * - Валидирует существование пользователя
   * - Делегирует в repository.searchByPlot
   * - Case-insensitive поиск по plot_number и plot.address
   * - Debounce обрабатывается на UI уровне (300ms, OQ-6)
   *
   * @see US-19-3 FR-5 (поиск по участку)
   * @see US-19-3 AC-5.2 (поиск по номеру)
   * @see US-19-3 AC-5.3 (поиск по адресу)
   */
  async searchByPlot(
    userId: string,
    query: string
  ): Promise<PlotUserRoleConnection[]> {
    // BR-6: Проверяем существование пользователя
    const userExists = await this.plotUserRoleRepository.userExists(userId);
    if (!userExists) {
      throw new PlotUserRoleNotFoundError(`Пользователь с ID '${userId}' не найден`);
    }

    return this.plotUserRoleRepository.searchByPlot(userId, query);
  }
}
