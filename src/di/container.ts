import { AuthService } from '@/domains/auth/auth.service';
import { AuthRepository } from '@/domains/auth/auth.repository.prisma';
import type { IAuthRepository } from '@/domains/auth/auth.repository.interface';
import { createUserProfileService } from '@/domains/userProfile/userProfile.service';
import { UserProfileRepository } from '@/domains/userProfile/userProfile.repository.prisma';
import type { IUserProfileRepository } from '@/domains/userProfile/userProfile.repository.interface';
import {
  RoleService,
  PageService,
  ApiEndpointService,
  RoleApiEndpointService,
} from '@/domains/roles/roles.service';
import { AccessService } from '@/domains/roles/access.service';
import {
  RoleRepository,
  PageRepository,
  RolePageRepository,
  ApiEndpointRepository,
  RoleApiEndpointRepository,
} from '@/domains/roles/roles.repository.prisma';
import type {
  IRoleRepository,
  IPageRepository,
  IRolePageRepository,
  IApiEndpointRepository,
  IRoleApiEndpointRepository,
} from '@/domains/roles/roles.repository.interface';
import { PlotService } from '@/domains/plot/plot.service';
import { PlotRepositoryPrisma } from '@/domains/plot/plot.repository.prisma';
import type { IPlotRepository } from '@/domains/plot/plot.repository.interface';
import {
  PlotUserRoleService,
  createPlotUserRoleService,
} from '@/domains/plotUser/plotUser.service';
import { UsersService } from '@/domains/users/users.service';
import { UsersRepositoryPrisma } from '@/domains/users/users.repository.prisma';
import type { IUsersRepository } from '@/domains/users/users.repository.interface';
import {
  PlotUserRoleRepositoryPrisma,
  PlotUserRoleHistoryRepositoryPrisma,
} from '@/domains/plotUser/plotUser.repository.prisma';
import type {
  IPlotUserRoleRepository,
  IPlotUserRoleHistoryRepository,
} from '@/domains/plotUser/plotUser.repository.interface';
import { CommsService } from '@/domains/comms/comms.service';
import { PrismaCommsRepository } from '@/domains/comms/comms.repository.prisma';
import type { ICommsRepository } from '@/domains/comms/comms.repository.interface';
import { AnnouncementService } from '@/domains/announcement/announcement.service';
import { AnnouncementRepositoryPrisma } from '@/domains/announcement/announcement.repository.prisma';
import type { IAnnouncementRepository } from '@/domains/announcement/announcement.repository.interface';

// Factory function to create AuthService with injected dependencies
export function createAuthService(): AuthService {
  const repository: IAuthRepository = new AuthRepository();
  return new AuthService(repository);
}

// Factory function to create UserProfileService with injected dependencies
export function createUserProfileServiceDI() {
  const repository: IUserProfileRepository = new UserProfileRepository();
  return createUserProfileService(repository);
}

// Factory functions to create roles-domain services with injected dependencies
export function createRoleService(): RoleService {
  const roleRepo: IRoleRepository = new RoleRepository();
  const rolePageRepo: IRolePageRepository = new RolePageRepository();
  return new RoleService(roleRepo, rolePageRepo);
}

export function createPageService(): PageService {
  const pageRepo: IPageRepository = new PageRepository();
  return new PageService(pageRepo);
}

export function createApiEndpointService(): ApiEndpointService {
  const endpointRepo: IApiEndpointRepository = new ApiEndpointRepository();
  return new ApiEndpointService(endpointRepo);
}

export function createRoleApiEndpointService(): RoleApiEndpointService {
  const roleEndpointRepo: IRoleApiEndpointRepository = new RoleApiEndpointRepository();
  return new RoleApiEndpointService(roleEndpointRepo);
}

export function createAccessService(): AccessService {
  const roleRepo: IRoleRepository = new RoleRepository();
  const pageRepo: IPageRepository = new PageRepository();
  const rolePageRepo: IRolePageRepository = new RolePageRepository();
  const endpointRepo: IApiEndpointRepository = new ApiEndpointRepository();
  const roleEndpointRepo: IRoleApiEndpointRepository = new RoleApiEndpointRepository();
  return new AccessService(roleRepo, pageRepo, rolePageRepo, endpointRepo, roleEndpointRepo);
}

