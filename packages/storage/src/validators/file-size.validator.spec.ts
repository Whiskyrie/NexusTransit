import { ValidationArguments } from "class-validator";
import {
  IsValidFileSizeConstraint,
  IsValidFileSize,
  bytesToMB,
  mbToBytes,
} from "./file-size.validator";
import type { StorageConfig } from "../config/storage.config";

const makeStorageConfig = (maxFileSize = 5 * 1024 * 1024): StorageConfig => ({
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
    maxFileSize,
    allowedMimeTypes: ["image/jpeg"],
    allowedExtensions: [".jpg"],
    imageQuality: 85,
    thumbnailSizes: {
      small: { width: 150, height: 150 },
      medium: { width: 400, height: 400 },
      large: { width: 800, height: 600 },
    },
  },
});

const makeArgs = (storageConfig?: StorageConfig): ValidationArguments =>
  ({
    object: storageConfig ? { storageConfig } : {},
    property: "file",
    value: undefined,
    targetName: "UploadFileDto",
    constraints: [],
  }) as unknown as ValidationArguments;

describe("IsValidFileSizeConstraint", () => {
  let constraint: IsValidFileSizeConstraint;
  const fiveMB = 5 * 1024 * 1024;

  beforeEach(() => {
    constraint = new IsValidFileSizeConstraint();
  });

  describe("validate()", () => {
    it("deve retornar true para arquivo dentro do limite", () => {
      const file = { size: 1 * 1024 * 1024 } as Express.Multer.File;
      expect(constraint.validate(file, makeArgs(makeStorageConfig(fiveMB)))).toBe(true);
    });

    it("deve retornar true para arquivo no limite exato", () => {
      const file = { size: fiveMB } as Express.Multer.File;
      expect(constraint.validate(file, makeArgs(makeStorageConfig(fiveMB)))).toBe(true);
    });

    it("deve retornar false para arquivo acima do limite", () => {
      const file = { size: fiveMB + 1 } as Express.Multer.File;
      expect(constraint.validate(file, makeArgs(makeStorageConfig(fiveMB)))).toBe(false);
    });

    it("deve retornar false quando arquivo é null", () => {
      expect(
        constraint.validate(null as unknown as Express.Multer.File, makeArgs(makeStorageConfig())),
      ).toBe(false);
    });

    it("deve retornar false quando size é 0 (falsy)", () => {
      const file = { size: 0 } as Express.Multer.File;
      expect(constraint.validate(file, makeArgs(makeStorageConfig()))).toBe(false);
    });

    it("deve usar 5MB como default quando storageConfig não informado", () => {
      const fileDentroDoDefault = { size: 4 * 1024 * 1024 } as Express.Multer.File;
      expect(constraint.validate(fileDentroDoDefault, makeArgs())).toBe(true);

      const fileAcimaDoDefault = { size: 6 * 1024 * 1024 } as Express.Multer.File;
      expect(constraint.validate(fileAcimaDoDefault, makeArgs())).toBe(false);
    });

    it("deve respeitar limite customizado (10MB)", () => {
      const tenMB = 10 * 1024 * 1024;
      const file = { size: 8 * 1024 * 1024 } as Express.Multer.File;
      expect(constraint.validate(file, makeArgs(makeStorageConfig(tenMB)))).toBe(true);
    });
  });

  describe("defaultMessage()", () => {
    it("deve retornar mensagem com tamanho máximo em MB", () => {
      const message = constraint.defaultMessage(makeArgs(makeStorageConfig(fiveMB)));
      expect(message).toContain("5");
      expect(message).toContain("MB");
    });

    it("deve usar 5MB como default quando storageConfig não informado", () => {
      const message = constraint.defaultMessage(makeArgs());
      expect(message).toContain("5");
    });

    it("deve retornar mensagem para 10MB quando configurado assim", () => {
      const message = constraint.defaultMessage(makeArgs(makeStorageConfig(10 * 1024 * 1024)));
      expect(message).toContain("10");
    });
  });
});

describe("IsValidFileSize decorator", () => {
  it("deve registrar o decorator sem erros", () => {
    class TestDto {
      file: Express.Multer.File = null as unknown as Express.Multer.File;
    }

    expect(() => {
      const decoratorFn = IsValidFileSize();
      decoratorFn(new TestDto(), "file");
    }).not.toThrow();
  });
});

describe("bytesToMB()", () => {
  it("deve converter 1MB corretamente", () => {
    expect(bytesToMB(1024 * 1024)).toBe(1);
  });

  it("deve converter 5MB corretamente", () => {
    expect(bytesToMB(5 * 1024 * 1024)).toBe(5);
  });

  it("deve retornar decimal para valores fracionais", () => {
    expect(bytesToMB(512 * 1024)).toBe(0.5);
  });

  it("deve retornar 0 para 0 bytes", () => {
    expect(bytesToMB(0)).toBe(0);
  });
});

describe("mbToBytes()", () => {
  it("deve converter 1MB para bytes corretamente", () => {
    expect(mbToBytes(1)).toBe(1024 * 1024);
  });

  it("deve converter 5MB para bytes corretamente", () => {
    expect(mbToBytes(5)).toBe(5 * 1024 * 1024);
  });

  it("deve ser inverso de bytesToMB", () => {
    const originalBytes = 3 * 1024 * 1024;
    expect(mbToBytes(bytesToMB(originalBytes))).toBe(originalBytes);
  });
});
