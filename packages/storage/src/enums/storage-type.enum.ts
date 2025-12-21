/**
 * Tipos de storage suportados
 * Representa os diferentes provedores de armazenamento disponíveis
 */
export enum StorageType {
  /**
   * Armazenamento local no sistema de arquivos
   */
  LOCAL = "local",
  /**
   * Armazenamento em nuvem Amazon S3
   */
  S3 = "s3",
  /**
   * Armazenamento em nuvem Backblaze B2
   */
  BACKBLAZE = "backblaze",
}

/**
 * Utilitário para validar tipo de storage
 */
export function isValidStorageType(type: string): type is StorageType {
  return Object.values(StorageType).includes(type as StorageType);
}

/**
 * Utilitário para obter tipos de storage disponíveis
 */
export function getAvailableStorageTypes(): StorageType[] {
  return Object.values(StorageType);
}

/**
 * Utilitário para traduzir tipo de storage
 */
export function translateStorageType(type: StorageType): string {
  const translations: Record<StorageType, string> = {
    [StorageType.LOCAL]: "Local",
    [StorageType.S3]: "Amazon S3",
    [StorageType.BACKBLAZE]: "Backblaze B2",
  };
  return translations[type] || type;
}
