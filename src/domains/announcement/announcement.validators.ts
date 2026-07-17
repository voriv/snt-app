import { z } from 'zod';

/**
 * @schema AnnouncementStatusSchema
 * @domain announcement
 * @description Схема валидации статуса объявления
 *
 * @spec
 * - Допустимые значения: DRAFT, PUBLISHED, ARCHIVED
 */
export const AnnouncementStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

/**
 * @schema AnnouncementListQuerySchema
 * @domain announcement
 * @description Схема валидации query параметров для получения списка объявлений
 *
 * @spec
 * - page: положительное число, по умолчанию 1
 * - limit: от 1 до 100, по умолчанию 20
 * - status: опциональный фильтр по статусу
 * - search: опциональный текст поиска (минимум 2 символа)
 */
export const AnnouncementListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1, 'Номер страницы должен быть не менее 1').default(1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1, 'Количество записей должно быть не менее 1').max(100, 'Количество записей не может превышать 100').default(20)),
  status: AnnouncementStatusSchema.optional(),
  search: z.string().min(2, 'Текст поиска должен содержать минимум 2 символа').optional(),
});

/**
 * @schema AnnouncementDetailQuerySchema
 * @domain announcement
 * @description Схема валидации ID объявления для получения деталей
 *
 * @spec
 * - id: обязательный параметр из URL
 */
export const AnnouncementDetailQuerySchema = z.object({
  id: z.string().min(1, 'ID объявления обязателен'),
});

/**
 * @type AnnouncementListQueryParsed
 * @domain announcement
 * @description Тип результата валидации AnnouncementListQuerySchema
 */
export type AnnouncementListQueryParsed = z.infer<typeof AnnouncementListQuerySchema>;

/**
 * @type AnnouncementDetailQueryParsed
 * @domain announcement
 * @description Тип результата валидации AnnouncementDetailQuerySchema
 */
export type AnnouncementDetailQueryParsed = z.infer<typeof AnnouncementDetailQuerySchema>;

/**
 * @schema AnnouncementCreateSchema
 * @domain announcement
 * @description Схема валидации данных для создания объявления
 *
 * @spec
 * - title: обязательный, минимум 1 символ, максимум 200 символов
 * - content: опциональный, максимум 5000 символов
 * - Пустое содержание трансформируется в null
 */
export const AnnouncementCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Заголовок обязателен')
    .max(200, 'Заголовок не может превышать 200 символов'),
  content: z
    .string()
    .max(5000, 'Содержание не может превышать 5000 символов')
    .optional()
    .or(z.literal(''))
    .transform(val => (val === '' ? null : val)),
});

/**
 * @type AnnouncementCreateInput
 * @domain announcement
 * @description Тип результата валидации AnnouncementCreateSchema
 */
export type AnnouncementCreateInput = z.infer<typeof AnnouncementCreateSchema>;