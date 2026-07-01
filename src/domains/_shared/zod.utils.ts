import { z } from 'zod';

/**
 * @domain _shared
 * @description Утилиты для создания Zod-схем с опциональными полями
 *
 * @spec
 * - Все утилиты поддерживают преобразование пустой строки в null
 * - Пустая строка преобразуется в null (BR-14)
 * - Все сообщения об ошибках на русском языке
 */

/**
 * Создает Zod-схему для опционального строкового поля с валидацией min/max
 * Пустая строка преобразуется в null (BR-14)
 *
 * @param options - Опции конфигурации
 * @param options.min - Минимальная длина (если указано значение)
 * @param options.max - Максимальная длина (если указано значение)
 * @param options.description - Описание поля для сообщений об ошибках
 * @returns Zod-схема для string | null
 *
 * @example
 * ```typescript
 * const name = optionalString({
 *   description: 'Имя пользователя',
 *   min: 2,
 *   max: 50
 * });
 * ```
 */
export function optionalString(options: {
  description: string;
  min?: number;
  max?: number;
  errorMap?: Partial<Record<'min' | 'max', string>>;
}) {
  const { description, min, max, errorMap } = options;

  const messages: Record<string, string> = {};

  if (min) {
    messages.min = errorMap?.min || `${description} должно содержать минимум ${min} символа`;
  }

  if (max) {
    messages.max = errorMap?.max || `${description} не может превышать ${max} символов`;
  }

  return z
    .string()
    .min(min ?? 2, messages.min ?? `${description} должно содержать минимум 2 символа`)
    .max(max ?? 50, messages.max ?? `${description} не может превышать 50 символов`)
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .transform((val) => (val === '' ? null : val));
}

/**
 * Создает Zod-схему для опционального строкового поля без валидации длины
 * Пустая строка преобразуется в null (BR-14)
 *
 * @param options - Опции конфигурации
 * @param options.description - Описание поля для сообщений об ошибках
 * @param options.max - Максимальная длина (если указано значение)
 * @returns Zod-схема для string | null
 *
 * @example
 * ```typescript
 * const bio = optionalString({
 *   description: 'Биография',
 *   max: 500
 * });
 * ```
 */
export function optionalStringUnbounded(options: {
  description: string;
  max?: number;
  errorMap?: Partial<Record<'max', string>>;
}) {
  const { description, max, errorMap } = options;

  let schema = z.string();

  if (max) {
    schema = schema.max(
      max,
      errorMap?.max ?? `${description} не может превышать ${max} символов`
    );
  }

  return schema.optional().or(z.literal('')).or(z.null()).transform((val) => (val === '' ? null : val));
}

/**
 * Создает Zod-схему для опционального Email поля
 * Пустая строка преобразуется в null (BR-14)
 *
 * @param description - Описание поля для сообщений об ошибках
 * @returns Zod-схема для string | null
 *
 * @example
 * ```typescript
 * const email = optionalEmail('Email пользователя');
 * ```
 */
export function optionalEmail(description: string) {
  return z
    .string()
    .email(`${description} должен быть валидным email адресом`)
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .transform((val) => (val === '' ? null : val));
}

/**
 * Создает Zod-схему для опционального URL поля
 * Пустая строка преобразуется в null (BR-14)
 *
 * @param description - Описание поля для сообщений об ошибках
 * @returns Zod-схема для string | null
 *
 * @example
 * ```typescript
 * const avatar = optionalUrl('URL аватара');
 * ```
 */
export function optionalUrl(description: string) {
  return z
    .string()
    .url(`${description} должен быть валидным URL`)
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .transform((val) => (val === '' ? null : val));
}

/**
 * Создает Zod-схему для опционального числового поля с валидацией min/max
 *
 * @param options - Опции конфигурации
 * @param options.description - Описание поля для сообщений об ошибках
 * @param options.min - Минимальное значение (опционально)
 * @param options.max - Максимальное значение (опционально)
 * @returns Zod-схема для number | null
 *
 * @example
 * ```typescript
 * const age = optionalNumber({
 *   description: 'Возраст',
 *   min: 18,
 *   max: 100
 * });
 * ```
 */
export function optionalNumber(options: {
  description: string;
  min?: number;
  max?: number;
  errorMap?: Partial<Record<'min' | 'max', string>>;
}) {
  const { description, min, max, errorMap } = options;

  let schema = z.number();

  if (min !== undefined) {
    schema = schema.min(
      min,
      errorMap?.min ?? `${description} должен быть не меньше ${min}`
    );
  }

  if (max !== undefined) {
    schema = schema.max(
      max,
      errorMap?.max ?? `${description} должен быть не больше ${max}`
    );
  }

  return schema.optional().or(z.literal('')).or(z.null());
}

/**
 * Создает Zod-схему для опционального boolean поля
 *
 * @param description - Описание поля для сообщений об ошибках
 * @returns Zod-схема для boolean | null
 *
 * @example
 * ```typescript
 * const isActive = optionalBoolean('Статус активен');
 * ```
 */
export function optionalBoolean(_description: string) {
  return z.boolean().optional();
}

/**
 * Создает Zod-схему для опционального DateTime поля
 *
 * @param description - Описание поля для сообщений об ошибках
 * @returns Zod-схема для Date | null
 *
 * @example
 * ```typescript
 * const birthDate = optionalDate('Дата рождения');
 * ```
 */
export function optionalDate(_description: string) {
  return z.date().optional();
}

/**
 * Создает Zod-схему для телефона с международным форматом
 * Пустая строка преобразуется в null (BR-14)
 *
 * @param description - Описание поля для сообщений об ошибках
 * @returns Zod-схема для string | null
 *
 * @example
 * ```typescript
 * const phone = optionalPhone('Телефон');
 * ```
 */
export function optionalPhone(description: string) {
  return z
    .string()
    .regex(
      /^\+?[0-9\s\-\(\)]{7,20}$/,
      `${description} должен быть валидным номером телефона`
    )
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .transform((val) => (val === '' ? null : val));
}
