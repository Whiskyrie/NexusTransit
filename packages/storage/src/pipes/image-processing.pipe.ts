import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import sharp from "sharp";
import type { StorageConfig } from "../config/storage.config";

/**
 * Pipe para processamento e otimização de imagens
 *
 * Redimensiona, comprime e valida imagens antes do upload
 */
@Injectable()
export class ImageProcessingPipe implements PipeTransform {
  private readonly storageConfig: StorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.storageConfig = this.configService.getOrThrow<StorageConfig>("storage");
  }

  async transform(
    value: Express.Multer.File,
    _metadata: ArgumentMetadata,
  ): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException("No file provided");
    }

    // Validar se é imagem
    if (!value.mimetype.startsWith("image/")) {
      throw new BadRequestException("File must be an image");
    }

    try {
      // Processar imagem com sharp
      const image = sharp(value.buffer);
      const metadata = await image.metadata();

      // Validar dimensões mínimas (opcional)
      if (metadata.width && metadata.width < 10) {
        throw new BadRequestException("Image width too small");
      }

      if (metadata.height && metadata.height < 10) {
        throw new BadRequestException("Image height too small");
      }

      // Otimizar imagem
      let processedImage = image;

      if (metadata.format === "jpeg") {
        processedImage = image.jpeg({
          quality: this.storageConfig.upload.imageQuality,
        });
      } else if (metadata.format === "png") {
        processedImage = image.png({ compressionLevel: 9 });
      } else if (metadata.format === "webp") {
        processedImage = image.webp({
          quality: this.storageConfig.upload.imageQuality,
        });
      }

      // Atualizar buffer do arquivo
      value.buffer = await processedImage.toBuffer();

      return value;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Invalid image file");
    }
  }
}
