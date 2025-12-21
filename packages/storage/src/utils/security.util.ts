import { BadRequestException } from "@nestjs/common";

/**
 * Utilitários de segurança para storage
 */
export class SecurityUtil {
  /**
   * Prevenir path traversal em nomes de arquivo
   */
  static preventPathTraversal(filename: string): void {
    if (/\.\.\/|\.\.\\/.test(filename) || filename.includes("\0")) {
      throw new BadRequestException("Invalid file name: path traversal detected");
    }

    if (filename.startsWith("/") || filename.startsWith("\\")) {
      throw new BadRequestException("Invalid file name: absolute path detected");
    }
  }

  /**
   * Validar se nome de arquivo é seguro
   */
  static isSafeFilename(filename: string): boolean {
    // Permitir apenas caracteres alfanuméricos, hífens, underscores e pontos
    const safePattern = /^[a-zA-Z0-9\-_.]+$/;
    return safePattern.test(filename);
  }

  /**
   * Sanitizar nome de arquivo
   */
  static sanitizeFilename(filename: string): string {
    // Remover caracteres perigosos
    let sanitized = filename
      .replace(/[^a-zA-Z0-9.\-_]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^[._]+/, "")
      .replace(/[._]+$/, "");

    // Limitar tamanho do nome
    const maxLength = 255;
    if (sanitized.length > maxLength) {
      const ext = /\.[^/.]+$/.exec(sanitized);
      const extension = ext ? ext[0] : "";
      const nameWithoutExt = sanitized.substring(0, sanitized.length - extension.length);
      sanitized = nameWithoutExt.substring(0, maxLength - extension.length) + extension;
    }

    return sanitized || "unnamed";
  }

  /**
   * Validar extensão de arquivo contra MIME type
   */
  static validateExtensionMatchesMimeType(filename: string, mimeType: string): boolean {
    const extension = /\.[^/.]+$/.exec(filename.toLowerCase());
    if (!extension) return false;

    const ext = extension[0];
    const mimeMap: Record<string, string[]> = {
      ".jpg": ["image/jpeg"],
      ".jpeg": ["image/jpeg"],
      ".png": ["image/png"],
      ".webp": ["image/webp"],
      ".gif": ["image/gif"],
      ".svg": ["image/svg+xml"],
      ".pdf": ["application/pdf"],
      ".doc": ["application/msword"],
      ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      ".mp4": ["video/mp4"],
      ".mov": ["video/quicktime"],
    };

    const allowedMimeTypes = mimeMap[ext];
    if (!allowedMimeTypes) return false;

    return allowedMimeTypes.includes(mimeType);
  }

  /**
   * Gerar nome de arquivo seguro e único
   */
  static generateSafeFilename(originalName: string, uuid: string): string {
    const extension = /\.[^/.]+$/.exec(originalName.toLowerCase());
    const ext = extension ? extension[0] : "";
    return `${uuid}${ext}`;
  }

  /**
   * Validar tamanho de arquivo
   */
  static validateFileSize(size: number, maxSize: number): void {
    if (size > maxSize) {
      throw new BadRequestException(
        `File size too large. Maximum allowed: ${maxSize / (1024 * 1024)}MB`,
      );
    }

    if (size === 0) {
      throw new BadRequestException("File is empty");
    }
  }

  /**
   * Validar tipo MIME
   */
  static validateMimeType(mimeType: string, allowedTypes: string[]): void {
    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`);
    }
  }

  /**
   * Remover metadados EXIF de imagens (para privacidade)
   */
  static shouldRemoveExifData(mimeType: string): boolean {
    return mimeType.startsWith("image/") && mimeType !== "image/svg+xml";
  }
}
