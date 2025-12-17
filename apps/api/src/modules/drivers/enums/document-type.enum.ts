/**
 * Document Type Enum
 * Tipos de documentos aceitos para motoristas
 */
export enum DocumentType {
  /**
   * Cadastro de Pessoa Física
   */
  CPF = 'cpf',

  /**
   * Carteira Nacional de Habilitação
   */
  CNH = 'cnh',

  /**
   * Registro Geral (RG)
   */
  RG = 'rg',

  /**
   * Certificado MOPP (Movimentação Operacional de Produtos Perigosos)
   */
  MOPP = 'mopp',

  /**
   * Exame médico
   */
  MEDICAL_EXAM = 'medical_exam',

  /**
   * Atestado de antecedentes criminais
   */
  CRIMINAL_RECORD = 'criminal_record',

  /**
   * Verificação de antecedentes (Background Check)
   */
  BACKGROUND_CHECK = 'background_check',

  /**
   * Comprovante de residência
   */
  ADDRESS_PROOF = 'address_proof',

  /**
   * Foto/selfie do motorista
   */
  SELFIE = 'selfie',

  /**
   * Contrato de trabalho
   */
  CONTRACT = 'contract',

  /**
   * Outros documentos
   */
  OTHER = 'other',
}

/**
 * Utilitário para validar tipo de documento
 */
export function isValidDocumentType(type: string): type is DocumentType {
  return Object.values(DocumentType).includes(type as DocumentType);
}

/**
 * Utilitário para obter tipos de documentos disponíveis
 */
export function getAvailableDocumentTypes(): DocumentType[] {
  return Object.values(DocumentType);
}

/**
 * Utilitário para traduzir tipo de documento
 */
export function translateDocumentType(type: DocumentType): string {
  const translations: Record<DocumentType, string> = {
    [DocumentType.CPF]: 'CPF',
    [DocumentType.CNH]: 'CNH',
    [DocumentType.RG]: 'RG',
    [DocumentType.MOPP]: 'Certificado MOPP',
    [DocumentType.MEDICAL_EXAM]: 'Exame Médico',
    [DocumentType.CRIMINAL_RECORD]: 'Antecedentes Criminais',
    [DocumentType.BACKGROUND_CHECK]: 'Background Check',
    [DocumentType.ADDRESS_PROOF]: 'Comprovante de Residência',
    [DocumentType.SELFIE]: 'Foto',
    [DocumentType.CONTRACT]: 'Contrato',
    [DocumentType.OTHER]: 'Outro',
  };
  return translations[type] || type;
}

/**
 * Documentos obrigatórios para motoristas
 */
export const REQUIRED_DOCUMENTS = [
  DocumentType.CPF,
  DocumentType.CNH,
  DocumentType.RG,
  DocumentType.MEDICAL_EXAM,
] as const;

/**
 * Verifica se o documento é obrigatório
 */
export function isRequiredDocument(type: DocumentType): boolean {
  return REQUIRED_DOCUMENTS.includes(type as any);
}
