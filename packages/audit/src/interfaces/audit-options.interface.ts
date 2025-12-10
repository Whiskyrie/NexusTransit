import { AuditCategory } from "../enums";

export interface IAuditableOptions {
  trackCreation?: boolean;
  trackUpdates?: boolean;
  trackDeletion?: boolean;
  excludeFields?: string[];
  trackOldValues?: boolean;
  entityDisplayName?: string;
  auditCategory?: AuditCategory;
  retentionPeriodDays?: number;
}

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
}
