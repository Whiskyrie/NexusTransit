/**
 * Common Enums for Auth Service
 *
 * Re-exports enums from their respective modules for easier imports.
 * Only includes enums relevant to auth-service domain.
 */

// User related enums
export { UserStatus } from "../../users/enums/user-status.enum";
export { UserType } from "../../users/enums/user-type.enum";

// Role related enums
export { RoleType } from "../../roles/enums/role-type.enum";

// Auth related enums
export { TokenType } from "../../auth/enums/token-type.enum";
export { AuthProvider } from "../../auth/enums/auth-provider.enum";

// Audit related enums
export { AuditAction, AuditCategory } from "@nexus/audit";
