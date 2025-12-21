export interface UploadResult {
  originalUrl: string;
  thumbnails?: {
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

export interface FileUploadResult {
  filePath: string;
  fileHash: string;
  url: string;
  metadata: {
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
}

export interface ThumbnailSize {
  width: number;
  height: number;
  suffix: string;
}

export interface StorageProvider {
  upload(buffer: Buffer, key: string, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  generateSignedUrl?(key: string, expiresIn?: number): Promise<string>;
}

export interface FileMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  uploadedAt?: Date;
  storageType?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FileList {
  files: FileMetadata[];
  total: number;
  page: number;
  limit: number;
}

export interface FileFilter {
  type?: "documents" | "images" | "proofs" | "temp";
  extension?: string;
  mimeType?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}