// Factory function to create PlotService with injected dependencies
export function createPlotService(): PlotService {
  const repository: IPlotRepository = new PlotRepositoryPrisma();
  return new PlotService(repository);
}

// Factory function to create PlotUserRoleService with injected dependencies
export function createPlotUserRoleServiceDI(): PlotUserRoleService {
  const plotUserRoleRepo: IPlotUserRoleRepository = new PlotUserRoleRepositoryPrisma();
  const historyRepo: IPlotUserRoleHistoryRepository = new PlotUserRoleHistoryRepositoryPrisma();
  return createPlotUserRoleService(plotUserRoleRepo, historyRepo);
}

// Factory function to create UsersService with injected dependencies
export function createUsersService(): UsersService {
  const repository: IUsersRepository = new UsersRepositoryPrisma();
  const plotUserRoleService = createPlotUserRoleServiceDI();
  return new UsersService(repository, plotUserRoleService);
}

// Factory function to create CommsService with injected dependencies
export function createCommsService(): CommsService {
  const repository: ICommsRepository = new PrismaCommsRepository();
  return new CommsService(repository);
}

// Factory function to create AnnouncementService with injected dependencies
export function createAnnouncementService(): AnnouncementService {
  const repository: IAnnouncementRepository = new AnnouncementRepositoryPrisma();
  return new AnnouncementService(repository);
}

// Container for managing dependencies
export class Container {
  private authService: AuthService | null = null;
  private userProfileService: ReturnType<typeof createUserProfileServiceDI> | null = null;
  private roleService: RoleService | null = null;
  private pageService: PageService | null = null;
  private apiEndpointService: ApiEndpointService | null = null;
  private roleApiEndpointService: RoleApiEndpointService | null = null;
  private accessService: AccessService | null = null;
  private plotService: PlotService | null = null;
  private plotUserService: PlotUserRoleService | null = null;
  private usersService: UsersService | null = null;
  private commsService: CommsService | null = null;
  private announcementService: AnnouncementService | null = null;

  getAuthService(): AuthService {
    if (!this.authService) {
      const repository: IAuthRepository = new AuthRepository();
      this.authService = new AuthService(repository);
    }
    return this.authService;
  }

  getUserProfileService() {
    if (!this.userProfileService) {
      const repository: IUserProfileRepository = new UserProfileRepository();
      this.userProfileService = createUserProfileService(repository);
    }
    return this.userProfileService;
  }

  getRoleService(): RoleService {
    if (!this.roleService) {
      this.roleService = createRoleService();
    }
    return this.roleService;
  }

  getPageService(): PageService {
    if (!this.pageService) {
      this.pageService = createPageService();
    }
    return this.pageService;
  }

  getApiEndpointService(): ApiEndpointService {
    if (!this.apiEndpointService) {
      this.apiEndpointService = createApiEndpointService();
    }
    return this.apiEndpointService;
  }

  getRoleApiEndpointService(): RoleApiEndpointService {
    if (!this.roleApiEndpointService) {
      this.roleApiEndpointService = createRoleApiEndpointService();
    }
    return this.roleApiEndpointService;
  }

  getAccessService(): AccessService {
    if (!this.accessService) {
      this.accessService = createAccessService();
    }
    return this.accessService;
  }

  getPlotService(): PlotService {
    if (!this.plotService) {
      this.plotService = createPlotService();
    }
    return this.plotService;
  }

  getPlotUserRoleService(): PlotUserRoleService {
    if (!this.plotUserService) {
      this.plotUserService = createPlotUserRoleServiceDI();
    }
    return this.plotUserService;
  }

  getUsersService(): UsersService {
    if (!this.usersService) {
      this.usersService = createUsersService();
    }
    return this.usersService;
  }

  getCommsService(): CommsService {
    if (!this.commsService) {
      this.commsService = createCommsService();
    }
    return this.commsService;
  }

  getAnnouncementService(): AnnouncementService {
    if (!this.announcementService) {
      this.announcementService = createAnnouncementService();
    }
    return this.announcementService;
  }
}

// Singleton instance
export const container = new Container();

/**
 * Получить singleton-экземпляр DI-контейнера
 *
 * @returns Экземпляр Container
 *
 * @spec - Используется в withRoleGuard и API route handlers для получения сервисов
 */
export function getContainer(): Container {
  return container;
}
