/**
 * @function registerSchema
 * @domain auth
 * @description Zod-схема валидации данных регистрации пользователя
 *
 * @spec
 * - email: обязателен, строка, trim, lowercase, формат email через .email()
 * - password: обязателен, строка, минимум 6 символов, БЕЗ trim — пробелы часть пароля
 * - confirmPassword: обязателен, строка, должен совпадать с password через .refine()
 * - Ошибки валидации: пользовательские сообщения на русском языке
 *
 * @see docs/user-stories/US-2-registration.md — BR-1..BR-4, Edge Cases 2,3,4,6,7,8,10
 */
import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z
      .string({ required_error: 'Email обязателен' })
      .trim()
      .toLowerCase()
      .email('Введите корректный email'),
    password: z
      .string({ required_error: 'Пароль обязателен' })
      .min(6, 'Пароль должен содержать минимум 6 символов'),
    confirmPassword: z
      .string({ required_error: 'Подтверждение пароля обязательно' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * @function loginSchema
 * @domain auth
 * @description Zod-схема валидации данных входа пользователя
 *
 * @spec
 * - email: обязателен, строка, trim, lowercase, формат email через .email()
 * - password: обязателен, строка, БЕЗ trim — пробелы часть пароля
 * - Ошибки валидации: пользовательские сообщения на русском языке
 * - Валидация аналогична registration, но без confirmPassword и проверки длины
 *
 * @see docs/user-stories/US-3-authentication.md — BR-1, BR-2, AC-5..AC-7
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email обязателен' })
    .trim()
    .toLowerCase()
    .email('Некорректный email'),
  password: z.string({ required_error: 'Пароль обязателен' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * @function changePasswordSchema
 * @domain auth
 * @description Zod-схема валидации данных смены пароля пользователем
 *
 * @spec
 * - currentPassword: обязателен, строка, БЕЗ trim — пробелы часть пароля
 * - newPassword: обязателен, строка, минимум 6 символов, БЕЗ trim
 * - confirmPasswordNew: обязателен, строка, должен совпадать с newPassword через .refine()
 * - Ошибки валидации: пользовательские сообщения на русском языке
 *
 * @see docs/requirements/REQ-AUTH-001.md — BR-08..BR-12, FR-09..FR-12
 * @see docs/user-stories/US-12-активная-смена-пароля-пользователем.md
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: 'Текущий пароль обязателен' }),
    newPassword: z
      .string({ required_error: 'Новый пароль обязателен' })
      .min(6, 'Пароль должен содержать минимум 6 символов'),
    confirmPasswordNew: z.string({ required_error: 'Подтверждение пароля обязательно' }),
  })
  .refine((data) => data.newPassword === data.confirmPasswordNew, {
    message: 'Пароли не совпадают',
    path: ['confirmPasswordNew'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
