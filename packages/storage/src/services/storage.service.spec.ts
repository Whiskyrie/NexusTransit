import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageService } from "./storage.service";

// Mock do AWS SDK
const mockS3SendFn = jest.fn();
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockS3SendFn })),
  DeleteObjectCommand: jest
    .fn()
    .mockImplementation((params) => ({ _type: "DeleteObjectCommand", ...params })),
  PutObjectCommand: jest
    .fn()
    .mockImplementation((params) => ({ _type: "PutObjectCommand", ...params })),
  HeadObjectCommand: jest
    .fn()
    .mockImplementation((params) => ({ _type: "HeadObjectCommand", ...params })),
}));

jest.mock("@aws-sdk/lib-storage", () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: jest.fn().mockResolvedValue({}),
  })),
}));

// Mock do sharp
jest.mock("sharp", () => {
  const sharpInstance = {
    metadata: jest.fn().mockResolvedValue({
      format: "jpeg",
      width: 1920,
      height: 1080,
    }),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("processed")),
  };
  const sharpFn = jest.fn().mockReturnValue(sharpInstance);
  return sharpFn;
});

const mockStorageConfig = {
  provider: {
    type: "backblaze" as const,
    localPath: "/tmp/uploads",
    publicUrl: "http://localhost:3000",
  },
  backblaze: {
    endpoint: "https://s3.us-east-005.backblazeb2.com",
    region: "us-east-005",
    accessKeyId: "b2-access",
    secretAccessKey: "b2-secret",
    bucket: "nexus-bucket",
    bucketRegion: "us-east-005",
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".pdf"],
    imageQuality: 85,
    thumbnailSizes: {
      small: { width: 150, height: 150 },
      medium: { width: 400, height: 400 },
      large: { width: 800, height: 600 },
    },
  },
};

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: "file",
  originalname: "foto.jpg",
  encoding: "7bit",
  mimetype: "image/jpeg",
  size: 1024,
  buffer: Buffer.from("fake image content"),
  stream: null as any,
  destination: "",
  filename: "",
  path: "",
  ...overrides,
});

