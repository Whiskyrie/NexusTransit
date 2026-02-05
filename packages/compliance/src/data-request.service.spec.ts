/// <reference types="jest" />

import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { DataRequestService } from "./data-request.service";
import { DataRequestEntity } from "./entities/data-request.entity";
import { CreateDataRequestDto, UpdateDataRequestDto } from "./dto/lgpdDto";
import { DataRequestStatus, DataRequestType } from "./enums/lgpdEnums";

describe("DataRequestService", () => {
  let service: DataRequestService;
  let repository: Repository<DataRequestEntity>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataRequestService,
        {
          provide: getRepositoryToken(DataRequestEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DataRequestService>(DataRequestService);
    repository = module.get<Repository<DataRequestEntity>>(getRepositoryToken(DataRequestEntity));

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createDataRequest", () => {
    const userId = "user-123";
    const createDto: CreateDataRequestDto = {
      requestType: DataRequestType.DATA_ACCESS,
      reason: "Solicitação de acesso aos meus dados",
    };

    it("should create a new data request successfully", async () => {
      repository.findOne = jest.fn().mockResolvedValue(null);

      const mockRequest = {
        id: "request-123",
        userId,
        ...createDto,
        status: DataRequestStatus.PENDING,
        dueDate: expect.any(Date),
      };

      repository.create = jest.fn().mockReturnValue(mockRequest);
      repository.save = jest.fn().mockResolvedValue(mockRequest);

      const result = await service.createDataRequest(userId, createDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          requestType: createDto.requestType,
          status: DataRequestStatus.PENDING,
        },
      });
      expect(repository.create).toHaveBeenCalledWith({
        userId,
        ...createDto,
        dueDate: expect.any(Date),
        status: DataRequestStatus.PENDING,
      });
      expect(repository.save).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual(mockRequest);
    });

    it("should throw BadRequestException when pending request already exists", async () => {
      const existingRequest = {
        id: "existing-123",
        userId,
        requestType: DataRequestType.DATA_ACCESS,
        status: DataRequestStatus.PENDING,
      };

      repository.findOne = jest.fn().mockResolvedValue(existingRequest);

      await expect(service.createDataRequest(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createDataRequest(userId, createDto)).rejects.toThrow(
        "Já existe uma solicitação data_access pendente para este usuário",
      );
    });

    it("should allow different request types for same user", async () => {
      repository.findOne = jest.fn().mockResolvedValue(null);

      const createDeletionDto: CreateDataRequestDto = {
        requestType: DataRequestType.DATA_ERASURE,
        reason: "Quero excluir meus dados",
      };

      const mockRequest = {
        id: "request-456",
        userId,
        ...createDeletionDto,
        status: DataRequestStatus.PENDING,
        dueDate: expect.any(Date),
      };

      repository.create = jest.fn().mockReturnValue(mockRequest);
      repository.save = jest.fn().mockResolvedValue(mockRequest);

      const result = await service.createDataRequest(userId, createDeletionDto);

      expect(result.requestType).toBe(DataRequestType.DATA_ERASURE);
    });
  });

  describe("updateDataRequest", () => {
    const requestId = "request-123";
    const adminId = "admin-456";
    const updateDto: UpdateDataRequestDto = {
      status: DataRequestStatus.PROCESSING,
      adminNotes: "Iniciando processamento da solicitação",
    };

    it("should update data request successfully", async () => {
      const existingRequest = {
        id: requestId,
        userId: "user-123",
        requestType: DataRequestType.DATA_ACCESS,
        status: DataRequestStatus.PENDING,
        startProcessing: jest.fn(),
      };

      repository.findOne = jest.fn().mockResolvedValue(existingRequest);
      repository.save = jest.fn().mockResolvedValue({
        ...existingRequest,
        ...updateDto,
      });

      const result = await service.updateDataRequest(requestId, updateDto, adminId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: requestId },
      });
      expect(existingRequest.startProcessing).toHaveBeenCalledWith(adminId);
      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(DataRequestStatus.PROCESSING);
    });

    it("should throw NotFoundException when request not found", async () => {
      repository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.updateDataRequest(requestId, updateDto, adminId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateDataRequest(requestId, updateDto, adminId)).rejects.toThrow(
        "Solicitação de dados não encontrada",
      );
    });

    it("should update without calling startProcessing if status is not PROCESSING", async () => {
      const existingRequest = {
        id: requestId,
        userId: "user-123",
        requestType: DataRequestType.DATA_ACCESS,
        status: DataRequestStatus.PENDING,
        startProcessing: jest.fn(),
      };

      const updateWithoutProcessing: UpdateDataRequestDto = {
        adminNotes: "Apenas uma nota",
      };

      repository.findOne = jest.fn().mockResolvedValue(existingRequest);
      repository.save = jest.fn().mockResolvedValue({
        ...existingRequest,
        ...updateWithoutProcessing,
      });

      await service.updateDataRequest(requestId, updateWithoutProcessing, adminId);

      expect(existingRequest.startProcessing).not.toHaveBeenCalled();
    });
  });

  describe("completeDataRequest", () => {
    const requestId = "request-123";
    const filePath = "/exports/user-data-123.json";
    const fileHash = "abc123hash";
    const fileSize = 1024;

    it("should complete data request with file info", async () => {
      const existingRequest = {
        id: requestId,
        userId: "user-123",
        status: DataRequestStatus.PROCESSING,
        complete: jest.fn(),
      };

      repository.findOne = jest.fn().mockResolvedValue(existingRequest);
      repository.save = jest.fn().mockResolvedValue({
        ...existingRequest,
        status: DataRequestStatus.COMPLETED,
        filePath,
        fileHash,
        fileSize,
      });

      const result = await service.completeDataRequest(requestId, filePath, fileHash, fileSize);

      expect(existingRequest.complete).toHaveBeenCalledWith(filePath, fileHash, fileSize);
      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(DataRequestStatus.COMPLETED);
    });

    it("should throw NotFoundException when request not found", async () => {
      repository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.completeDataRequest(requestId)).rejects.toThrow(NotFoundException);
    });
  });

  describe("failDataRequest", () => {
    const requestId = "request-123";
    const errorMessage = "Erro ao processar solicitação";

    it("should mark request as failed with error message", async () => {
      const existingRequest = {
        id: requestId,
        userId: "user-123",
        status: DataRequestStatus.PROCESSING,
        fail: jest.fn(),
      };

      repository.findOne = jest.fn().mockResolvedValue(existingRequest);
      repository.save = jest.fn().mockResolvedValue({
        ...existingRequest,
        status: DataRequestStatus.FAILED,
        errorMessage,
      });

      const result = await service.failDataRequest(requestId, errorMessage);

      expect(existingRequest.fail).toHaveBeenCalledWith(errorMessage);
      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(DataRequestStatus.FAILED);
    });

    it("should throw NotFoundException when request not found", async () => {
      repository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.failDataRequest(requestId, errorMessage)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getUserDataRequests", () => {
    const userId = "user-123";

    it("should return all user data requests ordered by creation date", async () => {
      const mockRequests = [
        {
          id: "request-1",
          userId,
          requestType: DataRequestType.DATA_ACCESS,
          status: DataRequestStatus.COMPLETED,
          createdAt: new Date("2026-02-01"),
        },
        {
          id: "request-2",
          userId,
          requestType: DataRequestType.DATA_ERASURE,
          status: DataRequestStatus.PENDING,
          createdAt: new Date("2026-02-03"),
        },
      ];

      repository.find = jest.fn().mockResolvedValue(mockRequests);

      const result = await service.getUserDataRequests(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: "DESC" },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("request-1");
    });
  });

  describe("getDataRequestStatistics", () => {
    it("should return comprehensive statistics", async () => {
      repository.count = jest
        .fn()
        .mockResolvedValueOnce(100) // totalRequests
        .mockResolvedValueOnce(30) // pendingRequests
        .mockResolvedValueOnce(60) // completedRequests
        .mockResolvedValueOnce(10); // failedRequests

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getRawOne: jest.fn().mockResolvedValue({ avgHours: "2" }),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      repository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.getDataRequestStatistics();

      expect(result.totalRequests).toBe(100);
      expect(result.requestsByStatus).toBeDefined();
      expect(result.requestsByType).toBeDefined();
      expect(result.overdueRequests).toBeDefined();
      expect(result.overdueRequests).toBe(5);
    });
  });

  describe("calculateDueDate", () => {
    it("should calculate due date as 15 business days from now", async () => {
      const userId = "user-123";
      const createDto: CreateDataRequestDto = {
        requestType: DataRequestType.DATA_ACCESS,
      };

      repository.findOne = jest.fn().mockResolvedValue(null);
      repository.create = jest.fn().mockImplementation((data) => data);
      repository.save = jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: "test", ...data }));

      const beforeTest = new Date();
      await service.createDataRequest(userId, createDto);
      const afterTest = new Date();

      const callArg = (repository.create as jest.Mock).mock.calls[0][0];
      const dueDate = callArg.dueDate;

      // 15 business days = approximately 21 calendar days
      const daysDiff = Math.ceil(
        (dueDate.getTime() - beforeTest.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBeGreaterThanOrEqual(15);
      expect(daysDiff).toBeLessThanOrEqual(25);
    });
  });
});
