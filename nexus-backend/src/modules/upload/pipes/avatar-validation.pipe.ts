import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class AvatarValidationPipe implements PipeTransform {
  private readonly maxSize = 2 * 1024 * 1024; // 2MB
  private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly minDimension = 100; // pixels
  private readonly maxDimension = 2048; // pixels

  async transform(
    file: Express.Multer.File,
    _metadata: ArgumentMetadata,
  ): Promise<Express.Multer.File> {
    if (!file) {
      throw new BadRequestException('No avatar file provided');
    }

    // Validar tamanho
    if (file.size > this.maxSize) {
      throw new BadRequestException(`Avatar too large. Maximum size: 2MB`);
    }

    // Validar tipo MIME
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid avatar format. Allowed formats: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    // Validar se é uma imagem quadrada (opcional - pode ser removido se não for necessário)
    try {
      const sharp = await import('sharp');
      const metadata = await sharp.default(file.buffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new BadRequestException('Invalid image dimensions');
      }

      // Verificar dimensões mínimas e máximas
      if (metadata.width < this.minDimension || metadata.height < this.minDimension) {
        throw new BadRequestException(
          `Avatar too small. Minimum dimensions: ${this.minDimension}x${this.minDimension}px`,
        );
      }

      if (metadata.width > this.maxDimension || metadata.height > this.maxDimension) {
        throw new BadRequestException(
          `Avatar too large. Maximum dimensions: ${this.maxDimension}x${this.maxDimension}px`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid image file');
    }

    return file;
  }
}
