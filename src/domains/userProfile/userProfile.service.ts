import type { IUserProfileRepository } from './userProfile.repository.interface';
import { UserProfileRepository } from './userProfile.repository.prisma';
import {
  UserProfileNotFoundError,
  UserProfileInvalidDataError,
  FileTooLargeError,
  UnsupportedFileTypeError,
  ThemeInvalidError,
} from './userProfile.errors';
import type {
  UserProfileData,
  UserProfileFull,
  CreateUserProfileInput,
  UpdateUserProfileInput,
  UploadAvatarResult,
  Theme,
} from './userProfile.types';
import { userProfileUpdateSchema, avatarFileSchema, updateThemeSchema } from './userProfile.validators';
import { ZodError } from 'zod';

/**
 * @service UserProfileService
 * @domain userProfile
 * @description Бизнес-логика управления профилем пользователя
 *
 * @spec
 * - Валидация: через Zod-схемы из userProfile.validators.ts
 * - Ошибки: UserProfileNotFoundError, UserProfileInvalidDataError
 * - Зависимости: IUserProfileRepository через DI
 * - Ограничения: avatar ≤5MB, accepted types: JPG, PNG, GIF, name/lastname 2-50 символов
 */
export class UserProfileService {
  constructor(
    private readonly repository: IUserProfileRepository = new UserProfileRepository()
  ) {}

  /**
   * Найти профиль по ID
   * @param id - Уникальный идентификатор профиля
   * @returns Полный объект UserProfileData
   * @throws {UserProfileNotFoundError} если профиль не найден
   */
  async findById(id: string): Promise<UserProfileData> {
    const profile = await this.repository.findById(id);
    if (!profile) {
      throw new UserProfileNotFoundError(id);
    }
    return profile;
  }

  /**
   * Найти профиль по ID пользователя
   * @param userId - Уникальный идентификатор пользователя
   * @returns Полный объект UserProfileData или null если не найден
   */
  async findByUserId(userId: string): Promise<UserProfileData | null> {
    return await this.repository.findByUserId(userId);
  }

  /**
   * Получить все профили пользователей
   * @returns Массив всех профилей
   */
  async findAll(): Promise<UserProfileData[]> {
    return await this.repository.findAll();
  }

 /**
  * Получить профиль текущего авторизованного пользователя
  * @param userId - ID текущего пользователя из session
  * @returns Полный объект профиля с данными пользователя
  * @throws {UserProfileNotFoundError} если профиль не найден и не удалось создать
  *
  * @spec
  * - Если профиль не найден — автоматически создаёт пустой профиль (Edge Case 1)
  * - Возвращает полный профиль с данными пользователя
  * - email берется из User (BR-10)
  */
 async getUserProfile(userId: string): Promise<UserProfileFull> {
   return await this.repository.findOrCreateWithUser(userId);
 }

  /**
   * Создать новый профиль пользователя или вернуть существующий
   * @param userId - ID пользователя
   * @param data - Данные для создания профиля
   * @returns Созданный или существующий профиль
   */
  async createOrGet(userId: string, data: CreateUserProfileInput): Promise<UserProfileData> {
    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    return await this.repository.create({ ...data, userId });
  }

  /**
   * Создать новый профиль пользователя
   * @param userId - ID пользователя
   * @param data - Данные для создания профиля
   * @returns Созданный профиль
   */
  async create(userId: string, data: CreateUserProfileInput): Promise<UserProfileData> {
    return await this.repository.create({ ...data, userId });
  }

  /**
   * Обновить профиль пользователя
   * @param id - Уникальный идентификатор профиля
   * @param data - Данные для обновления
   * @returns Обновленный профиль
   * @throws {UserProfileNotFoundError} если профиль не найден
   * @throws {UserProfileInvalidDataError} если валидация не пройдена
   */
  async update(id: string, data: UpdateUserProfileInput): Promise<UserProfileData> {
    // Валидация данных через Zod
    const validatedData = userProfileUpdateSchema.parse(data);

    return await this.repository.update(id, validatedData);
  }

  /**
   * Обновить профиль текущего пользователя
   * @param userId - ID текущего пользователя
   * @param data - Данные для обновления (частичное обновление)
   * @returns Полный обновленный профиль с данными пользователя (UserProfileFull)
   * @throws {UserProfileNotFoundError} если профиль не найден
   * @throws {UserProfileInvalidDataError} если валидация не пройдена
   *
   * @spec
   * - Все поля опциональны при частичном обновлении (BR-13)
   * - Пустая строка для firstName/lastName трансформируется в null (BR-14)
   * - Валидация через Zod-схему
   * - Возвращает полный профиль с email и name из User
   */
  async updateUserProfile(
    userId: string,
    data: UpdateUserProfileInput
  ): Promise<UserProfileFull> {
    // Находим профиль по userId
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      throw new UserProfileNotFoundError(userId);
    }

