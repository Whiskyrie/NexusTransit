/**
 * Interface para provedores de armazenamento
 * Define os métodos que um provedor de storage deve implementar
 */
export interface StorageProvider {
  /**
   * Faz upload de um arquivo
   * @param buffer Buffer do arquivo
   * @param key Chave/identificador do arquivo
   * @param contentType Tipo de conteúdo (MIME type)
   * @returns URL pública do arquivo
   */
  upload(buffer: Buffer, key: string, contentType: string): Promise<string>;

  /**
   * Deleta um arquivo
   * @param key Chave/identificador do arquivo
   */
  delete(key: string): Promise<void>;

  /**
   * Verifica se um arquivo existe
   * @param key Chave/identificador do arquivo
   * @returns true se o arquivo existir
   */
  exists(key: string): Promise<boolean>;
}

/**
 * Interface para opções de upload
 */
export interface UploadOptions {
  /**
   * Tipo de arquivo (documents, images, proofs, temp)
   */
  fileType?: "documents" | "images" | "proofs" | "temp";

  /**
   * Qualidade da imagem (0-100)
   */
  quality?: number;

  /**
   * Gerar thumbnails (apenas para imagens)
   */
  generateThumbnails?: boolean;

  /**
   * Tamanhos de thumbnail personalizados
   */
  thumbnailSizes?: {
    small?: { width: number; height: number };
    medium?: { width: number; height: number };
    large?: { width: number; height: number };
  };

  /**
   * Metadados adicionais
   */
  metadata?: Record<string, string>;
}

/**
 * Interface para metadados de arquivo
 */
export interface FileMetadata {
  /**
   * Nome original do arquivo
   */
  originalName: string;

  /**
   * Nome do arquivo no storage
   */
  filename: string;

  /**
   * Tamanho do arquivo em bytes
   */
  size: number;

  /**
   * Tipo MIME do arquivo
   */
  mimeType: string;

  /**
   * Largura da imagem (se aplicável)
   */
  width?: number;

  /**
   * Altura da imagem (se aplicável)
   */
  height?: number;

  /**
   * Data de upload
   */
  uploadedAt: Date;

  /**
   * Tipo de storage
   */
  storageType: string;
}

/**
 * Interface para resultado de upload
 */
export interface FileUploadResult {
  /**
   * URL pública do arquivo
   */
  url: string;

  /**
   * Chave do arquivo no storage
   */
  key: string;

  /**
   * Hash único do arquivo
   */
  fileHash: string;

  /**
   * Metadados do arquivo
   */
  metadata: FileMetadata;

  /**
   * Thumbnails (apenas para imagens)
   */
  thumbnails?: {
    small: string;
    medium: string;
    large: string;
  };
}

/**
 * Interface para lista de arquivos
 */
export interface FileList {
  /**
   * Lista de arquivos
   */
  files: FileUploadResult[];

  /**
   * Total de arquivos
   */
  total: number;

  /**
   * Página atual
   */
  page: number;

  /**
   * Itens por página
   */
  limit: number;
}

/**
 * Interface para filtros de arquivo
 */
export interface FileFilter {
  /**
   * Tipo de arquivo
   */
  fileType?: string;

  /**
   * Data de upload inicial
   */
  startDate?: Date;

  /**
   * Data de upload final
   */
  endDate?: Date;

  /**
   * Termo de busca
   */
  search?: string;

  /**
   * Página
   */
  page?: number;

  /**
   * Itens por página
   */
  limit?: number;
}
