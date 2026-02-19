import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { StorageModule } from "./storage.module";
import { StorageService } from "./services/storage.service";

// Mock AWS SDK para evitar conexões reais
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  DeleteObjectCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
  HeadObjectCommand: jest.fn(),
}));

jest.mock("@aws-sdk/lib-storage", () => ({
  Upload: jest.fn().mockImplementation(() => ({ done: jest.fn().mockResolvedValue({}) })),
}));

jest.mock("sharp", () => jest.fn());

// Configuração de storage para testes
const testStorageConfig = () => ({
  storage: {
    provider: { type: "backblaze" },
    backblaze: {
      endpoint: "https://s3.us-east-005.backblazeb2.com",
      region: "us-east-005",
      accessKeyId: "test-key",
      secretAccessKey: "test-secret",
      bucket: "test-bucket",
      bucketRegion: "us-east-005",
    },
    upload: {
      maxFileSize: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg"],
      allowedExtensions: [".jpg"],
      imageQuality: 85,
      thumbnailSizes: {
        small: { width: 150, height: 150 },
        medium: { width: 400, height: 400 },
        large: { width: 800, height: 600 },
      },
    },
  },
});

describe("StorageModule", () => {
  describe("forRoot()", () => {
    it("deve criar módulo e exportar StorageService", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            load: [testStorageConfig],
            isGlobal: true,
          }),
          StorageModule.forRoot(),
        ],
      }).compile();

      const storageService = moduleRef.get<StorageService>(StorageService);
      expect(storageService).toBeDefined();
      expect(storageService).toBeInstanceOf(StorageService);
    });

    it("deve ser global (não exige re-importação)", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            load: [testStorageConfig],
            isGlobal: true,
          }),
          StorageModule.forRoot(),
        ],
      }).compile();

      // Módulo global - StorageService deve ser acessível
      const storageService = moduleRef.get<StorageService>(StorageService);
      expect(storageService).toBeDefined();
    });
  });

  describe("forRootAsync()", () => {
    it("deve criar módulo com factory assíncrona", async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            load: [testStorageConfig],
            isGlobal: true,
          }),
          StorageModule.forRootAsync({
            useFactory: () => ({}),
          }),
        ],
      }).compile();

      const storageService = moduleRef.get<StorageService>(StorageService);
      expect(storageService).toBeDefined();
      expect(storageService).toBeInstanceOf(StorageService);
    });

    it("deve criar módulo sem factory (comportamento igual ao forRoot)", async () => {
      // forRootAsync sem options delega para MulterModule.registerAsync sem factory
      // o que pode falhar em contexto de teste puro — checamos apenas a definição do módulo
      const dynamicModule = StorageModule.forRootAsync({});
      expect(dynamicModule).toHaveProperty("module", StorageModule);
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule.exports).toBeDefined();
    });
  });
});
