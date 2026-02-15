import {
  IsMOPPValidConstraint,
  type MOPPCertificate,
  isMOPPExpired,
  getMOPPDaysToExpiration,
  IsMOPPValid,
} from "./mopp.validator";
import { validate } from "class-validator";

class TestDto {
  @IsMOPPValid()
  mopp!: MOPPCertificate;
}

describe("MOPP Validator", () => {
  let validator: IsMOPPValidConstraint;

  beforeEach(() => {
    validator = new IsMOPPValidConstraint();
  });

  describe("IsMOPPValidConstraint", () => {
    const validCertificate: MOPPCertificate = {
      certificate_number: "MOPP-1234-5678",
      issue_date: new Date("2024-01-15"),
      expiration_date: new Date("2029-01-15"),
      issuing_authority: "DETRAN-SP",
      categories: ["CLASSE_1", "CLASSE_3"],
    };

    describe("Certificados válidos", () => {
      it("deve validar certificado MOPP correto", () => {
        expect(validator.validate(validCertificate)).toBe(true);
      });

      it("deve validar com todas as categorias válidas", () => {
        const cert: MOPPCertificate = {
          ...validCertificate,
          categories: [
            "CLASSE_1",
            "CLASSE_2",
            "CLASSE_3",
            "CLASSE_4",
            "CLASSE_5",
            "CLASSE_6",
            "CLASSE_7",
            "CLASSE_8",
            "CLASSE_9",
          ],
        };

        expect(validator.validate(cert)).toBe(true);
      });

      it("deve validar com uma única categoria", () => {
        const cert: MOPPCertificate = {
          ...validCertificate,
          categories: ["CLASSE_3"],
        };

        expect(validator.validate(cert)).toBe(true);
      });
    });

    describe("Certificados inválidos - Estrutura", () => {
      it("deve rejeitar certificado null/undefined", () => {
        expect(validator.validate(null as unknown as MOPPCertificate)).toBe(false);
        expect(validator.validate(undefined as unknown as MOPPCertificate)).toBe(false);
      });

      it("deve rejeitar certificado sem número", () => {
        const cert = { ...validCertificate, certificate_number: "" };
        expect(validator.validate(cert)).toBe(false);
      });

      it("deve rejeitar certificado sem data de emissão", () => {
        const cert = {
          ...validCertificate,
          issue_date: null as unknown as Date,
        };
        expect(validator.validate(cert)).toBe(false);
      });

      it("deve rejeitar certificado sem data de vencimento", () => {
        const cert = {
          ...validCertificate,
          expiration_date: null as unknown as Date,
        };
        expect(validator.validate(cert)).toBe(false);
      });

      it("deve rejeitar certificado sem autoridade emissora", () => {
        const cert = { ...validCertificate, issuing_authority: "" };
        expect(validator.validate(cert)).toBe(false);
      });

      it("deve rejeitar certificado sem categorias", () => {
        const cert = {
          ...validCertificate,
          categories: null as unknown as string[],
        };
        expect(validator.validate(cert)).toBe(false);
      });
    });

    describe("Certificados inválidos - Número", () => {
      it("deve rejeitar número de certificado com formato incorreto", () => {
        const cert = { ...validCertificate, certificate_number: "MOPP-123-456" };
        expect(validator.validate(cert)).toBe(false);
      });

      it("deve rejeitar número sem prefixo MOPP", () => {
        const cert = { ...validCertificate, certificate_number: "1234-5678" };
        expect(validator.validate(cert)).toBe(false);
      });

      it("deve rejeitar número com letras nos dígitos", () => {
        const cert = { ...validCertificate, certificate_number: "MOPP-ABCD-EFGH" };
        expect(validator.validate(cert)).toBe(false);
      });
    });

    describe("Certificados inválidos - Datas", () => {
      it("deve rejeitar vencimento anterior à emissão", () => {
        const cert: MOPPCertificate = {
          ...validCertificate,
          issue_date: new Date("2025-01-15"),
          expiration_date: new Date("2024-01-15"),
        };

        expect(validator.validate(cert)).toBe(false);
      });

      it("deve rejeitar data de emissão inválida", () => {
        const cert: MOPPCertificate = {
          ...validCertificate,
          issue_date: new Date("invalid"),
        };

        expect(validator.validate(cert)).toBe(false);
      });

      it("deve rejeitar data de vencimento inválida", () => {
        const cert: MOPPCertificate = {
          ...validCertificate,
          expiration_date: new Date("invalid"),
        };

        expect(validator.validate(cert)).toBe(false);
      });
    });

    describe("Certificados inválidos - Categorias", () => {
      it("deve rejeitar array de categorias vazio", () => {
        const cert = { ...validCertificate, categories: [] };
        expect(validator.validate(cert)).toBe(false);
      });

      it("deve rejeitar categoria inválida", () => {
        const cert = { ...validCertificate, categories: ["CLASSE_INVALID"] };
        expect(validator.validate(cert)).toBe(false);
      });

      it("deve rejeitar se alguma categoria for inválida", () => {
        const cert = {
          ...validCertificate,
          categories: ["CLASSE_1", "INVALID_CLASS", "CLASSE_3"],
        };
        expect(validator.validate(cert)).toBe(false);
      });
    });

    describe("defaultMessage", () => {
      it("deve retornar mensagem padrão", () => {
        const message = validator.defaultMessage();
        expect(message).toContain("Certificado MOPP inválido");
      });
    });
  });

  describe("isMOPPExpired", () => {
    it("deve retornar false para certificado válido no futuro", () => {
      const futureDate = new Date(Date.now() + 86400000 * 30); // 30 dias
      expect(isMOPPExpired(futureDate)).toBe(false);
    });

    it("deve retornar true para certificado vencido", () => {
      const pastDate = new Date(Date.now() - 86400000); // 1 dia atrás
      expect(isMOPPExpired(pastDate)).toBe(true);
    });

    it("deve retornar true para data de hoje (expirado no momento)", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today.getTime() - 1);

      expect(isMOPPExpired(yesterday)).toBe(true);
    });
  });

  describe("getMOPPDaysToExpiration", () => {
    it("deve calcular dias restantes corretamente", () => {
      const futureDate = new Date(Date.now() + 86400000 * 30); // 30 dias
      const days = getMOPPDaysToExpiration(futureDate);

      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    it("deve retornar número negativo para certificado vencido", () => {
      const pastDate = new Date(Date.now() - 86400000 * 10); // 10 dias atrás
      const days = getMOPPDaysToExpiration(pastDate);

      expect(days).toBeLessThan(0);
      expect(days).toBeGreaterThanOrEqual(-11);
      expect(days).toBeLessThanOrEqual(-9);
    });

    it("deve retornar aproximadamente 0 para data de hoje", () => {
      const today = new Date();
      const days = getMOPPDaysToExpiration(today);

      expect(days).toBeGreaterThanOrEqual(-1);
      expect(days).toBeLessThanOrEqual(1);
    });

    it("deve calcular corretamente para datas distantes", () => {
      const farFuture = new Date(Date.now() + 86400000 * 365); // 1 ano
      const days = getMOPPDaysToExpiration(farFuture);

      expect(days).toBeGreaterThanOrEqual(364);
      expect(days).toBeLessThanOrEqual(366);
    });
  });

  describe("IsMOPPValid Decorator", () => {
    it("deve validar certificado MOPP através do decorator", async () => {
      const dto = new TestDto();
      dto.mopp = {
        certificate_number: "MOPP-1234-5678",
        issue_date: new Date("2024-01-15"),
        expiration_date: new Date("2029-01-15"),
        issuing_authority: "DETRAN-SP",
        categories: ["CLASSE_1", "CLASSE_3"],
      };

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("deve rejeitar certificado MOPP inválido através do decorator", async () => {
      const dto = new TestDto();
      dto.mopp = {
        certificate_number: "INVALID",
        issue_date: new Date("2024-01-15"),
        expiration_date: new Date("2029-01-15"),
        issuing_authority: "DETRAN-SP",
        categories: ["CLASSE_1"],
      };

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
