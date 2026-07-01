/**
 * @file roles.validators.ts
 * @domain roles
 * @description Zod-схемы валидации для ролей, страниц и API endpoints
 *
 * @spec
 * - Все сообщения об ошибках на русском языке
 * - Опциональные строковые поля: пустая строка → null (см. CODE_REVIEW.md)
 * - Сообщения содержат ограничения (min/max)
 *
 * @see docs/user-stories/US-8-roles-management.md — BR-1..BR-29
 */
import { z } from 'zod';

/**
 * @description Опциональное строковое поле. Пустая строка → null
 * @spec - transform: empty string → null
 */
function optionalString(maxLength: number) {
  return z
    .string()
    .max(maxLength, `Не может превышать ${maxLength} символов`)
    .optional()
    .or(z.literal(''))
    .transform(v => (v === '' ? null : v));
}

/** Regex для пути страницы: начинается с /, содержит буквы/цифры/дефисы/слэши */
const PATH_REGEX = /^\/[a-z0-9\-/]*$/i;

/** Regex для пути API endpoint: как PATH_REGEX, но допускает :param */
const API_PATH_REGEX = /^\/[a-z0-9\-/:]*$/i;

/**
 * @description Схема создания роли
 * @spec BR-1: name 2-50, уникальное; BR-2: description до 500
 */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя роли должно содержать минимум 2 символа')
    .max(50, 'Имя роли не может превышать 50 символов'),
  description: z
    .string()
    .max(500, 'Описание не может превышать 500 символов')
    .optional()
    .or(z.literal(''))
    .transform(v => (v === '' ? null : v)),
});

/**
 * @description Схема обновления роли
 * @spec BR-3: системную роль нельзя переименовать (проверка в сервисе)
 */
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя роли должно содержать минимум 2 символа')
    .max(50, 'Имя роли не может превышать 50 символов')
    .optional(),
  description: z
    .string()
    .max(500, 'Описание не может превышать 500 символов')
    .optional()
    .or(z.literal(''))
    .transform(v => (v === '' ? null : v)),
});

/**
 * @description Схема создания страницы
 * @spec BR-6: path обязателен, начинается с /, уникальный; BR-7: title 2-100; BR-8: sortOrder int; BR-9: isActive bool
 */
export const createPageSchema = z.object({
  path: z
    .string()
    .regex(PATH_REGEX, 'Путь должен начинаться с / и содержать только буквы, цифры, дефисы и слэши'),
  title: z
    .string()
    .min(2, 'Заголовок должен содержать минимум 2 символа')
    .max(100, 'Заголовок не может превышать 100 символов'),
  groupName: optionalString(100),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

/**
 * @description Схема обновления страницы
 */
export const updatePageSchema = z.object({
  path: z
    .string()
    .regex(PATH_REGEX, 'Путь должен начинаться с /')
    .optional(),
  title: z
    .string()
    .min(2, 'Заголовок должен содержать минимум 2 символа')
    .max(100, 'Заголовок не может превышать 100 символов')
    .optional(),
  groupName: optionalString(100),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * @description Схема создания API endpoint
 * @spec BR-18: method enum; BR-19: path regex + unique [method,path]; BR-20: accessType enum default role
 */
export const createApiEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE'], {
    message: 'Метод должен быть одним из: GET, POST, PATCH, PUT, DELETE',
  }),
  path: z
    .string()
    .regex(API_PATH_REGEX, 'Путь должен начинаться с /'),
  description: optionalString(500),
  accessType: z.enum(['public', 'owner', 'role', 'super_admin']).default('role'),
  isActive: z.boolean().default(true),
});

/**
 * @description Схема обновления API endpoint
 */
export const updateApiEndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']).optional(),
  path: z
    .string()
    .regex(API_PATH_REGEX, 'Путь должен начинаться с /')
    .optional(),
  description: optionalString(500),
  accessType: z.enum(['public', 'owner', 'role', 'super_admin']).optional(),
  isActive: z.boolean().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type CreateApiEndpointInput = z.infer<typeof createApiEndpointSchema>;
export type UpdateApiEndpointInput = z.infer<typeof updateApiEndpointSchema>;
