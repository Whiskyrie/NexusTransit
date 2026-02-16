import { IsCNHConstraint, normalizeCNH, IsCNH } from "./cnh.validator";
import { validate } from "class-validator";

class TestDto {
  @IsCNH()
  cnh!: string;
}

describe("CNH Validator", () => {
  let validator: IsCNHConstraint;

  beforeEach(() => {
    validator = new IsCNHConstraint();
  });

  describe("IsCNHConstraint", () => {
    describe("CNHs válidas", () => {
      it("deve validar CNH válida sem formatação", () => {
        // CNHs geradas com o algoritmo correto
        expect(validator.validate("12345678900")).toBe(true);
        expect(validator.validate("04958898096")).toBe(true);
        expect(validator.validate("80732154662")).toBe(true);
        expect(validator.validate("52719836059")).toBe(true);
      });

      it("deve validar CNH com formatação", () => {
        expect(validator.validate("049.588.980-96")).toBe(true);
      });
    });

    describe("CNHs inválidas", () => {
      it("deve rejeitar CNH com todos dígitos iguais", () => {
        expect(validator.validate("00000000000")).toBe(false);
        expect(validator.validate("11111111111")).toBe(false);
        expect(validator.validate("99999999999")).toBe(false);
      });

      it("deve rejeitar CNH com comprimento incorreto", () => {
        expect(validator.validate("123456789")).toBe(false); // 9 dígitos
        expect(validator.validate("123456789012")).toBe(false); // 12 dígitos
        expect(validator.validate("")).toBe(false);
      });

      it("deve rejeitar CNH com dígitos verificadores incorretos", () => {
        expect(validator.validate("04958898097")).toBe(false); // último dígito errado
        expect(validator.validate("12345678901")).toBe(false); // deveria ser 00
      });

      it("deve rejeitar valor null/undefined", () => {
        expect(validator.validate(null as unknown as string)).toBe(false);
        expect(validator.validate(undefined as unknown as string)).toBe(false);
      });

      it("deve rejeitar tipo não string", () => {
        expect(validator.validate(1234567890 as unknown as string)).toBe(false);
      });
    });

    describe("defaultMessage", () => {
      it("deve retornar mensagem padrão", () => {
        expect(validator.defaultMessage()).toBe("CNH deve estar em formato válido");
      });
    });
  });

  describe("normalizeCNH", () => {
    it("deve remover formatação da CNH", () => {
      expect(normalizeCNH("049.588.980-96")).toBe("04958898096");
      expect(normalizeCNH("123-456-789-00")).toBe("12345678900");
    });

    it("deve manter CNH sem formatação", () => {
      expect(normalizeCNH("04958898096")).toBe("04958898096");
    });

    it("deve retornar string vazia para input vazio", () => {
      expect(normalizeCNH("")).toBe("");
      expect(normalizeCNH(null as unknown as string)).toBe("");
      expect(normalizeCNH(undefined as unknown as string)).toBe("");
    });

    it("deve remover caracteres especiais diversos", () => {
      expect(normalizeCNH("049.588.980/96")).toBe("04958898096");
      expect(normalizeCNH("049 588 980 96")).toBe("04958898096");
    });
  });

  describe("IsCNH Decorator", () => {
    it("deve validar CNH através do decorator", async () => {
      const dto = new TestDto();
      dto.cnh = "12345678900";

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("deve rejeitar CNH inválida através do decorator", async () => {
      const dto = new TestDto();
      dto.cnh = "00000000000";

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
