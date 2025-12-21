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
 * Provedor de armazenamento S3
 * Implementa armazenamento em Amazon S3
 */
@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly storageConfig: StorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.storageConfig = this.configService.getOrThrow<StorageConfig>("storage");

    // Configuração do cliente S3
    this.s3Client = new S3Client({
      region: this.storageConfig.s3?.region || "us-east-1",
      credentials: {
        accessKeyId: this.storageConfig.s3?.accessKeyId || "",
        secretAccessKey: this.storageConfig.s3?.secretAccessKey || "",
      },
    });

    this.logger.log("S3 storage provider initialized");
  }

  /**
   * Upload de arquivo para S3
   */
  async upload(buffer: Buffer, key: string, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.storageConfig.s3?.bucket || "",
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          "uploaded-by": "nexus-transit",
          "upload-timestamp": new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Gerar URL pública
      const publicUrl = `https://${this.storageConfig.s3?.bucket}.s3.${this.storageConfig.s3?.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded to S3: ${key}`);

      return publicUrl;
    } catch (error) {
      this.logger.error(
        `Failed to upload file to S3: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Deletar arquivo do S3
   */
  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.storageConfig.s3?.bucket || "",
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from S3: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Verificar se arquivo existe no S3
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.storageConfig.s3?.bucket || "",
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gerar URL assinada para arquivo
   */
  async generateSignedUrl(key: string, _expiresIn: number = 3600): Promise<string> {
    // Implementação de URL assinada seria aqui
    // Por enquanto, retorna URL pública
    return `https://${this.storageConfig.s3?.bucket}.s3.${this.storageConfig.s3?.region}.amazonaws.com/${key}`;
  }
}
