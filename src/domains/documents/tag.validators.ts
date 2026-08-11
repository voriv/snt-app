import { z } from 'zod';

/**
 * @schema tagNameSchema
 * @domain documents
 * @description Zod-схема для валидации названия тега
 *
 * @spec
 * - string, trim, min(1), max(50)
 *
 * @traces US-22-04 AC-4, US-22-07 AC-3
 * @task DOCS-T2.2.3
 */
export const tagNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Название тега не может быть пустым' })
  .max(50, { message: 'Тег не может превышать 50 символов' });
