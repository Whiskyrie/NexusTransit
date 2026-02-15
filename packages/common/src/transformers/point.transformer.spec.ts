import { PointTransformer, toWKT, getLatitude, getLongitude } from "./point.transformer";

describe("Point Transformer", () => {
  describe("PointTransformer.from", () => {
    it("deve retornar valor do banco sem modificação", () => {
      const dbValue = "(-23.561414,-46.656250)";
      const result = PointTransformer.from(dbValue);

      expect(result).toBe("(-23.561414,-46.656250)");
    });

    it("deve retornar null para valor null", () => {
      expect(PointTransformer.from(null)).toBeNull();
    });

    it("deve retornar null para valor undefined", () => {
      expect(PointTransformer.from(undefined as unknown as string)).toBeNull();
    });

    it("deve retornar null para string vazia", () => {
      expect(PointTransformer.from("")).toBeNull();
    });
  });

  describe("PointTransformer.to", () => {
    it("deve converter formato POINT(x y) para (x,y)", () => {
      const wkt = "POINT(-23.561414 -46.656250)";
      const result = PointTransformer.to(wkt);

      expect(result).toBe("(-23.561414,-46.656250)");
    });

    it("deve converter POINT case insensitive", () => {
      const wkt = "point(-23.561414 -46.656250)";
      const result = PointTransformer.to(wkt);

      expect(result).toBe("(-23.561414,-46.656250)");
    });

    it("deve lidar com espaços extras no POINT", () => {
      const wkt = "POINT( -23.561414  -46.656250 )";
      const result = PointTransformer.to(wkt);

      expect(result).toBe("(-23.561414,-46.656250)");
    });

    it("deve manter formato (x,y) já correto", () => {
      const value = "(-23.561414,-46.656250)";
      const result = PointTransformer.to(value);

      expect(result).toBe("(-23.561414,-46.656250)");
    });

    it("deve remover espaços em formato (x, y)", () => {
      const value = "(-23.561414, -46.656250)";
      const result = PointTransformer.to(value);

      expect(result).toBe("(-23.561414,-46.656250)");
    });

    it("deve adicionar parênteses para formato x,y", () => {
      const value = "-23.561414,-46.656250";
      const result = PointTransformer.to(value);

      expect(result).toBe("(-23.561414,-46.656250)");
    });

    it("deve retornar null para valor null", () => {
      expect(PointTransformer.to(null)).toBeNull();
    });

    it("deve retornar null para valor undefined", () => {
      expect(PointTransformer.to(undefined)).toBeNull();
    });

    it("deve retornar null para string vazia", () => {
      expect(PointTransformer.to("")).toBeNull();
    });

    it("deve retornar null para formato inválido", () => {
      expect(PointTransformer.to("invalid format")).toBeNull();
      expect(PointTransformer.to("POINT()")).toBeNull();
    });

    it("deve lidar com coordenadas positivas", () => {
      const wkt = "POINT(40.712776 -74.005974)";
      const result = PointTransformer.to(wkt);

      expect(result).toBe("(40.712776,-74.005974)");
    });
  });

  describe("toWKT", () => {
    it("deve converter (x,y) para POINT(x y)", () => {
      const point = "(-23.561414,-46.656250)";
      const result = toWKT(point);

      expect(result).toBe("POINT(-23.561414 -46.656250)");
    });

    it("deve manter formato POINT já correto", () => {
      const wkt = "POINT(-23.561414 -46.656250)";
      const result = toWKT(wkt);

      expect(result).toBe(wkt);
    });

    it("deve retornar null para valor null", () => {
      expect(toWKT(null as unknown as string)).toBeNull();
    });

    it("deve retornar null para string vazia", () => {
      expect(toWKT("")).toBeNull();
    });

    it("deve retornar null para formato inválido", () => {
      expect(toWKT("invalid")).toBeNull();
    });

    it("deve retornar null para (x,y,z) com 3 coordenadas", () => {
      expect(toWKT("(-23.561414,-46.656250,100)")).toBeNull();
    });
  });

  describe("getLatitude", () => {
    it("deve extrair latitude de POINT(x y)", () => {
      const point = "POINT(-23.561414 -46.656250)";
      const lat = getLatitude(point);

      expect(lat).toBe(-23.561414);
    });

    it("deve extrair latitude de (x,y)", () => {
      const point = "(-23.561414,-46.656250)";
      const lat = getLatitude(point);

      expect(lat).toBe(-23.561414);
    });

    it("deve retornar null para valor null", () => {
      expect(getLatitude(null as unknown as string)).toBeNull();
    });

    it("deve retornar null para string vazia", () => {
      expect(getLatitude("")).toBeNull();
    });

    it("deve retornar null para formato inválido", () => {
      expect(getLatitude("invalid")).toBeNull();
    });

    it("deve lidar com latitude positiva", () => {
      const point = "POINT(40.712776 -74.005974)";
      const lat = getLatitude(point);

      expect(lat).toBe(40.712776);
    });
  });

  describe("getLongitude", () => {
    it("deve extrair longitude de POINT(x y)", () => {
      const point = "POINT(-23.561414 -46.656250)";
      const lng = getLongitude(point);

      expect(lng).toBe(-46.65625);
    });

    it("deve extrair longitude de (x,y)", () => {
      const point = "(-23.561414,-46.656250)";
      const lng = getLongitude(point);

      expect(lng).toBe(-46.65625);
    });

    it("deve retornar null para valor null", () => {
      expect(getLongitude(null as unknown as string)).toBeNull();
    });

    it("deve retornar null para string vazia", () => {
      expect(getLongitude("")).toBeNull();
    });

    it("deve retornar null para formato inválido", () => {
      expect(getLongitude("invalid")).toBeNull();
    });

    it("deve lidar com longitude positiva", () => {
      const point = "POINT(40.712776 74.005974)";
      const lng = getLongitude(point);

      expect(lng).toBe(74.005974);
    });
  });
});
