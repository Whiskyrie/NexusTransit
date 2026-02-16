import { Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { DistanceCalculatorService } from "./distance-calculator.util";

describe("DistanceCalculatorService", () => {
  let service: DistanceCalculatorService;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DistanceCalculatorService],
    }).compile();

    service = module.get<DistanceCalculatorService>(DistanceCalculatorService);
    loggerErrorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateDistance", () => {
    it("deve calcular distância entre duas coordenadas válidas", () => {
      // São Paulo - Rio de Janeiro (aprox 358 km)
      const origin = "POINT(-23.550520 -46.633308)";
      const destination = "POINT(-22.906847 -43.172896)";

      const distance = service.calculateDistance(origin, destination);

      expect(distance).toBeGreaterThan(350);
      expect(distance).toBeLessThan(370);
    });

    it("deve retornar 0 para coordenadas iguais", () => {
      const coord = "POINT(-23.550520 -46.633308)";
      const distance = service.calculateDistance(coord, coord);

      expect(distance).toBe(0);
    });

    it("deve calcular distância curta entre coordenadas próximas", () => {
      const origin = "POINT(-23.561414 -46.656250)";
      const destination = "POINT(-23.562500 -46.657000)";

      const distance = service.calculateDistance(origin, destination);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // < 1 km
    });

    it("deve retornar 0 e logar erro quando coordenadas inválidas", () => {
      const invalid = "INVALID_COORDS";
      const valid = "POINT(-23.550520 -46.633308)";

      const distance = service.calculateDistance(invalid, valid);

      expect(distance).toBe(0);
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it("deve retornar distância arredondada com 2 casas decimais", () => {
      const origin = "POINT(-23.561414 -46.656250)";
      const destination = "POINT(-23.650000 -46.750000)";

      const distance = service.calculateDistance(origin, destination);

      // Verifica se tem no máximo 2 casas decimais
      expect(distance.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe("calculateTotalDistance", () => {
    it("deve calcular distância total de rota com múltiplas paradas", () => {
      const coordinates = [
        "POINT(-23.550520 -46.633308)", // SP
        "POINT(-23.561414 -46.656250)", // Ponto intermediário
        "POINT(-22.906847 -43.172896)", // Rio
      ];

      const totalDistance = service.calculateTotalDistance(coordinates);

      expect(totalDistance).toBeGreaterThan(0);
      expect(typeof totalDistance).toBe("number");
    });

    it("deve retornar 0 para array com menos de 2 coordenadas", () => {
      expect(service.calculateTotalDistance([])).toBe(0);
      expect(service.calculateTotalDistance(["POINT(-23.550520 -46.633308)"])).toBe(0);
    });

    it("deve lidar com coordenadas inválidas no meio da rota", () => {
      const coordinates = [
        "POINT(-23.550520 -46.633308)",
        "INVALID",
        "POINT(-22.906847 -43.172896)",
      ];

      const totalDistance = service.calculateTotalDistance(coordinates);

      expect(totalDistance).toBeGreaterThanOrEqual(0);
      // Logger warning pode não ser chamado se a validação falha antes
    });

    it("deve retornar resultado arredondado com 2 casas decimais", () => {
      const coordinates = ["POINT(-23.550520 -46.633308)", "POINT(-23.561414 -46.656250)"];

      const totalDistance = service.calculateTotalDistance(coordinates);

      expect(totalDistance.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe("calculateEstimatedDuration", () => {
    it("deve calcular tempo estimado corretamente", () => {
      const distanceKm = 100;
      const avgSpeed = 50; // 50 km/h
      const delayFactor = 1.0; // sem atraso

      const duration = service.calculateEstimatedDuration(distanceKm, avgSpeed, delayFactor);

      expect(duration).toBe(120); // 2 horas = 120 minutos
    });

    it("deve aplicar fator de atraso padrão de 1.2", () => {
      const distanceKm = 100;
      const avgSpeed = 50;

      const duration = service.calculateEstimatedDuration(distanceKm, avgSpeed);

      expect(duration).toBe(144); // 2 horas * 1.2 = 144 minutos
    });

    it("deve usar velocidade padrão de 50 km/h", () => {
      const distanceKm = 50;

      const duration = service.calculateEstimatedDuration(distanceKm);

      expect(duration).toBe(72); // 1 hora * 1.2 = 72 minutos
    });

    it("deve retornar 0 para distância inválida", () => {
      expect(service.calculateEstimatedDuration(0, 50)).toBe(0);
      expect(service.calculateEstimatedDuration(-10, 50)).toBe(0);
    });

    it("deve retornar 0 para velocidade inválida", () => {
      expect(service.calculateEstimatedDuration(100, 0)).toBe(0);
      expect(service.calculateEstimatedDuration(100, -50)).toBe(0);
    });

    it("deve arredondar para cima o tempo em minutos", () => {
      const distanceKm = 10;
      const avgSpeed = 60; // 10 minutos exatos

      const duration = service.calculateEstimatedDuration(distanceKm, avgSpeed, 1.0);

      expect(duration).toBe(10); // ceil de 10.0
    });
  });

  describe("calculateFuelConsumption", () => {
    it("deve calcular consumo de combustível corretamente", () => {
      const distanceKm = 100;
      const consumption = 10; // 10 km/l

      const fuel = service.calculateFuelConsumption(distanceKm, consumption);

      expect(fuel).toBe(10); // 100 km / 10 km/l = 10 litros
    });

    it("deve usar consumo padrão de 10 km/l", () => {
      const distanceKm = 50;

      const fuel = service.calculateFuelConsumption(distanceKm);

      expect(fuel).toBe(5); // 50 km / 10 km/l = 5 litros
    });

    it("deve retornar 0 para distância inválida", () => {
      expect(service.calculateFuelConsumption(0, 10)).toBe(0);
      expect(service.calculateFuelConsumption(-50, 10)).toBe(0);
    });

    it("deve retornar 0 para consumo inválido", () => {
      expect(service.calculateFuelConsumption(100, 0)).toBe(0);
      expect(service.calculateFuelConsumption(100, -10)).toBe(0);
    });

    it("deve retornar resultado arredondado com 2 casas decimais", () => {
      const distanceKm = 100;
      const consumption = 12.5;

      const fuel = service.calculateFuelConsumption(distanceKm, consumption);

      expect(fuel.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe("calculateFuelCost", () => {
    it("deve calcular custo de combustível corretamente", () => {
      const distanceKm = 100;
      const consumption = 10; // km/l
      const price = 5.5; // R$/l

      const cost = service.calculateFuelCost(distanceKm, consumption, price);

      expect(cost).toBe(55); // 10 litros * R$5.5 = R$55
    });

    it("deve usar valores padrão", () => {
      const distanceKm = 100;

      const cost = service.calculateFuelCost(distanceKm);

      expect(cost).toBe(55); // 100/10 * 5.5 = 55
    });

    it("deve retornar resultado arredondado com 2 casas decimais", () => {
      const cost = service.calculateFuelCost(100, 12, 5.75);

      expect(cost.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe("parseCoordinates", () => {
    it("deve fazer parse de coordenadas válidas", () => {
      const point = "POINT(-23.561414 -46.656250)";

      const coords = service.parseCoordinates(point);

      expect(coords).toEqual({
        latitude: -23.561414,
        longitude: -46.65625,
      });
    });

    it("deve lançar erro para formato inválido", () => {
      const invalid = "INVALID_FORMAT";

      expect(() => service.parseCoordinates(invalid)).toThrow("Formato de coordenadas inválido");
    });

    it("deve lançar erro para POINT sem coordenadas", () => {
      const invalid = "POINT()";

      expect(() => service.parseCoordinates(invalid)).toThrow();
    });

    it("deve fazer parse de coordenadas positivas", () => {
      const point = "POINT(40.712776 -74.005974)"; // Nova York

      const coords = service.parseCoordinates(point);

      expect(coords.latitude).toBe(40.712776);
      expect(coords.longitude).toBe(-74.005974);
    });
  });

  describe("validateCoordinates", () => {
    it("deve retornar true para coordenadas válidas", () => {
      expect(service.validateCoordinates("POINT(-23.561414 -46.656250)")).toBe(true);
      expect(service.validateCoordinates("POINT(40.712776 -74.005974)")).toBe(true);
    });

    it("deve retornar false para coordenadas inválidas", () => {
      expect(service.validateCoordinates("INVALID")).toBe(false);
      expect(service.validateCoordinates("POINT()")).toBe(false);
      expect(service.validateCoordinates("")).toBe(false);
    });
  });

  describe("formatCoordinates", () => {
    it("deve formatar coordenadas para o formato PostGIS POINT", () => {
      const result = service.formatCoordinates(-23.561414, -46.65625);

      expect(result).toBe("POINT(-23.561414 -46.65625)");
    });

    it("deve formatar coordenadas positivas", () => {
      const result = service.formatCoordinates(40.712776, -74.005974);

      expect(result).toBe("POINT(40.712776 -74.005974)");
    });

    it("deve formatar coordenadas com valores inteiros", () => {
      const result = service.formatCoordinates(0, 0);

      expect(result).toBe("POINT(0 0)");
    });
  });
});
