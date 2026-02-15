import { AuditableUtils, type ChangedField, type AuditLog } from "./audit.util";

describe("AuditableUtils", () => {
  describe("getChangedFields", () => {
    it("deve detectar campos modificados", () => {
      const original = {
        id: "1",
        name: "João",
        age: 30,
        city: "São Paulo",
      };

      const updated = {
        name: "João Silva",
        age: 31,
      };

      const changed = AuditableUtils.getChangedFields(original, updated);

      expect(changed).toHaveLength(2);
      expect(changed).toContainEqual({
        field_name: "name",
        old_value: "João",
        new_value: "João Silva",
        change_type: "modified",
      });
      expect(changed).toContainEqual({
        field_name: "age",
        old_value: 30,
        new_value: 31,
        change_type: "modified",
      });
    });

    it("deve detectar campos adicionados", () => {
      const original = { id: "1", name: "João" };
      const updated = { email: "joao@example.com" };

      const changed = AuditableUtils.getChangedFields(original, updated);

      expect(changed).toContainEqual({
        field_name: "email",
        old_value: undefined,
        new_value: "joao@example.com",
        change_type: "added",
      });
    });

    it("deve excluir campos padrão sensíveis", () => {
      const original = {
        id: "1",
        name: "João",
        password: "old123",
        token: "old-token",
      };

      const updated = {
        name: "João Silva",
        password: "new456",
        token: "new-token",
      };

      const changed = AuditableUtils.getChangedFields(original, updated);

      expect(changed).toHaveLength(1);
      expect(changed[0]?.field_name).toBe("name");
    });

    it("deve excluir campos personalizados", () => {
      const original = { id: "1", name: "João", internal: "data" };
      const updated = { name: "João Silva", internal: "new-data" };

      const changed = AuditableUtils.getChangedFields(original, updated, ["internal"]);

      expect(changed).toHaveLength(1);
      expect(changed[0]?.field_name).toBe("name");
    });

    it("deve retornar array vazio quando nada mudou", () => {
      const original = { id: "1", name: "João" };
      const updated = { name: "João" };

      const changed = AuditableUtils.getChangedFields(original, updated);

      expect(changed).toHaveLength(0);
    });

    it("deve ignorar valores undefined no updated", () => {
      const original = { id: "1", name: "João", age: 30 };
      const updated = { name: "João", age: undefined };

      const changed = AuditableUtils.getChangedFields(original, updated);

      expect(changed).toHaveLength(0);
    });
  });

  describe("compareEntities", () => {
    it("deve retornar true para entidades iguais", () => {
      const entity1 = { id: "1", name: "João", age: 30 };
      const entity2 = { id: "1", name: "João", age: 30 };

      const isEqual = AuditableUtils.compareEntities(entity1, entity2);

      expect(isEqual).toBe(true);
    });

    it("deve retornar false para entidades diferentes", () => {
      const entity1 = { id: "1", name: "João", age: 30 };
      const entity2 = { id: "1", name: "Maria", age: 30 };

      const isEqual = AuditableUtils.compareEntities(entity1, entity2);

      expect(isEqual).toBe(false);
    });

    it("deve ignorar campos excluídos na comparação", () => {
      const entity1 = { id: "1", name: "João", updated_at: new Date("2025-01-01") };
      const entity2 = { id: "1", name: "João", updated_at: new Date("2025-01-15") };

      const isEqual = AuditableUtils.compareEntities(entity1, entity2);

      expect(isEqual).toBe(true); // updated_at é excluído por padrão
    });

    it("deve lidar com Arrays", () => {
      const entity1 = { id: "1", tags: ["a", "b", "c"] };
      const entity2 = { id: "1", tags: ["a", "b", "c"] };

      const isEqual = AuditableUtils.compareEntities(entity1, entity2);

      expect(isEqual).toBe(true);
    });

    it("deve detectar diferenças em Arrays", () => {
      const entity1 = { id: "1", tags: ["a", "b", "c"] };
      const entity2 = { id: "1", tags: ["a", "b", "d"] };

      const isEqual = AuditableUtils.compareEntities(entity1, entity2);

      expect(isEqual).toBe(false);
    });

    it("deve lidar com Dates", () => {
      const date = new Date("2025-01-15");
      const entity1 = { id: "1", birth_date: date };
      const entity2 = { id: "1", birth_date: new Date(date) };

      const isEqual = AuditableUtils.compareEntities(entity1, entity2);

      expect(isEqual).toBe(true);
    });
  });

  describe("sanitizeAuditData", () => {
    it("deve mascarar campos sensíveis padrão", () => {
      const data = {
        id: "1",
        name: "João",
        password: "secret123",
        token: "abc-token",
        email: "joao@example.com",
      };

      const sanitized = AuditableUtils.sanitizeAuditData(data);

      expect(sanitized.password).toBe("***");
      expect(sanitized.token).toBe("***");
      expect(sanitized.name).toBe("João");
      expect(sanitized.email).toBe("joao@example.com");
    });

    it("deve mascarar campos sensíveis personalizados", () => {
      const data = {
        id: "1",
        name: "João",
        ssn: "123-45-6789",
        credit_card: "1234-5678-9012-3456",
      };

      const sanitized = AuditableUtils.sanitizeAuditData(data, ["ssn", "credit_card"]);

      expect(sanitized.ssn).toBe("***");
      expect(sanitized.credit_card).toBe("***");
      expect(sanitized.name).toBe("João");
    });

    it("não deve modificar dados sem campos sensíveis", () => {
      const data = { id: "1", name: "João", age: 30 };

      const sanitized = AuditableUtils.sanitizeAuditData(data);

      expect(sanitized).toEqual(data);
    });

    it("não deve modificar o objeto original", () => {
      const data = { id: "1", password: "secret123" };
      const original = { ...data };

      AuditableUtils.sanitizeAuditData(data);

      expect(data).toEqual(original);
    });
  });

  describe("formatAuditLog", () => {
    it("deve formatar log simples", () => {
      const log: AuditLog = {
        timestamp: new Date("2025-01-15T10:00:00Z"),
        operation: "CREATE",
        entity_name: "User",
        entity_id: "user-123",
      };

      const formatted = AuditableUtils.formatAuditLog(log);

      expect(formatted).toContain("2025-01-15T10:00:00.000Z");
      expect(formatted).toContain("CREATE:");
      expect(formatted).toContain("User#user-123");
    });

    it("deve incluir userId quando presente", () => {
      const log: AuditLog = {
        timestamp: new Date("2025-01-15T10:00:00Z"),
        operation: "UPDATE",
        entity_name: "User",
        entity_id: "user-123",
        user_id: "admin-456",
      };

      const formatted = AuditableUtils.formatAuditLog(log);

      expect(formatted).toContain("by user admin-456");
    });

    it("deve incluir campos alterados", () => {
      const log: AuditLog = {
        timestamp: new Date("2025-01-15T10:00:00Z"),
        operation: "UPDATE",
        entity_name: "User",
        entity_id: "user-123",
        changed_fields: [
          { field_name: "name", old_value: "João", new_value: "João Silva" },
          { field_name: "age", old_value: 30, new_value: 31 },
        ],
      };

      const formatted = AuditableUtils.formatAuditLog(log);

      expect(formatted).toContain("name: João → João Silva");
      expect(formatted).toContain("age: 30 → 31");
    });
  });

  describe("createAuditLog", () => {
    it("deve criar log básico", () => {
      const log = AuditableUtils.createAuditLog("CREATE", "User", "user-123");

      expect(log.operation).toBe("CREATE");
      expect(log.entity_name).toBe("User");
      expect(log.entity_id).toBe("user-123");
      expect(log.timestamp).toBeInstanceOf(Date);
    });

    it("deve incluir campos opcionais quando fornecidos", () => {
      const changedFields: ChangedField[] = [
        { field_name: "name", old_value: "João", new_value: "Maria" },
      ];

      const metadata = { ip: "192.168.1.1" };

      const log = AuditableUtils.createAuditLog(
        "UPDATE",
        "User",
        "user-123",
        changedFields,
        "admin-456",
        metadata,
      );

      expect(log.changed_fields).toEqual(changedFields);
      expect(log.user_id).toBe("admin-456");
      expect(log.metadata).toEqual(metadata);
    });

    it("deve criar log de DELETE", () => {
      const log = AuditableUtils.createAuditLog("DELETE", "User", "user-123", undefined, "admin");

      expect(log.operation).toBe("DELETE");
      expect(log.user_id).toBe("admin");
    });
  });

  describe("shouldAuditField", () => {
    it("deve retornar true para campos normais", () => {
      expect(AuditableUtils.shouldAuditField("name")).toBe(true);
      expect(AuditableUtils.shouldAuditField("email")).toBe(true);
    });

    it("deve retornar false para campos sensíveis padrão", () => {
      expect(AuditableUtils.shouldAuditField("password")).toBe(false);
      expect(AuditableUtils.shouldAuditField("token")).toBe(false);
      expect(AuditableUtils.shouldAuditField("created_at")).toBe(false);
    });

    it("deve retornar false para campos personalizados excluídos", () => {
      expect(AuditableUtils.shouldAuditField("internal_id", ["internal_id"])).toBe(false);
    });
  });

  describe("extractMetadata", () => {
    it("deve extrair campos úteis para metadados", () => {
      const entity = {
        id: "user-123",
        name: "João Silva",
        status: "active",
        type: "admin",
        code: "ADM-001",
        extra_field: "value",
        another_field: "data",
      };

      const metadata = AuditableUtils.extractMetadata(entity);

      expect(metadata).toEqual({
        id: "user-123",
        name: "João Silva",
        status: "active",
        type: "admin",
        code: "ADM-001",
      });
    });

    it("deve retornar apenas campos presentes", () => {
      const entity = {
        id: "user-123",
        status: "active",
      };

      const metadata = AuditableUtils.extractMetadata(entity);

      expect(metadata).toEqual({
        id: "user-123",
        status: "active",
      });
    });

    it("deve retornar objeto vazio quando nenhum campo útil presente", () => {
      const entity = {
        random_field: "value",
        another_field: "data",
      };

      const metadata = AuditableUtils.extractMetadata(entity);

      expect(metadata).toEqual({});
    });
  });
});
