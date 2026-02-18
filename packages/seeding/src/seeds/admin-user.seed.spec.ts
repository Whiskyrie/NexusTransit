import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { AdminUserSeed } from "./admin-user.seed";
import { RoleEntity } from "../interfaces/role.interface";
import { UserEntity } from "../interfaces/user.interface";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
}));

describe("AdminUserSeed", () => {
  let seed: AdminUserSeed;
  let mockUserRepository: jest.Mocked<Repository<UserEntity>>;
  let mockRoleRepository: jest.Mocked<Repository<RoleEntity>>;

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
        AdminUserSeed,
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

    seed = module.get<AdminUserSeed>(AdminUserSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should create admin user when it does not exist", async () => {
      // Mock: admin does not exist
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue({
        id: "role-id",
        name: "ADMIN",
      } as RoleEntity);
      mockUserRepository.create.mockReturnValue({
        id: "user-id",
        email: "admin@nexustransit.com",
      } as UserEntity);
      mockUserRepository.save.mockResolvedValue({
        id: "user-id",
        email: "admin@nexustransit.com",
      } as UserEntity);
      mockUserRepository.query.mockResolvedValue(undefined);

      await seed.run();

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: "admin@nexustransit.com" },
      });
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: "ADMIN" },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("Admin@123", 10);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockUserRepository.query).toHaveBeenCalled();
    });

    it("should not create admin user if it already exists", async () => {
      // Mock: admin already exists
      mockUserRepository.findOne.mockResolvedValue({
        id: "existing-user-id",
        email: "admin@nexustransit.com",
      } as UserEntity);

      await seed.run();

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: "admin@nexustransit.com" },
      });
      expect(mockRoleRepository.findOne).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it("should throw error if ADMIN role not found", async () => {
      // Mock: admin does not exist, but role also not found
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(seed.run()).rejects.toThrow(
        "Role ADMIN não encontrada. Execute o seed de roles primeiro.",
      );
    });

    it("should create user with correct data", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue({
        id: "role-id",
        name: "ADMIN",
      } as RoleEntity);
      mockUserRepository.create.mockReturnValue({
        id: "user-id",
      } as UserEntity);
      mockUserRepository.save.mockResolvedValue({
        id: "user-id",
      } as UserEntity);
      mockUserRepository.query.mockResolvedValue(undefined);

      await seed.run();

      const createCall = mockUserRepository.create.mock.calls[0][0];

      expect(createCall).toMatchObject({
        email: "admin@nexustransit.com",
        password_hash: "hashed_password",
        first_name: "Administrador",
        last_name: "Sistema",
        phone: "+5511999999999",
        user_type: "admin",
        status: "active",
        email_verified: true,
      });
    });

    it("should associate role to user after creation", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue({
        id: "role-id",
        name: "ADMIN",
      } as RoleEntity);
      mockUserRepository.create.mockReturnValue({
        id: "user-id",
      } as UserEntity);
      mockUserRepository.save.mockResolvedValue({
        id: "user-id",
      } as UserEntity);
      mockUserRepository.query.mockResolvedValue(undefined);

      await seed.run();

      expect(mockUserRepository.query).toHaveBeenCalledWith(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
        ["user-id", "role-id"],
      );
    });

    it("should be idempotent - running twice should not duplicate admin", async () => {
      // First run - admin does not exist
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue({
        id: "role-id",
        name: "ADMIN",
      } as RoleEntity);
      mockUserRepository.create.mockReturnValue({
        id: "user-id",
      } as UserEntity);
      mockUserRepository.save.mockResolvedValue({
        id: "user-id",
      } as UserEntity);
      mockUserRepository.query.mockResolvedValue(undefined);

      await seed.run();

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);

      // Reset mocks
      jest.clearAllMocks();

      // Second run - admin exists
      mockUserRepository.findOne.mockResolvedValue({
        id: "user-id",
        email: "admin@nexustransit.com",
      } as UserEntity);

      await seed.run();

      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockUserRepository.findOne.mockRejectedValue(new Error("Database error"));

      await expect(seed.run()).rejects.toThrow("Database error");
    });

    it("should handle save errors gracefully", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue({
        id: "role-id",
        name: "ADMIN",
      } as RoleEntity);
      mockUserRepository.create.mockReturnValue({
        id: "user-id",
      } as UserEntity);
      mockUserRepository.save.mockRejectedValue(new Error("Save failed"));

      await expect(seed.run()).rejects.toThrow("Save failed");
    });

    it("should handle query errors gracefully", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue({
        id: "role-id",
        name: "ADMIN",
      } as RoleEntity);
      mockUserRepository.create.mockReturnValue({
        id: "user-id",
      } as UserEntity);
      mockUserRepository.save.mockResolvedValue({
        id: "user-id",
      } as UserEntity);
      mockUserRepository.query.mockRejectedValue(new Error("Query failed"));

      await expect(seed.run()).rejects.toThrow("Query failed");
    });
  });
});
