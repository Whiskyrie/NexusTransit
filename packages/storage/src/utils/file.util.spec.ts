import { FileUtil } from "./file.util";

describe("FileUtil", () => {
  describe("sanitizeFileName()", () => {
    it("deve remover caracteres especiais", () => {
      const result = FileUtil.sanitizeFileName("meu arquivo!@#.jpg");
      expect(result).not.toContain("!");
      expect(result).not.toContain("@");
      expect(result).not.toContain("#");
    });

    it("deve substituir espaços por underscore", () => {
      const result = FileUtil.sanitizeFileName("meu arquivo.jpg");
      expect(result).not.toContain(" ");
    });

    it("deve preservar extensão do arquivo", () => {
      const result = FileUtil.sanitizeFileName("foto.jpg");
      expect(result).toContain(".jpg");
    });

    it("deve lidar com nomes sem extensão", () => {
      const result = FileUtil.sanitizeFileName("arquivo");
      expect(result).toBeTruthy();
    });
  });

  describe("generateUniqueFileName()", () => {
    it("deve gerar nome único diferente do original", () => {
      const result = FileUtil.generateUniqueFileName("foto.jpg");
      expect(result).not.toBe("foto.jpg");
    });

    it("deve preservar a extensão do arquivo original", () => {
      const result = FileUtil.generateUniqueFileName("foto.jpg");
      expect(result).toMatch(/\.jpg$/);
    });

    it("deve preservar extensão .png", () => {
      const result = FileUtil.generateUniqueFileName("imagem.png");
      expect(result).toMatch(/\.png$/);
    });

    it("deve preservar extensão .pdf", () => {
      const result = FileUtil.generateUniqueFileName("doc.pdf");
      expect(result).toMatch(/\.pdf$/);
    });

    it("deve gerar nomes diferentes em chamadas sucessivas", () => {
      const name1 = FileUtil.generateUniqueFileName("foto.jpg");
      const name2 = FileUtil.generateUniqueFileName("foto.jpg");
      expect(name1).not.toBe(name2);
    });
  });

  describe("generateFilePath()", () => {
    it("deve gerar caminho com basePath, tipo e data", () => {
      const result = FileUtil.generateFilePath("base", "images", "arquivo.jpg");
      const now = new Date();
      const year = now.getFullYear().toString();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");

      expect(result).toContain("base");
      expect(result).toContain("images");
      expect(result).toContain(year);
      expect(result).toContain(month);
      expect(result).toContain(day);
      expect(result).toContain("arquivo.jpg");
    });

    it("deve gerar caminho correto para tipo documents", () => {
      const result = FileUtil.generateFilePath("", "documents", "doc.pdf");
      expect(result).toContain("documents");
    });

    it("deve gerar caminho correto para tipo proofs", () => {
      const result = FileUtil.generateFilePath("", "proofs", "prova.jpg");
      expect(result).toContain("proofs");
    });

    it("deve gerar caminho correto para tipo temp", () => {
      const result = FileUtil.generateFilePath("", "temp", "tmp.png");
      expect(result).toContain("temp");
    });
  });

  describe("getFileExtension()", () => {
    it("deve retornar extensão em lowercase", () => {
      expect(FileUtil.getFileExtension("FOTO.JPG")).toBe(".jpg");
      expect(FileUtil.getFileExtension("imagem.PNG")).toBe(".png");
    });

    it("deve retornar .jpg para arquivo .jpg", () => {
      expect(FileUtil.getFileExtension("arquivo.jpg")).toBe(".jpg");
    });

    it("deve retornar .pdf para arquivo .pdf", () => {
      expect(FileUtil.getFileExtension("documento.pdf")).toBe(".pdf");
    });

    it("deve retornar string vazia para arquivo sem extensão", () => {
      expect(FileUtil.getFileExtension("arquivo")).toBe("");
    });

    it("deve lidar com nome de arquivo com múltiplos pontos", () => {
      expect(FileUtil.getFileExtension("arquivo.backup.jpg")).toBe(".jpg");
    });
  });

  describe("getMimeTypeFromExtension()", () => {
    it("deve retornar image/jpeg para .jpg", () => {
      expect(FileUtil.getMimeTypeFromExtension(".jpg")).toBe("image/jpeg");
    });

    it("deve retornar image/jpeg para .jpeg", () => {
      expect(FileUtil.getMimeTypeFromExtension(".jpeg")).toBe("image/jpeg");
    });

    it("deve retornar image/png para .png", () => {
      expect(FileUtil.getMimeTypeFromExtension(".png")).toBe("image/png");
    });

    it("deve retornar image/webp para .webp", () => {
      expect(FileUtil.getMimeTypeFromExtension(".webp")).toBe("image/webp");
    });

    it("deve retornar application/pdf para .pdf", () => {
      expect(FileUtil.getMimeTypeFromExtension(".pdf")).toBe("application/pdf");
    });

    it("deve retornar video/mp4 para .mp4", () => {
      expect(FileUtil.getMimeTypeFromExtension(".mp4")).toBe("video/mp4");
    });

    it("deve retornar application/octet-stream para extensão desconhecida", () => {
      expect(FileUtil.getMimeTypeFromExtension(".xyz")).toBe("application/octet-stream");
    });

    it("deve ser case-insensitive", () => {
      expect(FileUtil.getMimeTypeFromExtension(".JPG")).toBe("image/jpeg");
    });
  });

  describe("isImageFile()", () => {
    it("deve retornar true para image/jpeg", () => {
      expect(FileUtil.isImageFile("image/jpeg")).toBe(true);
    });

    it("deve retornar true para image/png", () => {
      expect(FileUtil.isImageFile("image/png")).toBe(true);
    });

    it("deve retornar true para image/webp", () => {
      expect(FileUtil.isImageFile("image/webp")).toBe(true);
    });

    it("deve retornar false para application/pdf", () => {
      expect(FileUtil.isImageFile("application/pdf")).toBe(false);
    });

    it("deve retornar false para video/mp4", () => {
      expect(FileUtil.isImageFile("video/mp4")).toBe(false);
    });
  });

  describe("isDocumentFile()", () => {
    it("deve retornar true para application/pdf", () => {
      expect(FileUtil.isDocumentFile("application/pdf")).toBe(true);
    });

    it("deve retornar true para application/msword", () => {
      expect(FileUtil.isDocumentFile("application/msword")).toBe(true);
    });

    it("deve retornar true para .docx MIME type", () => {
      expect(
        FileUtil.isDocumentFile(
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
      ).toBe(true);
    });

    it("deve retornar false para image/jpeg", () => {
      expect(FileUtil.isDocumentFile("image/jpeg")).toBe(false);
    });
  });

  describe("isVideoFile()", () => {
    it("deve retornar true para video/mp4", () => {
      expect(FileUtil.isVideoFile("video/mp4")).toBe(true);
    });

    it("deve retornar true para video/quicktime", () => {
      expect(FileUtil.isVideoFile("video/quicktime")).toBe(true);
    });

    it("deve retornar false para image/jpeg", () => {
      expect(FileUtil.isVideoFile("image/jpeg")).toBe(false);
    });
  });

  describe("generatePublicUrl()", () => {
    it("deve concatenar baseUrl e filePath", () => {
      const result = FileUtil.generatePublicUrl("http://localhost:3000/uploads", "images/foto.jpg");
      expect(result).toBe("http://localhost:3000/uploads/images/foto.jpg");
    });

    it("deve funcionar com URLs de produção", () => {
      const result = FileUtil.generatePublicUrl(
        "https://cdn.example.com",
        "documents/2024/01/doc.pdf",
      );
      expect(result).toBe("https://cdn.example.com/documents/2024/01/doc.pdf");
    });
  });

  describe("extractKeyFromUrl()", () => {
    it("deve extrair chave removendo baseUrl", () => {
      const result = FileUtil.extractKeyFromUrl(
        "http://localhost:3000/uploads/images/foto.jpg",
        "http://localhost:3000/uploads",
      );
      expect(result).toBe("images/foto.jpg");
    });

    it("deve remover barra inicial se houver", () => {
      const result = FileUtil.extractKeyFromUrl(
        "http://localhost:3000/uploads/foto.jpg",
        "http://localhost:3000/uploads",
      );
      expect(result).toBe("foto.jpg");
    });
  });
});
