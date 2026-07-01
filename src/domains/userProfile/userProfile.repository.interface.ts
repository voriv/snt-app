import type { UserProfileData, CreateUserProfileInput, UpdateUserProfileInput, UserProfileFull, Theme } from './userProfile.types';

/**
 * @interface IUserProfileRepository
 * @domain userProfile
 * @description Контракт доступа к данным профиля пользователя
 *
 * @spec
 * - Все методы асинхронные
 * - findById возвращает null если не найден — НЕ бросает ошибку
 * - findByUserId возвращает null если не найден — НЕ бросает ошибку
 * - create/update могут выбросить ошибку уникальности на уровне БД
 */
export interface IUserProfileRepository {
  /**
   * Найти профиль по ID
   * @param id - Уникальный идентификатор профиля
   * @returns Профиль пользователя или null если не найден
   */
  findById(id: string): Promise<UserProfileData | null>;

  /**
   * Найти профиль по ID пользователя
   * @param userId - Уникальный идентификатор пользователя
   * @returns Профиль пользователя или null если не найден
   */
  findByUserId(userId: string): Promise<UserProfileData | null>;

  /**
   * Получить все профили пользователей
   * @returns Массив всех профилей
   */
  findAll(): Promise<UserProfileData[]>;

  /**
   * Создать новый профиль пользователя
   * @param data - Данные для создания профиля
   * @returns Созданный профиль
   * @throws при дублировании
   */
  create(data: CreateUserProfileInput & { userId: string; theme?: string }): Promise<UserProfileData>;

  /**
   * Обновить профиль пользователя
   * @param id - Уникальный идентификатор профиля
   * @param data - Данные для обновления
   * @returns Обновленный профиль
   * @throws если профиль не найден
   */
  update(id: string, data: UpdateUserProfileInput): Promise<UserProfileData>;

  /**
   * Удалить профиль пользователя
   * @param id - Уникальный идентификатор профиля
   */
  delete(id: string): Promise<void>;

  /**
   * Найти профиль вместе с данными пользователя
   * @param userId - Уникальный идентификатор пользователя
   * @returns Агрегированный профиль пользователя или null
   */
  findWithUser(userId: string): Promise<UserProfileFull | null>;

  /**
   * Найти профиль пользователя вместе с данными пользователя или создать новый
   * @param userId - Уникальный идентификатор пользователя
   * @returns Агрегированный профиль пользователя (найденный или созданный)
   *
   * @spec
   * - Если профиль существует — возвращает его
   * - Если профиль не найден — создает новый с null firstName/lastName
   * - Используется для автоматического создания профиля при первом доступе
   */
  findOrCreateWithUser(userId: string): Promise<UserProfileFull>;

  /**
   * Обновить тему оформления пользователя
   * @param userId - Уникальный идентификатор пользователя
   * @param theme - Новая тема оформления
   * @returns Обновленная тема
   * @throws {ProfileRepositoryError} если профиль не найден
   */
  updateTheme(userId: string, theme: Theme): Promise<Theme>;
}
