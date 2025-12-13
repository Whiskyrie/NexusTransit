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

export interface StorageProvider {
  upload(buffer: Buffer, key: string, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
