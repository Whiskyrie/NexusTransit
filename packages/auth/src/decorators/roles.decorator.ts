import { SetMetadata } from "@nestjs/common";
import type { Role } from "../enums/role.enum";

/**
 * Metadata key para roles
 */
export const ROLES_KEY = "roles";

/**
 * Roles Decorator
 * Define quais roles têm acesso ao endpoint
 *
 * @example
 * ```typescript
 * @Roles(Role.ADMIN, Role.GESTOR)
 * @Get('admin')
 * getAdminData() {
 *   return 'Admin data';
 * }
 * ```
 */
export const Roles = (...roles: Role[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
