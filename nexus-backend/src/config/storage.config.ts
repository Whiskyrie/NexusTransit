import { registerAs } from '@nestjs/config';

export interface StorageConfig {
  // Backblaze B2 Configuration
  backblaze: {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    bucketRegion: string;
  };
  // Upload Settings
  upload: {
    maxFileSize: number; // em bytes (5MB default)
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    imageQuality: number; // para compressão JPEG (0-100)
    thumbnailSizes: {
      small: { width: number; height: number };
      medium: { width: number; height: number };
      large: { width: number; height: number };
    };
  };
}

export default registerAs(
  'storage',
  (): StorageConfig => ({
    backblaze: {
      endpoint: process.env.BACKBLAZE_ENDPOINT ?? 'https://s3.us-east-005.backblazeb2.com',
      region: process.env.BACKBLAZE_REGION ?? 'us-east-005',
      accessKeyId: process.env.BACKBLAZE_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.BACKBLAZE_SECRET_ACCESS_KEY ?? '',
      bucket: process.env.BACKBLAZE_BUCKET ?? '',
      bucketRegion: process.env.BACKBLAZE_BUCKET_REGION ?? 'us-east-005',
    },
    upload: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '5242880') || 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
      imageQuality: parseInt(process.env.IMAGE_QUALITY ?? '85') || 85,
      thumbnailSizes: {
        small: { width: 150, height: 150 },
        medium: { width: 400, height: 400 },
        large: { width: 800, height: 600 },
      },
    },
  }),
);
