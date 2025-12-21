import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import type { StorageConfig } from "../config/storage.config";
import type {
  UploadResult,
  FileUploadResult,
  FileMetadata,
  FileList,
  FileFilter,
} from "../interfaces/upload.interface";
import { LocalStorageProvider } from "../providers/local-storage.provider";
import { S3StorageProvider } from "../providers/s3-storage.provider";
import { FileUtil } from "../utils/file.util";
import { StorageType } from "../enums/storage-type.enum";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly storageConfig: StorageConfig;
  private storageProvider: LocalStorageProvider | S3StorageProvider;

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

    // Inicializar provedor de storage com base na configuração
    this.initializeStorageProvider();

    this.logger.log("Storage service initialized with Backblaze B2 configuration");
  }

  /**
   * Inicializar provedor de storage com base na configuração
   */
  private initializeStorageProvider(): void {
    const storageType = this.storageConfig.provider.type;

    if (storageType === StorageType.LOCAL) {
      this.storageProvider = new LocalStorageProvider(this.configService);
      this.logger.log("Using local storage provider");
    } else if (storageType === StorageType.S3) {
      this.storageProvider = new S3StorageProvider(this.configService);
      this.logger.log("Using S3 storage provider");
    } else {
      this.storageProvider = new LocalStorageProvider(this.configService);
      this.logger.log("Defaulting to local storage provider");
    }
  }

  /**
   * Upload de imagem com geração automática de thumbnails
   */
  async uploadImage(
    file: Express.Multer.File,
    folder = "images",
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
      this.logger.error("Failed to upload image", error instanceof Error ? error.stack : undefined);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException("Failed to upload image");
    }
  }

  /**
   * Upload múltiplo de imagens
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder = "images",
    userId?: string,
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder, userId));

    return Promise.all(uploadPromises);
  }

  /**
   * Upload de arquivo genérico (documentos PDF, etc.)
   */
  async uploadFile(
    file: Express.Multer.File,
    options: { fileType?: "documents" | "images" | "proofs" | "temp" } = {},
    userId?: string,
  ): Promise<FileUploadResult> {
    try {
      // Validar o arquivo
      if (!file) {
        throw new BadRequestException("No file provided");
      }

      if (file.size > this.storageConfig.upload.maxFileSize) {
        throw new BadRequestException(
          `File size too large. Maximum allowed: ${this.storageConfig.upload.maxFileSize / (1024 * 1024)}MB`,
        );
      }

      // Determinar tipo de arquivo
      const fileType = options.fileType || "documents";

      // Gerar nome único para o arquivo
      const fileName = FileUtil.generateUniqueFileName(file.originalname);
      const fileKey = FileUtil.generateFilePath("", fileType, fileName);
      const fileHash = uuidv4();

      // Upload do arquivo
      const url = await this.storageProvider.upload(file.buffer, fileKey, file.mimetype);

      // Criar metadados
      const metadata: FileMetadata = {
        originalName: file.originalname,
        filename: fileName,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        storageType: this.storageConfig.provider.type,
      };

      // Log da operação
      this.logger.log(`File uploaded successfully: ${fileKey}`, {
        originalName: file.originalname,
        size: file.size,
        userId,
      });

      return {
        filePath: fileKey,
        fileHash,
        url,
        metadata,
      };
    } catch (error) {
      this.logger.error("Failed to upload file", error instanceof Error ? error.stack : undefined);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException("Failed to upload file");
    }
  }

  /**
   * Upload múltiplo de arquivos
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: { fileType?: "documents" | "images" | "proofs" | "temp" } = {},
    userId?: string,
  ): Promise<FileUploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options, userId));

    return Promise.all(uploadPromises);
  }

  /**
   * Deletar arquivo
   */
  async deleteFile(fileKey: string): Promise<void> {
    try {
      await this.storageProvider.delete(fileKey);
      this.logger.log(`File deleted: ${fileKey}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file: ${fileKey}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException("Failed to delete file");
    }
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
      const baseKey = key.replace(/\.[^/.]+$/, ""); // Remove extensão
      const thumbnailKeys = [
        `${baseKey}_small.webp`,
        `${baseKey}_medium.webp`,
        `${baseKey}_large.webp`,
      ];

      await Promise.allSettled(
        thumbnailKeys.map((thumbnailKey) => this.deleteFromB2(thumbnailKey)),
      );

      this.logger.log(`Image and thumbnails deleted: ${key}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete image: ${imageUrl}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException("Failed to delete image");
    }
  }

  /**
   * Validar arquivo de imagem
   */
  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    if (file.size > this.storageConfig.upload.maxFileSize) {
      throw new BadRequestException(
        `File size too large. Maximum allowed: ${this.storageConfig.upload.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    if (!this.storageConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.storageConfig.upload.allowedMimeTypes.join(", ")}`,
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
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 80 }) // Usar WebP para thumbnails (melhor compressão)
        .toBuffer();

      const thumbnailFileName = `${baseFileName}_${size}.webp`;
      const url = await this.storageProvider.upload(
        thumbnailBuffer,
        thumbnailFileName,
        "image/webp",
      );

      return [size, url];
    });

    const results = await Promise.all(thumbnailPromises);

    return Object.fromEntries(results) as {
      small: string;
      medium: string;
      large: string;
    };
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
            "uploaded-by": "nexus-transit",
            "upload-timestamp": new Date().toISOString(),
          },
        },
        // Configurações para otimização de performance
        queueSize: 4,
        partSize: 1024 * 1024 * 5, // 5MB por part
        leavePartsOnError: false,
      });

      await upload.done();

      // Construir URL pública
      const baseUrl = this.storageConfig.backblaze.endpoint.replace("s3.", "");
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
      const pathParts = urlObj.pathname.split("/");

      // Remove bucket name from path and get the key
      const bucketIndex = pathParts.indexOf(this.storageConfig.backblaze.bucket);
      if (bucketIndex !== -1) {
        return pathParts.slice(bucketIndex + 1).join("/");
      }

      // Fallback: assume the path is the key
      return pathParts.slice(1).join("/");
    } catch {
      throw new BadRequestException("Invalid image URL format");
    }
  }

  /**
   * Obter metadados de arquivo
   */
  async getFileMetadata(fileKey: string): Promise<FileMetadata> {
    // Implementação básica - em produção, poderia buscar do banco de dados
    const exists = await this.storageProvider.exists(fileKey);

    if (!exists) {
      throw new BadRequestException("File not found");
    }

    return {
      filename: fileKey.split("/").pop() || fileKey,
      originalName: fileKey.split("/").pop() || fileKey,
      size: 0, // Tamanho desconhecido sem banco de dados
      mimeType: FileUtil.getMimeTypeFromExtension(FileUtil.getFileExtension(fileKey)),
    };
  }

  /**
   * Listar arquivos
   */
  async listFiles(
    _filter: FileFilter = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<FileList> {
    // Implementação básica - em produção, usaria banco de dados
    // Este é um exemplo simplificado

    const files: FileMetadata[] = [];
    const total = 0;

    return {
      files,
      total,
      page,
      limit,
    };
  }

  /**
   * Mover arquivo
   */
  async moveFile(fileKey: string, newPath: string): Promise<void> {
    // Implementação básica - em produção, moveria no storage
    const exists = await this.storageProvider.exists(fileKey);

    if (!exists) {
      throw new BadRequestException("File not found");
    }

    // Copiar para novo local
    const fileData = await this.downloadFile(fileKey);
    await this.storageProvider.upload(fileData, newPath, "application/octet-stream");

    // Deletar original
    await this.storageProvider.delete(fileKey);
  }

  /**
   * Copiar arquivo
   */
  async copyFile(fileKey: string, newPath: string): Promise<void> {
    const exists = await this.storageProvider.exists(fileKey);

    if (!exists) {
      throw new BadRequestException("File not found");
    }

    const fileData = await this.downloadFile(fileKey);
    await this.storageProvider.upload(fileData, newPath, "application/octet-stream");
  }

  /**
   * Baixar arquivo
   */
  private async downloadFile(_fileKey: string): Promise<Buffer> {
    // Implementação básica - em produção, baixaria do storage
    throw new Error("Download not implemented for this storage provider");
  }

  /**
   * Obter extensão do arquivo
   */
  private getFileExtension(filename: string): string {
    const extension = /\.[^/.]+$/.exec(filename.toLowerCase());
    return extension ? extension[0] : ".jpg";
  }
}
