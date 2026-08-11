/**
 * @domain auth
 * @description Публичный API домена аутентификации
 */
export { AuthService } from './auth.service';
export type { IAuthRepository } from './auth.repository.interface';
export type { RegisterData, UserData, CreateUserInput, UserWithPassword, LoginData } from './auth.types';
export { UserDuplicateError, UserInvalidDataError, InvalidCredentialsError, GuestRoleMissingError, InvalidCurrentPasswordError, NewPasswordMatchesCurrentError } from './auth.errors';
export { registerSchema, loginSchema, changePasswordSchema } from './auth.validators';
export type { RegisterInput, LoginInput, ChangePasswordInput } from './auth.validators';
