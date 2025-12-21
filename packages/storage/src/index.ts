/**
 * @nexus/storage
 *
 * Storage and file upload utilities for NexusTransit
 * Supports S3-compatible storage (Backblaze B2) and local storage
 */

// Module
export { StorageModule } from "./storage.module";

// Services
export { StorageService } from "./services/storage.service";

// Providers
export { LocalStorageProvider } from "./providers/local-storage.provider";
export { S3StorageProvider } from "./providers/s3-storage.provider";

// Pipes
export { FileValidationPipe } from "./pipes/file-validation.pipe";
export { ImageProcessingPipe } from "./pipes/image-processing.pipe";

// Config
export { default as storageConfig } from "./config/storage.config";
export type { StorageConfig } from "./config/storage.config";

// Interfaces
export type * from "./interfaces/upload.interface";

// DTOs
export { UploadFileDto } from "./dto/upload-file.dto";
export { UploadMultipleDto } from "./dto/upload-multiple.dto";
export { FileFilterDto } from "./dto/file-filter.dto";
export { FileResponseDto } from "./dto/file-response.dto";
export { FileMetadataDto } from "./dto/file-metadata.dto";

// Validators
export {
  IsValidFileType,
  IsValidFileTypeConstraint,
  normalizeFileExtension,
  isValidFileExtension,
} from "./validators/file-type.validator";
export {
  IsValidFileSize,
  IsValidFileSizeConstraint,
  bytesToMB,
  mbToBytes,
} from "./validators/file-size.validator";

// Enums
export {
  StorageType,
  isValidStorageType,
  getAvailableStorageTypes,
  translateStorageType,
} from "./enums/storage-type.enum";

// Utils
export { FileUtil } from "./utils/file.util";
export { SecurityUtil } from "./utils/security.util";
