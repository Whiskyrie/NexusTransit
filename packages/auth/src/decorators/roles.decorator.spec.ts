import { SetMetadata } from "@nestjs/common";
import { Roles, ROLES_KEY } from "./roles.decorator";
import { Role } from "../enums/role.enum";

describe("Roles Decorator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve estar definido", () => {
    expect(Roles).toBeDefined();
  });

  it("deve ter a chave ROLES_KEY definida como 'roles'", () => {
    expect(ROLES_KEY).toBe("roles");
  });

  it("deve retornar uma função decorator", () => {
    const decorator = Roles(Role.ADMIN);

    expect(typeof decorator).toBe("function");
  });

  it("deve aplicar metadata quando usado como decorator", () => {
    class TestController {
      @Roles(Role.ADMIN)
      adminMethod() {
        return "admin";
      }
    }

    const instance = new TestController();
    const metadata = Reflect.getMetadata(ROLES_KEY, instance.adminMethod);

    expect(metadata).toEqual([Role.ADMIN]);
  });

  it("deve aplicar múltiplas roles a um método", () => {
    class TestController {
      @Roles(Role.ADMIN, Role.MANAGER)
      privilegedMethod() {
        return "privileged";
      }
    }

    const instance = new TestController();
    const metadata = Reflect.getMetadata(ROLES_KEY, instance.privilegedMethod);

    expect(metadata).toEqual([Role.ADMIN, Role.MANAGER]);
  });

  it("deve aplicar roles diferentes a métodos diferentes", () => {
    class TestController {
      @Roles(Role.ADMIN)
      adminMethod() {
        return "admin";
      }

      @Roles(Role.DRIVER)
      driverMethod() {
        return "driver";
      }

      @Roles(Role.GESTOR, Role.OPERATOR)
      multiRoleMethod() {
        return "multi";
      }
    }

    const instance = new TestController();

    expect(Reflect.getMetadata(ROLES_KEY, instance.adminMethod)).toEqual([Role.ADMIN]);
    expect(Reflect.getMetadata(ROLES_KEY, instance.driverMethod)).toEqual([Role.DRIVER]);
    expect(Reflect.getMetadata(ROLES_KEY, instance.multiRoleMethod)).toEqual([
      Role.GESTOR,
      Role.OPERATOR,
    ]);
  });

  it("deve funcionar em classes", () => {
    @Roles(Role.ADMIN)
    class AdminController {}

    const metadata = Reflect.getMetadata(ROLES_KEY, AdminController);

    expect(metadata).toEqual([Role.ADMIN]);
  });

  it("deve aceitar array vazio de roles", () => {
    class TestController {
      @Roles()
      noRolesMethod() {}
    }

    const instance = new TestController();
    const metadata = Reflect.getMetadata(ROLES_KEY, instance.noRolesMethod);

    expect(metadata).toEqual([]);
  });

  it("deve preservar a ordem das roles", () => {
    class TestController {
      @Roles(Role.DRIVER, Role.ADMIN, Role.GESTOR, Role.OPERATOR)
      orderedMethod() {}
    }

    const instance = new TestController();
    const metadata = Reflect.getMetadata(ROLES_KEY, instance.orderedMethod);

    expect(metadata).toEqual([Role.DRIVER, Role.ADMIN, Role.GESTOR, Role.OPERATOR]);
  });

  it("deve permitir roles duplicadas", () => {
    class TestController {
      @Roles(Role.ADMIN, Role.ADMIN, Role.MANAGER)
      duplicatedMethod() {}
    }

    const instance = new TestController();
    const metadata = Reflect.getMetadata(ROLES_KEY, instance.duplicatedMethod);

    expect(metadata).toEqual([Role.ADMIN, Role.ADMIN, Role.MANAGER]);
  });

  describe("integração com diferentes roles", () => {
    it("deve funcionar com SUPER_ADMIN", () => {
      @Roles(Role.SUPER_ADMIN)
      class TestClass {}

      expect(Reflect.getMetadata(ROLES_KEY, TestClass)).toEqual([Role.SUPER_ADMIN]);
    });

    it("deve funcionar com CUSTOMER", () => {
      @Roles(Role.CUSTOMER)
      class TestClass {}

      expect(Reflect.getMetadata(ROLES_KEY, TestClass)).toEqual([Role.CUSTOMER]);
    });

    it("deve funcionar com DESPACHANTE", () => {
      @Roles(Role.DESPACHANTE)
      class TestClass {}

      expect(Reflect.getMetadata(ROLES_KEY, TestClass)).toEqual([Role.DESPACHANTE]);
    });
  });
});
