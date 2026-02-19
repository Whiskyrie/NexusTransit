import { ConfigService } from "@nestjs/config";
import { LocalStorageProvider } from "./local-storage.provider";
import { promises as fs } from "fs";

jest.mock("fs", () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    access: jest.fn(),
  },
}));

const mockStorageConfig = {
  provider: {
    type: "local" as const,
    localPath: "/tmp/nexus-uploads",
    publicUrl: "http://localhost:3000/uploads",
  },
  backblaze: {
    endpoint: "https://s3.us-east-005.backblazeb2.com",
    region: "us-east-005",
    accessKeyId: "",
    secretAccessKey: "",
    bucket: "",
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

describe("LocalStorageProvider", () => {
  let provider: LocalStorageProvider;
  let mockMkdir: jest.Mock;
  let mockWriteFile: jest.Mock;
  let mockUnlink: jest.Mock;
  let mockAccess: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMkdir = fs.mkdir as jest.Mock;
    mockWriteFile = fs.writeFile as jest.Mock;
    mockUnlink = fs.unlink as jest.Mock;
    mockAccess = fs.access as jest.Mock;

    const configService = {
      getOrThrow: jest.fn().mockReturnValue(mockStorageConfig),
    } as unknown as ConfigService;

    provider = new LocalStorageProvider(configService);
  });

  describe("upload()", () => {
    it("deve criar diretório e salvar arquivo, retornando URL pública", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const buffer = Buffer.from("conteudo da imagem");
      const url = await provider.upload(buffer, "images/foto.jpg", "image/jpeg");

      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining("/tmp/nexus-uploads"), {
        recursive: true,
      });
      expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining("foto.jpg"), buffer);
      expect(url).toBe("http://localhost:3000/uploads/images/foto.jpg");
    });

    it("deve criar diretórios recursivos para subpastas", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await provider.upload(Buffer.from("data"), "2024/01/15/foto.jpg", "image/jpeg");

      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining("2024"), { recursive: true });
    });

    it("deve lançar erro quando falha ao escrever arquivo", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockRejectedValue(new Error("Disk full"));

      await expect(
        provider.upload(Buffer.from("data"), "images/foto.jpg", "image/jpeg"),
      ).rejects.toThrow("Disk full");
    });

    it("deve usar localPath default ./uploads quando não configurado", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      const configService = {
        getOrThrow: jest.fn().mockReturnValue({
          ...mockStorageConfig,
          provider: { type: "local" as const },
        }),
      } as unknown as ConfigService;

      const providerWithoutPath = new LocalStorageProvider(configService);
      await providerWithoutPath.upload(Buffer.from("data"), "foto.jpg", "image/jpeg");

      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining("uploads"), {
        recursive: true,
      });
    });
  });

  describe("delete()", () => {
    it("deve deletar arquivo existente", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockUnlink.mockResolvedValue(undefined);

      await provider.delete("images/foto.jpg");

      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining("foto.jpg"));
    });

    it("deve ignorar silenciosamente quando arquivo não existe", async () => {
      mockAccess.mockRejectedValue(new Error("ENOENT"));

      await expect(provider.delete("images/inexistente.jpg")).resolves.not.toThrow();
      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it("deve lançar erro quando falha ao deletar (diferente de ENOENT)", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockUnlink.mockRejectedValue(new Error("Permission denied"));

      await expect(provider.delete("images/foto.jpg")).rejects.toThrow("Permission denied");
    });
  });

  describe("exists()", () => {
    it("deve retornar true quando arquivo existe", async () => {
      mockAccess.mockResolvedValue(undefined);

      const result = await provider.exists("images/foto.jpg");

      expect(result).toBe(true);
    });

    it("deve retornar false quando arquivo não existe", async () => {
      mockAccess.mockRejectedValue(new Error("ENOENT"));

      const result = await provider.exists("images/inexistente.jpg");

      expect(result).toBe(false);
    });
  });

  describe("getFullPath()", () => {
    it("deve retornar caminho completo do arquivo", () => {
      const fullPath = provider.getFullPath("images/foto.jpg");
      expect(fullPath).toContain("/tmp/nexus-uploads");
      expect(fullPath).toContain("images/foto.jpg");
    });

    it("deve usar localPath default quando não configurado", () => {
      const configService = {
        getOrThrow: jest.fn().mockReturnValue({
          ...mockStorageConfig,
          provider: { type: "local" as const },
        }),
      } as unknown as ConfigService;
      const p = new LocalStorageProvider(configService);
      expect(p.getFullPath("foto.jpg")).toContain("uploads");
    });
  });

  describe("sem campos opcionais no provider config", () => {
    let providerNoOpts: LocalStorageProvider;

    beforeEach(() => {
      const configService = {
        getOrThrow: jest.fn().mockReturnValue({
          ...mockStorageConfig,
          provider: { type: "local" as const },
        }),
      } as unknown as ConfigService;
      providerNoOpts = new LocalStorageProvider(configService);
    });

    it("delete() deve usar ./uploads como fallback", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockUnlink.mockResolvedValue(undefined);

      await providerNoOpts.delete("foto.jpg");
      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining("uploads"));
    });

    it("exists() deve usar ./uploads como fallback e retornar true", async () => {
      mockAccess.mockResolvedValue(undefined);
      const result = await providerNoOpts.exists("foto.jpg");
      expect(result).toBe(true);
    });

    it("upload() deve usar publicUrl default e retornar URL com localhost", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      const url = await providerNoOpts.upload(Buffer.from("d"), "foto.jpg", "image/jpeg");
      expect(url).toContain("localhost");
    });
  });
});
