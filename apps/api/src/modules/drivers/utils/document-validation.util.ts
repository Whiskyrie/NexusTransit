/**
 * Utilitários para validação de documentos de motoristas
 *
 * Fornece funções auxiliares para:
 * - Verificar vencimento de documentos
 * - Calcular dias até vencimento
 * - Validar períodos de validade
 * - Alertas de documentos próximos ao vencimento
 */

/**
 * Número de dias para considerar documento "expirando em breve"
 */
export const DAYS_BEFORE_EXPIRATION_WARNING = 30;

/**
 * Número de dias para considerar documento "crítico" (urgente renovação)
 */
export const DAYS_BEFORE_EXPIRATION_CRITICAL = 7;

/**
 * Status de validade de um documento
 */
export enum DocumentValidityStatus {
  /**
   * Documento válido com prazo confortável
   */
  VALID = 'VALID',

  /**
   * Documento válido mas próximo ao vencimento
   */
  EXPIRING_SOON = 'EXPIRING_SOON',

  /**
   * Documento válido mas muito próximo ao vencimento (crítico)
   */
  EXPIRING_CRITICAL = 'EXPIRING_CRITICAL',

  /**
   * Documento vencido
   */
  EXPIRED = 'EXPIRED',
}

/**
 * Interface para resultado de validação de documento
 */
export interface DocumentValidityResult {
  status: DocumentValidityStatus;
  daysUntilExpiration: number;
  isValid: boolean;
  message: string;
}

/**
 * Verifica se um documento está vencido
 *
 * @param expirationDate - Data de vencimento do documento
 * @returns true se o documento está vencido
 */
