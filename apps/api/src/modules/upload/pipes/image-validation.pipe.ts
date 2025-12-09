import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageConfig } from '../../../config/storage.config';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(file: Express.Multer.File, _metadata: ArgumentMetadata): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const storageConfig = this.configService.get<StorageConfig>('storage');

    if (!storageConfig) {
      throw new BadRequestException('Storage configuration not found');
    }

    // Validar tamanho do arquivo
    if (file.size > storageConfig.upload.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum allowed: ${storageConfig.upload.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Validar tipo MIME
    if (!storageConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${storageConfig.upload.allowedMimeTypes.join(', ')}`,
      );
    }

    // Validar extensão do arquivo
    const fileExtension = this.getFileExtension(file.originalname);
    if (!storageConfig.upload.allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed extensions: ${storageConfig.upload.allowedExtensions.join(', ')}`,
      );
    }

    // Validar nome do arquivo (sem caracteres especiais)
    if (!/^[a-zA-Z0-9._-]+$/.test(file.originalname)) {
      throw new BadRequestException(
        'Invalid filename. Only alphanumeric characters, dots, underscores and hyphens are allowed',
      );
    }

    return file;
  }

  private getFileExtension(filename: string): string {
    const extension = /\.[^/.]+$/.exec(filename.toLowerCase());
    return extension ? extension[0] : '';
  }
}
