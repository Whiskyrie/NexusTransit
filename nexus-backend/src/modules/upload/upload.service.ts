import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type { StorageConfig } from '../../config/storage.config';

export interface UploadResult {
  originalUrl: string;
  thumbnails: {
    small: string;
    medium: string;
    large: string;
  };
  metadata: {
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
  };
}

export interface ThumbnailSize {
  width: number;
  height: number;
  suffix: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly storageConfig: StorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.storageConfig = this.configService.getOrThrow<StorageConfig>('storage');

    // Configuração do cliente S3 para Backblaze B2
    this.s3Client = new S3Client({
      endpoint: this.storageConfig.backblaze.endpoint,
      region: this.storageConfig.backblaze.region,
      credentials: {
        accessKeyId: this.storageConfig.backblaze.accessKeyId,
        secretAccessKey: this.storageConfig.backblaze.secretAccessKey,
      },
      forcePathStyle: true, // Necessário para compatibilidade com Backblaze B2
    });

    this.logger.log('Upload service initialized with Backblaze B2 configuration');
  }

  /**
   * Upload de imagem com geração automática de thumbnails
   */
  async uploadImage(
    file: Express.Multer.File,
    folder = 'images',
    userId?: string,
  ): Promise<UploadResult> {
    try {
      // Validar o arquivo
      this.validateFile(file);

      // Gerar nome único para o arquivo
      const fileExtension = this.getFileExtension(file.originalname);
      const baseFileName = `${folder}/${uuidv4()}`;

      // Processar a imagem original
      const processedImage = await this.processImage(file.buffer);
      const originalFileName = `${baseFileName}${fileExtension}`;

      // Upload da imagem original
      const originalUrl = await this.uploadToB2(
        processedImage.buffer,
        originalFileName,
        file.mimetype,
      );

      // Gerar e fazer upload dos thumbnails
      const thumbnails = await this.generateAndUploadThumbnails(
        file.buffer,
        baseFileName,
        fileExtension,
      );

      // Log da operação
      this.logger.log(`Image uploaded successfully: ${originalFileName}`, {
        originalName: file.originalname,
        size: file.size,
        userId,
      });

      return {
        originalUrl,
        thumbnails,
        metadata: {
          filename: originalFileName,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          width: processedImage.metadata.width,
          height: processedImage.metadata.height,
        },
      };
    } catch (error) {
      this.logger.error('Failed to upload image', error instanceof Error ? error.stack : undefined);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  /**
   * Upload múltiplo de imagens
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder = 'images',
    userId?: string,
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, folder, userId));

    return Promise.all(uploadPromises);
  }

  /**
   * Deletar imagem e seus thumbnails
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(imageUrl);

      // Deletar imagem original
      await this.deleteFromB2(key);

      // Deletar thumbnails
      const baseKey = key.replace(/\.[^/.]+$/, ''); // Remove extensão
      const thumbnailKeys = [
        `${baseKey}_small.webp`,
        `${baseKey}_medium.webp`,
        `${baseKey}_large.webp`,
      ];

      await Promise.allSettled(thumbnailKeys.map(thumbnailKey => this.deleteFromB2(thumbnailKey)));

      this.logger.log(`Image and thumbnails deleted: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete image: ${imageUrl}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to delete image');
    }
  }

  /**
   * Validar arquivo de imagem
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.storageConfig.upload.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum allowed: ${this.storageConfig.upload.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    if (!this.storageConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.storageConfig.upload.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  /**
   * Processar imagem (otimização e compressão)
   */
  private async processImage(
    buffer: Buffer,
  ): Promise<{ buffer: Buffer; metadata: sharp.Metadata }> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Otimizar baseado no formato
    let processedImage = image;

    if (metadata.format === 'jpeg') {
      processedImage = image.jpeg({ quality: this.storageConfig.upload.imageQuality });
    } else if (metadata.format === 'png') {
      processedImage = image.png({ compressionLevel: 9 });
    } else if (metadata.format === 'webp') {
      processedImage = image.webp({ quality: this.storageConfig.upload.imageQuality });
    }

    const processedBuffer = await processedImage.toBuffer();

    return { buffer: processedBuffer, metadata };
  }

  /**
   * Gerar e fazer upload dos thumbnails
   */
  private async generateAndUploadThumbnails(
    originalBuffer: Buffer,
    baseFileName: string,
    _originalExtension: string,
  ): Promise<{ small: string; medium: string; large: string }> {
    const sizes = this.storageConfig.upload.thumbnailSizes;

    const thumbnailPromises = Object.entries(sizes).map(async ([size, dimensions]) => {
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 80 }) // Usar WebP para thumbnails (melhor compressão)
        .toBuffer();

      const thumbnailFileName = `${baseFileName}_${size}.webp`;
      const url = await this.uploadToB2(thumbnailBuffer, thumbnailFileName, 'image/webp');

      return [size, url];
    });

    const results = await Promise.all(thumbnailPromises);

    return Object.fromEntries(results) as { small: string; medium: string; large: string };
  }

  /**
   * Upload para Backblaze B2
   */
  private async uploadToB2(buffer: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.storageConfig.backblaze.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          // Metadados para otimização
          Metadata: {
            'uploaded-by': 'nexus-transit',
            'upload-timestamp': new Date().toISOString(),
          },
        },
        // Configurações para otimização de performance
        queueSize: 4,
        partSize: 1024 * 1024 * 5, // 5MB por part
        leavePartsOnError: false,
      });

      await upload.done();

      // Construir URL pública
      const baseUrl = this.storageConfig.backblaze.endpoint.replace('s3.', '');
      return `${baseUrl}/${this.storageConfig.backblaze.bucket}/${key}`;
    } catch (error) {
      this.logger.error(
        `Failed to upload to B2: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Deletar arquivo do Backblaze B2
   */
  private async deleteFromB2(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.storageConfig.backblaze.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Extrair chave do arquivo da URL
   */
  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');

      // Remove bucket name from path and get the key
      const bucketIndex = pathParts.indexOf(this.storageConfig.backblaze.bucket);
      if (bucketIndex !== -1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }

      // Fallback: assume the path is the key
      return pathParts.slice(1).join('/');
    } catch {
      throw new BadRequestException('Invalid image URL format');
    }
  }

  /**
   * Obter extensão do arquivo
   */
  private getFileExtension(filename: string): string {
    const extension = /\.[^/.]+$/.exec(filename.toLowerCase());
    return extension ? extension[0] : '.jpg';
  }
}
