/**
 * @file users.repository.interface.ts
 * @domain users
 * @description Контракт доступа к данным пользователей
 *
 * @spec
 * - Все методы асинхронные
 * - findAllUsers возвращает пагинированный ответ
 *
 * @see docs/model/entities/user.md
 */
import type { UserDetail, UserFilters, UserListResponse, UserSearchResult } from './users.types';

/**
 * @interface IUsersRepository
 * @domain users
 * @description Контракт доступа к данным пользователей
 *
 * @spec
 * - Все методы асинхронные
 * - findAllUsers возвращает пагинированный ответ с JOIN профиля и ролей
 */
export interface IUsersRepository {
  /**
   * Получить список пользователей с пагинацией
   *
   * @param filters - Фильтры пагинации (page, limit)
   * @returns Пагинированный ответ со списком пользователей
   *
   * @spec
   * - JOIN user_profiles (LEFT) для firstName, lastName
   * - JOIN user_roles + roles для списка ролей
   * - Сортировка по createdAt DESC
   */
 findAllUsers(filters: UserFilters): Promise<UserListResponse>;

 /**
  * Найти пользователя по идентификатору с профилем и ролями
  *
  * @param id - Уникальный идентификатор пользователя
  * @returns Объект UserDetail или null если не найден
  *
  * @spec
  * - JOIN user_profiles (LEFT) для профиля
  * - JOIN user_roles + roles для списка ролей
  * - Возвращает null если пользователь не найден (НЕ бросает ошибку)
  */
 findUserById(id: string): Promise<UserDetail | null>;

 /**
  * Поиск пользователей для выбора собеседника
  *
  * @param query - Текст поиска (по email, firstName, lastName)
  * @param excludeUserId - ID пользователя для исключения (текущий пользователь)
  * @param limit - Максимальное количество результатов
  * @returns Массив результатов поиска
  *
  * @spec
  * - LEFT JOIN user_profiles для firstName, lastName, avatar
  * - Фильтр: исключаем пользователя с excludeUserId
  * - Поиск по email, firstName, lastName (ILIKE)
  * - Лимит: минимум 1, максимум 50
  */
 searchUsers(query: string, excludeUserId: string, limit?: number): Promise<UserSearchResult[]>;
}
