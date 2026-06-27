import { z } from 'zod';

/**
 * Схема валидации данных для создания участка.
 *
 * @public
 */
export const createPlotSchema = z.object({
  number: z.string().min(1, 'Номер участка обязателен').max(50),
  area: z.number().positive('Площадь должна быть положительной'),
  address: z.string().max(255).nullable().optional(),
  cadastralNum: z.string().max(50).nullable().optional(),
});

/**
 * Схема валидации данных для обновления участка.
 * Все поля необязательны.
 *
 * @public
 */
export const updatePlotSchema = z.object({
  number: z.string().min(1).max(50).optional(),
  area: z.number().positive().optional(),
  address: z.string().max(255).nullable().optional(),
  cadastralNum: z.string().max(50).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ABANDONED']).optional(),
});

/**
 * Схема валидации параметров списка участков.
 *
 * @public
 */
export const plotListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ABANDONED']).nullable().optional(),
});

/**
 * Схема валидации ID участка.
 *
 * @public
 */
export const plotIdSchema = z.object({
  id: z.string().cuid(),
});
