/**
 * @module plotUser
 * @domain plotUser
 * @description Публичное API домена связей пользователь-участок
 */

// Types
export type {
  PlotUserRole,
  CreatePlotUserRoleInput,
  UpdatePlotUserRoleInput,
  PlotUserRoleWithRelations,
  PlotUserRoleHistory,
  PlotUserRoleListFilters,
  PaginatedResponse,
  PlotUserRoleRole,
  PlotUserRoleStatus,
  PlotUserRoleParticipantFilter,
  PlotUserRoleParticipant,
} from './plotUser.types';

// Enums/Constants
export {
  PlotUserRoleRoleName,
  PlotUserRoleRoleLabel,
  PlotUserRoleStatusLabel,
} from './plotUser.types';

// Errors
export {
  PlotUserRoleNotFoundError,
  PlotUserRoleDuplicateError,
  PlotUserRoleInvalidDataError,
} from './plotUser.errors';

// Validators
export {
  createPlotUserRoleSchema,
  updatePlotUserRoleSchema,
} from './plotUser.validators';
export type {
  CreatePlotUserRoleData,
  UpdatePlotUserRoleData,
} from './plotUser.validators';

// Repository Interfaces
export type {
  IPlotUserRoleRepository,
  IPlotUserRoleHistoryRepository,
} from './plotUser.repository.interface';

// Repository Implementations
export {
  PlotUserRoleRepositoryPrisma,
  PlotUserRoleHistoryRepositoryPrisma,
} from './plotUser.repository.prisma';

// Service
export {
  PlotUserRoleService,
  createPlotUserRoleService,
} from './plotUser.service';
