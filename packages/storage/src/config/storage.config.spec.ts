import storageConfig from "./storage.config";

describe("storageConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("deve retornar configuração default para backblaze", () => {
    delete process.env.STORAGE_PROVIDER;
    const config = storageConfig();

    expect(config.provider.type).toBe("backblaze");
    expect(config.backblaze.endpoint).toContain("backblazeb2");
    expect(config.s3).toBeUndefined();
  });

  it("deve retornar configuração S3 quando STORAGE_PROVIDER=s3", () => {
    process.env.STORAGE_PROVIDER = "s3";
    process.env.AWS_S3_REGION = "us-east-1";
    process.env.AWS_ACCESS_KEY_ID = "test-key";
    process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
    process.env.AWS_S3_BUCKET = "test-bucket";

    // Reimportar após setar env
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: freshConfig } = require("./storage.config");
    const config = freshConfig();

    expect(config.s3).toBeDefined();
    expect(config.s3!.region).toBe("us-east-1");
    expect(config.s3!.bucket).toBe("test-bucket");
  });

  it("deve retornar configuração local quando STORAGE_PROVIDER=local", () => {
    delete process.env.STORAGE_PROVIDER;
    const config = storageConfig();

    expect(config.provider.localPath).toBeDefined();
    expect(config.provider.publicUrl).toBeDefined();
  });

  it("deve usar valores de env quando definidos", () => {
    process.env.MAX_FILE_SIZE = "10485760"; // 10MB
    process.env.IMAGE_QUALITY = "90";
    process.env.BACKBLAZE_BUCKET = "my-bucket";

    const config = storageConfig();

    expect(config.upload.maxFileSize).toBe(10485760);
    expect(config.upload.imageQuality).toBe(90);
    expect(config.backblaze.bucket).toBe("my-bucket");
  });

  it("deve definir thumbnailSizes corretos", () => {
    const config = storageConfig();

    expect(config.upload.thumbnailSizes.small).toEqual({ width: 150, height: 150 });
    expect(config.upload.thumbnailSizes.medium).toEqual({ width: 400, height: 400 });
    expect(config.upload.thumbnailSizes.large).toEqual({ width: 800, height: 600 });
  });

  it("deve incluir tipos MIME permitidos", () => {
    const config = storageConfig();

    expect(config.upload.allowedMimeTypes).toContain("image/jpeg");
    expect(config.upload.allowedMimeTypes).toContain("image/png");
    expect(config.upload.allowedMimeTypes).toContain("application/pdf");
  });
});
