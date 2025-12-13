/**
 * Enum para tipos de comprovante de entrega
 * Define os diferentes tipos de evidências que podem comprovar uma entrega
 */
export enum ProofType {
  /** Assinatura digital do recebedor */
  SIGNATURE = 'SIGNATURE',

  /** Foto do produto entregue */
  PHOTO = 'PHOTO',

  /** Foto do local da entrega */
  LOCATION_PHOTO = 'LOCATION_PHOTO',

  /** Documento de identificação do recebedor */
  ID_DOCUMENT = 'ID_DOCUMENT',

  /** Comprovante de residência */
  RESIDENCE_PROOF = 'RESIDENCE_PROOF',

  /** Autorização por escrito */
  WRITTEN_AUTHORIZATION = 'WRITTEN_AUTHORIZATION',

  /** Código de confirmação SMS */
  SMS_CODE = 'SMS_CODE',

  /** Código de confirmação email */
  EMAIL_CODE = 'EMAIL_CODE',

  /** Biometria (digital, facial) */
  BIOMETRIC = 'BIOMETRIC',

  /** Áudio de confirmação */
  AUDIO_CONFIRMATION = 'AUDIO_CONFIRMATION',

  /** GPS coordinates no momento da entrega */
  GPS_COORDINATES = 'GPS_COORDINATES',

  /** Outros tipos de comprovante */
  OTHER = 'OTHER',
}

/**
 * Descrições detalhadas dos tipos para exibição em UI
 */
export const ProofTypeDescriptions: Record<ProofType, string> = {
  [ProofType.SIGNATURE]: 'Assinatura digital',
  [ProofType.PHOTO]: 'Foto do produto',
  [ProofType.LOCATION_PHOTO]: 'Foto do local',
  [ProofType.ID_DOCUMENT]: 'Documento de identificação',
  [ProofType.RESIDENCE_PROOF]: 'Comprovante de residência',
  [ProofType.WRITTEN_AUTHORIZATION]: 'Autorização por escrito',
  [ProofType.SMS_CODE]: 'Código SMS',
  [ProofType.EMAIL_CODE]: 'Código email',
  [ProofType.BIOMETRIC]: 'Biometria',
  [ProofType.AUDIO_CONFIRMATION]: 'Confirmação por áudio',
  [ProofType.GPS_COORDINATES]: 'Coordenadas GPS',
  [ProofType.OTHER]: 'Outro tipo',
};

/**
 * Categorias de comprovantes para agrupamento
 */
export enum ProofCategory {
  /** Comprovantes visuais (fotos, vídeos) */
  VISUAL = 'VISUAL',

  /** Comprovantes documentais (assinaturas, documentos) */
  DOCUMENTARY = 'DOCUMENTARY',

  /** Comprovantes digitais (códigos, biometria) */
  DIGITAL = 'DIGITAL',

  /** Comprovantes de localização */
  LOCATION = 'LOCATION',

  /** Outros tipos */
  OTHER = 'OTHER',
}

/**
 * Mapeamento de tipos para categorias
 */
export const ProofTypeCategories: Record<ProofType, ProofCategory> = {
  [ProofType.SIGNATURE]: ProofCategory.DOCUMENTARY,
  [ProofType.PHOTO]: ProofCategory.VISUAL,
  [ProofType.LOCATION_PHOTO]: ProofCategory.VISUAL,
  [ProofType.ID_DOCUMENT]: ProofCategory.DOCUMENTARY,
  [ProofType.RESIDENCE_PROOF]: ProofCategory.DOCUMENTARY,
  [ProofType.WRITTEN_AUTHORIZATION]: ProofCategory.DOCUMENTARY,
  [ProofType.SMS_CODE]: ProofCategory.DIGITAL,
  [ProofType.EMAIL_CODE]: ProofCategory.DIGITAL,
  [ProofType.BIOMETRIC]: ProofCategory.DIGITAL,
  [ProofType.AUDIO_CONFIRMATION]: ProofCategory.DIGITAL,
  [ProofType.GPS_COORDINATES]: ProofCategory.LOCATION,
  [ProofType.OTHER]: ProofCategory.OTHER,
};

/**
 * Tipos de arquivo aceitos para cada tipo de comprovante
 */
export const ProofTypeAcceptedFormats: Record<ProofType, string[]> = {
  [ProofType.SIGNATURE]: ['image/png', 'image/jpeg', 'image/svg+xml'],
  [ProofType.PHOTO]: ['image/jpeg', 'image/png', 'image/webp'],
  [ProofType.LOCATION_PHOTO]: ['image/jpeg', 'image/png', 'image/webp'],
  [ProofType.ID_DOCUMENT]: ['image/jpeg', 'image/png', 'application/pdf'],
  [ProofType.RESIDENCE_PROOF]: ['image/jpeg', 'image/png', 'application/pdf'],
  [ProofType.WRITTEN_AUTHORIZATION]: ['image/jpeg', 'image/png', 'application/pdf'],
  [ProofType.SMS_CODE]: [], // Não requer arquivo
  [ProofType.EMAIL_CODE]: [], // Não requer arquivo
  [ProofType.BIOMETRIC]: [], // Dados biométricos
  [ProofType.AUDIO_CONFIRMATION]: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  [ProofType.GPS_COORDINATES]: [], // Dados de GPS
  [ProofType.OTHER]: ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'],
};

/**
 * Tamanho máximo de arquivo (em bytes) para cada tipo
 */
export const ProofTypeMaxFileSize: Record<ProofType, number> = {
  [ProofType.SIGNATURE]: 1024 * 1024, // 1MB
  [ProofType.PHOTO]: 5 * 1024 * 1024, // 5MB
  [ProofType.LOCATION_PHOTO]: 5 * 1024 * 1024, // 5MB
  [ProofType.ID_DOCUMENT]: 3 * 1024 * 1024, // 3MB
  [ProofType.RESIDENCE_PROOF]: 3 * 1024 * 1024, // 3MB
  [ProofType.WRITTEN_AUTHORIZATION]: 3 * 1024 * 1024, // 3MB
  [ProofType.SMS_CODE]: 0, // Não se aplica
  [ProofType.EMAIL_CODE]: 0, // Não se aplica
  [ProofType.BIOMETRIC]: 0, // Não se aplica
  [ProofType.AUDIO_CONFIRMATION]: 2 * 1024 * 1024, // 2MB
  [ProofType.GPS_COORDINATES]: 0, // Não se aplica
  [ProofType.OTHER]: 10 * 1024 * 1024, // 10MB
};

/**
 * Comprovantes obrigatórios para diferentes tipos de entrega
 */
export const RequiredProofTypes: Record<string, ProofType[]> = {
  standard: [ProofType.SIGNATURE],
  high_value: [ProofType.SIGNATURE, ProofType.ID_DOCUMENT, ProofType.PHOTO],
  legal_document: [ProofType.SIGNATURE, ProofType.ID_DOCUMENT, ProofType.RESIDENCE_PROOF],
  scheduled: [ProofType.SIGNATURE, ProofType.LOCATION_PHOTO],
};
