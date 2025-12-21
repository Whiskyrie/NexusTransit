import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { StorageConfig } from "../config/storage.config";

/**
 * Pipe para validação de arquivos de upload
 *
 * Valida tamanho, tipo MIME e extensão de arquivo
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly storageConfig: StorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.storageConfig = this.configService.getOrThrow<StorageConfig>("storage");
  }

  transform(value: Express.Multer.File, _metadata: ArgumentMetadata): Express.Multer.File {
    if (!value) {
      throw new BadRequestException("No file provided");
    }

    // Validar tamanho
    if (value.size > this.storageConfig.upload.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum allowed: ${this.storageConfig.upload.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Validar MIME type
    if (!this.storageConfig.upload.allowedMimeTypes.includes(value.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.storageConfig.upload.allowedMimeTypes.join(", ")}`,
      );
    }

    // Validar extensão
    const extension = this.getFileExtension(value.originalname);
    if (!this.storageConfig.upload.allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed extensions: ${this.storageConfig.upload.allowedExtensions.join(", ")}`,
      );
    }

    // Prevenir path traversal
    if (this.containsPathTraversal(value.originalname)) {
      throw new BadRequestException("Invalid file name: path traversal detected");
    }

    return value;
  }

  private getFileExtension(filename: string): string {
    const extension = /\.[^/.]+$/.exec(filename.toLowerCase());
    return extension ? extension[0] : "";
  }

  private containsPathTraversal(filename: string): boolean {
    return /\.\.\/|\.\.\\/.test(filename) || filename.includes("\0");
  }
}
