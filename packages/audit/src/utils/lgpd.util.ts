import { createHash } from "crypto";
import { AuditCategory } from "../enums";

/**
 * Tipos para objetos JSON genéricos
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

export type JsonObject = {
  [key: string]: JsonValue;
};

export type JsonArray = JsonValue[];

/**
 * Type guard para verificar se é um JsonObject
 */
function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Campos considerados dados pessoais sensíveis pela LGPD
 */
export const SENSITIVE_PERSONAL_FIELDS = [
  "cpf",
  "rg",
  "cnh",
  "email",
  "phone",
  "mobile",
  "address",
  "street",
  "complement",
  "neighborhood",
  "city",
  "state",
  "zip_code",
  "postal_code",
  "birth_date",
  "birthDate",
  "date_of_birth",
  "passport",
  "social_security",
  "bank_account",
  "credit_card",
  "debit_card",
  "pix_key",
  "salary",
  "income",
  "health_data",
  "medical_record",
  "biometric_data",
  "fingerprint",
  "facial_recognition",
  "ip_address",
  "geolocation",
  "latitude",
  "longitude",
];

/**
 * Política de retenção de dados por categoria (em dias)
 * Baseado na LGPD e boas práticas
 */
export const DATA_RETENTION_POLICY: Record<AuditCategory, number> = {
  [AuditCategory.SECURITY]: 1825, // 5 anos - Segurança crítica
  [AuditCategory.AUTH]: 730, // 2 anos - Autenticação
  [AuditCategory.USER_MANAGEMENT]: 1095, // 3 anos - Gestão de usuários
  [AuditCategory.VEHICLE_MANAGEMENT]: 730, // 2 anos - Gestão de veículos
  [AuditCategory.DRIVER_MANAGEMENT]: 730, // 2 anos - Gestão de motoristas
  [AuditCategory.ROUTE_MANAGEMENT]: 365, // 1 ano - Gestão de rotas
  [AuditCategory.DELIVERY_MANAGEMENT]: 1095, // 3 anos - Gestão de entregas
  [AuditCategory.CUSTOMER_MANAGEMENT]: 1095, // 3 anos - Gestão de clientes
  [AuditCategory.REPORT_MANAGEMENT]: 365, // 1 ano - Relatórios
  [AuditCategory.SYSTEM]: 180, // 6 meses - Sistema geral
  [AuditCategory.INTEGRATION]: 365, // 1 ano - Integrações
  [AuditCategory.CONFIGURATION]: 730, // 2 anos - Configurações
  [AuditCategory.OTHER]: 180, // 6 meses - Outros
};

/**
 * Categorias críticas que nunca devem ser deletadas automaticamente
 */
export const CRITICAL_CATEGORIES: AuditCategory[] = [AuditCategory.SECURITY, AuditCategory.AUTH];

/**
 * Anonimiza um valor de dado pessoal
 * Usa hash SHA-256 para permitir identificação sem revelar o valor original
 */
export function anonymizePersonalData(value: string | null): string | null {
  if (!value) return null;

  // Se for CPF/CNPJ, manter apenas primeiros e últimos dígitos
  if (/^\d{11}$/.test(value) || /^\d{14}$/.test(value)) {
    const first = value.substring(0, 3);
    const last = value.substring(value.length - 2);
    const middle = "*".repeat(value.length - 5);
    return `${first}${middle}${last}`;
  }

  // Se for email, manter domínio e anonimizar usuário
  if (value.includes("@")) {
    const [user, domain] = value.split("@");
    const visibleChars = Math.min(3, user.length);
    const anonymizedUser = user.substring(0, visibleChars) + "***";
    return `${anonymizedUser}@${domain}`;
  }

  // Se for telefone, manter apenas DDD e primeiros dígitos
  if (/^\+?\d{10,15}$/.test(value.replace(/\D/g, ""))) {
    const digits = value.replace(/\D/g, "");
    const first = digits.substring(0, 4);
    const last = digits.substring(digits.length - 2);
    return `${first}****${last}`;
  }

  // Para outros dados, usar hash SHA-256
  return createHash("sha256").update(value).digest("hex").substring(0, 16);
}

