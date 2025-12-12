import { SetMetadata } from "@nestjs/common";
import type { Role } from "../enums/role.enum";

/**
 * Decorator para definir roles permitidas em um endpoint
 *
 * @example
 * ```typescript
 * @Roles(Role.ADMIN, Role.GESTOR)
 * async findAll() { ... }
 * ```
 */
export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
