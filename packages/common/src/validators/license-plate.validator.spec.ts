import {
  IsLicensePlateConstraint,
  normalizeLicensePlate,
  formatLicensePlate,
  isMercosulPlate,
  isOldFormatPlate,
  IsLicensePlate,
} from "./license-plate.validator";
import { validate } from "class-validator";

class TestDto {
  @IsLicensePlate()
  plate!: string;
}

describe("License Plate Validator", () => {
  let validator: IsLicensePlateConstraint;

  beforeEach(() => {
    validator = new IsLicensePlateConstraint();
  });

  describe("IsLicensePlateConstraint", () => {
    describe("Placas válidas - Formato Antigo", () => {
      it("deve validar placa antiga sem formatação", () => {
        expect(validator.validate("ABC1234")).toBe(true);
        expect(validator.validate("XYZ9876")).toBe(true);
      });

      it("deve validar placa antiga com formatação", () => {
        expect(validator.validate("ABC-1234")).toBe(true);
        expect(validator.validate("XYZ-9876")).toBe(true);
      });

      it("deve aceitar letras minúsculas", () => {
        expect(validator.validate("abc-1234")).toBe(true);
        expect(validator.validate("xyz9876")).toBe(true);
      });
    });

    describe("Placas válidas - Formato Mercosul", () => {
      it("deve validar placa Mercosul sem formatação", () => {
        expect(validator.validate("ABC1D23")).toBe(true);
        expect(validator.validate("XYZ9A87")).toBe(true);
      });

      it("deve validar placa Mercosul com formatação", () => {
        expect(validator.validate("ABC-1D23")).toBe(true);
        expect(validator.validate("XYZ-9A87")).toBe(true);
      });
    });

    describe("Placas inválidas", () => {
      it("deve rejeitar placa com comprimento incorreto", () => {
        expect(validator.validate("ABC123")).toBe(false); // 6 caracteres
        expect(validator.validate("ABC12345")).toBe(false); // 8 caracteres
        expect(validator.validate("")).toBe(false);
      });

      it("deve rejeitar placa com formato incorreto", () => {
        expect(validator.validate("1234ABC")).toBe(false); // números primeiro
        expect(validator.validate("ABCD123")).toBe(false); // 4 letras
        expect(validator.validate("AB12345")).toBe(false); // 2 letras
      });

      it("deve rejeitar placa com caracteres especiais", () => {
        expect(validator.validate("ABC@123")).toBe(false);
        expect(validator.validate("ABC#1D2")).toBe(false);
      });

      it("deve rejeitar valor null/undefined/empty", () => {
        expect(validator.validate(null as unknown as string)).toBe(false);
        expect(validator.validate(undefined as unknown as string)).toBe(false);
        expect(validator.validate("")).toBe(false);
      });

      it("deve rejeitar padrão Mercosul incorreto", () => {
        expect(validator.validate("ABCA123")).toBe(false); // letra na posição 4
        expect(validator.validate("ABC12D3")).toBe(false); // letra na posição 6
      });
    });

    describe("defaultMessage", () => {
      it("deve retornar mensagem padrão", () => {
        const message = validator.defaultMessage();
        expect(message).toContain("brasileiro válido");
      });
    });
  });

  describe("normalizeLicensePlate", () => {
    it("deve remover formatação e converter para maiúsculas", () => {
      expect(normalizeLicensePlate("abc-1234")).toBe("ABC1234");
      expect(normalizeLicensePlate("xyz-9a87")).toBe("XYZ9A87");
    });

    it("deve remover espaços", () => {
      expect(normalizeLicensePlate("ABC 1234")).toBe("ABC1234");
      expect(normalizeLicensePlate("ABC - 1234")).toBe("ABC1234");
    });

    it("deve retornar placa já normalizada", () => {
      expect(normalizeLicensePlate("ABC1234")).toBe("ABC1234");
    });

    it("deve retornar string vazia para input vazio", () => {
      expect(normalizeLicensePlate("")).toBe("");
      expect(normalizeLicensePlate(null as unknown as string)).toBe("");
      expect(normalizeLicensePlate(undefined as unknown as string)).toBe("");
    });
  });

  describe("formatLicensePlate", () => {
    it("deve formatar placa sem formatação", () => {
      expect(formatLicensePlate("ABC1234")).toBe("ABC-1234");
      expect(formatLicensePlate("XYZ9A87")).toBe("XYZ-9A87");
    });

    it("deve normalizar e formatar placa minúscula", () => {
      expect(formatLicensePlate("abc1234")).toBe("ABC-1234");
      expect(formatLicensePlate("xyz9a87")).toBe("XYZ-9A87");
    });

    it("deve retornar placa já formatada", () => {
      expect(formatLicensePlate("ABC-1234")).toBe("ABC-1234");
    });

    it("deve retornar input original se comprimento incorreto", () => {
      expect(formatLicensePlate("ABC123")).toBe("ABC123");
      expect(formatLicensePlate("")).toBe("");
    });

    it("deve reformatar placa com espaços", () => {
      expect(formatLicensePlate("ABC 1234")).toBe("ABC-1234");
    });
  });

  describe("isMercosulPlate", () => {
    it("deve identificar placa Mercosul corretamente", () => {
      expect(isMercosulPlate("ABC1D23")).toBe(true);
      expect(isMercosulPlate("XYZ9A87")).toBe(true);
      expect(isMercosulPlate("ABC-1D23")).toBe(true);
    });

    it("deve retornar false para placa antiga", () => {
      expect(isMercosulPlate("ABC1234")).toBe(false);
      expect(isMercosulPlate("XYZ9876")).toBe(false);
    });

    it("deve retornar false para placa inválida", () => {
      expect(isMercosulPlate("ABCD123")).toBe(false);
      expect(isMercosulPlate("")).toBe(false);
    });
  });

  describe("isOldFormatPlate", () => {
    it("deve identificar placa antiga corretamente", () => {
      expect(isOldFormatPlate("ABC1234")).toBe(true);
      expect(isOldFormatPlate("XYZ9876")).toBe(true);
      expect(isOldFormatPlate("ABC-1234")).toBe(true);
    });

    it("deve retornar false para placa Mercosul", () => {
      expect(isOldFormatPlate("ABC1D23")).toBe(false);
      expect(isOldFormatPlate("XYZ9A87")).toBe(false);
    });

    it("deve retornar false para placa inválida", () => {
      expect(isOldFormatPlate("ABCD123")).toBe(false);
      expect(isOldFormatPlate("")).toBe(false);
    });
  });

  describe("IsLicensePlate Decorator", () => {
    it("deve validar placa através do decorator", async () => {
      const dto = new TestDto();
      dto.plate = "ABC-1234";

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("deve rejeitar placa inválida através do decorator", async () => {
      const dto = new TestDto();
      dto.plate = "INVALID";

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
