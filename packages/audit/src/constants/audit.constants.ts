export const AUDIT_RETENTION_DAYS = 30;
export const AUDIT_RETENTION_DAYS_CRITICAL = 365;
export const AUDIT_SKIP_PATTERNS = [
  "/health",
  "/favicon.ico",
  "/robots.txt",
  "/swagger",
  "/swagger-ui",
  "/docs",
  "/api-docs",
  "/metrics",
  "/.well-known",
];
export const AUDIT_MAX_LOGS_PER_QUERY = 100;
export const AUDIT_DEFAULT_PAGE_SIZE = 10;
export const AUDIT_STATS_CACHE_TTL = 300;
export const AUDIT_TRACKABLE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];
export const AUDIT_CACHE_PREFIX = "audit:";
export const AUDIT_STATS_CACHE_KEY = `${AUDIT_CACHE_PREFIX}stats`;
export const AUDIT_EXCLUDED_FIELDS = [
  "password",
  "passwordHash",
  "password_hash",
  "token",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "secret",
  "apiKey",
  "api_key",
  "creditCard",
  "credit_card",
  "cvv",
  "ssn",
];
export const AUDIT_MAX_OLD_DATA_SIZE = 10000;
export const AUDIT_MAX_NEW_DATA_SIZE = 10000;
export const AUDIT_CRITICAL_ACTIONS = [
  "LOGIN",
  "LOGOUT",
  "DELETE",
  "PERMISSION_CHANGE",
  "ROLE_CHANGE",
  "PASSWORD_CHANGE",
];
export const AUDIT_CRITICAL_CATEGORIES = [
  "SECURITY",
  "AUTHENTICATION",
  "AUTHORIZATION",
  "DATA_DELETION",
];

// Key used for metadata
export const AUDITABLE_ENTITY_KEY = "AUDITABLE_ENTITY";

export const DEFAULT_AUDITABLE_OPTIONS = {
  trackCreation: true,
  trackUpdates: true,
  trackDeletion: true,
  excludeFields: ["updated_at", "created_at"],
  trackOldValues: true,
  entityDisplayName: "",
};
