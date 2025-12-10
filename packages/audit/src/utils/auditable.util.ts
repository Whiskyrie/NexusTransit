import { AUDITABLE_ENTITY_KEY } from "../constants/audit.constants";
import type { IAuditableOptions } from "../interfaces/audit-options.interface";

export class AuditableUtils {
  static isAuditable(target: object): boolean {
    try {
      const metadata: unknown = Reflect.getMetadata(
        AUDITABLE_ENTITY_KEY,
        target
      );
      return !!metadata;
    } catch {
      return false;
    }
  }

  static getAuditableOptions(target: object): IAuditableOptions | undefined {
    try {
      return Reflect.getMetadata(AUDITABLE_ENTITY_KEY, target) as
        | IAuditableOptions
        | undefined;
    } catch {
      return undefined;
    }
  }

  static sanitizeAuditData(
    data: Record<string, unknown>,
    excludeFields: string[] = []
  ): Record<string, unknown> {
    const sanitized = { ...data };

    excludeFields.forEach((field) => {
      delete sanitized[field];
    });

    return sanitized;
  }
}
