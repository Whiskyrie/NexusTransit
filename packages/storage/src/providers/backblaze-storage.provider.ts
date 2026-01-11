import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { StorageProvider } from "../interfaces/upload.interface";
import type { StorageConfig } from "../config/storage.config";

/**
 * Provedor de armazenamento Backblaze B2
 * Implementa armazenamento usando Backblaze B2 com S3-compatible API
 */
@Injectable()
export class BackblazeStorageProvider implements StorageProvider {
  private readonly logger = new Logger(BackblazeStorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly storageConfig: StorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.storageConfig = this.configService.getOrThrow<StorageConfig>("storage");

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

    this.logger.log("Backblaze B2 storage provider initialized");
  }

  /**
   * Upload de arquivo para Backblaze B2
   */
  async upload(buffer: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.storageConfig.backblaze.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          "uploaded-by": "nexus-transit",
          "upload-timestamp": new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Gerar URL pública do Backblaze
      // Formato: https://<bucket>.s3.<region>.backblazeb2.com/<key>
      const publicUrl = `https://${this.storageConfig.backblaze.bucket}.s3.${this.storageConfig.backblaze.region}.backblazeb2.com/${key}`;

      this.logger.log(`File uploaded to Backblaze B2: ${key}`);

      return publicUrl;
    } catch (error) {
      this.logger.error(
        `Failed to upload file to Backblaze B2: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Deletar arquivo do Backblaze B2
   */
  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.storageConfig.backblaze.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted from Backblaze B2: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Backblaze B2: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Verificar se arquivo existe no Backblaze B2
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.storageConfig.backblaze.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obter URL pública do arquivo
   */
  async getPublicUrl(key: string): Promise<string> {
    return `https://${this.storageConfig.backblaze.bucket}.s3.${this.storageConfig.backblaze.region}.backblazeb2.com/${key}`;
  }
}
