import bcrypt from 'bcryptjs';
import type { UserRepository } from '@/repositories/user-repository.interface';
import {
  ValidationError,
  NotFoundError,
  BusinessRuleError,
  ConflictError,
} from './_lib/errors';
import { generateRandomString } from '@/lib/utils';

/**
 * Входные данные для входа пользователя.
 *
 * @public
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Результат входа пользователя.
 *
 * @public
 */
export interface LoginResult {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  };
}

/**
 * Входные данные для генерации токена сброса пароля.
 *
 * @public
 */
export interface GenerateResetTokenInput {
  email: string;
}

/**
 * Результат генерации токена сброса пароля.
 *
 * @public
 */
export interface GenerateResetTokenResult {
  resetToken: string;
  userExists: boolean;
}

/**
 * Входные данные для сброса пароля по токену.
 *
 * @public
 */
export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

/**
 * Входные данные для смены пароля авторизованного пользователя.
 *
 * @public
 */
export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * Входные данные для регистрации пользователя.
 *
 * @public
 */
export interface RegisterInput {
  email: string;
  password: string;
  name?: string | null;
}

/**
 * Результат регистрации пользователя.
 *
 * @public
 */
export interface RegisterResult {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  };
}

/**
 * Сервис аутентификации.
 *
 * @remarks
 * Отвечает за вход, выход, управление токенами сброса паролей.
 *
 * @public
 */
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(private userRepository: UserRepository) {}

  /**
   * Регистрирует нового пользователя.
   *
   * @param input - Входные данные (email, пароль, имя)
   * @returns Информация о созданном пользователе
   * @throws ValidationError если входные данные невалидны
   * @throws ConflictError если email уже используется
   *
   * @example
   * ```ts
   * const result = await authService.register({ email: 'user@example.com', password: 'secret123' })
   * ```
   */
  async register(input: RegisterInput): Promise<RegisterResult> {
    const parsed = this.validateRegisterInput(input);
    const existingUser = await this.userRepository.findByEmail(parsed.email);

    if (existingUser) {
      throw new ConflictError('user-email', 'Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(parsed.password, this.BCRYPT_ROUNDS);
    const user = await this.userRepository.create({
      email: parsed.email,
      passwordHash,
      name: parsed.name,
      role: 'GUEST',
      isActive: true,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Выполняет вход пользователя по email и паролю.
   *
   * @param input - Входные данные (email, пароль)
   * @returns Информация о пользователе
   * @throws ValidationError если входные данные невалидны
   * @throws BusinessRuleError если пользователь не найден или пароль неверен
   *
   * @example
   * ```ts
   * const result = await authService.login({ email: 'user@example.com', password: 'secret123' })
   * ```
   */
  async login(input: LoginInput): Promise<LoginResult> {
    const parsed = this.validateLoginInput(input);
    const user = await this.userRepository.findByEmail(parsed.email);

    if (!user || !user.passwordHash) {
      // Безопасность: не сообщаем конкретно, что email не найден
      throw new BusinessRuleError(
        'invalid-credentials',
        'Неверный email или пароль',
      );
    }

    if (!user.isActive) {
      throw new BusinessRuleError('account-inactive', 'Аккаунт заблокирован');
    }

    const isPasswordValid = await bcrypt.compare(parsed.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new BusinessRuleError('invalid-credentials', 'Неверный email или пароль');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Генерирует токен сброса пароля для пользователя с указанным email.
   *
   * @param input - Email пользователя
   * @returns Токен и флаг существования пользователя
   * @throws ValidationError если email невалиден
   *
   * @example
   * ```ts
   * const { resetToken, userExists } = await authService.generateResetToken({ email: 'user@example.com' })
   * ```
   */
  async generateResetToken(input: GenerateResetTokenInput): Promise<GenerateResetTokenResult> {
    const parsed = this.validateEmailInput(input.email);
    const user = await this.userRepository.findByEmail(parsed);

    if (!user) {
      return { resetToken: '', userExists: false };
    }

    const resetToken = generateRandomString(32);
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await this.userRepository.saveResetToken(user.id, resetToken, resetTokenExp);

    return { resetToken, userExists: true };
  }

  /**
   * Сбрасывает пароль по токену.
   *
   * @param input - Токен и новый пароль
   * @throws ValidationError если входные данные невалидны
   * @throws NotFoundError если токен недействителен
   * @throws BusinessRuleError если токен истёк
   *
   * @example
   * ```ts
   * await authService.resetPassword({ token: 'abc123', newPassword: 'newSecret123' })
   * ```
   */
  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const parsed = this.validateResetPasswordInput(input);
    const user = await this.findUserByResetToken(parsed.token);

    if (!user) {
      throw new NotFoundError('reset-token', parsed.token);
    }

    if (!user.resetTokenExp || user.resetTokenExp < new Date()) {
      throw new BusinessRuleError('token-expired', 'Токен сброса пароля истёк');
    }

    const passwordHash = await bcrypt.hash(parsed.newPassword, this.BCRYPT_ROUNDS);
    await this.userRepository.clearResetToken(user.id);
    await this.userRepository.update(user.id, { passwordHash });
  }

  /**
   * Меняет пароль авторизованного пользователя.
   *
   * @param input - ID пользователя, текущий и новый пароли
   * @throws ValidationError если входные данные невалидны
   * @throws BusinessRuleError если текущий пароль неверен
   *
   * @example
   * ```ts
   * await authService.changePassword({ userId: 'user-123', currentPassword: 'old123', newPassword: 'new123' })
   * ```
   */
  async changePassword(input: ChangePasswordInput): Promise<void> {
    const parsed = this.validateChangePasswordInput(input);
    const user = await this.userRepository.findById(parsed.userId);

    if (!user || !user.passwordHash) {
      throw new NotFoundError('User', parsed.userId);
    }

    const isPasswordValid = await bcrypt.compare(parsed.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new BusinessRuleError('invalid-current-password', 'Неверный текущий пароль');
    }

    const passwordHash = await bcrypt.hash(parsed.newPassword, this.BCRYPT_ROUNDS);
    await this.userRepository.update(user.id, { passwordHash });
  }

  // === Приватные методы ===

  private validateRegisterInput(input: RegisterInput): { email: string; password: string; name?: string | null } {
    if (!input.email?.trim()) {
      throw new ValidationError('email', 'Email обязателен');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      throw new ValidationError('email', 'Неверный формат email');
    }
    if (!input.password) {
      throw new ValidationError('password', 'Пароль обязателен');
    }
    if (input.password.length < 6) {
      throw new ValidationError('password', 'Пароль должен содержать минимум 6 символов');
    }
    return {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      name: input.name,
    };
  }

  private validateLoginInput(input: LoginInput): { email: string; password: string } {
    if (!input.email?.trim()) {
      throw new ValidationError('email', 'Email обязателен');
    }
    if (!input.password) {
      throw new ValidationError('password', 'Пароль обязателен');
    }
    return {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    };
  }

  private validateEmailInput(email: string): string {
    if (!email?.trim()) {
      throw new ValidationError('email', 'Email обязателен');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new ValidationError('email', 'Неверный формат email');
    }
    return email.trim().toLowerCase();
  }

  private validateResetPasswordInput(input: ResetPasswordInput): { token: string; newPassword: string } {
    if (!input.token?.trim()) {
      throw new ValidationError('token', 'Токен обязателен');
    }
    if (!input.newPassword) {
      throw new ValidationError('password', 'Новый пароль обязателен');
    }
    if (input.newPassword.length < 6) {
      throw new ValidationError('password', 'Пароль должен содержать минимум 6 символов');
    }
    return { token: input.token.trim(), newPassword: input.newPassword };
  }

  private validateChangePasswordInput(input: ChangePasswordInput): {
    userId: string;
    currentPassword: string;
    newPassword: string;
  } {
    if (!input.userId?.trim()) {
      throw new ValidationError('userId', 'UserID обязателен');
    }
    if (!input.currentPassword) {
      throw new ValidationError('currentPassword', 'Текущий пароль обязателен');
    }
    if (!input.newPassword) {
      throw new ValidationError('newPassword', 'Новый пароль обязателен');
    }
    if (input.newPassword.length < 6) {
      throw new ValidationError('newPassword', 'Пароль должен содержать минимум 6 символов');
    }
    if (input.currentPassword === input.newPassword) {
      throw new ValidationError('newPassword', 'Новый пароль должен отличаться от текущего');
    }
    return {
      userId: input.userId.trim(),
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    };
  }

  private async findUserByResetToken(token: string): Promise<{ id: string; resetTokenExp: Date | null } | null> {
    // Находим пользователя по resetToken - используем raw query так как Prisma не поддерживает прямой findUnique с condition
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        resetTokenExp: true,
      },
    });
    return user;
  }
}

/**
 * Factory функция для создания экземпляра AuthService.
 *
 * @param userRepository - Репозиторий пользователя
 * @returns Экземпляр AuthService
 *
 * @public
 */
export function createAuthService(userRepository: UserRepository): AuthService {
  return new AuthService(userRepository);
}
