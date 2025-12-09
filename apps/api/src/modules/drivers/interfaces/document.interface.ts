import type { DocumentType } from '../enums/document-type.enum';

/**
 * Interface para metadados de documento
 */
export interface DocumentMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface para status de documento
 */
export interface DocumentStatus {
  isActive: boolean;
  isVerified?: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  expirationDate?: Date;
}

/**
 * Interface para requisitos de documento
 */
export interface DocumentRequirements {
  type: DocumentType;
  required: boolean;
  maxSizeMB: number;
  allowedMimeTypes: string[];
  hasExpiration: boolean;
  description: string;
}

/**
 * Mapa de documentos obrigatórios e suas configurações
 */
export const REQUIRED_DRIVER_DOCUMENTS: Record<string, DocumentRequirements> = {
  CNH: {
    type: 'CNH' as DocumentType,
    required: true,
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    hasExpiration: true,
    description: 'Carteira Nacional de Habilitação',
  },
  CPF: {
    type: 'CPF' as DocumentType,
    required: true,
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    hasExpiration: false,
    description: 'Cadastro de Pessoa Física',
  },
  RG: {
    type: 'RG' as DocumentType,
    required: true,
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    hasExpiration: false,
    description: 'Registro Geral (Identidade)',
  },
  COMPROVANTE_RESIDENCIA: {
    type: 'COMPROVANTE_RESIDENCIA' as DocumentType,
    required: true,
    maxSizeMB: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    hasExpiration: false,
    description: 'Comprovante de Residência (máx 3 meses)',
  },
  CERTIDAO_ANTECEDENTES: {
    type: 'CERTIDAO_ANTECEDENTES' as DocumentType,
    required: true,
    maxSizeMB: 5,
    allowedMimeTypes: ['application/pdf'],
    hasExpiration: true,
    description: 'Certidão de Antecedentes Criminais',
  },
};

/**
 * Interface para checklist de documentos do motorista
 */
export interface DriverDocumentChecklist {
  driverId: string;
  totalRequired: number;
  totalUploaded: number;
  totalActive: number;
  missingDocuments: DocumentType[];
  expiredDocuments: DocumentType[];
  pendingVerification: DocumentType[];
  completionPercentage: number;
  isComplete: boolean;
}
