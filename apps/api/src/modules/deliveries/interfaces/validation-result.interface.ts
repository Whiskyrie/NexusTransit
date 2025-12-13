/**
 * Interface para resultado de validação
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}
