import { Reflector } from "@nestjs/core";
import {
  Auditable,
  NonAuditable,
  AuditableOperations,
  AUDITABLE_ENTITY_KEY,
  DEFAULT_AUDITABLE_OPTIONS,
} from "./auditable.decorator";

describe("Auditable Decorators", () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe("Auditable", () => {
    it("should be defined", () => {
      expect(Auditable).toBeDefined();
    });

    it("should set metadata with default options when called without arguments", () => {
      @Auditable()
      class TestEntity {}

      const metadata = reflector.get(AUDITABLE_ENTITY_KEY, TestEntity);

      expect(metadata).toBeDefined();
      expect(metadata.trackCreation).toBe(true);
      expect(metadata.trackUpdates).toBe(true);
      expect(metadata.trackDeletion).toBe(true);
      expect(metadata.excludeFields).toEqual(["updated_at", "created_at"]);
      expect(metadata.trackOldValues).toBe(true);
      expect(metadata.entityDisplayName).toBe("");
    });

    it("should merge custom options with defaults", () => {
      @Auditable({
        trackCreation: false,
        excludeFields: ["password", "secret"],
        entityDisplayName: "Custom Entity",
      })
      class CustomEntity {}

      const metadata = reflector.get(AUDITABLE_ENTITY_KEY, CustomEntity);

      expect(metadata.trackCreation).toBe(false);
      expect(metadata.trackUpdates).toBe(true);
      expect(metadata.excludeFields).toEqual(["password", "secret"]);
      expect(metadata.entityDisplayName).toBe("Custom Entity");
    });

    it("should set all options when provided", () => {
      @Auditable({
        trackCreation: false,
        trackUpdates: false,
        trackDeletion: false,
        excludeFields: ["field1", "field2"],
        trackOldValues: false,
        entityDisplayName: "Test Entity",
      })
      class FullyConfiguredEntity {}

      const metadata = reflector.get(AUDITABLE_ENTITY_KEY, FullyConfiguredEntity);

      expect(metadata.trackCreation).toBe(false);
      expect(metadata.trackUpdates).toBe(false);
      expect(metadata.trackDeletion).toBe(false);
      expect(metadata.excludeFields).toEqual(["field1", "field2"]);
      expect(metadata.trackOldValues).toBe(false);
      expect(metadata.entityDisplayName).toBe("Test Entity");
    });
  });

  describe("NonAuditable", () => {
    it("should be defined", () => {
      expect(NonAuditable).toBeDefined();
    });

    it("should disable all tracking options", () => {
      @NonAuditable()
      class TempEntity {}

      const metadata = reflector.get(AUDITABLE_ENTITY_KEY, TempEntity);

      expect(metadata).toBeDefined();
      expect(metadata.trackCreation).toBe(false);
      expect(metadata.trackUpdates).toBe(false);
      expect(metadata.trackDeletion).toBe(false);
    });
  });

  describe("AuditableOperations", () => {
    it("should be defined", () => {
      expect(AuditableOperations).toBeDefined();
    });

    it("should track only CREATE operation", () => {
      @AuditableOperations(["CREATE"])
      class CreateOnlyEntity {}

      const metadata = reflector.get(AUDITABLE_ENTITY_KEY, CreateOnlyEntity);

      expect(metadata).toBeDefined();
    });

    it("should track only UPDATE operation", () => {
      @AuditableOperations(["UPDATE"])
      class UpdateOnlyEntity {}

      const metadata = reflector.get(AUDITABLE_ENTITY_KEY, UpdateOnlyEntity);

      expect(metadata).toBeDefined();
    });

    it("should track only DELETE operation", () => {
      @AuditableOperations(["DELETE"])
      class DeleteOnlyEntity {}

      const metadata = reflector.get(AUDITABLE_ENTITY_KEY, DeleteOnlyEntity);

      expect(metadata).toBeDefined();
    });

    it("should track multiple operations", () => {
      @AuditableOperations(["CREATE", "UPDATE"])
      class CreateUpdateEntity {}

      const metadata = reflector.get(AUDITABLE_ENTITY_KEY, CreateUpdateEntity);

      expect(metadata).toBeDefined();
    });

    it("should track all operations when specified", () => {
      @AuditableOperations(["CREATE", "UPDATE", "DELETE"])
      class AllOperationsEntity {}

      const metadata = reflector.get(AUDITABLE_ENTITY_KEY, AllOperationsEntity);

      expect(metadata).toBeDefined();
    });
  });

  describe("DEFAULT_AUDITABLE_OPTIONS", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_AUDITABLE_OPTIONS.trackCreation).toBe(true);
      expect(DEFAULT_AUDITABLE_OPTIONS.trackUpdates).toBe(true);
      expect(DEFAULT_AUDITABLE_OPTIONS.trackDeletion).toBe(true);
      expect(DEFAULT_AUDITABLE_OPTIONS.excludeFields).toEqual(["updated_at", "created_at"]);
      expect(DEFAULT_AUDITABLE_OPTIONS.trackOldValues).toBe(true);
      expect(DEFAULT_AUDITABLE_OPTIONS.entityDisplayName).toBe("");
    });
  });

  describe("AUDITABLE_ENTITY_KEY", () => {
    it("should be defined", () => {
      expect(AUDITABLE_ENTITY_KEY).toBeDefined();
      expect(AUDITABLE_ENTITY_KEY).toBe("auditable_delivery_entity");
    });
  });
});
