/**
 * @nexus/storage
 *
 * Storage and file upload utilities for NexusTransit
 * Supports S3-compatible storage (Backblaze B2)
 */

// Module
export { StorageModule } from "./storage.module";

// Services
export { StorageService } from "./services/storage.service";

// Pipes
export { ImageValidationPipe } from "./pipes/image-validation.pipe";
export { AvatarValidationPipe } from "./pipes/avatar-validation.pipe";
export { MultipleImagesValidationPipe } from "./pipes/multiple-images-validation.pipe";

// Config
export { default as storageConfig, StorageConfig } from "./config/storage.config";

// Interfaces
export * from "./interfaces/upload.interface";
