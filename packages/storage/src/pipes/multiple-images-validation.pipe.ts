import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { StorageConfig } from "../config/storage.config";

@Injectable()
export class MultipleImagesValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(
    files: Express.Multer.File[],
    _metadata: ArgumentMetadata
  ): Express.Multer.File[] {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }

    const storageConfig = this.configService.get<StorageConfig>("storage");

    if (!storageConfig) {
      throw new BadRequestException("Storage configuration not found");
    }

    // Validar cada arquivo
    files.forEach((file, index) => {
      // Validar tamanho do arquivo
      if (file.size > storageConfig.upload.maxFileSize) {
        throw new BadRequestException(
          `File ${index + 1} size too large. Maximum allowed: ${storageConfig.upload.maxFileSize / (1024 * 1024)}MB`
        );
      }

      // Validar tipo MIME
      if (!storageConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File ${index + 1} has invalid type. Allowed types: ${storageConfig.upload.allowedMimeTypes.join(", ")}`
        );
      }

      // Validar extensão do arquivo
      const fileExtension = this.getFileExtension(file.originalname);
      if (!storageConfig.upload.allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `File ${index + 1} has invalid extension. Allowed extensions: ${storageConfig.upload.allowedExtensions.join(", ")}`
        );
      }
    });

    return files;
  }

  private getFileExtension(filename: string): string {
    const extension = /\.[^/.]+$/.exec(filename.toLowerCase());
    return extension ? extension[0] : "";
  }
}
