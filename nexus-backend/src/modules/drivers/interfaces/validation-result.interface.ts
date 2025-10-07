/**
 * Interface para resultado de validação
 * Usado em validators e validações customizadas
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Interface específica para validação de CNH
 */
export interface CNHValidationResult extends ValidationResult {
  daysToExpiration?: number;
  isExpired?: boolean;
  categoryValid?: boolean;
}

/**
 * Interface para validação de documentos
 */
export interface DocumentValidationResult extends ValidationResult {
  documentType?: string;
  isRequired?: boolean;
  isActive?: boolean;
}
