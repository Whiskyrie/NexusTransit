import { IsCPFConstraint, normalizeCPF, formatCPF, IsCPF } from "./cpf.validator";
import { validate } from "class-validator";

class TestDto {
  @IsCPF()
  cpf!: string;
}

describe("CPF Validator", () => {
  let validator: IsCPFConstraint;

  beforeEach(() => {
    validator = new IsCPFConstraint();
  });

  describe("IsCPFConstraint", () => {
    describe("CPFs válidos", () => {
      it("deve validar CPF válido sem formatação", () => {
        expect(validator.validate("11144477735")).toBe(true);
        expect(validator.validate("52998224725")).toBe(true);
      });

      it("deve validar CPF válido com formatação", () => {
        expect(validator.validate("111.444.777-35")).toBe(true);
        expect(validator.validate("529.982.247-25")).toBe(true);
      });

      it("deve validar CPFs conhecidos", () => {
        // CPFs válidos comuns para teste
        expect(validator.validate("12345678909")).toBe(true);
        expect(validator.validate("00000000191")).toBe(true);
      });
    });

    describe("CPFs inválidos", () => {
      it("deve rejeitar CPF com todos dígitos iguais", () => {
        expect(validator.validate("00000000000")).toBe(false);
        expect(validator.validate("11111111111")).toBe(false);
        expect(validator.validate("99999999999")).toBe(false);
      });

      it("deve rejeitar CPF com comprimento incorreto", () => {
        expect(validator.validate("123456789")).toBe(false); // 9 dígitos
        expect(validator.validate("123456789012")).toBe(false); // 12 dígitos
        expect(validator.validate("")).toBe(false);
      });

      it("deve rejeitar CPF com dígitos verificadores incorretos", () => {
        expect(validator.validate("12345678900")).toBe(false);
        expect(validator.validate("11144477736")).toBe(false);
      });

      it("deve rejeitar valor null/undefined", () => {
        expect(validator.validate(null as unknown as string)).toBe(false);
        expect(validator.validate(undefined as unknown as string)).toBe(false);
      });

      it("deve rejeitar tipo não string", () => {
        expect(validator.validate(12345678909 as unknown as string)).toBe(false);
      });
    });

    describe("defaultMessage", () => {
      it("deve retornar mensagem padrão", () => {
        expect(validator.defaultMessage()).toBe("CPF deve estar em formato válido");
      });
    });
  });

  describe("normalizeCPF", () => {
    it("deve remover formatação do CPF", () => {
      expect(normalizeCPF("111.444.777-35")).toBe("11144477735");
      expect(normalizeCPF("123.456.789-09")).toBe("12345678909");
    });

    it("deve manter CPF sem formatação", () => {
      expect(normalizeCPF("11144477735")).toBe("11144477735");
    });

    it("deve retornar string vazia para input vazio", () => {
      expect(normalizeCPF("")).toBe("");
      expect(normalizeCPF(null as unknown as string)).toBe("");
      expect(normalizeCPF(undefined as unknown as string)).toBe("");
    });

    it("deve remover caracteres especiais diversos", () => {
      expect(normalizeCPF("111.444.777/35")).toBe("11144477735");
      expect(normalizeCPF("111 444 777 35")).toBe("11144477735");
    });
  });

  describe("formatCPF", () => {
    it("deve formatar CPF sem formatação", () => {
      expect(formatCPF("11144477735")).toBe("111.444.777-35");
      expect(formatCPF("12345678909")).toBe("123.456.789-09");
    });

    it("deve retornar CPF já formatado", () => {
      expect(formatCPF("111.444.777-35")).toBe("111.444.777-35");
    });

    it("deve retornar input original se comprimento incorreto", () => {
      expect(formatCPF("123456789")).toBe("123456789");
      expect(formatCPF("")).toBe("");
    });

    it("deve normalizar e formatar CPF com formatação incorreta", () => {
      expect(formatCPF("111-444-777-35")).toBe("111.444.777-35");
    });
  });

  describe("IsCPF Decorator", () => {
    it("deve validar CPF através do decorator", async () => {
      const dto = new TestDto();
      dto.cpf = "111.444.777-35";

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("deve rejeitar CPF inválido através do decorator", async () => {
      const dto = new TestDto();
      dto.cpf = "000.000.000-00";

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
