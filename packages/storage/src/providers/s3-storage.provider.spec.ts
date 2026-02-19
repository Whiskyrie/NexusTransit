import { ConfigService } from "@nestjs/config";
import { S3StorageProvider } from "./s3-storage.provider";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const mockS3SendFn = jest.fn();
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockS3SendFn })),
  PutObjectCommand: jest
    .fn()
    .mockImplementation((params) => ({ _type: "PutObjectCommand", ...params })),
  DeleteObjectCommand: jest
    .fn()
    .mockImplementation((params) => ({ _type: "DeleteObjectCommand", ...params })),
  HeadObjectCommand: jest
    .fn()
    .mockImplementation((params) => ({ _type: "HeadObjectCommand", ...params })),
}));

const mockStorageConfig = {
  provider: { type: "s3" as const },
  backblaze: {
    endpoint: "https://s3.us-east-005.backblazeb2.com",
    region: "us-east-005",
    accessKeyId: "",
    secretAccessKey: "",
    bucket: "",
    bucketRegion: "us-east-005",
  },
  s3: {
    region: "us-east-1",
    accessKeyId: "access-key",
    secretAccessKey: "secret-key",
    bucket: "test-bucket",
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png"],
    allowedExtensions: [".jpg", ".png"],
    imageQuality: 85,
    thumbnailSizes: {
      small: { width: 150, height: 150 },
      medium: { width: 400, height: 400 },
      large: { width: 800, height: 600 },
    },
  },
};

describe("S3StorageProvider", () => {
  let provider: S3StorageProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3SendFn.mockResolvedValue({});

    const configService = {
      getOrThrow: jest.fn().mockReturnValue(mockStorageConfig),
    } as unknown as ConfigService;

    provider = new S3StorageProvider(configService);
  });

  describe("upload()", () => {
    it("deve fazer upload e retornar URL pública do S3", async () => {
      mockS3SendFn.mockResolvedValue({});

      const buffer = Buffer.from("conteudo do arquivo");
      const url = await provider.upload(buffer, "images/foto.jpg", "image/jpeg");

      expect(mockS3SendFn).toHaveBeenCalledTimes(1);
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: "images/foto.jpg",
          Body: buffer,
          ContentType: "image/jpeg",
        }),
      );
      expect(url).toContain("test-bucket");
      expect(url).toContain("images/foto.jpg");
    });

    it("deve lançar erro quando S3 falha no upload", async () => {
      mockS3SendFn.mockRejectedValue(new Error("S3 upload error"));

      await expect(
        provider.upload(Buffer.from("data"), "images/foto.jpg", "image/jpeg"),
      ).rejects.toThrow("S3 upload error");
    });

    it("deve incluir metadados no upload", async () => {
      mockS3SendFn.mockResolvedValue({});
      await provider.upload(Buffer.from("data"), "test.jpg", "image/jpeg");

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Metadata: expect.objectContaining({
            "uploaded-by": "nexus-transit",
          }),
        }),
      );
    });
  });

  describe("delete()", () => {
    it("deve deletar arquivo do S3", async () => {
      mockS3SendFn.mockResolvedValue({});

      await provider.delete("images/foto.jpg");

      expect(mockS3SendFn).toHaveBeenCalledTimes(1);
      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: "images/foto.jpg",
        }),
      );
    });

    it("deve lançar erro quando S3 falha na deleção", async () => {
      mockS3SendFn.mockRejectedValue(new Error("S3 delete error"));

      await expect(provider.delete("images/foto.jpg")).rejects.toThrow("S3 delete error");
    });
  });

  describe("exists()", () => {
    it("deve retornar true quando arquivo existe", async () => {
      mockS3SendFn.mockResolvedValue({ ContentLength: 1024 });

      const result = await provider.exists("images/foto.jpg");

      expect(result).toBe(true);
      expect(HeadObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: "images/foto.jpg",
        }),
      );
    });

    it("deve retornar false quando arquivo não existe (erro S3)", async () => {
      mockS3SendFn.mockRejectedValue(new Error("NotFound"));

      const result = await provider.exists("images/inexistente.jpg");

      expect(result).toBe(false);
    });
  });

  describe("generateSignedUrl()", () => {
    it("deve gerar URL com bucket e key", async () => {
      const url = await provider.generateSignedUrl!("images/foto.jpg", 3600);

      expect(url).toContain("test-bucket");
      expect(url).toContain("images/foto.jpg");
    });
  });

  describe("instanciação", () => {
    it("deve inicializar S3Client com credenciais corretas", () => {
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          region: "us-east-1",
          credentials: {
            accessKeyId: "access-key",
            secretAccessKey: "secret-key",
          },
        }),
      );
    });

    it("deve usar string vazia quando s3 config não definido", () => {
      const configService = {
        getOrThrow: jest.fn().mockReturnValue({
          ...mockStorageConfig,
          s3: undefined,
        }),
      } as unknown as ConfigService;

      const providerWithoutS3 = new S3StorageProvider(configService);
      expect(providerWithoutS3).toBeDefined();
    });
  });

  describe("upload() com s3 undefined", () => {
    it("deve usar bucket vazio quando s3 config não definido", async () => {
      mockS3SendFn.mockResolvedValue({});

      const configService = {
        getOrThrow: jest.fn().mockReturnValue({
          ...mockStorageConfig,
          s3: undefined,
        }),
      } as unknown as ConfigService;

      const providerWithoutS3 = new S3StorageProvider(configService);
      const url = await providerWithoutS3.upload(Buffer.from("data"), "key.jpg", "image/jpeg");

      expect(url).toBeDefined();
    });
  });
});
