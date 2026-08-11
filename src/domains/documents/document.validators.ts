import { z } from 'zod';

/**
 * @constant ALLOWED_MIME_TYPES
 * @domain documents
 * @description Белый список поддерживаемых MIME-типов файлов
 *
 * @spec
 * - PDF: application/pdf
 * - DOCX: application/vnd.openxmlformats-officedocument.wordprocessingml.document
 * - Images: jpeg, png, gif, bmp, webp
 *
 * @traces US-22-03 AC-2, AC-3, AC-4
 * @task DOCS-T2.2.2
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
] as const;

/**
 * @constant MAX_FILE_SIZE
 * @domain documents
 * @description Максимальный размер файла в байтах (100 МБ)
 *
 * @spec
 * - Настраиваемый через конфигурацию (BR-09)
 *
 * @traces US-22-03 AC-5
 * @task DOCS-T2.2.2
 */
export const MAX_FILE_SIZE = 104_857_600; // 100 MB

/**
 * @schema fileValidationSchema
 * @domain documents
 * @description Zod-схема для валидации загружаемого файла
 *
 * @spec
 * - mimeType должен быть в белом списке
 * - fileSize > 0 и <= MAX_FILE_SIZE
 *
 * @traces US-22-03 AC-1..6
 * @task DOCS-T2.2.2
 */
export const fileValidationSchema = z.object({
  mimeType: z
    .string()
    .refine((val) => (ALLOWED_MIME_TYPES as readonly string[]).includes(val), {
      message:
        'Файлы этого типа не поддерживаются. Допустимые типы: PDF, DOCX, JPG, PNG, GIF, BMP, WEBP',
    }),
  fileSize: z
    .number()
    .int()
    .positive({ message: 'Файл не может быть пустым' })
    .max(MAX_FILE_SIZE, {
      message: `Размер файла превышает допустимый лимит (${MAX_FILE_SIZE / 1_048_576} МБ)`,
    }),
});

/**
 * @schema documentMetadataSchema
 * @domain documents
 * @description Zod-схема для валидации метаданных документа при загрузке
 *
 * @spec
 * - title: обязательный, min 1, max 255
 * - description: опционально, текст, empty → null
 * - categoryId: опционально, string
 * - documentType: обязательный, min 1, max 50
 * - visibleRoles: массив строк, минимум 1
 * - tags: опционально, массив строк, max 10, каждая max 50
 * - status: опционально, DocumentStatus
 *
 * @traces US-22-04 AC-1..5
 * @task DOCS-T2.2.2
 */
export const documentMetadataSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Название документа обязательно' })
    .max(255, { message: 'Название не должно превышать 255 символов' }),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  categoryId: z.string().optional().nullable(),
  documentType: z
    .string()
    .trim()
    .min(1, { message: 'Тип документа обязателен' })
    .max(50, { message: 'Тип документа не должен превышать 50 символов' }),
  visibleRoles: z
    .array(z.string())
    .min(1, { message: 'Выберите хотя бы одну роль для доступа' }),
  tags: z
    .array(z.string().max(50, { message: 'Тег не может превышать 50 символов' }))
    .max(10, { message: 'Максимум 10 тегов' })
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

/**
 * @schema updateDocumentSchema
 * @domain documents
 * @description Zod-схема для валидации данных редактирования документа
 *
 * @spec
 * - Все поля опциональны (partial update)
 * - Те же правила валидации, что и documentMetadataSchema
 *
 * @traces US-22-07 AC-1..8
 * @task DOCS-T2.2.2
 */
export const updateDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Название документа обязательно' })
    .max(255, { message: 'Название не должно превышать 255 символов' })
    .optional(),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  categoryId: z.string().optional().nullable(),
  documentType: z
    .string()
    .trim()
    .min(1, { message: 'Тип документа обязателен' })
    .max(50, { message: 'Тип документа не должен превышать 50 символов' })
    .optional(),
  visibleRoles: z
    .array(z.string())
    .min(1, { message: 'Выберите хотя бы одну роль для доступа' })
    .optional(),
  tags: z
    .array(z.string().max(50, { message: 'Тег не может превышать 50 символов' }))
    .max(10, { message: 'Максимум 10 тегов' })
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

/**
 * @schema documentFiltersSchema
 * @domain documents
 * @description Zod-схема для валидации параметров фильтрации списка документов
 *
 * @spec
 * - Все параметры опциональны
 * - page: 1..100, default 1
 * - limit: 1..100, default 20
 *
 * @traces US-22-05 AC-1..9
 * @task DOCS-T2.2.2
 */
export const documentFiltersSchema = z.object({
  categoryId: z.string().optional(),
  documentType: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1).max(100).optional()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100).optional()),
});