    // Валидируем данные через Zod (обрабатывает пустые строки -> null)
    const validatedData = userProfileUpdateSchema.parse(data);

    // Обновляем профиль в БД и возвращаем результат
    const updatedProfile = await this.repository.update(profile.id, validatedData);

    // Возвращаем полный профиль с данными пользователя
    const fullProfile = await this.repository.findWithUser(userId);
    if (!fullProfile) {
      throw new UserProfileNotFoundError(userId);
    }
    return fullProfile;
  }

  /**
   * Обновить тему оформления пользователя
   * @param userId - ID текущего пользователя
   * @param theme - Новая тема оформления ('light', 'dark', 'green')
   * @returns Обновленная тема
   * @throws {UserProfileNotFoundError} если профиль не найден
   * @throws {ThemeInvalidError} если тема невалидна
   *
   * @spec
   * - Тема должна быть одной из: light, dark, green (BR-2)
   * - Валидация через Zod-схему updateThemeSchema
   * - При невалидной теме выбрасывается ThemeInvalidError
   * - При отсутствии профиля выбрасывается UserProfileNotFoundError
   */
  async updateTheme(userId: string, theme: string): Promise<Theme> {
    // Валидация темы через Zod
    const validation = updateThemeSchema.safeParse({ theme });
    if (!validation.success) {
      throw new ThemeInvalidError(theme as string);
    }

    // Находим профиль по userId
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      throw new UserProfileNotFoundError(userId);
    }

    // Обновляем тему в БД
    const updatedTheme = await this.repository.updateTheme(userId, validation.data.theme);
    return updatedTheme;
  }

  /**
   * Загрузить/обновить аватар пользователя
   * @param userId - ID текущего пользователя
   * @param file - Файл аватара
   * @returns URL загруженного аватара
   * @throws {FileTooLargeError} если размер файла > 5MB
   * @throws {UnsupportedFileTypeError} если формат не поддерживается
   */
  async uploadAvatar(
    userId: string,
    file: { size: number; mimetype: string; buffer: Buffer }
  ): Promise<UploadAvatarResult> {
    // Проверка размера файла
    const fileSizeValidation = avatarFileSchema.pick({ fileSize: true }).safeParse({
      fileSize: file.size,
    });

    if (!fileSizeValidation.success) {
      throw new FileTooLargeError(file.size, 5 * 1024 * 1024);
    }

    // Проверка MIME type
    const fileTypeValidation = avatarFileSchema.pick({ fileType: true }).safeParse({
      fileType: file.mimetype,
    });

    if (!fileTypeValidation.success) {
      throw new UnsupportedFileTypeError(file.mimetype, [
        'image/jpeg',
        'image/png',
        'image/gif',
      ]);
    }

    // TODO: Сохранить файл в хранилище (S3/file system)
    // TODO: Обрезать изображение до 512x512
    // TODO: Обновить профиль

    // Для текущей реализации - используем placeholder
    return {
      avatarUrl: '/placeholder-avatar.jpg', // TODO: Реальный URL
    };
  }

  /**
   * Обновить аватар пользователя (сохранить URL в профиль)
   * @param userId - ID текущего пользователя
   * @param avatarUrl - URL аватара
   * @returns Обновленный профиль
   * @throws {UserProfileNotFoundError} если профиль не найден
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<UserProfileData> {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      throw new UserProfileNotFoundError(userId);
    }

    return await this.repository.update(profile.id, { avatar: avatarUrl });
  }

  /**
   * Удалить аватар пользователя
   * @param userId - ID текущего пользователя
   */
  async deleteAvatar(userId: string): Promise<UserProfileData> {
    const profile = await this.repository.findByUserId(userId);
    if (!profile) {
      throw new UserProfileNotFoundError(userId);
    }

    return await this.repository.update(profile.id, { avatar: null });
  }
}

/**
 * @domain userProfile
 * @description Фабрика для создания UserProfileService
 * Используется для DI и тестирования
 */
export function createUserProfileService(repository?: IUserProfileRepository): UserProfileService {
  if (repository) {
    return new UserProfileService(repository);
  }
  return new UserProfileService();
}