export function isDocumentExpired(expirationDate: Date | string): boolean {
  if (!expirationDate) {
    return true;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiration = new Date(expirationDate);
  expiration.setHours(0, 0, 0, 0);

  return expiration < now;
}

/**
 * Calcula dias até o vencimento de um documento
 *
 * @param expirationDate - Data de vencimento
 * @returns Número de dias até o vencimento (negativo se já vencido)
 */
export function daysUntilExpiration(expirationDate: Date | string): number {
  if (!expirationDate) {
    return -999;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expiration = new Date(expirationDate);
  expiration.setHours(0, 0, 0, 0);

  const diffTime = expiration.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se um documento está próximo ao vencimento
 *
 * @param expirationDate - Data de vencimento
 * @param warningDays - Número de dias para considerar "próximo" (padrão: 30)
 * @returns true se o documento vence em breve
 */
export function isDocumentExpiringSoon(
  expirationDate: Date | string,
  warningDays: number = DAYS_BEFORE_EXPIRATION_WARNING,
): boolean {
  const days = daysUntilExpiration(expirationDate);
  return days > 0 && days <= warningDays;
}

/**
 * Verifica se um documento está em estado crítico (vence muito em breve)
 *
 * @param expirationDate - Data de vencimento
 * @param criticalDays - Número de dias para considerar "crítico" (padrão: 7)
 * @returns true se o documento está em estado crítico
 */
export function isDocumentExpiringCritical(
  expirationDate: Date | string,
  criticalDays: number = DAYS_BEFORE_EXPIRATION_CRITICAL,
): boolean {
  const days = daysUntilExpiration(expirationDate);
  return days > 0 && days <= criticalDays;
}

/**
 * Obtém o status de validade de um documento
 *
 * @param expirationDate - Data de vencimento
 * @returns Status detalhado da validade do documento
 */
export function getDocumentValidityStatus(expirationDate: Date | string): DocumentValidityResult {
  const days = daysUntilExpiration(expirationDate);

  if (days < 0) {
    return {
      status: DocumentValidityStatus.EXPIRED,
      daysUntilExpiration: days,
      isValid: false,
      message: `Documento vencido há ${Math.abs(days)} dias`,
    };
  }

  if (days <= DAYS_BEFORE_EXPIRATION_CRITICAL) {
    return {
      status: DocumentValidityStatus.EXPIRING_CRITICAL,
      daysUntilExpiration: days,
      isValid: true,
      message: `Documento vence em ${days} dias - URGENTE`,
    };
  }

  if (days <= DAYS_BEFORE_EXPIRATION_WARNING) {
    return {
      status: DocumentValidityStatus.EXPIRING_SOON,
      daysUntilExpiration: days,
      isValid: true,
      message: `Documento vence em ${days} dias`,
    };
  }

  return {
    status: DocumentValidityStatus.VALID,
    daysUntilExpiration: days,
    isValid: true,
    message: `Documento válido por ${days} dias`,
  };
}

/**
 * Valida se um período de validade é válido
 *
 * @param issueDate - Data de emissão
 * @param expirationDate - Data de vencimento
 * @returns true se o período é válido
 */
export function isValidDocumentPeriod(
  issueDate: Date | string,
  expirationDate: Date | string,
): boolean {
  if (!issueDate || !expirationDate) {
    return false;
  }

  const issue = new Date(issueDate);
  const expiration = new Date(expirationDate);

  // Verifica se as datas são válidas
  if (isNaN(issue.getTime()) || isNaN(expiration.getTime())) {
    return false;
  }

  // Data de emissão deve ser anterior ao vencimento
  return issue < expiration;
}

/**
 * Calcula a data de emissão baseada no vencimento e validade padrão
 *
 * @param expirationDate - Data de vencimento
 * @param validityMonths - Meses de validade (padrão: 12)
 * @returns Data de emissão calculada
 */
export function calculateIssueDate(expirationDate: Date | string, validityMonths = 12): Date {
  const expiration = new Date(expirationDate);
  const issue = new Date(expiration);
  issue.setMonth(issue.getMonth() - validityMonths);
  return issue;
}

/**
 * Calcula a data de vencimento baseada na emissão e validade padrão
 *
 * @param issueDate - Data de emissão
 * @param validityMonths - Meses de validade (padrão: 12)
 * @returns Data de vencimento calculada
 */
export function calculateExpirationDate(issueDate: Date | string, validityMonths = 12): Date {
  const issue = new Date(issueDate);
  const expiration = new Date(issue);
  expiration.setMonth(expiration.getMonth() + validityMonths);
  return expiration;
}

/**
 * Formata mensagem de alerta baseada no status do documento
 *
 * @param documentType - Tipo de documento
 * @param driverName - Nome do motorista
 * @param expirationDate - Data de vencimento
 * @returns Mensagem formatada
 */
export function formatExpirationAlert(
  documentType: string,
  driverName: string,
  expirationDate: Date | string,
): string {
  const result = getDocumentValidityStatus(expirationDate);
  const expDate = new Date(expirationDate).toLocaleDateString('pt-BR');

  switch (result.status) {
    case DocumentValidityStatus.EXPIRED:
      return `ALERTA: ${documentType} do motorista ${driverName} venceu em ${expDate}`;

    case DocumentValidityStatus.EXPIRING_CRITICAL:
      return `URGENTE: ${documentType} do motorista ${driverName} vence em ${result.daysUntilExpiration} dias (${expDate})`;

    case DocumentValidityStatus.EXPIRING_SOON:
      return `ATENÇÃO: ${documentType} do motorista ${driverName} vence em ${result.daysUntilExpiration} dias (${expDate})`;

    default:
      return `${documentType} do motorista ${driverName} válido até ${expDate}`;
  }
}

/**
 * Obtém todos os documentos que precisam de atenção (vencidos ou próximos ao vencimento)
 *
 * @param documents - Lista de documentos com data de vencimento
 * @returns Lista de documentos que precisam de atenção
 */
export function getDocumentsNeedingAttention<T extends { expiration_date?: Date | string }>(
  documents: T[],
): T[] {
  return documents.filter(doc => {
    if (!doc.expiration_date) {
      return false;
    }

    const status = getDocumentValidityStatus(doc.expiration_date);
    return status.status !== DocumentValidityStatus.VALID;
  });
}
