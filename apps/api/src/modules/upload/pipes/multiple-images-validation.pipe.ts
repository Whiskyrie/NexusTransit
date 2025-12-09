import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageConfig } from '../../../config/storage.config';

@Injectable()
export class MultipleImagesValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(files: Express.Multer.File[], _metadata: ArgumentMetadata): Express.Multer.File[] {
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const storageConfig = this.configService.get<StorageConfig>('storage');

    if (!storageConfig) {
      throw new BadRequestException('Storage configuration not found');
    }

    // Limitar número de arquivos
    const maxFiles = 10;
    if (files.length > maxFiles) {
      throw new BadRequestException(`Too many files. Maximum allowed: ${maxFiles}`);
    }

    // Validar cada arquivo
    files.forEach((file, index) => {
      // Validar tamanho
      if (file.size > storageConfig.upload.maxFileSize) {
        throw new BadRequestException(
          `File ${index + 1} is too large. Maximum allowed: ${storageConfig.upload.maxFileSize / (1024 * 1024)}MB`,
        );
      }

      // Validar tipo MIME
      if (!storageConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File ${index + 1} has invalid type. Allowed types: ${storageConfig.upload.allowedMimeTypes.join(', ')}`,
        );
      }

      // Validar extensão
      const fileExtension = this.getFileExtension(file.originalname);
      if (!storageConfig.upload.allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `File ${index + 1} has invalid extension. Allowed extensions: ${storageConfig.upload.allowedExtensions.join(', ')}`,
        );
      }

      // Validar nome do arquivo
      if (!/^[a-zA-Z0-9._-]+$/.test(file.originalname)) {
        throw new BadRequestException(
          `File ${index + 1} has invalid filename. Only alphanumeric characters, dots, underscores and hyphens are allowed`,
        );
      }
    });

    // Validar tamanho total
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 50 * 1024 * 1024; // 50MB total

    if (totalSize > maxTotalSize) {
      throw new BadRequestException(
        `Total file size too large. Maximum allowed: ${maxTotalSize / (1024 * 1024)}MB`,
      );
    }

    return files;
  }

  private getFileExtension(filename: string): string {
    const extension = /\.[^/.]+$/.exec(filename.toLowerCase());
    return extension ? extension[0] : '';
  }
}
