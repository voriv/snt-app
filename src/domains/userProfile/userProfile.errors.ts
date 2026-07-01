import { BaseError, NotFoundError, ValidationError, ConflictError, BusinessRuleError } from '@/shared/errors';

/**
 * @domain userProfile
 * @description Ошибка: профиль пользователя не найден
 *
 * @spec
 * - Код ошибки: USER_PROFILE_NOT_FOUND
 * - HTTP статус: 404
 * - Сообщение: профиль не найден для указанного userId
 */
export class UserProfileNotFoundError extends NotFoundError {
  constructor(userId: string) {
    super('UserProfile', userId);
  }
}

/**
 * @domain userProfile
 * @description Ошибка: неверные данные профиля
 *
 * @spec
 * - Код ошибки: USER_PROFILE_INVALID_DATA
 * - HTTP статус: 400
 * - Сообщение: валидация данных не пройдена
 */
export class UserProfileInvalidDataError extends ValidationError {
  constructor(message: string) {
    super(`UserProfile data is invalid: ${message}`);
  }
}

/**
 * @domain userProfile
 * @description Ошибка: дублирование профиля
 *
 * @spec
 * - Код ошибки: USER_PROFILE_DUPLICATE
 * - HTTP статус: 409
 * - Сообщение: профиль с таким user_id уже существует
 */
export class UserProfileDuplicateError extends ConflictError {
  constructor(field: string, value: string) {
    super(`UserProfile with ${field}=${value} already exists`);
  }
}

/**
 * @domain userProfile
 * @description Ошибка: недопустимое значение темы
 *
 * @spec
 * - Код ошибки: THEME_INVALID
 * - HTTP статус: 400
 * - Сообщение: тема должна быть одной из: light, dark, green
 */
export class ThemeInvalidError extends ValidationError {
  constructor(theme: string) {
    super(`Invalid theme: "${theme}". Allowed values: light, dark, green`);
  }
}

/**
 * @domain userProfile
 * @description Ошибка: файл слишком большой для аватара
 *
 * @spec
 * - Код ошибки: FILE_TOO_LARGE
 * - HTTP статус: 413
 * - Максимальный размер: 5MB
 */
export class FileTooLargeError extends BusinessRuleError {
  constructor(fileSize: number, maxSize: number) {
    super(
      `File size ${fileSize} bytes exceeds maximum allowed ${maxSize} bytes`
    );
  }
}

/**
 * @domain userProfile
 * @description Ошибка: неподдерживаемый формат файла аватара
 *
 * @spec
 * - Код ошибки: UNSUPPORTED_FILE_TYPE
 * - HTTP статус: 415
 * - Поддерживаемые форматы: image/jpeg, image/png, image/gif
 */
export class UnsupportedFileTypeError extends BusinessRuleError {
  constructor(fileType: string, allowedTypes: string[]) {
    super(
      `Unsupported file type "${fileType}". Allowed types: ${allowedTypes.join(', ')}`
    );
  }
}

/**
 * @domain userProfile
 * @description Ошибка: критическая ошибка репозитория
 *
 * @spec
 * - Код ошибки: PROFILE_REPOSITORY_ERROR
 * - HTTP статус: 500
 * - Сообщение: ошибка доступа к БД
 */
export class ProfileRepositoryError extends BaseError {
  constructor(message: string) {
    super(message, 500, 'PROFILE_REPOSITORY_ERROR');
  }
}

/**
 * @domain userProfile
 * @description Ошибка: ошибка загрузки изображения
 *
 * @spec
 * - Код ошибки: IMAGE_UPLOAD_ERROR
 * - HTTP статус: 500
 * - Сообщение: ошибка при загрузке изображения
 */
export class ImageUploadError extends BaseError {
  constructor(message: string) {
    super(message, 500, 'IMAGE_UPLOAD_ERROR');
  }
}
