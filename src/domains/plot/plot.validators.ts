import { z } from 'zod';

/**
 * Regex для валидации кадастрового номера
 * Формат: XX:XX:XXXXXXX:XXX (19 символов с двоеточиями)
 * @spec - Каждый сегмент: цифры, разделённые двоеточиями
 */
const cadastralNumberRegex = /^\d{2}:\d{2}:\d{7}:\d{3}$/;

/**
 * @function createPlotSchema
 * @domain plot
 * @description Zod-схема для валидации данных создания участка
 *
 * @spec
 * - plotNumber: минимум 1 символ, максимум 50
 * - cadastralNumber: опционально, формат XX:XX:XXXXXXX:XXX (если задан)
 * - area: число, должно быть > 0
 * - address: опционально, максимум 200 символов
 * - note: опционально, максимум 500 символов
 *
 * @see docs/user-stories/US-14-plot-registration.md — BR-3 (формат кадастра)
 */
export const createPlotSchema = z.object({
  plotNumber: z
    .string()
    .min(1, 'Номер участка обязателен')
    .max(50, 'Номер участка не может превышать 50 символов'),
  cadastralNumber: z
    .string()
    .max(20, 'Кадастровый номер не может превышать 20 символов')
    .or(z.literal(''))
    .superRefine((val, ctx) => {
      if (typeof val === 'string' && val.length > 0 && !cadastralNumberRegex.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Кадастровый номер должен соответствовать формату XX:XX:XXXXXXX:XXX',
        });
      }
    })
    .transform((val) => (val === '' ? null : val))
    .optional()
    .nullable(),
  area: z
    .number()
    .positive('Площадь должна быть положительным числом'),
  address: z
    .string()
    .max(200, 'Адрес не может превышать 200 символов')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val))
    .nullable(),
  note: z
    .string()
    .max(500, 'Примечание не может превышать 500 символов')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val))
    .nullable(),
});

/**
 * @function updatePlotSchema
 * @domain plot
 * @description Zod-схема для валидации данных обновления участка
 *
 * @spec
 * - Все поля опциональны
 * - Те же правила валидации, что и createPlotSchema
 */
export const updatePlotSchema = z.object({
  plotNumber: z
    .string()
    .min(1, 'Номер участка обязателен')
    .max(50, 'Номер участка не может превышать 50 символов')
    .nullable()
    .optional(),
  cadastralNumber: z
    .string()
    .max(20, 'Кадастровый номер не может превышать 20 символов')
    .or(z.literal(''))
    .superRefine((val, ctx) => {
      if (typeof val === 'string' && val.length > 0 && !cadastralNumberRegex.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Кадастровый номер должен соответствовать формату XX:XX:XXXXXXX:XXX',
        });
      }
    })
    .transform((val) => (val === '' ? null : val))
    .optional()
    .nullable(),
  area: z
    .number()
    .positive('Площадь должна быть положительным числом')
    .optional(),
  address: z
    .string()
    .max(200, 'Адрес не может превышать 200 символов')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val))
    .nullable(),
  note: z
    .string()
    .max(500, 'Примечание не может превышать 500 символов')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val))
    .nullable(),
});
