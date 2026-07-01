import { z } from 'zod';
import { optionalString, optionalStringUnbounded, optionalPhone } from '@/domains/_shared/zod.utils';

/**
 * @domain userProfile
 * @description Zod-схема валидации для создания профиля пользователя
 *
 * @spec
 * - firstName: required, 2-50 символов
 * - middleName: optional, 2-50 символов или null
 * - lastName: required, 2-50 символов
 * - phone: optional, формат E.164 или национальный
 * - bio: optional, max 500 символов
 */
export const userProfileCreateSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя не может превышать 50 символов'),
  middleName: optionalString({ description: 'Отчество' }),
  lastName: z
    .string()
    .min(2, 'Фамилия должна содержать минимум 2 символа')
    .max(50, 'Фамилия не может превышать 50 символов'),
  phone: optionalPhone('Телефон'),
  bio: optionalStringUnbounded({ description: 'Биография', max: 500 }),
});

/**
 * @domain userProfile
 * @description Zod-схема валидации для обновления профиля пользователя
 *
 * @spec
 * - Все поля опциональные — можно обновить только указанные поля (BR-13)
 * - Пустые строки для firstName/lastName превращаются в null (BR-14)
 * - name/lastName: если указано — 2-50 символов, иначе null/пусто
 * - phone: пустая строка или null
 * - bio: max 500 символов, пустая строка или null
 */
export const userProfileUpdateSchema = z.object({
  /**
   * @spec firstName: опциональное поле, принимает string | null | undefined
   * - При пустой строке — преобразуется в null (BR-1, BR-14)
   * - При наличии значения: 2-50 символов
   */
  firstName: optionalString({ description: 'Имя' }),
  /**
   * @spec middleName: опциональное поле, принимает string | null | undefined
   * - При пустой строке — преобразуется в null (BR-14)
   * - При наличии значения: 2-50 символов
   */
  middleName: optionalString({ description: 'Отчество' }),
  /**
   * @spec lastName: опциональное поле, принимает string | null | undefined
   * - При пустой строке — преобразуется в null (BR-1, BR-14)
   * - При наличии значения: 2-50 символов
   */
  lastName: optionalString({ description: 'Фамилия' }),
  /**
   * @spec phone: опциональное поле, принимает string | null | undefined
   * - При пустой строке — преобразуется в null (BR-14)
   */
  phone: optionalPhone('Телефон'),
  /**
   * @spec bio: опциональное поле, принимает string | null | undefined
   * - При пустой строке — преобразуется в null (BR-14)
   * - Максимум 500 символов
   */
  bio: optionalStringUnbounded({ description: 'Биография', max: 500 }),
});

/**
 * @domain userProfile
 * @description Zod-схема валидации для файла аватара
 *
 * @spec
 * - fileSize: max 5MB (5 * 1024 * 1024 bytes)
 * - fileTypes: image/jpeg, image/png, image/gif
 */
export const avatarFileSchema = z.object({
  fileSize: z.number().max(5 * 1024 * 1024, 'Размер файла не должен превышать 5MB'),
  fileType: z.enum(['image/jpeg', 'image/png', 'image/gif'], {
    errorMap: () => ({ message: 'Поддерживаются только форматы JPG, PNG, GIF' }),
  }),
});

/**
 * @domain userProfile
 * @description Zod-схема валидации для обновления темы профиля
 *
 * @spec
 * - theme: требуется, enum ['light', 'dark', 'green']
 */
export const updateThemeSchema = z.object({
  theme: z.enum(['light', 'dark', 'green'], {
    errorMap: () => ({ message: 'Недопустимое значение темы. Доступны: light, dark, green' }),
  }),
});

/**
 * @domain userProfile
 * @description Тип входных данных для создания профиля, основанный на схеме
 */
export type CreateUserProfileInput = z.infer<typeof userProfileCreateSchema>;

/**
 * @domain userProfile
 * @description Тип входных данных для обновления профиля, основанный на схеме
 */
export type UpdateUserProfileInput = z.infer<typeof userProfileUpdateSchema>;

/**
 * @domain userProfile
 * @description Тип валидации файла аватара
 */
export type AvatarFileValidation = z.infer<typeof avatarFileSchema>;
