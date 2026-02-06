import { CurrentUser } from "./current-user.decorator";
import type { AuthUser } from "../interfaces";

describe("CurrentUser Decorator", () => {
  it("deve estar definido", () => {
    expect(CurrentUser).toBeDefined();
  });

  it("deve ser uma função", () => {
    expect(typeof CurrentUser).toBe("function");
  });

  it("deve criar um decorator sem parâmetros", () => {
    const decorator = CurrentUser();

    expect(decorator).toBeDefined();
  });

  it("deve criar um decorator com campo 'id'", () => {
    const decorator = CurrentUser("id");

    expect(decorator).toBeDefined();
  });

  it("deve criar um decorator com campo 'email'", () => {
    const decorator = CurrentUser("email");

    expect(decorator).toBeDefined();
  });

  it("deve criar um decorator com campo 'roles'", () => {
    const decorator = CurrentUser("roles");

    expect(decorator).toBeDefined();
  });

  it("deve aceitar tipos genéricos", () => {
    interface CustomUser extends AuthUser {
      department: string;
      customField: string;
    }

    const decorator1 = CurrentUser<CustomUser>();
    const decorator2 = CurrentUser<CustomUser>("department");
    const decorator3 = CurrentUser<CustomUser>("customField");

    expect(decorator1).toBeDefined();
    expect(decorator2).toBeDefined();
    expect(decorator3).toBeDefined();
  });

  it("deve aceitar campos customizados", () => {
    const decorator = CurrentUser("customField");

    expect(decorator).toBeDefined();
  });

  it("deve ser reutilizável", () => {
    const decorator1 = CurrentUser();
    const decorator2 = CurrentUser("id");
    const decorator3 = CurrentUser("email");

    expect(decorator1).toBeDefined();
    expect(decorator2).toBeDefined();
    expect(decorator3).toBeDefined();

    // Decorators diferentes
    expect(decorator1).not.toBe(decorator2);
    expect(decorator2).not.toBe(decorator3);
  });

  describe("integração com metadata do NestJS", () => {
    it("deve usar createParamDecorator do NestJS", () => {
      // CurrentUser usa createParamDecorator internamente
      // que cria metadata específica do NestJS
      const decorator = CurrentUser();

      // Verificar que é uma função válida
      expect(typeof decorator).toBe("function");
    });

    it("deve permitir uso em parâmetros de métodos", () => {
      class TestController {
        testMethod(@CurrentUser() user: AuthUser, @CurrentUser("id") userId: string) {
          return { user, userId };
        }
      }

      const instance = new TestController();
      expect(instance).toBeDefined();
      expect(instance.testMethod).toBeDefined();
    });

    it("deve permitir múltiplos usos no mesmo controller", () => {
      class TestController {
        method1(@CurrentUser() user: AuthUser) {
          return user;
        }

        method2(@CurrentUser("id") userId: string) {
          return userId;
        }

        method3(@CurrentUser("email") email: string) {
          return email;
        }
      }

      const instance = new TestController();
      expect(instance.method1).toBeDefined();
      expect(instance.method2).toBeDefined();
      expect(instance.method3).toBeDefined();
    });
  });
});
