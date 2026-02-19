import { BadRequestException } from "@nestjs/common";
import { SecurityUtil } from "./security.util";

describe("SecurityUtil", () => {
  describe("preventPathTraversal()", () => {
    it("deve lançar erro para path traversal com ../", () => {
      expect(() => SecurityUtil.preventPathTraversal("../etc/passwd")).toThrow(BadRequestException);
    });

    it("deve lançar erro para path traversal com ..\\ (windows)", () => {
      expect(() => SecurityUtil.preventPathTraversal("..\\etc\\passwd")).toThrow(
        BadRequestException,
      );
    });

    it("deve lançar erro para caracter nulo", () => {
      expect(() => SecurityUtil.preventPathTraversal("arquivo\0.jpg")).toThrow(BadRequestException);
    });

    it("deve lançar erro para caminho absoluto com /", () => {
      expect(() => SecurityUtil.preventPathTraversal("/etc/passwd")).toThrow(BadRequestException);
    });

    it("deve lançar erro para caminho absoluto com \\", () => {
      expect(() => SecurityUtil.preventPathTraversal("\\windows\\system32")).toThrow(
        BadRequestException,
      );
    });

    it("não deve lançar erro para nome de arquivo válido", () => {
      expect(() => SecurityUtil.preventPathTraversal("foto.jpg")).not.toThrow();
      expect(() => SecurityUtil.preventPathTraversal("documento-2024.pdf")).not.toThrow();
    });

    it("não deve lançar erro para caminho relativo simples", () => {
      expect(() => SecurityUtil.preventPathTraversal("images/foto.jpg")).not.toThrow();
    });
  });

  describe("isSafeFilename()", () => {
    it("deve retornar true para nome seguro", () => {
      expect(SecurityUtil.isSafeFilename("arquivo.jpg")).toBe(true);
      expect(SecurityUtil.isSafeFilename("foto_2024.png")).toBe(true);
      expect(SecurityUtil.isSafeFilename("doc-final.pdf")).toBe(true);
    });

    it("deve retornar false para espaços", () => {
      expect(SecurityUtil.isSafeFilename("meu arquivo.jpg")).toBe(false);
    });

    it("deve retornar false para caracteres especiais", () => {
      expect(SecurityUtil.isSafeFilename("arquivo!.jpg")).toBe(false);
      expect(SecurityUtil.isSafeFilename("arquivo@2024.jpg")).toBe(false);
      expect(SecurityUtil.isSafeFilename("arquivo#.jpg")).toBe(false);
    });

    it("deve retornar false para string vazia", () => {
      expect(SecurityUtil.isSafeFilename("")).toBe(false);
    });
  });

  describe("sanitizeFilename()", () => {
    it("deve substituir caracteres especiais por underscore", () => {
      const result = SecurityUtil.sanitizeFilename("arquivo!@#.jpg");
      expect(result).not.toContain("!");
      expect(result).not.toContain("@");
      expect(result).not.toContain("#");
    });

    it("deve substituir espaços por underscore", () => {
      const result = SecurityUtil.sanitizeFilename("meu arquivo.jpg");
      expect(result).not.toContain(" ");
    });

    it("deve remover múltiplos underscores consecutivos", () => {
      const result = SecurityUtil.sanitizeFilename("arquivo___teste.jpg");
      expect(result).not.toContain("___");
    });

    it("deve remover pontos e underscores do início", () => {
      const result = SecurityUtil.sanitizeFilename("..arquivo.jpg");
      expect(result[0]).not.toBe(".");
    });

    it("deve preservar extensão do arquivo", () => {
      const result = SecurityUtil.sanitizeFilename("arquivo valido.jpg");
      expect(result).toMatch(/\.jpg$/);
    });

    it("deve truncar nome muito longo", () => {
      const longName = "a".repeat(300) + ".jpg";
      const result = SecurityUtil.sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it("deve retornar unnamed para string vazia", () => {
      const result = SecurityUtil.sanitizeFilename("...");
      expect(result).toBe("unnamed");
    });
  });

  describe("validateExtensionMatchesMimeType()", () => {
    it("deve retornar true para .jpg com image/jpeg", () => {
      expect(SecurityUtil.validateExtensionMatchesMimeType("foto.jpg", "image/jpeg")).toBe(true);
    });

    it("deve retornar true para .jpeg com image/jpeg", () => {
      expect(SecurityUtil.validateExtensionMatchesMimeType("foto.jpeg", "image/jpeg")).toBe(true);
    });

    it("deve retornar true para .png com image/png", () => {
      expect(SecurityUtil.validateExtensionMatchesMimeType("imagem.png", "image/png")).toBe(true);
    });

    it("deve retornar true para .pdf com application/pdf", () => {
      expect(SecurityUtil.validateExtensionMatchesMimeType("doc.pdf", "application/pdf")).toBe(
        true,
      );
    });

    it("deve retornar false para extensão não correspondendo ao MIME", () => {
      expect(SecurityUtil.validateExtensionMatchesMimeType("foto.jpg", "application/pdf")).toBe(
        false,
      );
    });

    it("deve retornar false para extensão desconhecida", () => {
      expect(SecurityUtil.validateExtensionMatchesMimeType("arquivo.xyz", "image/jpeg")).toBe(
        false,
      );
    });

    it("deve retornar false para arquivo sem extensão", () => {
      expect(SecurityUtil.validateExtensionMatchesMimeType("arquivo", "image/jpeg")).toBe(false);
    });

    it("deve ser case-insensitive na extensão", () => {
      expect(SecurityUtil.validateExtensionMatchesMimeType("FOTO.JPG", "image/jpeg")).toBe(true);
    });
  });

  describe("generateSafeFilename()", () => {
    it("deve gerar nome com uuid e extensão do original", () => {
      const result = SecurityUtil.generateSafeFilename("foto.jpg", "uuid-123");
      expect(result).toBe("uuid-123.jpg");
    });

    it("deve preservar extensão .png", () => {
      const result = SecurityUtil.generateSafeFilename("imagem.png", "uuid-456");
      expect(result).toBe("uuid-456.png");
    });

    it("deve preservar extensão .pdf", () => {
      const result = SecurityUtil.generateSafeFilename("doc.pdf", "uuid-789");
      expect(result).toBe("uuid-789.pdf");
    });

    it("deve retornar apenas uuid sem extensão para arquivo sem ext", () => {
      const result = SecurityUtil.generateSafeFilename("arquivo", "uuid-000");
      expect(result).toBe("uuid-000");
    });
  });

  describe("validateFileSize()", () => {
    it("não deve lançar erro para arquivo dentro do limite", () => {
      expect(() => SecurityUtil.validateFileSize(1024, 5 * 1024 * 1024)).not.toThrow();
    });

    it("deve lançar erro para arquivo acima do limite", () => {
      expect(() => SecurityUtil.validateFileSize(6 * 1024 * 1024, 5 * 1024 * 1024)).toThrow(
        BadRequestException,
      );
    });

    it("deve lançar erro para arquivo vazio (size = 0)", () => {
      expect(() => SecurityUtil.validateFileSize(0, 5 * 1024 * 1024)).toThrow(BadRequestException);
    });

    it("não deve lançar erro para arquivo no limite exato", () => {
      const maxSize = 5 * 1024 * 1024;
      expect(() => SecurityUtil.validateFileSize(maxSize, maxSize)).not.toThrow();
    });
  });

  describe("validateMimeType()", () => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    it("não deve lançar erro para MIME type permitido", () => {
      expect(() => SecurityUtil.validateMimeType("image/jpeg", allowedTypes)).not.toThrow();
      expect(() => SecurityUtil.validateMimeType("application/pdf", allowedTypes)).not.toThrow();
    });

    it("deve lançar erro para MIME type não permitido", () => {
      expect(() => SecurityUtil.validateMimeType("video/mp4", allowedTypes)).toThrow(
        BadRequestException,
      );
    });

    it("deve lançar erro com mensagem contendo tipos permitidos", () => {
      try {
        SecurityUtil.validateMimeType("video/mp4", allowedTypes);
      } catch (e) {
        expect((e as BadRequestException).message).toContain("image/jpeg");
      }
    });
  });

  describe("shouldRemoveExifData()", () => {
    it("deve retornar true para image/jpeg", () => {
      expect(SecurityUtil.shouldRemoveExifData("image/jpeg")).toBe(true);
    });

    it("deve retornar true para image/png", () => {
      expect(SecurityUtil.shouldRemoveExifData("image/png")).toBe(true);
    });

    it("deve retornar false para image/svg+xml", () => {
      expect(SecurityUtil.shouldRemoveExifData("image/svg+xml")).toBe(false);
    });

    it("deve retornar false para application/pdf", () => {
      expect(SecurityUtil.shouldRemoveExifData("application/pdf")).toBe(false);
    });

    it("deve retornar false para video/mp4", () => {
      expect(SecurityUtil.shouldRemoveExifData("video/mp4")).toBe(false);
    });
  });
});
