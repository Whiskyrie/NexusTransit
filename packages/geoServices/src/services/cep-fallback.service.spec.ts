import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { CepFallbackService } from "./cep-fallback.service";
import { ViaCepService } from "./viacep.service";
import { BrasilApiService } from "./brasilapi.service";
import { AwesomeApiService } from "./awesomeapi.service";

describe("CepFallbackService", () => {
  let service: CepFallbackService;
  let viaCepService: ViaCepService;
  let brasilApiService: BrasilApiService;
  let awesomeApiService: AwesomeApiService;

  const mockAddress = {
    zipCode: "01310-100",
    street: "Avenida Paulista",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CepFallbackService,
        {
          provide: ViaCepService,
          useValue: {
            name: "ViaCEP",
            priority: 1,
            timeout: 3000,
            getAddressByZipCode: jest.fn(),
            validateZipCode: jest.fn(),
            isEnabled: jest.fn(() => true),
          },
        },
        {
          provide: BrasilApiService,
          useValue: {
            name: "BrasilAPI",
            priority: 2,
            timeout: 3000,
            getAddressByZipCode: jest.fn(),
            validateZipCode: jest.fn(),
            isEnabled: jest.fn(() => true),
          },
        },
        {
          provide: AwesomeApiService,
          useValue: {
            name: "AwesomeAPI",
            priority: 3,
            timeout: 3000,
            getAddressByZipCode: jest.fn(),
            validateZipCode: jest.fn(),
            isEnabled: jest.fn(() => true),
          },
        },
      ],
    }).compile();

    service = module.get<CepFallbackService>(CepFallbackService);
    viaCepService = module.get<ViaCepService>(ViaCepService);
    brasilApiService = module.get<BrasilApiService>(BrasilApiService);
    awesomeApiService = module.get<AwesomeApiService>(AwesomeApiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAddressByZipCode", () => {
    const validCep = "01310100";

    it("should return address from first provider (ViaCEP) when available", async () => {
      jest.spyOn(viaCepService, "getAddressByZipCode").mockResolvedValue(mockAddress);

      const result = await service.getAddressByZipCode(validCep);

      expect(result).toEqual(mockAddress);
      expect(viaCepService.getAddressByZipCode).toHaveBeenCalledWith(validCep);
      expect(brasilApiService.getAddressByZipCode).not.toHaveBeenCalled();
      expect(awesomeApiService.getAddressByZipCode).not.toHaveBeenCalled();
    });

    it("should fallback to BrasilAPI when ViaCEP fails", async () => {
      jest
        .spyOn(viaCepService, "getAddressByZipCode")
        .mockRejectedValue(new ServiceUnavailableException());
      jest.spyOn(brasilApiService, "getAddressByZipCode").mockResolvedValue(mockAddress);

      const result = await service.getAddressByZipCode(validCep);

      expect(result).toEqual(mockAddress);
      expect(viaCepService.getAddressByZipCode).toHaveBeenCalledWith(validCep);
      expect(brasilApiService.getAddressByZipCode).toHaveBeenCalledWith(validCep);
      expect(awesomeApiService.getAddressByZipCode).not.toHaveBeenCalled();
    });

    it("should fallback to AwesomeAPI when ViaCEP and BrasilAPI fail", async () => {
      jest
        .spyOn(viaCepService, "getAddressByZipCode")
        .mockRejectedValue(new ServiceUnavailableException());
      jest
        .spyOn(brasilApiService, "getAddressByZipCode")
        .mockRejectedValue(new ServiceUnavailableException());
      jest.spyOn(awesomeApiService, "getAddressByZipCode").mockResolvedValue(mockAddress);

      const result = await service.getAddressByZipCode(validCep);

      expect(result).toEqual(mockAddress);
      expect(viaCepService.getAddressByZipCode).toHaveBeenCalled();
      expect(brasilApiService.getAddressByZipCode).toHaveBeenCalled();
      expect(awesomeApiService.getAddressByZipCode).toHaveBeenCalled();
    });

    it("should throw ServiceUnavailableException when all providers fail", async () => {
      jest
        .spyOn(viaCepService, "getAddressByZipCode")
        .mockRejectedValue(new ServiceUnavailableException());
      jest
        .spyOn(brasilApiService, "getAddressByZipCode")
        .mockRejectedValue(new ServiceUnavailableException());
      jest
        .spyOn(awesomeApiService, "getAddressByZipCode")
        .mockRejectedValue(new ServiceUnavailableException());

      await expect(service.getAddressByZipCode(validCep)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it("should throw NotFoundException immediately when CEP not found", async () => {
      jest.spyOn(viaCepService, "getAddressByZipCode").mockRejectedValue(new NotFoundException());

      await expect(service.getAddressByZipCode(validCep)).rejects.toThrow(NotFoundException);

      expect(brasilApiService.getAddressByZipCode).not.toHaveBeenCalled();
      expect(awesomeApiService.getAddressByZipCode).not.toHaveBeenCalled();
    });
  });

  describe("getProvidersStats", () => {
    it("should return stats for all providers", () => {
      const stats = service.getProvidersStats();

      expect(stats).toHaveLength(3);
      expect(stats.map((s) => s.providerName)).toContain("ViaCEP");
      expect(stats.map((s) => s.providerName)).toContain("BrasilAPI");
      expect(stats.map((s) => s.providerName)).toContain("AwesomeAPI");
    });
  });

  describe("resetStats", () => {
    it("should reset all provider statistics", () => {
      service.resetStats();
      const stats = service.getProvidersStats();

      stats.forEach((stat) => {
        expect(stat.totalRequests).toBe(0);
        expect(stat.successfulRequests).toBe(0);
        expect(stat.failedRequests).toBe(0);
        expect(stat.averageResponseTime).toBe(0);
      });
    });
  });
});
