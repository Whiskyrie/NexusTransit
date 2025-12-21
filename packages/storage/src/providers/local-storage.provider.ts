import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { promises as fs } from "fs";
import { join } from "path";
import { StorageProvider } from "../interfaces/upload.interface";
import { FileUtil } from "../utils/file.util";
import type { StorageConfig } from "../config/storage.config";

/**
 * Provedor de armazenamento local
 * Implementa armazenamento em sistema de arquivos local
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly storageConfig: StorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.storageConfig = this.configService.getOrThrow<StorageConfig>("storage");
    this.logger.log("Local storage provider initialized");
  }

  /**
   * Upload de arquivo para sistema de arquivos local
   */
  async upload(buffer: Buffer, key: string, _contentType: string): Promise<string> {
    try {
      // Criar diretório se não existir
      const dirPath = join(
        this.storageConfig.provider.localPath || "./uploads",
        key.split("/").slice(0, -1).join("/"),
      );
      await fs.mkdir(dirPath, { recursive: true });

      // Caminho completo do arquivo
      const filePath = join(this.storageConfig.provider.localPath || "./uploads", key);

      // Escrever arquivo
      await fs.writeFile(filePath, buffer);

      // Gerar URL pública
      const publicUrl = FileUtil.generatePublicUrl(
        this.storageConfig.provider.publicUrl || "http://localhost:3000/uploads",
        key,
      );

      this.logger.log(`File uploaded to local storage: ${key}`);

      return publicUrl;
    } catch (error) {
      this.logger.error(
        `Failed to upload file to local storage: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Deletar arquivo do sistema de arquivos local
   */
  async delete(key: string): Promise<void> {
    try {
      const filePath = join(this.storageConfig.provider.localPath || "./uploads", key);

      // Verificar se arquivo existe
      try {
        await fs.access(filePath);
      } catch {
        this.logger.warn(`File not found for deletion: ${key}`);
        return;
      }

      // Deletar arquivo
      await fs.unlink(filePath);

      this.logger.log(`File deleted from local storage: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from local storage: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Verificar se arquivo existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      const filePath = join(this.storageConfig.provider.localPath || "./uploads", key);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obter caminho completo do arquivo
   */
  getFullPath(key: string): string {
    return join(this.storageConfig.provider.localPath || "./uploads", key);
  }
}
