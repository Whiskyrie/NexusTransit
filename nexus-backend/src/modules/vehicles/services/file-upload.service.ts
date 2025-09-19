import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UploadConfig {
  destination: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

export interface FileUploadResult {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  extension: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(private readonly configService: ConfigService) {}

  async ensureUploadDirectory(destination: string): Promise<void> {
    try {
      await fs.access(destination);
    } catch {
      await fs.mkdir(destination, { recursive: true });
      this.logger.log(`Diretório de upload criado: ${destination}`);
    }
  }

  async uploadFile(file: Express.Multer.File, config: UploadConfig): Promise<FileUploadResult> {
    // Validate file size
    if (file.size > config.maxFileSize) {
      throw new BadRequestException(
        `Arquivo muito grande. Tamanho máximo: ${this.formatFileSize(config.maxFileSize)}`,
      );
    }

    // Validate file type
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Tipo de arquivo não permitido: ${file.mimetype}`);
    }

    // Validate file extension
    const extension = this.getFileExtension(file.originalname);
    if (!config.allowedExtensions.includes(extension)) {
      throw new BadRequestException(`Extensão de arquivo não permitida: ${extension}`);
    }

    // Ensure upload directory exists
    await this.ensureUploadDirectory(config.destination);

    // Generate unique filename
    const uniqueFilename = this.generateUniqueFilename(file.originalname);
    const filePath = join(config.destination, uniqueFilename);

    // Save file
    await fs.writeFile(filePath, file.buffer);

    // Generate URL (local for now, will be B2 URL in the future)
    const fileUrl = this.generateFileUrl(uniqueFilename, 'vehicles');

    const result: FileUploadResult = {
      filename: uniqueFilename,
      originalName: file.originalname,
      path: filePath,
      url: fileUrl,
      size: file.size,
      mimeType: file.mimetype,
      extension,
    };

    this.logger.log(`Arquivo carregado: ${file.originalname} -> ${uniqueFilename}`);

    return result;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.debug(`Arquivo removido: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Erro ao remover arquivo ${filePath}:`, error);
      // Don't throw - file might already be deleted
    }
  }

  async moveFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      // Ensure destination directory exists
      const destinationDir = destinationPath.substring(0, destinationPath.lastIndexOf('/'));
      await this.ensureUploadDirectory(destinationDir);

      // Move file
      await fs.rename(sourcePath, destinationPath);
      this.logger.debug(`Arquivo movido: ${sourcePath} -> ${destinationPath}`);
    } catch (error) {
      this.logger.error(`Erro ao mover arquivo ${sourcePath} para ${destinationPath}:`, error);
      throw error;
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const extension = this.getFileExtension(originalName);
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);

    return `${timestamp}-${uuid}-${nameWithoutExt}.${extension}`;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() ?? '';
  }

  private generateFileUrl(filename: string, category: string): string {
    // Local URL for now - will be replaced with B2 URL in the future
    const baseUrl = this.configService.get<string>('app.baseUrl', 'http://localhost:3000');
    return `${baseUrl}/uploads/${category}/${filename}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Future: Backblaze B2 integration methods
  async uploadToBackblazeB2(
    _file: Express.Multer.File,
    _bucketPath: string,
  ): Promise<FileUploadResult> {
    // TODO: Implement B2 upload using official SDK
    // This will replace local file storage
    throw new Error('Backblaze B2 integration not implemented yet');
  }

  async migrateLocalToB2(_localPath: string, _b2Path: string): Promise<string> {
    // TODO: Implement migration from local storage to B2
    throw new Error('B2 migration not implemented yet');
  }

  // Configuration factory methods
  static getVehicleDocumentConfig(): UploadConfig {
    return {
      destination: join(process.cwd(), 'uploads', 'vehicles'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
    };
  }

  static getProfileImageConfig(): UploadConfig {
    return {
      destination: join(process.cwd(), 'uploads', 'profiles'),
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    };
  }
}
