export interface AuditableOptions {
  trackCreation?: boolean;
  trackUpdates?: boolean;
  trackDeletion?: boolean;
  excludeFields?: string[];
  trackOldValues?: boolean;
  entityDisplayName?: string;
}

export interface AuditMetadata {
  changedColumns?: string[];
  oldValues?: Record<string, unknown>;
}

export interface AuditContext {
  requestId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  timestamp?: string;
}
