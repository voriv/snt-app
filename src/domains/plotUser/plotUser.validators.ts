import { z } from 'zod';

/**
 * @validator createPlotUserRoleSchema
 * @domain plotUser
 * @description Zod схема для валидации данных создания связи
 *
 * @spec
 * - userId: required - cuid
 * - plotId: required - cuid
 * - role: required - 1|2|3
 * - status: optional - default 'active'
 * - comment: optional - nullable string, max 500 chars
 * - expiresAt: optional - nullable datetime
 */
export const createPlotUserRoleSchema = z.object({
  userId: z.string().cuid('Пользователь не найден'),
  plotId: z.string().cuid('Участок не найден'),
  role: z.union([z.literal(1), z.literal(2), z.literal(3)], {
    errorMap: () => ({
      message: 'Роль должна быть 1 (владелец), 2 (проживает) или 3 (представитель)',
    }),
  }),
  status: z.enum(['active', 'pending', 'expired'], {
    errorMap: () => ({
      message: 'Статус должен быть active, pending или expired',
    }),
  }).optional().default('active'),
  comment: z
    .string()
    .max(500, 'Комментарий не может превышать 500 символов')
    .nullable()
    .optional(),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional(),
});

/**
 * @validator updatePlotUserRoleSchema
 * @domain plotUser
 * @description Zod схема для валидации данных обновления связи
 *
 * @spec
 * - Все поля опциональны
 * - При передаче должны проходить валидацию
 */
export const updatePlotUserRoleSchema = z.object({
  role: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  status: z.enum(['active', 'pending', 'expired']).optional(),
  comment: z
    .string()
    .max(500, 'Комментарий не может превышать 500 символов')
    .nullable()
    .optional(),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional(),
});

// Exports for types
export type CreatePlotUserRoleData = z.infer<typeof createPlotUserRoleSchema>;
export type UpdatePlotUserRoleData = z.infer<typeof updatePlotUserRoleSchema>;
