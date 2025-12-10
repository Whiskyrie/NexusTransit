import { SetMetadata } from "@nestjs/common";
import {
  AUDITABLE_ENTITY_KEY,
  DEFAULT_AUDITABLE_OPTIONS,
} from "../constants/audit.constants";
import type { IAuditableOptions } from "../interfaces/audit-options.interface";

export const Auditable = (options: IAuditableOptions = {}): ClassDecorator => {
  const mergedOptions = { ...DEFAULT_AUDITABLE_OPTIONS, ...options };
  return SetMetadata(AUDITABLE_ENTITY_KEY, mergedOptions);
};

export const NonAuditable = (): ClassDecorator =>
  SetMetadata(AUDITABLE_ENTITY_KEY, {
    trackCreation: false,
    trackUpdates: false,
    trackDeletion: false,
  });

export const AuditableOperations = (
  operations: ("CREATE" | "UPDATE" | "DELETE")[]
): ClassDecorator => {
  return SetMetadata(AUDITABLE_ENTITY_KEY, {
    trackCreation: operations.includes("CREATE"),
    trackUpdates: operations.includes("UPDATE"),
    trackDeletion: operations.includes("DELETE"),
    excludeFields: ["updated_at", "created_at"],
    trackOldValues: true,
    entityDisplayName: "",
  });
};
