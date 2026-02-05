/// <reference types="jest" />

import { Test, TestingModule } from "@nestjs/testing";
import { DataPortabilityService } from "./data-portability.service";
import * as path from "path";
import * as crypto from "crypto";

// Mock functions
const mockMkdir = jest.fn();
const mockWriteFile = jest.fn();
const mockReadFile = jest.fn();
const mockUnlink = jest.fn();
const mockStat = jest.fn();
const mockAccess = jest.fn();

// Mock fs/promises
jest.mock("fs/promises", () => ({
  mkdir: (...args: any[]) => mockMkdir(...args),
  writeFile: (...args: any[]) => mockWriteFile(...args),
  readFile: (...args: any[]) => mockReadFile(...args),
  unlink: (...args: any[]) => mockUnlink(...args),
  stat: (...args: any[]) => mockStat(...args),
  access: (...args: any[]) => mockAccess(...args),
}));

// Mock crypto
jest.mock("crypto", () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue("mocked-hash-123"),
  }),
}));

describe("DataPortabilityService", () => {
  let service: DataPortabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataPortabilityService],
    }).compile();

    service = module.get<DataPortabilityService>(DataPortabilityService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("exportUserData", () => {
    const userId = "user-123";

    it("should export user data successfully in JSON format", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(Buffer.from("test data"));

      const result = await service.exportUserData(userId);

      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining("exports"), {
        recursive: true,
      });
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining(`user-data-export-${userId}`),
        expect.any(String),
        "utf8",
      );
      expect(result.filePath).toContain("user-data-export");
      expect(result.fileHash).toBe("mocked-hash-123");
      expect(result.fileSize).toBe(9); // "test data".length
    });

    it("should include correct export metadata", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockImplementation((filePath, data) => {
        // Verify the JSON structure
        const jsonData = JSON.parse(data as string);
        expect(jsonData.exportInfo).toBeDefined();
        expect(jsonData.exportInfo.userId).toBe(userId);
        expect(jsonData.exportInfo.exportVersion).toBe("1.0");
        expect(jsonData.exportInfo.description).toContain("LGPD");
        expect(new Date(jsonData.exportInfo.exportDate)).toBeInstanceOf(Date);
        return Promise.resolve();
      });
      mockReadFile.mockResolvedValue(Buffer.from("test"));

      await service.exportUserData(userId);

      expect(mockWriteFile).toHaveBeenCalled();
    });

    it("should handle file system errors gracefully", async () => {
      mockMkdir.mockRejectedValue(new Error("Permission denied"));

      await expect(service.exportUserData(userId)).rejects.toThrow(
        "Erro ao exportar dados do usuário: Permission denied",
      );
    });

    it("should handle write file errors", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockRejectedValue(new Error("Disk full"));

      await expect(service.exportUserData(userId)).rejects.toThrow(
        "Erro ao exportar dados do usuário: Disk full",
      );
    });

    it("should generate unique filenames with timestamps", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(Buffer.from("test"));

      const result1 = await service.exportUserData(userId);

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await service.exportUserData(userId);

      expect(result1.filePath).not.toBe(result2.filePath);
    });

    it("should calculate correct file hash", async () => {
      const fileContent = "user data content";
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(Buffer.from(fileContent));

      const result = await service.exportUserData(userId);

      expect(crypto.createHash).toHaveBeenCalledWith("sha256");
      expect(result.fileHash).toBe("mocked-hash-123");
    });

    it("should include all required data sections", async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockImplementation((filePath, data) => {
        const jsonData = JSON.parse(data as string);
        expect(jsonData).toHaveProperty("exportInfo");
        expect(jsonData).toHaveProperty("userData");
        expect(jsonData).toHaveProperty("auditLogs");
        expect(jsonData).toHaveProperty("consents");
        expect(jsonData).toHaveProperty("dataRequests");
        return Promise.resolve();
      });
      mockReadFile.mockResolvedValue(Buffer.from("test"));

      await service.exportUserData(userId);
    });
  });

  describe("deleteExportFile", () => {
    const filePath = "/exports/test-file.json";

    it("should delete export file successfully", async () => {
      mockUnlink.mockResolvedValue(undefined);

      await service.deleteExportFile(filePath);

      expect(mockUnlink).toHaveBeenCalledWith(filePath);
    });

    it("should silently ignore errors when file deletion fails", async () => {
      mockUnlink.mockRejectedValue(new Error("Permission denied"));

      // O método não lança erro, apenas ignora falhas silenciosamente
      await expect(service.deleteExportFile(filePath)).resolves.toBeUndefined();
    });
  });

  describe("getExportFileInfo", () => {
    const filePath = "/exports/test-file.json";

    it("should return file information", async () => {
      const mockStats = {
        size: 1024,
        birthtime: new Date("2026-01-01"),
        mtime: new Date("2026-01-15"),
      };

      mockStat.mockResolvedValue(mockStats as any);
      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(Buffer.from("test-data"));

      const result = await service.getExportFileInfo(filePath);

      expect(result).toEqual({
        exists: true,
        size: 1024,
        created: mockStats.birthtime,
        hash: expect.any(String),
      });
    });

    it("should return exists false when file does not exist", async () => {
      mockAccess.mockRejectedValue(new Error("File not found"));

      const result = await service.getExportFileInfo(filePath);

      expect(result.exists).toBe(false);
    });
  });
});
