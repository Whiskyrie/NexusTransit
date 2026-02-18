import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import { TestUsersSeed } from "./test-users.seed";
import { RoleEntity } from "../interfaces/role.interface";
import { UserEntity } from "../interfaces/user.interface";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
}));

describe("TestUsersSeed", () => {
  let seed: TestUsersSeed;
  let mockUserRepository: jest.Mocked<Repository<UserEntity>>;
  let mockRoleRepository: jest.Mocked<Repository<RoleEntity>>;

  const mockRoles = {
    admin: { id: "admin-id", name: "ADMIN" } as RoleEntity,
    gestor: { id: "gestor-id", name: "GESTOR" } as RoleEntity,
    despachante: { id: "despachante-id", name: "DESPACHANTE" } as RoleEntity,
    motorista: { id: "motorista-id", name: "MOTORISTA" } as RoleEntity,
    cliente: { id: "cliente-id", name: "CLIENTE" } as RoleEntity,
  };

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      query: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserEntity>>;

    mockRoleRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<RoleEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestUsersSeed,
        {
          provide: "USER_REPOSITORY",
          useValue: mockUserRepository,
        },
        {
          provide: "ROLE_REPOSITORY",
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    seed = module.get<TestUsersSeed>(TestUsersSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should throw error if roles not found", async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(seed.run()).rejects.toThrow(
        "Roles não encontradas. Execute o seed de roles primeiro.",
      );
    });

    it("should create test users when roles exist", async () => {
      // Mock roles
      mockRoleRepository.findOne.mockImplementation(async (options) => {
        const where = options?.where as { name?: string } | undefined;
        if (where?.name === "ADMIN") return mockRoles.admin;
        if (where?.name === "GESTOR") return mockRoles.gestor;
        if (where?.name === "DESPACHANTE") return mockRoles.despachante;
        if (where?.name === "MOTORISTA") return mockRoles.motorista;
        if (where?.name === "CLIENTE") return mockRoles.cliente;
        return null;
      });

      // Mock user not existing
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: "user-id" } as UserEntity);
      mockUserRepository.save.mockResolvedValue({ id: "user-id" } as UserEntity);
      mockUserRepository.query.mockResolvedValue(undefined);

      await seed.run();

      // Should check for all 5 roles
      expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(5);
    });

    it("should not create user if already exists", async () => {
      // Mock roles
      mockRoleRepository.findOne.mockImplementation(async (options) => {
        const where = options?.where as { name?: string } | undefined;
        if (where?.name === "ADMIN") return mockRoles.admin;
        if (where?.name === "GESTOR") return mockRoles.gestor;
        if (where?.name === "DESPACHANTE") return mockRoles.despachante;
        if (where?.name === "MOTORISTA") return mockRoles.motorista;
        if (where?.name === "CLIENTE") return mockRoles.cliente;
        return null;
      });

      // Mock user already exists
      mockUserRepository.findOne.mockResolvedValue({ id: "existing-id" } as UserEntity);

      await seed.run();

      // Should not create or save users
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it("should be idempotent", async () => {
      // Mock roles
      mockRoleRepository.findOne.mockImplementation(async (options) => {
        const where = options?.where as { name?: string } | undefined;
        return mockRoles[where?.name?.toLowerCase() as keyof typeof mockRoles] || null;
      });

      // First run - users don't exist
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: "user-id" } as UserEntity);
      mockUserRepository.save.mockResolvedValue({ id: "user-id" } as UserEntity);
      mockUserRepository.query.mockResolvedValue(undefined);

      await seed.run();

      const _firstCallCount = mockUserRepository.save.mock.calls.length;

      // Reset and second run - users exist
      jest.clearAllMocks();
      mockRoleRepository.findOne.mockImplementation(async (options) => {
        const where = options?.where as { name?: string } | undefined;
        return mockRoles[where?.name?.toLowerCase() as keyof typeof mockRoles] || null;
      });
      mockUserRepository.findOne.mockResolvedValue({ id: "existing-id" } as UserEntity);

      await seed.run();

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockRoleRepository.findOne.mockRejectedValue(new Error("Database error"));

      await expect(seed.run()).rejects.toThrow("Database error");
    });
  });
});
