/**
 * @file index.ts
 * @domain roles
 * @description Публичный API домена roles (re-exports)
 *
 * @spec
 * - Экспортирует типы, сервисы, ошибки, валидаторы и интерфейсы репозиториев
 * - НЕ экспортирует реализации репозиториев (инкапсуляция Prisma)
 * - НЕ экспортирует UserWithPassword (безопасность)
 */
export type {
  Role,
  Page,
  ApiEndpoint,
  UserRole,
  RolePage,
  RoleApiEndpoint,
  CreateRoleInput,
  UpdateRoleInput,
  CreatePageInput,
  UpdatePageInput,
  CreateApiEndpointInput,
  UpdateApiEndpointInput,
  HttpMethod,
  AccessType,
} from './roles.types';

export type {
  IRoleRepository,
  IPageRepository,
  IRolePageRepository,
  IApiEndpointRepository,
  IRoleApiEndpointRepository,
} from './roles.repository.interface';

export {
  RoleNotFoundError,
  RoleDuplicateError,
  RoleSystemProtectedError,
  LastSuperAdminError,
  RoleInvalidDataError,
  PageNotFoundError,
  PageDuplicateError,
  PageInvalidDataError,
  ApiEndpointNotFoundError,
  ApiEndpointDuplicateError,
  ApiEndpointInvalidDataError,
} from './roles.errors';

export {
  createRoleSchema,
  updateRoleSchema,
  createPageSchema,
  updatePageSchema,
  createApiEndpointSchema,
  updateApiEndpointSchema,
} from './roles.validators';

export { RoleService, PageService, ApiEndpointService, RoleApiEndpointService } from './roles.service';
export { AccessService } from './access.service';
