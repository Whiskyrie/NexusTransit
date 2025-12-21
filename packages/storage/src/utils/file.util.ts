import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { StorageConfig } from "../config/storage.config";
import { SecurityUtil } from "./security.util";

/**
 * Utilitários para manipulação de arquivos
 */
export class FileUtil {
  /**
   * Sanitizar nome de arquivo
   * Remove caracteres especiais e espaços
   */
  static sanitizeFileName(filename: string): string {
    return SecurityUtil.sanitizeFilename(filename);
  }

  /**
   * Gerar nome único para arquivo
   * Formato: {uuid}{extensao}
   */
  static generateUniqueFileName(originalName: string): string {
    const uuid = uuidv4();
    return SecurityUtil.generateSafeFilename(originalName, uuid);
  }

  /**
   * Gerar caminho completo para arquivo
   * Formato: {basePath}/{tipo}/{ano}/{mes}/{dia}/{nome}
   */
  static generateFilePath(
    basePath: string,
    fileType: "documents" | "images" | "proofs" | "temp",
    fileName: string,
  ): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${basePath}/${fileType}/${year}/${month}/${day}/${fileName}`;
  }

  /**
   * Obter extensão do arquivo
   */
  static getFileExtension(filename: string): string {
    return extname(filename).toLowerCase();
  }

  /**
   * Obter MIME type a partir da extensão
   */
  static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
    };

    return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
  }

  /**
   * Validar se arquivo é imagem
   */
  static isImageFile(mimeType: string): boolean {
    return mimeType.startsWith("image/");
  }

  /**
   * Validar se arquivo é documento
   */
  static isDocumentFile(mimeType: string): boolean {
    const documentTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return documentTypes.includes(mimeType);
  }

  /**
   * Validar se arquivo é vídeo
   */
  static isVideoFile(mimeType: string): boolean {
    return mimeType.startsWith("video/");
  }

  /**
   * Obter configuração de storage
   */
  static getStorageConfig(storageConfig: StorageConfig): StorageConfig {
    return storageConfig;
  }

  /**
   * Gerar URL pública para arquivo
   */
  static generatePublicUrl(baseUrl: string, filePath: string): string {
    return `${baseUrl}/${filePath}`;
  }

  /**
   * Extrair chave do arquivo da URL
   */
  static extractKeyFromUrl(url: string, baseUrl: string): string {
    return url.replace(baseUrl, "").replace(/^\//, "");
  }
}
