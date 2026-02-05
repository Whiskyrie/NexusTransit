/// <reference types="jest" />

import { Test, TestingModule } from "@nestjs/testing";
import { ComplianceController } from "./compliance.controller";
import { ConsentService } from "./consent.service";
import { DataRequestService } from "./data-request.service";
import { DataPortabilityService } from "./data-portability.service";
import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { DataRequestStatus, DataRequestType, ConsentType } from "./enums/lgpdEnums";

describe("ComplianceController", () => {
  let controller: ComplianceController;
  let consentService: jest.Mocked<ConsentService>;
  let dataRequestService: jest.Mocked<DataRequestService>;
  let dataPortabilityService: jest.Mocked<DataPortabilityService>;

  const mockConsentService = {
    createConsent: jest.fn(),
    revokeConsent: jest.fn(),
    getUserConsents: jest.fn(),
    getActiveUserConsents: jest.fn(),
    hasValidConsent: jest.fn(),
  };

  const mockDataRequestService = {
    createDataRequest: jest.fn(),
    updateDataRequest: jest.fn(),
    completeDataRequest: jest.fn(),
    failDataRequest: jest.fn(),
    getUserDataRequests: jest.fn(),
    getPendingRequests: jest.fn(),
    getOverdueRequests: jest.fn(),
    getDataRequestStatistics: jest.fn(),
  };

  const mockDataPortabilityService = {
    exportUserData: jest.fn(),
    exportUserDataToCSV: jest.fn(),
    validateExportFile: jest.fn(),
    deleteExportFile: jest.fn(),
    getExportFileInfo: jest.fn(),
    listUserExports: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        { provide: ConsentService, useValue: mockConsentService },
        { provide: DataRequestService, useValue: mockDataRequestService },
        { provide: DataPortabilityService, useValue: mockDataPortabilityService },
      ],
    }).compile();

    controller = module.get<ComplianceController>(ComplianceController);
    consentService = module.get(ConsentService);
    dataRequestService = module.get(DataRequestService);
    dataPortabilityService = module.get(DataPortabilityService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("createConsent", () => {
    const mockReq = {
      user: { id: "user-123", email: "test@example.com", roles: ["user"] },
      ip: "192.168.1.1",
      get: jest.fn().mockReturnValue("Mozilla/5.0"),
    };

    const createConsentDto = {
      consentType: ConsentType.BASIC_DATA_PROCESSING,
      termsVersion: "1.0.0",
      purposeDescription: "Processamento de dados para entregas",
    };

    it("should create consent with request context", async () => {
      const mockConsent = {
        id: "consent-123",
        ...createConsentDto,
        userId: "user-123",
      };

      mockConsentService.createConsent.mockResolvedValue(mockConsent);

      const result = await controller.createConsent(mockReq as any, createConsentDto);

      expect(mockConsentService.createConsent).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({
          ...createConsentDto,
          consentIp: "192.168.1.1",
          userAgent: "Mozilla/5.0",
          collectionMethod: "web",
        }),
      );
      expect(result).toEqual({
        success: true,
        message: "Consentimento registrado com sucesso",
        data: mockConsent,
      });
    });

    it("should handle missing IP address gracefully", async () => {
      const reqWithoutIp = {
        user: mockReq.user,
        ip: undefined,
        get: mockReq.get,
      };

      const expectedDto = {
        ...createConsentDto,
        userAgent: "Mozilla/5.0",
        collectionMethod: "web",
      };

      mockConsentService.createConsent.mockResolvedValue({ id: "consent-123" });

      await controller.createConsent(reqWithoutIp as any, createConsentDto);

      expect(mockConsentService.createConsent).toHaveBeenCalledWith("user-123", expectedDto);
    });

    it("should propagate service exceptions", async () => {
      mockConsentService.createConsent.mockRejectedValue(
        new BadRequestException("Consentimento já existe"),
      );

      await expect(controller.createConsent(mockReq as any, createConsentDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("revokeConsent", () => {
    const mockReq = {
      user: { id: "user-123", email: "test@example.com", roles: ["user"] },
    };

    const revokeConsentDto = {
      consentType: ConsentType.BASIC_DATA_PROCESSING,
      revocationReason: "Não desejo mais compartilhar meus dados",
    };

    it("should revoke consent successfully", async () => {
      const mockConsent = {
        id: "consent-123",
        userId: "user-123",
        consentType: ConsentType.BASIC_DATA_PROCESSING,
        isActive: false,
        revokedAt: new Date(),
      };

      mockConsentService.revokeConsent.mockResolvedValue(mockConsent);

      const result = await controller.revokeConsent(mockReq as any, revokeConsentDto);

      expect(mockConsentService.revokeConsent).toHaveBeenCalledWith("user-123", revokeConsentDto);
      expect(result).toEqual({
        success: true,
        message: "Consentimento revogado com sucesso",
        data: mockConsent,
      });
    });

    it("should handle not found consent", async () => {
      mockConsentService.revokeConsent.mockRejectedValue(
        new NotFoundException("Consentimento não encontrado"),
      );

      await expect(controller.revokeConsent(mockReq as any, revokeConsentDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getUserConsents", () => {
    const mockReq = {
      user: { id: "user-123", email: "test@example.com", roles: ["user"] },
    };

    it("should return user consents", async () => {
      const mockConsents = [
        {
          id: "consent-1",
          userId: "user-123",
          consentType: ConsentType.BASIC_DATA_PROCESSING,
          isActive: true,
        },
        {
          id: "consent-2",
          userId: "user-123",
          consentType: ConsentType.MARKETING_COMMUNICATIONS,
          isActive: false,
        },
      ];

      mockConsentService.getUserConsents.mockResolvedValue(mockConsents);

      const result = await controller.getUserConsents(mockReq as any);

      expect(mockConsentService.getUserConsents).toHaveBeenCalledWith("user-123");
      expect(result).toEqual({
        success: true,
        data: mockConsents,
      });
    });
  });

  describe("getActiveUserConsents", () => {
    const mockReq = {
      user: { id: "user-123", email: "test@example.com", roles: ["user"] },
    };

    it("should return only active consents", async () => {
      const mockActiveConsents = [
        {
          id: "consent-1",
          userId: "user-123",
          consentType: ConsentType.BASIC_DATA_PROCESSING,
          isActive: true,
        },
      ];

      mockConsentService.getActiveUserConsents.mockResolvedValue(mockActiveConsents);

      const result = await controller.getActiveConsents(mockReq as any);

      expect(mockConsentService.getActiveUserConsents).toHaveBeenCalledWith("user-123");
      expect(result).toEqual({
        success: true,
        data: mockActiveConsents,
      });
    });
  });

  describe("createDataRequest", () => {
    const mockReq = {
      user: { id: "user-123", email: "test@example.com", roles: ["user"] },
      ip: "192.168.1.1",
      get: jest.fn().mockReturnValue("Mozilla/5.0"),
    };

    const createDataRequestDto = {
      requestType: DataRequestType.DATA_ACCESS,
      reason: "Solicitação de acesso aos meus dados",
    };

    it("should create data request with request context", async () => {
      const mockRequest = {
        id: "request-123",
        userId: "user-123",
        ...createDataRequestDto,
        status: DataRequestStatus.PENDING,
      };

      mockDataRequestService.createDataRequest.mockResolvedValue(mockRequest);

      const result = await controller.createDataRequest(mockReq as any, createDataRequestDto);

      expect(mockDataRequestService.createDataRequest).toHaveBeenCalledWith(
        "user-123",
        expect.objectContaining({
          ...createDataRequestDto,
          requestIp: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        }),
      );
      expect(result).toEqual({
        success: true,
        message: "Solicitação criada com sucesso. Será processada em até 15 dias úteis.",
        data: mockRequest,
      });
    });
  });

  describe("getUserDataRequests", () => {
    const mockReq = {
      user: { id: "user-123", email: "test@example.com", roles: ["user"] },
    };

    it("should return user data requests", async () => {
      const mockRequests = [
        {
          id: "request-1",
          userId: "user-123",
          requestType: DataRequestType.DATA_ACCESS,
          status: DataRequestStatus.PENDING,
        },
        {
          id: "request-2",
          userId: "user-123",
          requestType: DataRequestType.DATA_ERASURE,
          status: DataRequestStatus.COMPLETED,
        },
      ];

      mockDataRequestService.getUserDataRequests.mockResolvedValue(mockRequests);

      const result = await controller.getUserDataRequests(mockReq as any);

      expect(mockDataRequestService.getUserDataRequests).toHaveBeenCalledWith("user-123");
      expect(result).toEqual({
        success: true,
        data: mockRequests,
      });
    });
  });

  describe("getDataRequestStatistics (Admin)", () => {
    const mockReq = {
      user: { id: "admin-123", email: "admin@example.com", roles: ["admin"] },
    };

    it("should return statistics for admin users", async () => {
      const mockStats = {
        totalRequests: 100,
        pendingRequests: 20,
        completedRequests: 70,
        failedRequests: 10,
      };

      mockDataRequestService.getDataRequestStatistics.mockResolvedValue(mockStats);

      const result = await controller.getDataRequestStatistics();

      expect(result).toEqual({
        success: true,
        data: mockStats,
      });
    });
  });
});
