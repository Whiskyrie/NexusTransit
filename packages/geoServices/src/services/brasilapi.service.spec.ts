import { Test, TestingModule } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { AxiosResponse, AxiosError } from "axios";
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { BrasilApiService } from "./brasilapi.service";
import type { BrasilApiResponse } from "../interfaces/brasilapi.interface";

describe("BrasilApiService", () => {
  let service: BrasilApiService;
  let _httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrasilApiService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<BrasilApiService>(BrasilApiService);
    _httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAddressByZipCode", () => {
    const validCep = "01310100";
    const mockBrasilApiResponse: BrasilApiResponse = {
      cep: "01310-100",
      state: "SP",
      city: "São Paulo",
      neighborhood: "Bela Vista",
      street: "Avenida Paulista",
      service: "viacep",
    };

    it("should return address successfully", async () => {
      const axiosResponse: AxiosResponse = {
        data: mockBrasilApiResponse,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as never,
      };

      mockHttpService.get.mockReturnValue(of(axiosResponse));

      const result = await service.getAddressByZipCode(validCep);

      expect(result).toEqual({
        zipCode: "01310-100",
        street: "Avenida Paulista",
        complement: undefined,
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        ibgeCode: undefined,
        ddd: undefined,
      });
    });

    it("should throw BadRequestException for invalid CEP", async () => {
      await expect(service.getAddressByZipCode("123")).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException when CEP not found (404)", async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 404,
          data: {},
          statusText: "Not Found",
          headers: {},
          config: {} as never,
        },
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getAddressByZipCode(validCep)).rejects.toThrow(NotFoundException);
    });

    it("should throw ServiceUnavailableException on 500 error", async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 500,
          data: {},
          statusText: "Internal Server Error",
          headers: {},
          config: {} as never,
        },
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getAddressByZipCode(validCep)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe("validateZipCode", () => {
    it("should return true for valid CEP", () => {
      expect(service.validateZipCode("01310100")).toBe(true);
      expect(service.validateZipCode("01310-100")).toBe(true);
    });

    it("should return false for invalid CEP", () => {
      expect(service.validateZipCode("")).toBe(false);
      expect(service.validateZipCode("123")).toBe(false);
      expect(service.validateZipCode("abcdefgh")).toBe(false);
    });
  });

  describe("isEnabled", () => {
    it("should return true by default", () => {
      expect(service.isEnabled()).toBe(true);
    });

    it("should return false when disabled via env", () => {
      process.env.CEP_BRASILAPI_ENABLED = "false";
      expect(service.isEnabled()).toBe(false);
      delete process.env.CEP_BRASILAPI_ENABLED;
    });
  });
});