describe("StorageService", () => {
  let service: StorageService;
  let mockUploadDone: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3SendFn.mockResolvedValue({});

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Upload } = require("@aws-sdk/lib-storage");
    mockUploadDone = jest.fn().mockResolvedValue({});
    Upload.mockImplementation(() => ({ done: mockUploadDone }));

    const configService = {
      getOrThrow: jest.fn().mockReturnValue(mockStorageConfig),
    } as unknown as ConfigService;

    service = new StorageService(configService);
  });

  describe("uploadImage()", () => {
    it("deve fazer upload de imagem e retornar URLs", async () => {
      const file = makeFile();

      const result = await service.uploadImage(file, "images");

      expect(result).toHaveProperty("originalUrl");
      expect(result).toHaveProperty("thumbnails");
      expect(result.thumbnails).toHaveProperty("small");
      expect(result.thumbnails).toHaveProperty("medium");
      expect(result.thumbnails).toHaveProperty("large");
      expect(result.metadata.originalName).toBe("foto.jpg");
      expect(result.metadata.mimeType).toBe("image/jpeg");
    });

    it("deve lançar BadRequestException quando arquivo não informado", async () => {
      await expect(
        service.uploadImage(null as unknown as Express.Multer.File, "images"),
      ).rejects.toThrow(BadRequestException);
    });

    it("deve lançar BadRequestException quando arquivo excede tamanho máximo", async () => {
      const file = makeFile({ size: 10 * 1024 * 1024 }); // 10MB

      await expect(service.uploadImage(file, "images")).rejects.toThrow(BadRequestException);
    });

    it("deve lançar BadRequestException para MIME type não permitido", async () => {
      const file = makeFile({ mimetype: "video/mp4" });

      await expect(service.uploadImage(file, "images")).rejects.toThrow(BadRequestException);
    });

    it("deve lançar InternalServerErrorException quando upload ao B2 falha", async () => {
      mockUploadDone.mockRejectedValue(new Error("B2 network error"));
      const file = makeFile();

      await expect(service.uploadImage(file, "images")).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("deve usar pasta default 'images' quando folder não informado", async () => {
      const file = makeFile();
      const result = await service.uploadImage(file);

      expect(result).toHaveProperty("originalUrl");
    });

    it("deve aceitar userId opcional", async () => {
      const file = makeFile();
      const result = await service.uploadImage(file, "avatars", "user-123");

      expect(result).toHaveProperty("originalUrl");
    });

    it("deve processar imagem PNG corretamente", async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sharp = require("sharp");
      sharp.mockReturnValue({
        metadata: jest.fn().mockResolvedValue({ format: "png", width: 800, height: 600 }),
        jpeg: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from("processed-png")),
      });

      const file = makeFile({ mimetype: "image/png", originalname: "foto.png" });
      const result = await service.uploadImage(file, "images");
      expect(result).toHaveProperty("originalUrl");
    });

    it("deve processar imagem WebP corretamente", async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sharp = require("sharp");
      sharp.mockReturnValue({
        metadata: jest.fn().mockResolvedValue({ format: "webp", width: 800, height: 600 }),
        jpeg: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from("processed-webp")),
      });

      const file = makeFile({ mimetype: "image/webp", originalname: "foto.webp" });
      const result = await service.uploadImage(file, "images");
      expect(result).toHaveProperty("originalUrl");
    });
  });

  describe("uploadMultipleImages()", () => {
    it("deve fazer upload de múltiplos arquivos", async () => {
      const files = [
        makeFile({ originalname: "foto1.jpg" }),
        makeFile({ originalname: "foto2.jpg" }),
      ];

      const results = await service.uploadMultipleImages(files, "images");

      expect(results).toHaveLength(2);
      results.forEach((r) => {
        expect(r).toHaveProperty("originalUrl");
        expect(r).toHaveProperty("thumbnails");
      });
    });

    it("deve retornar array vazio para lista vazia", async () => {
      const results = await service.uploadMultipleImages([], "images");
      expect(results).toHaveLength(0);
    });
  });

  describe("uploadFile()", () => {
    it("deve fazer upload de arquivo genérico (PDF)", async () => {
      // Para uploadFile usa storageProvider (backblaze provider)
      // que chama S3Client.send via PutObjectCommand
      const file = makeFile({
        originalname: "documento.pdf",
        mimetype: "application/pdf",
        size: 512,
      });

      const result = await service.uploadFile(file, { fileType: "documents" });

      expect(result).toHaveProperty("filePath");
      expect(result).toHaveProperty("url");
      expect(result).toHaveProperty("fileHash");
      expect(result.metadata.originalName).toBe("documento.pdf");
      expect(result.metadata.mimeType).toBe("application/pdf");
    });

    it("deve lançar BadRequestException quando arquivo não informado", async () => {
      await expect(service.uploadFile(null as unknown as Express.Multer.File)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("deve lançar BadRequestException quando arquivo excede tamanho máximo", async () => {
      const file = makeFile({ size: 10 * 1024 * 1024 }); // 10MB

      await expect(service.uploadFile(file)).rejects.toThrow(BadRequestException);
    });

    it("deve usar fileType 'documents' como default", async () => {
      const file = makeFile({ originalname: "doc.pdf", mimetype: "application/pdf" });
      const result = await service.uploadFile(file);

      expect(result.filePath).toContain("documents");
    });
  });

  describe("uploadMultipleFiles()", () => {
    it("deve fazer upload de múltiplos arquivos genéricos", async () => {
      const files = [
        makeFile({ originalname: "doc1.pdf", mimetype: "application/pdf" }),
        makeFile({ originalname: "doc2.pdf", mimetype: "application/pdf" }),
      ];

      const results = await service.uploadMultipleFiles(files, { fileType: "documents" });

      expect(results).toHaveLength(2);
      results.forEach((r) => {
        expect(r).toHaveProperty("url");
        expect(r).toHaveProperty("metadata");
      });
    });
  });

  describe("deleteFile()", () => {
    it("deve deletar arquivo usando provider", async () => {
      mockS3SendFn.mockResolvedValue({});

      await expect(service.deleteFile("images/foto.jpg")).resolves.not.toThrow();
    });

    it("deve lançar InternalServerErrorException quando deleção falha", async () => {
      mockS3SendFn.mockRejectedValue(new Error("S3 delete error"));

      await expect(service.deleteFile("images/foto.jpg")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("deleteImage()", () => {
    it("deve deletar imagem original e thumbnails", async () => {
      mockS3SendFn.mockResolvedValue({});

      const imageUrl = `https://nexus-bucket.s3.us-east-005.backblazeb2.com/images/foto.jpg`;

      await expect(service.deleteImage(imageUrl)).resolves.not.toThrow();

      // 1 chamada para original + 3 para thumbnails (allSettled)
      expect(mockS3SendFn).toHaveBeenCalledTimes(4);
    });

    it("deve lidar com URL sem bucket no path", async () => {
      mockS3SendFn.mockResolvedValue({});

      // URL sem o bucket no path (usa fallback de extração)
      const imageUrl = `https://cdn.example.com/images/foto.jpg`;

      await expect(service.deleteImage(imageUrl)).resolves.not.toThrow();
    });

    it("deve lançar InternalServerErrorException para URL inválida", async () => {
      await expect(service.deleteImage("url-invalida-sem-protocolo")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("getFileMetadata()", () => {
    it("deve retornar metadados do arquivo quando existe", async () => {
      mockS3SendFn.mockResolvedValue({ ContentLength: 1024 });

      const metadata = await service.getFileMetadata("images/foto.jpg");

      expect(metadata).toHaveProperty("filename");
      expect(metadata).toHaveProperty("originalName");
      expect(metadata).toHaveProperty("size");
      expect(metadata).toHaveProperty("mimeType");
    });

    it("deve lançar BadRequestException quando arquivo não existe", async () => {
      mockS3SendFn.mockRejectedValue(new Error("NoSuchKey"));

      await expect(service.getFileMetadata("images/inexistente.jpg")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("listFiles()", () => {
    it("deve retornar estrutura de lista paginada", async () => {
      const result = await service.listFiles({}, 1, 10);

      expect(result).toHaveProperty("files");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page", 1);
      expect(result).toHaveProperty("limit", 10);
      expect(Array.isArray(result.files)).toBe(true);
    });

    it("deve usar valores default page=1 e limit=10", async () => {
      const result = await service.listFiles();

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe("moveFile()", () => {
    it("deve lançar BadRequestException quando arquivo não existe", async () => {
      mockS3SendFn.mockRejectedValue(new Error("NoSuchKey"));

      await expect(service.moveFile("images/inexistente.jpg", "images/novo.jpg")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("copyFile()", () => {
    it("deve lançar BadRequestException quando arquivo não existe", async () => {
      mockS3SendFn.mockRejectedValue(new Error("NoSuchKey"));

      await expect(service.copyFile("images/inexistente.jpg", "images/copia.jpg")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("inicialização do provider", () => {
    it("deve usar BackblazeStorageProvider quando tipo é backblaze", () => {
      const configService = {
        getOrThrow: jest.fn().mockReturnValue({
          ...mockStorageConfig,
          provider: { type: "backblaze" },
        }),
      } as unknown as ConfigService;

      expect(() => new StorageService(configService)).not.toThrow();
    });

    it("deve usar S3StorageProvider quando tipo é s3", () => {
      const configService = {
        getOrThrow: jest.fn().mockReturnValue({
          ...mockStorageConfig,
          provider: { type: "s3" },
          s3: {
            region: "us-east-1",
            accessKeyId: "key",
            secretAccessKey: "secret",
            bucket: "bucket",
          },
        }),
      } as unknown as ConfigService;

      expect(() => new StorageService(configService)).not.toThrow();
    });

    it("deve usar LocalStorageProvider quando tipo é local", () => {
      const configService = {
        getOrThrow: jest.fn().mockReturnValue({
          ...mockStorageConfig,
          provider: {
            type: "local",
            localPath: "/tmp/uploads",
            publicUrl: "http://localhost:3000",
          },
        }),
      } as unknown as ConfigService;

      expect(() => new StorageService(configService)).not.toThrow();
    });

    it("deve usar BackblazeStorageProvider como fallback para tipo desconhecido", () => {
      const configService = {
        getOrThrow: jest.fn().mockReturnValue({
          ...mockStorageConfig,
          provider: { type: "unknown" },
        }),
      } as unknown as ConfigService;

      expect(() => new StorageService(configService)).not.toThrow();
    });
  });
});
