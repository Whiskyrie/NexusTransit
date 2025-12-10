import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { StorageConfig } from "../config/storage.config";

@Injectable()
export class AvatarValidationPipe implements PipeTransform {
  constructor(private readonly configService: ConfigService) {}

  transform(file: Express.Multer.File, _metadata: ArgumentMetadata): Express.Multer.File {
    if (!file) {
      throw new BadRequestException("No avatar file provided");
    }

    const storageConfig = this.configService.get<StorageConfig>("storage");

    if (!storageConfig) {
      throw new BadRequestException("Storage configuration not found");
    }

    // Avatar tem limite de tamanho menor (2MB)
    const maxAvatarSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxAvatarSize) {
      throw new BadRequestException(`Avatar size too large. Maximum allowed: 2MB`);
    }

    // Validar tipo MIME
    const allowedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedAvatarTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid avatar file type. Allowed types: ${allowedAvatarTypes.join(", ")}`,
      );
    }

    // Validar extensão do arquivo
    const fileExtension = this.getFileExtension(file.originalname);
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid avatar extension. Allowed extensions: ${allowedExtensions.join(", ")}`,
      );
    }

    return file;
  }

  private getFileExtension(filename: string): string {
    const extension = /\.[^/.]+$/.exec(filename.toLowerCase());
    return extension ? extension[0] : "";
  }
}
