import { registerAs } from "@nestjs/config";

export interface StorageConfig {
  // Storage Provider Configuration
  provider: {
    type: "local" | "s3" | "backblaze";
    localPath?: string;
    publicUrl?: string;
  };

  // Backblaze B2 Configuration
  backblaze: {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    bucketRegion: string;
  };

  // S3 Configuration
  s3?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
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
  "storage",
  (): StorageConfig => ({
    provider: {
      type: (process.env.STORAGE_PROVIDER as "local" | "s3" | "backblaze") ?? "backblaze",
      localPath: process.env.STORAGE_LOCAL_PATH ?? "./uploads",
      publicUrl: process.env.STORAGE_PUBLIC_URL ?? "http://localhost:3000/uploads",
    },
    backblaze: {
      endpoint: process.env.BACKBLAZE_ENDPOINT ?? "https://s3.us-east-005.backblazeb2.com",
      region: process.env.BACKBLAZE_REGION ?? "us-east-005",
      accessKeyId: process.env.BACKBLAZE_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.BACKBLAZE_SECRET_ACCESS_KEY ?? "",
      bucket: process.env.BACKBLAZE_BUCKET ?? "",
      bucketRegion: process.env.BACKBLAZE_BUCKET_REGION ?? "us-east-005",
    },
    s3:
      process.env.STORAGE_PROVIDER === "s3"
        ? {
            region: process.env.AWS_S3_REGION ?? "us-east-1",
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
            bucket: process.env.AWS_S3_BUCKET ?? "",
          }
        : undefined,
    upload: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? "5242880") || 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      allowedExtensions: [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
        ".svg",
        ".pdf",
        ".doc",
        ".docx",
      ],
      imageQuality: parseInt(process.env.IMAGE_QUALITY ?? "85") || 85,
      thumbnailSizes: {
        small: { width: 150, height: 150 },
        medium: { width: 400, height: 400 },
        large: { width: 800, height: 600 },
      },
    },
  }),
);
