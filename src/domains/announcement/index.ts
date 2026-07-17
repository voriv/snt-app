// Re-export public API of the announcement domain

// Types
export type {
  Announcement,
  AnnouncementWithAuthor,
  AnnouncementListQuery,
  PaginatedAnnouncements,
  AnnouncementFilter,
  AnnouncementStatus,
  AnnouncementCreateInput,
} from './announcement.types';

// Validators
export {
  AnnouncementListQuerySchema,
  AnnouncementDetailQuerySchema,
  AnnouncementStatusSchema,
  AnnouncementCreateSchema,
} from './announcement.validators';
export type {
  AnnouncementListQueryParsed,
  AnnouncementDetailQueryParsed,
} from './announcement.validators';

// Errors
export {
  AnnouncementNotFoundError,
  AnnouncementInvalidDataError,
} from './announcement.errors';

// Repository
export type { IAnnouncementRepository } from './announcement.repository.interface';
export { AnnouncementRepositoryPrisma } from './announcement.repository.prisma';

// Service
export { AnnouncementService } from './announcement.service';