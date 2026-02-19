import { ConfigService } from "@nestjs/config";
import { BackblazeStorageProvider } from "./backblaze-storage.provider";
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
  provider: { type: "backblaze" as const },
  backblaze: {
    endpoint: "https://s3.us-east-005.backblazeb2.com",
    region: "us-east-005",
    accessKeyId: "b2-access-key",
    secretAccessKey: "b2-secret-key",
    bucket: "nexus-bucket",
    bucketRegion: "us-east-005",
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

describe("BackblazeStorageProvider", () => {
  let provider: BackblazeStorageProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockS3SendFn.mockResolvedValue({});

    const configService = {
      getOrThrow: jest.fn().mockReturnValue(mockStorageConfig),
    } as unknown as ConfigService;

    provider = new BackblazeStorageProvider(configService);
  });

  describe("upload()", () => {
    it("deve fazer upload e retornar URL pública do Backblaze", async () => {
      mockS3SendFn.mockResolvedValue({});

      const buffer = Buffer.from("conteudo da imagem");
      const url = await provider.upload(buffer, "images/foto.jpg", "image/jpeg");

      expect(mockS3SendFn).toHaveBeenCalledTimes(1);
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "nexus-bucket",
          Key: "images/foto.jpg",
          Body: buffer,
          ContentType: "image/jpeg",
        }),
      );
      expect(url).toContain("nexus-bucket");
      expect(url).toContain("images/foto.jpg");
      expect(url).toContain("backblazeb2.com");
    });

    it("deve lançar erro quando Backblaze falha no upload", async () => {
      mockS3SendFn.mockRejectedValue(new Error("B2 connection error"));

      await expect(
        provider.upload(Buffer.from("data"), "images/foto.jpg", "image/jpeg"),
      ).rejects.toThrow("B2 connection error");
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
    it("deve deletar arquivo do Backblaze B2", async () => {
      mockS3SendFn.mockResolvedValue({});

      await provider.delete("images/foto.jpg");

      expect(mockS3SendFn).toHaveBeenCalledTimes(1);
      expect(DeleteObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "nexus-bucket",
          Key: "images/foto.jpg",
        }),
      );
    });

    it("deve lançar erro quando Backblaze falha na deleção", async () => {
      mockS3SendFn.mockRejectedValue(new Error("B2 delete error"));

      await expect(provider.delete("images/foto.jpg")).rejects.toThrow("B2 delete error");
    });
  });

  describe("exists()", () => {
    it("deve retornar true quando arquivo existe no B2", async () => {
      mockS3SendFn.mockResolvedValue({ ContentLength: 2048 });

      const result = await provider.exists("images/foto.jpg");

      expect(result).toBe(true);
      expect(HeadObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "nexus-bucket",
          Key: "images/foto.jpg",
        }),
      );
    });

    it("deve retornar false quando arquivo não existe no B2", async () => {
      mockS3SendFn.mockRejectedValue(new Error("NoSuchKey"));

      const result = await provider.exists("images/inexistente.jpg");

      expect(result).toBe(false);
    });
  });

  describe("getPublicUrl()", () => {
    it("deve gerar URL pública com bucket e região corretos", async () => {
      const url = await provider.getPublicUrl("images/foto.jpg");

      expect(url).toContain("nexus-bucket");
      expect(url).toContain("us-east-005");
      expect(url).toContain("backblazeb2.com");
      expect(url).toContain("images/foto.jpg");
    });
  });

  describe("instanciação", () => {
    it("deve inicializar S3Client com endpoint do Backblaze", () => {
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "https://s3.us-east-005.backblazeb2.com",
          region: "us-east-005",
          credentials: {
            accessKeyId: "b2-access-key",
            secretAccessKey: "b2-secret-key",
          },
          forcePathStyle: true,
        }),
      );
    });
  });
});
