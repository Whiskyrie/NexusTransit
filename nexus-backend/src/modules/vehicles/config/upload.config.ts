import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void,
    ) => {
      // Temporary local storage - will be replaced with Backblaze B2 in the future
      const uploadPath = join(process.cwd(), 'uploads', 'vehicles');
      cb(null, uploadPath);
    },
    filename: (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, filename: string) => void,
    ) => {
      const uniqueSuffix = uuidv4();
      const fileExtension = extname(file.originalname);
      const filename = `${Date.now()}-${uniqueSuffix}${fileExtension}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per upload
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    // Allowed file types for vehicle documents
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          `Tipo de arquivo não permitido: ${file.mimetype}. Tipos permitidos: ${allowedMimeTypes.join(', ')}`,
        ),
        false,
      );
    }
  },
};

// Configuration for future Backblaze B2 integration
export interface BackblazeB2Config {
  applicationKeyId: string;
  applicationKey: string;
  bucketId: string;
  bucketName: string;
  endpoint?: string;
}

export const backblazeB2Config: Partial<BackblazeB2Config> = {
  // These will be loaded from environment variables in the future
  // applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  // applicationKey: process.env.B2_APPLICATION_KEY,
  // bucketId: process.env.B2_BUCKET_ID,
  // bucketName: process.env.B2_BUCKET_NAME,
  endpoint: 'https://s3.us-west-002.backblazeb2.com', // Example endpoint
};

// Helper function to generate file URLs
export function generateFileUrl(filename: string, isLocal = true): string {
  if (isLocal) {
    // Local file URL - will be served by NestJS static files
    return `/uploads/vehicles/${filename}`;
  }

  // Future B2 URL format
  return `${backblazeB2Config.endpoint}/${backblazeB2Config.bucketName}/vehicles/${filename}`;
}

// File validation utilities
export class FileValidationUtils {
  static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  static readonly ALLOWED_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.pdf',
    '.doc',
    '.docx',
  ];
  static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  static validateFileType(filename: string): boolean {
    const extension = extname(filename).toLowerCase();
    return this.ALLOWED_EXTENSIONS.includes(extension);
  }

  static validateMimeType(mimetype: string): boolean {
    return this.ALLOWED_MIME_TYPES.includes(mimetype);
  }

  static getFileCategory(mimetype: string): string {
    if (mimetype.startsWith('image/')) {
      return 'image';
    } else if (mimetype === 'application/pdf') {
      return 'pdf';
    } else if (mimetype.includes('word') || mimetype.includes('document')) {
      return 'document';
    }
    return 'unknown';
  }
}
