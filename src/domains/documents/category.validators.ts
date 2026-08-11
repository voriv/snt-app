import { z } from 'zod';

/**
 * @schema createCategorySchema
 * @domain documents
 * @description Zod-схема для валидации данных создания категории документа
 *
 * @spec
 * - name: обязательное, trim, min 1, max 100 символов
 * - description: опционально, max 500, empty → null
 * - parentId: опционально, string
 *
 * @traces US-22-01 AC-3, AC-4
 * @task DOCS-T2.2.1
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Название категории обязательно' })
    .max(100, { message: 'Название категории не должно превышать 100 символов' }),
  description: z
    .string()
    .max(500, { message: 'Описание не может превышать 500 символов' })
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  parentId: z.string().optional().nullable(),
});
