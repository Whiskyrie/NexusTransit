import { SetMetadata } from "@nestjs/common";
import { Public, PUBLIC_KEY } from "./public.decorator";

describe("Public Decorator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve estar definido", () => {
    expect(Public).toBeDefined();
  });

  it("deve ter a chave PUBLIC_KEY definida como 'isPublic'", () => {
    expect(PUBLIC_KEY).toBe("isPublic");
  });

  it("deve retornar uma função decorator", () => {
    const decorator = Public();

    expect(typeof decorator).toBe("function");
  });

  it("deve aplicar metadata quando usado como decorator", () => {
    class TestController {
      @Public()
      publicMethod() {
        return "public";
      }
    }

    const instance = new TestController();
    const metadata = Reflect.getMetadata(PUBLIC_KEY, instance.publicMethod);

    expect(metadata).toBe(true);
  });

  it("deve aplicar metadata a diferentes métodos independentemente", () => {
    class TestController {
      @Public()
      method1() {
        return "method1";
      }

      @Public()
      method2() {
        return "method2";
      }

      method3() {
        return "method3";
      }
    }

    const instance = new TestController();

    expect(Reflect.getMetadata(PUBLIC_KEY, instance.method1)).toBe(true);
    expect(Reflect.getMetadata(PUBLIC_KEY, instance.method2)).toBe(true);
    expect(Reflect.getMetadata(PUBLIC_KEY, instance.method3)).toBeUndefined();
  });

  it("deve funcionar em classes", () => {
    @Public()
    class PublicController {}

    const metadata = Reflect.getMetadata(PUBLIC_KEY, PublicController);

    expect(metadata).toBe(true);
  });

  it("deve criar decorators separados para cada uso", () => {
    class TestController {
      @Public()
      method1() {}

      @Public()
      method2() {}
    }

    const instance = new TestController();

    expect(Reflect.getMetadata(PUBLIC_KEY, instance.method1)).toBe(true);
    expect(Reflect.getMetadata(PUBLIC_KEY, instance.method2)).toBe(true);
  });
});
