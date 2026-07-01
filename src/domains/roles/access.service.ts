/**
 * @file access.service.ts
 * @domain roles
 * @description Единый сервис проверки доступа пользователей к страницам и API endpoints
 *
 * @spec
 * - Зависимости: IRoleRepository, IPageRepository, IRolePageRepository,
 *   IApiEndpointRepository, IRoleApiEndpointRepository через DI
 * - SUPER_ADMIN: при наличии роли SUPER_ADMIN → true (runtime-правило, без обращения к role_pages/role_api_endpoints)
 * - Неактивная страница/endpoint (is_active=false) → false для ВСЕХ, включая SUPER_ADMIN
 * - Сопоставление путей через matchPath(pattern, actual) из @/shared/utils/path-matcher
 *
 * @see docs/user-stories/US-8-roles-management.md — FR-15, FR-16, BR-16..BR-29
 */
import type {
  IRoleRepository,
  IPageRepository,
  IRolePageRepository,
  IApiEndpointRepository,
  IRoleApiEndpointRepository,
} from './roles.repository.interface';
import type { ApiEndpoint, Page, Role } from './roles.types';
import { matchPath } from '@/shared/utils/path-matcher';

/** Имя системной супер-роли — даёт полный доступ через runtime-правило */
const SUPER_ADMIN_ROLE_NAME = 'SUPER_ADMIN';

/**
 * @service AccessService
 * @domain roles
 * @description Проверка доступа к страницам и API endpoints на основе ролевой модели RBAC
 *
 * @spec
 * - Методы используются в withRoleGuard для защиты API endpoints
 * - canAccessPage будет использоваться в US-9 для защиты страниц
 * - getAccessiblePages — для построения навигационного меню (US-9)
 */
export class AccessService {
  constructor(
    private readonly roleRepo: IRoleRepository,
    private readonly pageRepo: IPageRepository,
    private readonly rolePageRepo: IRolePageRepository,
    private readonly endpointRepo: IApiEndpointRepository,
    private readonly roleEndpointRepo: IRoleApiEndpointRepository,
  ) {}