/**
 * Verifica se um campo é considerado dado pessoal sensível
 */
export function isSensitiveField(fieldName: string): boolean {
  const normalizedField = fieldName.toLowerCase().replace(/_/g, "");
  return SENSITIVE_PERSONAL_FIELDS.some((sensitive) =>
    normalizedField.includes(sensitive.toLowerCase().replace(/_/g, "")),
  );
}

/**
 * Anonimiza um objeto, substituindo campos sensíveis por valores hash
 */
export function anonymizeObject(
  data: JsonObject,
  options: {
    excludeFields?: string[];
    preserveFields?: string[];
  } = {},
): JsonObject {
  if (!data || typeof data !== "object") return data;

  const { excludeFields = [], preserveFields = [] } = options;
  const result: JsonObject = {};

  for (const [key, value] of Object.entries(data)) {
    // Se está na lista de exclusão, pular
    if (excludeFields.includes(key)) {
      continue;
    }

    // Se está na lista de preservação, manter original
    if (preserveFields.includes(key)) {
      result[key] = value;
      continue;
    }

    // Se é campo sensível, anonimizar
    if (isSensitiveField(key) && typeof value === "string") {
      result[key] = anonymizePersonalData(value);
    } else if (isJsonObject(value)) {
      // Recursivo para objetos aninhados
      result[key] = anonymizeObject(value, options);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Calcula a data de expiração com base na categoria
 */
export function getExpirationDate(category: AuditCategory): Date {
  const retentionDays = DATA_RETENTION_POLICY[category] || 365;
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + retentionDays);
  return expirationDate;
}

/**
 * Verifica se uma categoria é crítica e não deve ser deletada automaticamente
 */
export function isCriticalCategory(category: AuditCategory): boolean {
  return CRITICAL_CATEGORIES.includes(category);
}

/**
 * Remove dados pessoais de um log de auditoria para conformidade LGPD
 */
export function sanitizeAuditLog(
  log: JsonObject,
  options: {
    anonymizeUser?: boolean;
    anonymizeOldValues?: boolean;
    anonymizeNewValues?: boolean;
    anonymizeMetadata?: boolean;
  } = {},
): JsonObject {
  const {
    anonymizeUser = true,
    anonymizeOldValues = true,
    anonymizeNewValues = true,
    anonymizeMetadata = true,
  } = options;

  const sanitized = { ...log };

  // Anonimizar dados do usuário
  if (anonymizeUser) {
    if (typeof sanitized.userEmail === "string") {
      sanitized.userEmail = anonymizePersonalData(sanitized.userEmail);
    }
    if (typeof sanitized.ipAddress === "string") {
      sanitized.ipAddress = anonymizePersonalData(sanitized.ipAddress);
    }
  }

  // Anonimizar valores antigos
  if (anonymizeOldValues && isJsonObject(sanitized.oldValues)) {
    sanitized.oldValues = anonymizeObject(sanitized.oldValues);
  }

  // Anonimizar novos valores
  if (anonymizeNewValues && isJsonObject(sanitized.newValues)) {
    sanitized.newValues = anonymizeObject(sanitized.newValues);
  }

  // Anonimizar metadata
  if (anonymizeMetadata && isJsonObject(sanitized.metadata)) {
    sanitized.metadata = anonymizeObject(sanitized.metadata);
  }

  return sanitized;
}

/**
 * Prepara dados para exportação conforme LGPD
 * (direito de acesso aos dados - Art. 18, I e II)
 */
export function prepareDataForExport(
  logs: JsonObject[],
  options: {
    includePersonalData?: boolean;
    format?: "readable" | "technical";
  } = {},
): JsonObject[] {
  const { includePersonalData = false, format = "readable" } = options;

  return logs.map((log) => {
    if (!includePersonalData) {
      return sanitizeAuditLog(log);
    }

    if (format === "readable") {
      // Formato legível para o titular dos dados
      return {
        data: log.created_at,
        acao: log.action,
        descricao: log.description,
        entidade: log.resourceType,
        categoriaAtividade: log.category,
      };
    }

    // Formato técnico completo
    return log;
  });
}
