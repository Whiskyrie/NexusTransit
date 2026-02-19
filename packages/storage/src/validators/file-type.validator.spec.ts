import { ValidationArguments } from "class-validator";
import {
  IsValidFileTypeConstraint,
  IsValidFileType,
  normalizeFileExtension,
  isValidFileExtension,
} from "./file-type.validator";
import type { StorageConfig } from "../config/storage.config";

const makeStorageConfig = (overrides?: Partial<StorageConfig["upload"]>): StorageConfig => ({
  provider: { type: "local" },
  backblaze: {
    endpoint: "https://s3.us-east-005.backblazeb2.com",
    region: "us-east-005",
    accessKeyId: "key",
    secretAccessKey: "secret",
    bucket: "bucket",
    bucketRegion: "us-east-005",
  },
  upload: {
    maxFileSize: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf"],
    imageQuality: 85,
    thumbnailSizes: {
      small: { width: 150, height: 150 },
      medium: { width: 400, height: 400 },
      large: { width: 800, height: 600 },
    },
    ...overrides,
  },
});

const makeArgs = (storageConfig: StorageConfig): ValidationArguments =>
  ({
    object: { storageConfig },
    property: "file",
    value: undefined,
    targetName: "UploadFileDto",
    constraints: [],
  }) as unknown as ValidationArguments;

describe("IsValidFileTypeConstraint", () => {
  let constraint: IsValidFileTypeConstraint;

  beforeEach(() => {
    constraint = new IsValidFileTypeConstraint();
  });

  describe("validate()", () => {
    it("deve retornar true para MIME type e extensão válidos", () => {
      const file = {
        mimetype: "image/jpeg",
        originalname: "foto.jpg",
        size: 1024,
      } as Express.Multer.File;

      const args = makeArgs(makeStorageConfig());
      expect(constraint.validate(file, args)).toBe(true);
    });

    it("deve retornar true para .jpeg (extensão alternativa de JPEG)", () => {
      const file = {
        mimetype: "image/jpeg",
        originalname: "foto.jpeg",
        size: 1024,
      } as Express.Multer.File;

      const args = makeArgs(makeStorageConfig());
      expect(constraint.validate(file, args)).toBe(true);
    });

    it("deve retornar true para application/pdf com extensão .pdf", () => {
      const file = {
        mimetype: "application/pdf",
        originalname: "documento.pdf",
        size: 2048,
      } as Express.Multer.File;

      const args = makeArgs(makeStorageConfig());
      expect(constraint.validate(file, args)).toBe(true);
    });

    it("deve retornar false quando MIME type não permitido", () => {
      const file = {
        mimetype: "video/mp4",
        originalname: "video.mp4",
        size: 1024,
      } as Express.Multer.File;

      const args = makeArgs(makeStorageConfig());
      expect(constraint.validate(file, args)).toBe(false);
    });

    it("deve retornar false quando extensão não permitida mas MIME válido", () => {
      const file = {
        mimetype: "image/jpeg",
        originalname: "foto.bmp",
        size: 1024,
      } as Express.Multer.File;

      const args = makeArgs(makeStorageConfig());
      expect(constraint.validate(file, args)).toBe(false);
    });

    it("deve retornar false quando arquivo é null", () => {
      const args = makeArgs(makeStorageConfig());
      expect(constraint.validate(null as unknown as Express.Multer.File, args)).toBe(false);
    });

    it("deve retornar false quando arquivo não tem mimetype", () => {
      const file = {
        originalname: "foto.jpg",
        size: 1024,
      } as Express.Multer.File;

      const args = makeArgs(makeStorageConfig());
      expect(constraint.validate(file, args)).toBe(false);
    });

    it("deve retornar false quando arquivo não tem originalname", () => {
      const file = {
        mimetype: "image/jpeg",
        size: 1024,
      } as Express.Multer.File;

      const args = makeArgs(makeStorageConfig());
      expect(constraint.validate(file, args)).toBe(false);
    });

    it("deve usar listas vazias quando storageConfig não informado", () => {
      const file = {
        mimetype: "image/jpeg",
        originalname: "foto.jpg",
        size: 1024,
      } as Express.Multer.File;

      const args = {
        object: {},
        property: "file",
        value: undefined,
        targetName: "UploadFileDto",
        constraints: [],
      } as unknown as ValidationArguments;

      expect(constraint.validate(file, args)).toBe(false);
    });

    it("deve ser case-insensitive na extensão do arquivo", () => {
      const file = {
        mimetype: "image/jpeg",
        originalname: "FOTO.JPG",
        size: 1024,
      } as Express.Multer.File;

      const args = makeArgs(makeStorageConfig());
      expect(constraint.validate(file, args)).toBe(true);
    });
  });

  describe("defaultMessage()", () => {
    it("deve retornar mensagem com tipos permitidos", () => {
      const args = makeArgs(makeStorageConfig());
      const message = constraint.defaultMessage(args);
      expect(message).toContain("image/jpeg");
      expect(message).toContain("image/png");
      expect(message).toContain("application/pdf");
    });

    it("deve retornar mensagem com string vazia quando sem config", () => {
      const args = {
        object: {},
        constraints: [],
        property: "file",
        value: undefined,
        targetName: "UploadFileDto",
      } as unknown as ValidationArguments;
      const message = constraint.defaultMessage(args);
      expect(message).toContain("Invalid file type");
    });
  });
});

describe("IsValidFileType decorator", () => {
  it("deve registrar o decorator sem erros", () => {
    class TestDto {
      file: Express.Multer.File = null as unknown as Express.Multer.File;
    }

    expect(() => {
      const decoratorFn = IsValidFileType();
      decoratorFn(new TestDto(), "file");
    }).not.toThrow();
  });
});

describe("normalizeFileExtension()", () => {
  it("deve converter extensão para lowercase", () => {
    expect(normalizeFileExtension(".JPG")).toBe(".jpg");
    expect(normalizeFileExtension(".PNG")).toBe(".png");
  });

  it("deve remover espaços", () => {
    expect(normalizeFileExtension(" .jpg ")).toBe(".jpg");
  });

  it("deve retornar string vazia para entrada vazia", () => {
    expect(normalizeFileExtension("")).toBe("");
  });

  it("deve retornar string vazia para entrada null/undefined", () => {
    expect(normalizeFileExtension(null as unknown as string)).toBe("");
    expect(normalizeFileExtension(undefined as unknown as string)).toBe("");
  });
});

describe("isValidFileExtension()", () => {
  const allowed = [".jpg", ".jpeg", ".png", ".pdf"];

  it("deve retornar true para extensões permitidas", () => {
    expect(isValidFileExtension(".jpg", allowed)).toBe(true);
    expect(isValidFileExtension(".png", allowed)).toBe(true);
    expect(isValidFileExtension(".pdf", allowed)).toBe(true);
  });

  it("deve retornar false para extensões não permitidas", () => {
    expect(isValidFileExtension(".mp4", allowed)).toBe(false);
    expect(isValidFileExtension(".exe", allowed)).toBe(false);
  });

  it("deve ser case-insensitive", () => {
    expect(isValidFileExtension(".JPG", allowed)).toBe(true);
    expect(isValidFileExtension(".PNG", allowed)).toBe(true);
  });

  it("deve retornar false para extensão vazia", () => {
    expect(isValidFileExtension("", allowed)).toBe(false);
  });
});
