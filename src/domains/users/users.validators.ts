/**
 * @file users.validators.ts
 * @domain users
 * @description Zod-схемы валидации для списка пользователей
 *
 * @spec
 * - Все сообщения об ошибках на русском языке
 * - Пагинация: page >= 1, limit 1-100
 *
 * @see docs/user-stories/US-20-01-просмотр-списка-пользователей.md
 */
import { z } from 'zod';

/**
 * @schema listUsersQuerySchema
 * @domain users
 * @description Валидация query-параметров для списка пользователей
 *
 * @spec
 * - page: опциональный number, default 1, min 1
 * - limit: опциональный number, default 25, min 1, max 100
 * - q: опциональный string, текст поиска по email/firstName/lastName
 * - sort: опциональный enum ['email', 'firstName', 'lastName', 'createdAt'], default 'createdAt'
 * - order: опциональный enum ['asc', 'desc'], default 'desc'
 */
export const listUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .pipe(
      z
        .number()
        .min(1, 'Номер страницы должен быть не менее 1')
        .default(1),
    ),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 25))
    .pipe(
      z
        .number()
        .min(1, 'Количество записей должно быть не менее 1')
        .max(100, 'Количество записей не может превышать 100')
        .default(25),
    ),
  q: z
    .string()
    .optional()
    .transform(val => (val === '' ? undefined : val)),
  sort: z
    .enum(['email', 'firstName', 'lastName', 'createdAt'])
    .optional()
    .default('createdAt'),
  order: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc'),
});

/**
 * @schema userIdParamSchema
 * @domain users
 * @description Валидация параметра id из URL
 *
 * @spec
 * - id — обязательная непустая строка
 */
export const userIdParamSchema = z.object({
  id: z.string().min(1, 'ID пользователя не может быть пустым'),
});
