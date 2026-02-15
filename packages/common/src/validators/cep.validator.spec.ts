import { IsCEPConstraint, normalizeCEP, formatCEP, IsCEP } from "./cep.validator";
import { validate } from "class-validator";

class TestDto {
  @IsCEP()
  cep!: string;
}

describe("CEP Validator", () => {
  let validator: IsCEPConstraint;

  beforeEach(() => {
    validator = new IsCEPConstraint();
  });

  describe("IsCEPConstraint", () => {
    describe("CEPs válidos", () => {
      it("deve validar CEP válido sem formatação", () => {
        expect(validator.validate("01310100")).toBe(true); // Av. Paulista, SP
        expect(validator.validate("20040020")).toBe(true); // Centro, Rio
        expect(validator.validate("70040902")).toBe(true); // Brasília, DF
      });

      it("deve validar CEP válido com formatação", () => {
        expect(validator.validate("01310-100")).toBe(true);
        expect(validator.validate("20040-020")).toBe(true);
      });

      it("deve validar faixas de CEP válidas", () => {
        expect(validator.validate("01000001")).toBe(true); // Ajustado para mínimo válido + 1
        expect(validator.validate("99999998")).toBe(true); // Evitar CEP com todos dígitos iguais
      });
    });

    describe("CEPs inválidos", () => {
      it("deve rejeitar CEP com todos dígitos iguais", () => {
        expect(validator.validate("00000000")).toBe(false);
        expect(validator.validate("11111111")).toBe(false);
        expect(validator.validate("99999999")).toBe(false);
      });

      it("deve rejeitar CEP com comprimento incorreto", () => {
        expect(validator.validate("0131010")).toBe(false); // 7 dígitos
        expect(validator.validate("013101000")).toBe(false); // 9 dígitos
        expect(validator.validate("")).toBe(false);
      });

      it("deve rejeitar CEP fora da faixa válida", () => {
        expect(validator.validate("00999999")).toBe(false); // < 01000000
        expect(validator.validate("00500000")).toBe(false);
      });

      it("deve rejeitar valor null/undefined", () => {
        expect(validator.validate(null as unknown as string)).toBe(false);
        expect(validator.validate(undefined as unknown as string)).toBe(false);
      });

      it("deve rejeitar tipo não string", () => {
        expect(validator.validate(1310100 as unknown as string)).toBe(false);
      });
    });

    describe("defaultMessage", () => {
      it("deve retornar mensagem padrão", () => {
        expect(validator.defaultMessage()).toBe("CEP deve estar em formato válido");
      });
    });
  });

  describe("normalizeCEP", () => {
    it("deve remover formatação do CEP", () => {
      expect(normalizeCEP("01310-100")).toBe("01310100");
      expect(normalizeCEP("20040-020")).toBe("20040020");
    });

    it("deve manter CEP sem formatação", () => {
      expect(normalizeCEP("01310100")).toBe("01310100");
    });

    it("deve retornar string vazia para input vazio", () => {
      expect(normalizeCEP("")).toBe("");
      expect(normalizeCEP(null as unknown as string)).toBe("");
      expect(normalizeCEP(undefined as unknown as string)).toBe("");
    });

    it("deve remover caracteres especiais diversos", () => {
      expect(normalizeCEP("01310.100")).toBe("01310100");
      expect(normalizeCEP("01310 100")).toBe("01310100");
    });
  });

  describe("formatCEP", () => {
    it("deve formatar CEP sem formatação", () => {
      expect(formatCEP("01310100")).toBe("01310-100");
      expect(formatCEP("20040020")).toBe("20040-020");
    });

    it("deve retornar CEP já formatado", () => {
      expect(formatCEP("01310-100")).toBe("01310-100");
    });

    it("deve retornar input original se comprimento incorreto", () => {
      expect(formatCEP("0131010")).toBe("0131010");
      expect(formatCEP("")).toBe("");
    });

    it("deve normalizar e formatar CEP com formatação incorreta", () => {
      expect(formatCEP("01310.100")).toBe("01310-100");
    });
  });

  describe("IsCEP Decorator", () => {
    it("deve validar CEP através do decorator", async () => {
      const dto = new TestDto();
      dto.cep = "01310-100";

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("deve rejeitar CEP inválido através do decorator", async () => {
      const dto = new TestDto();
      dto.cep = "00000000";

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