  /**
   * Проверить доступ пользователя к странице
   *
   * @param userId - ID пользователя
   * @param path - Путь страницы (например /dashboard/members)
   * @returns true если доступ разрешён
   *
   * @spec
   * - Если страница не найдена → false
   * - Если страница is_active=false → false (для всех, включая SUPER_ADMIN)
   * - Если у пользователя есть роль SUPER_ADMIN → true (runtime-правило)
   * - Иначе проверка наличия записи в role_pages для любой роли пользователя
   *
   * @see docs/user-stories/US-8-roles-management.md — BR-10, BR-11, BR-16, BR-17
   */
  async canAccessPage(userId: string, path: string): Promise<boolean> {
    const page = await this.pageRepo.findByPath(path);
    if (!page || !page.isActive) {
      return false;
    }

    const roles = await this.roleRepo.findRolesByUserId(userId);
    if (this.isSuperAdmin(roles)) {
      return true;
    }

    // Проверяем наличие записи в role_pages для любой роли пользователя
    for (const role of roles) {
      const assignedRoles = await this.rolePageRepo.findRolesByPageId(page.id);
      if (assignedRoles.some(r => r.id === role.id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Проверить доступ пользователя к API endpoint
   *
   * @param userId - ID пользователя
   * @param method - HTTP-метод запроса
   * @param path - Путь запроса (например /members/abc123 — сопоставляется с шаблонами)
   * @returns true если доступ разрешён
   *
   * @spec
   * - Endpoint определяется через matchPath по реестру api_endpoints
   * - Если endpoint не найден → false
   * - Если endpoint is_active=false → false (для всех, включая SUPER_ADMIN)
   * - access_type=public → true (проверка авторизации выполняется в withRoleGuard)
   * - access_type=owner → true при наличии сессии (владение проверяется в handler)
   * - access_type=super_admin → только SUPER_ADMIN
   * - access_type=role → SUPER_ADMIN → true; иначе проверка role_api_endpoints для любой роли пользователя
   *
   * @see docs/user-stories/US-8-roles-management.md — BR-21..BR-24
   */
  async canAccessApi(userId: string, method: string, path: string): Promise<boolean> {
    // Endpoint определяется через matchPath по реестру api_endpoints
    const endpoint = await this.resolveEndpoint(method, path);
    if (!endpoint || !endpoint.isActive) {
      return false;
    }

    switch (endpoint.accessType) {
      case 'public':
        return true;
      case 'owner':
        // Доступ при наличии сессии (владение проверяется в handler)
        // withRoleGuard гарантирует наличие userId
        return true;
      case 'super_admin': {
        const roles = await this.roleRepo.findRolesByUserId(userId);
        return this.isSuperAdmin(roles);
      }
      case 'role': {
        const roles = await this.roleRepo.findRolesByUserId(userId);
        if (this.isSuperAdmin(roles)) {
          return true;
        }
        // Проверка role_api_endpoints для любой роли пользователя
        for (const role of roles) {
          const assignedRoles = await this.roleEndpointRepo.findRolesByEndpointId(endpoint.id);
          if (assignedRoles.some(r => r.id === role.id)) {
            return true;
          }
        }
        return false;
      }
      default:
        return false;
    }
  }

  /**
   * Получить список страниц, доступных пользователю (для построения меню)
   *
   * @param userId - ID пользователя
   * @returns Активные страницы, доступные пользователю
   *
   * @spec
   * - SUPER_ADMIN → все активные страницы
   * - Иначе: страницы с записью в role_pages для любой роли пользователя
   * - Неактивные страницы исключаются всегда
   * - Сортировка по sortOrder
   *
   * @see docs/user-stories/US-9-page-access.md — построение навигации
   */
  async getAccessiblePages(userId: string): Promise<Page[]> {
    const roles = await this.roleRepo.findRolesByUserId(userId);
    const allPages = await this.pageRepo.findAll();
    const activePages = allPages.filter(p => p.isActive);

    if (this.isSuperAdmin(roles)) {
      // SUPER_ADMIN → все активные страницы, отсортированные по sortOrder
      return activePages.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    // Иначе: страницы с записью в role_pages для любой роли пользователя
    const accessiblePages: Page[] = [];
    for (const page of activePages) {
      const assignedRoles = await this.rolePageRepo.findRolesByPageId(page.id);
      if (assignedRoles.some(rp => roles.some(r => r.id === rp.id))) {
        accessiblePages.push(page);
      }
    }
    return accessiblePages.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  /**
   * Проверить, есть ли у пользователя роль SUPER_ADMIN
   *
   * @param roles - Список ролей пользователя
   * @returns true если среди ролей есть SUPER_ADMIN
   *
   * @spec - Runtime-правило: SUPER_ADMIN даёт полный доступ без обращения к role_pages/role_api_endpoints
   */
  private isSuperAdmin(roles: Role[]): boolean {
    return roles.some(r => r.name === SUPER_ADMIN_ROLE_NAME);
  }

  /**
   * Найти endpoint по HTTP-методу и пути с поддержкой :param сегментов
   *
   * @param method - HTTP-метод запроса
   * @param path - Путь запроса (например /members/abc123)
   * @returns Совпадающий ApiEndpoint или null
   *
   * @spec - Загружает реестр api_endpoints и сопоставляет через matchPath
   */
  async resolveEndpoint(
    method: string,
    path: string,
  ): Promise<ApiEndpoint | null> {
    const endpoints = await this.endpointRepo.findAll();
    const upperMethod = method.toUpperCase();
    return (
      endpoints.find(
        e => e.method === upperMethod && matchPath(e.path, path),
      ) ?? null
    );
  }
}
