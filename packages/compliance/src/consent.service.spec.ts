/// <reference types="jest" />

import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ConsentService } from "./consent.service";
import { UserConsentEntity } from "./entities/user-consent.entity";
import { CreateConsentDto, RevokeConsentDto } from "./dto/lgpdDto";
import { ConsentType } from "./enums/lgpdEnums";
import { ObjectLiteral } from "typeorm";

type MockRepository<T extends ObjectLiteral = ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <T extends ObjectLiteral>(): MockRepository<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe("ConsentService", () => {
  let service: ConsentService;
  let repository: MockRepository<UserConsentEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        {
          provide: getRepositoryToken(UserConsentEntity),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
    repository = module.get<MockRepository<UserConsentEntity>>(
      getRepositoryToken(UserConsentEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createConsent", () => {
    const userId = "user-123";
    const createConsentDto: CreateConsentDto = {
      consentType: ConsentType.BASIC_DATA_PROCESSING,
      termsVersion: "1.0.0",
      purposeDescription: "Processamento de dados para entregas",
      collectionMethod: "web",
    };

    it("should create a new consent successfully", async () => {
      const mockConsent = {
        id: "consent-123",
        userId,
        ...createConsentDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as UserConsentEntity;

      repository.findOne!.mockResolvedValue(null);
      repository.create!.mockReturnValue(mockConsent);
      repository.save!.mockResolvedValue(mockConsent as UserConsentEntity);

      const result = await service.createConsent(userId, createConsentDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          consentType: createConsentDto.consentType,
          isActive: true,
        },
      });
      expect(repository.create).toHaveBeenCalledWith({
        userId,
        ...createConsentDto,
      });
      expect(repository.save).toHaveBeenCalledWith(mockConsent);
      expect(result).toEqual(mockConsent);
    });

    it("should throw BadRequestException when consentType is missing", async () => {
      const invalidDto = { ...createConsentDto, consentType: undefined as unknown as ConsentType };

      await expect(service.createConsent(userId, invalidDto)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when user already has active consent", async () => {
      const existingConsent = {
        id: "existing-consent",
        userId,
        ...createConsentDto,
        isActive: true,
      } as unknown as UserConsentEntity;

      repository.findOne!.mockResolvedValue(existingConsent as UserConsentEntity);

      await expect(service.createConsent(userId, createConsentDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          consentType: createConsentDto.consentType,
          isActive: true,
        },
      });
    });

    it("should create consent with expiration date when provided", async () => {
      const expiresAt = new Date("2026-12-31");
      const dtoWithExpiry: CreateConsentDto = {
        ...createConsentDto,
        expiresAt: expiresAt.toISOString(),
      };

      const mockConsent: Partial<UserConsentEntity> = {
        id: "consent-123",
        userId,
        ...dtoWithExpiry,
        expiresAt,
        isActive: true,
      };

      repository.findOne!.mockResolvedValue(null);
      repository.create!.mockReturnValue(mockConsent);
      repository.save!.mockResolvedValue(mockConsent as UserConsentEntity);

      const result = await service.createConsent(userId, dtoWithExpiry);

      expect(repository.create).toHaveBeenCalledWith({
        userId,
        ...dtoWithExpiry,
        expiresAt,
      });
      expect(result.expiresAt).toEqual(expiresAt);
    });
  });

  describe("revokeConsent", () => {
    const userId = "user-123";
    const revokeConsentDto: RevokeConsentDto = {
      consentType: ConsentType.BASIC_DATA_PROCESSING,
      revocationReason: "Não desejo mais compartilhar meus dados",
    };

    it("should revoke consent successfully", async () => {
      const mockConsent = {
        id: "consent-123",
        userId,
        consentType: ConsentType.BASIC_DATA_PROCESSING,
        isActive: true,
        revoke: jest.fn(),
      } as unknown as UserConsentEntity;

      repository.findOne!.mockResolvedValue(mockConsent);
      repository.save!.mockResolvedValue(mockConsent);

      const result = await service.revokeConsent(userId, revokeConsentDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          consentType: revokeConsentDto.consentType,
          isActive: true,
        },
      });
      expect(mockConsent.revoke).toHaveBeenCalledWith(revokeConsentDto.revocationReason);
      expect(repository.save).toHaveBeenCalledWith(mockConsent);
      expect(result).toEqual(mockConsent);
    });

    it("should throw NotFoundException when no active consent exists", async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.revokeConsent(userId, revokeConsentDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getActiveConsent", () => {
    const userId = "user-123";
    const consentType = ConsentType.BASIC_DATA_PROCESSING;

    it("should return active consent when found", async () => {
      const mockConsent: Partial<UserConsentEntity> = {
        id: "consent-123",
        userId,
        consentType,
        isActive: true,
      };

      repository.findOne!.mockResolvedValue(mockConsent as UserConsentEntity);

      const result = await service.getActiveConsent(userId, consentType);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          consentType,
          isActive: true,
        },
      });
      expect(result).toEqual(mockConsent);
    });

    it("should return null when no active consent exists", async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.getActiveConsent(userId, consentType);

      expect(result).toBeNull();
    });
  });

  describe("getUserConsents", () => {
    const userId = "user-123";

    it("should return all user consents ordered by createdAt DESC", async () => {
      const mockConsents: Partial<UserConsentEntity>[] = [
        {
          id: "consent-1",
          userId,
          consentType: ConsentType.BASIC_DATA_PROCESSING,
          createdAt: new Date("2026-01-15"),
        },
        {
          id: "consent-2",
          userId,
          consentType: ConsentType.MARKETING_COMMUNICATIONS,
          createdAt: new Date("2026-01-10"),
        },
      ];

      repository.find!.mockResolvedValue(mockConsents as UserConsentEntity[]);

      const result = await service.getUserConsents(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: "DESC" },
      });
      expect(result).toEqual(mockConsents);
    });

    it("should return empty array when user has no consents", async () => {
      repository.find!.mockResolvedValue([]);

      const result = await service.getUserConsents(userId);

      expect(result).toEqual([]);
    });
  });

  describe("getActiveUserConsents", () => {
    const userId = "user-123";

    it("should return only active consents", async () => {
      const mockConsents: Partial<UserConsentEntity>[] = [
        {
          id: "consent-1",
          userId,
          consentType: ConsentType.BASIC_DATA_PROCESSING,
          isActive: true,
        },
        {
          id: "consent-2",
          userId,
          consentType: ConsentType.MARKETING_COMMUNICATIONS,
          isActive: true,
        },
      ];

      repository.find!.mockResolvedValue(
        mockConsents.map((c) => ({
          ...c,
          isValid: () => true,
        })) as UserConsentEntity[],
      );

      const result = await service.getActiveUserConsents(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          userId,
          isActive: true,
        },
        order: { createdAt: "DESC" },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("consent-1");
      expect(result[1].id).toBe("consent-2");
    });

    it("should filter out expired consents based on entity logic", async () => {
      const validConsent = {
        id: "consent-1",
        userId,
        consentType: ConsentType.BASIC_DATA_PROCESSING,
        isActive: true,
        isValid: () => true,
      };

      const expiredConsent = {
        id: "consent-2",
        userId,
        consentType: ConsentType.MARKETING_COMMUNICATIONS,
        isActive: true,
        expiresAt: new Date("2025-01-01"),
        isValid: () => false,
      };

      repository.find!.mockResolvedValue([
        validConsent,
        expiredConsent,
      ] as unknown as UserConsentEntity[]);

      const result = await service.getActiveUserConsents(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("consent-1");
    });
  });

  describe("hasValidConsent", () => {
    const userId = "user-123";
    const consentType = ConsentType.BASIC_DATA_PROCESSING;

    it("should return true when user has valid consent", async () => {
      const mockConsent = {
        id: "consent-123",
        userId,
        consentType,
        isActive: true,
        isValid: jest.fn().mockReturnValue(true),
      } as unknown as UserConsentEntity;

      repository.findOne!.mockResolvedValue(mockConsent);

      const result = await service.hasValidConsent(userId, consentType);

      expect(result).toBe(true);
      expect(mockConsent.isValid).toHaveBeenCalled();
    });

    it("should return false when user has no consent", async () => {
      repository.findOne!.mockResolvedValue(null);

      const result = await service.hasValidConsent(userId, consentType);

      expect(result).toBe(false);
    });

    it("should return false when consent is invalid", async () => {
      const mockConsent = {
        id: "consent-123",
        userId,
        consentType,
        isActive: true,
        isValid: jest.fn().mockReturnValue(false),
      } as unknown as UserConsentEntity;

      repository.findOne!.mockResolvedValue(mockConsent);

      const result = await service.hasValidConsent(userId, consentType);

      expect(result).toBe(false);
    });
  });

  describe("getConsentHistory", () => {
    const userId = "user-123";

    it("should return consent history with all records", async () => {
      const mockHistory: Partial<UserConsentEntity>[] = [
        {
          id: "consent-1",
          userId,
          consentType: ConsentType.BASIC_DATA_PROCESSING,
          isActive: false,
          revokedAt: new Date("2026-01-15"),
          revocationReason: "Usuário solicitou revogação",
        },
        {
          id: "consent-2",
          userId,
          consentType: ConsentType.BASIC_DATA_PROCESSING,
          isActive: true,
        },
      ];

      repository.find!.mockResolvedValue(mockHistory as UserConsentEntity[]);

      const result = await service.getUserConsents(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: "DESC" },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe("updateExpiredConsents", () => {
    it("should update expired consents and return count", async () => {
      const expiredConsents = [
        {
          id: "consent-1",
          userId: "user-1",
          isActive: true,
          expiresAt: new Date("2025-01-01"),
          revoke: jest.fn(),
        },
        {
          id: "consent-2",
          userId: "user-2",
          isActive: true,
          expiresAt: new Date("2025-01-01"),
          revoke: jest.fn(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(expiredConsents),
      };

      repository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);
      repository.save = jest.fn().mockResolvedValue(expiredConsents);

      const result = await service.updateExpiredConsents();

      expect(result).toBe(2);
      expect(expiredConsents[0].revoke).toHaveBeenCalledWith(
        "Consentimento expirado automaticamente",
      );
      expect(expiredConsents[1].revoke).toHaveBeenCalledWith(
        "Consentimento expirado automaticamente",
      );
      expect(repository.save).toHaveBeenCalledWith(expiredConsents);
    });

    it("should return 0 when no expired consents exist", async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      repository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.updateExpiredConsents();

      expect(result).toBe(0);
    });
  });

  describe("getConsentStatistics", () => {
    it("should return comprehensive statistics", async () => {
      repository.count = jest
        .fn()
        .mockResolvedValueOnce(100) // totalConsents
        .mockResolvedValueOnce(80) // activeConsents
        .mockResolvedValueOnce(20); // revokedConsents

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      repository.createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(mockQueryBuilder) // expiredConsents
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            { type: ConsentType.BASIC_DATA_PROCESSING, count: "50" },
            { type: ConsentType.MARKETING_COMMUNICATIONS, count: "30" },
          ]),
        });

      const result = await service.getConsentStatistics();

      expect(result.totalConsents).toBe(100);
      expect(result.activeConsents).toBe(80);
      expect(result.revokedConsents).toBe(20);
      expect(result.expiredConsents).toBe(5);
      expect(result.consentsByType[ConsentType.BASIC_DATA_PROCESSING]).toBe(50);
      expect(result.consentsByType[ConsentType.MARKETING_COMMUNICATIONS]).toBe(30);
    });
  });

  describe("revokeAllUserConsents", () => {
    const userId = "user-123";

    it("should revoke all active consents and return count", async () => {
      const activeConsents = [
        {
          id: "consent-1",
          userId,
          consentType: ConsentType.BASIC_DATA_PROCESSING,
          isActive: true,
          revoke: jest.fn(),
        },
        {
          id: "consent-2",
          userId,
          consentType: ConsentType.MARKETING_COMMUNICATIONS,
          isActive: true,
          revoke: jest.fn(),
        },
      ];

      repository.find!.mockResolvedValue(activeConsents as unknown as UserConsentEntity[]);
      repository.save!.mockResolvedValue(activeConsents as unknown as UserConsentEntity[]);

      const result = await service.revokeAllUserConsents(userId);

      expect(result).toBe(2);
      expect(activeConsents[0].revoke).toHaveBeenCalledWith("Exclusão de conta do usuário");
      expect(activeConsents[1].revoke).toHaveBeenCalledWith("Exclusão de conta do usuário");
      expect(repository.save).toHaveBeenCalledWith(activeConsents);
    });

    it("should return 0 when user has no active consents", async () => {
      repository.find!.mockResolvedValue([]);

      const result = await service.revokeAllUserConsents(userId, "Motivo customizado");

      expect(result).toBe(0);
    });

    it("should use custom reason when provided", async () => {
      const activeConsents = [
        {
          id: "consent-1",
          userId,
          consentType: ConsentType.BASIC_DATA_PROCESSING,
          isActive: true,
          revoke: jest.fn(),
        },
      ];

      repository.find!.mockResolvedValue(activeConsents as unknown as UserConsentEntity[]);
      repository.save!.mockResolvedValue(activeConsents as unknown as UserConsentEntity[]);

      await service.revokeAllUserConsents(userId, "Motivo específico");

      expect(activeConsents[0].revoke).toHaveBeenCalledWith("Motivo específico");
    });
  });
});
