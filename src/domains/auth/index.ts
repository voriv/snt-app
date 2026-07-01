/**
 * @domain auth
 * @description Публичный API домена аутентификации
 */
export { AuthService } from './auth.service';
export type { IAuthRepository } from './auth.repository.interface';
export type { RegisterData, UserData, CreateUserInput, UserWithPassword, LoginData } from './auth.types';
export { UserDuplicateError, UserInvalidDataError, InvalidCredentialsError } from './auth.errors';
export { registerSchema, loginSchema } from './auth.validators';
export type { RegisterInput, LoginInput } from './auth.validators';
