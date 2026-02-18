import { Test, TestingModule } from "@nestjs/testing";
import { ObjectLiteral, Repository } from "typeorm";
import { RolesSeed, RoleType } from "./roles.seed";
import { RoleEntity } from "../interfaces/role.interface";

type MockRepository<T extends ObjectLiteral> = jest.Mocked<
  Pick<Repository<T>, "findOne" | "create" | "save">
>;

describe("RolesSeed", () => {
  let seed: RolesSeed;
  let mockRoleRepository: MockRepository<RoleEntity>;

  beforeEach(async () => {
    mockRoleRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as MockRepository<RoleEntity>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesSeed,
        {
          provide: "ROLE_REPOSITORY",
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    seed = module.get<RolesSeed>(RolesSeed);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(seed).toBeDefined();
  });

  describe("run", () => {
    it("should create all roles when none exist", async () => {
      // Mock: no existing roles
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((data) => data as RoleEntity);
      mockRoleRepository.save.mockImplementation(async (role) => role as RoleEntity);

      await seed.run();

      // Should check for each role
      expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(5);

      // Should create each role
      expect(mockRoleRepository.create).toHaveBeenCalledTimes(5);
      expect(mockRoleRepository.save).toHaveBeenCalledTimes(5);
    });

    it("should not create roles that already exist", async () => {
      // Mock: ADMIN already exists
      mockRoleRepository.findOne.mockImplementation(async (options) => {
        const where = options?.where as { name?: string } | undefined;
        if (where?.name === "ADMIN") {
          return { id: "1", name: "ADMIN" } as RoleEntity;
        }
        return null;
      });
      mockRoleRepository.create.mockImplementation((data) => data as RoleEntity);
      mockRoleRepository.save.mockImplementation(async (role) => role as RoleEntity);

      await seed.run();

      // Should only create 4 roles (not ADMIN)
      expect(mockRoleRepository.create).toHaveBeenCalledTimes(4);
      expect(mockRoleRepository.save).toHaveBeenCalledTimes(4);
    });

    it("should skip all roles if all already exist", async () => {
      // Mock: all roles exist
      mockRoleRepository.findOne.mockResolvedValue({
        id: "existing",
        name: "existing",
      } as RoleEntity);

      await seed.run();

      // Should check for each role
      expect(mockRoleRepository.findOne).toHaveBeenCalledTimes(5);

      // Should not create any roles
      expect(mockRoleRepository.create).not.toHaveBeenCalled();
      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });

    it("should create ADMIN role with correct permissions", async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((data) => data as RoleEntity);
      mockRoleRepository.save.mockImplementation(async (role) => role as RoleEntity);

      await seed.run();

      const adminCreateCall = mockRoleRepository.create.mock.calls.find(
        (call) => call[0].name === "ADMIN",
      );

      expect(adminCreateCall).toBeDefined();
      expect(adminCreateCall![0]).toMatchObject({
        name: "ADMIN",
        display_name: "Administrador",
        type: RoleType.ADMIN,
        permissions: ["*"],
        hierarchy_level: 0,
        is_active: true,
      });
    });

    it("should create GESTOR role with correct permissions", async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((data) => data as RoleEntity);
      mockRoleRepository.save.mockImplementation(async (role) => role as RoleEntity);

      await seed.run();

      const gestorCreateCall = mockRoleRepository.create.mock.calls.find(
        (call) => call[0].name === "GESTOR",
      );

      expect(gestorCreateCall).toBeDefined();
      expect(gestorCreateCall![0]).toMatchObject({
        name: "GESTOR",
        display_name: "Gestor",
        type: RoleType.MANAGER,
        hierarchy_level: 1,
        is_active: true,
      });
      expect(gestorCreateCall![0].permissions).toContain("users.read");
      expect(gestorCreateCall![0].permissions).toContain("deliveries.read");
    });

    it("should create MOTORISTA role with correct permissions", async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((data) => data as RoleEntity);
      mockRoleRepository.save.mockImplementation(async (role) => role as RoleEntity);

      await seed.run();

      const motoristaCreateCall = mockRoleRepository.create.mock.calls.find(
        (call) => call[0].name === "MOTORISTA",
      );

      expect(motoristaCreateCall).toBeDefined();
      expect(motoristaCreateCall![0]).toMatchObject({
        name: "MOTORISTA",
        display_name: "Motorista",
        type: RoleType.DRIVER,
        hierarchy_level: 3,
        is_active: true,
      });
      expect(motoristaCreateCall![0].permissions).toContain("deliveries.read");
      expect(motoristaCreateCall![0].permissions).toContain("tracking.read");
    });

    it("should create CLIENTE role with correct permissions", async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((data) => data as RoleEntity);
      mockRoleRepository.save.mockImplementation(async (role) => role as RoleEntity);

      await seed.run();

      const clienteCreateCall = mockRoleRepository.create.mock.calls.find(
        (call) => call[0].name === "CLIENTE",
      );

      expect(clienteCreateCall).toBeDefined();
      expect(clienteCreateCall![0]).toMatchObject({
        name: "CLIENTE",
        display_name: "Cliente",
        type: RoleType.CUSTOMER,
        hierarchy_level: 4,
        is_active: true,
      });
      expect(clienteCreateCall![0].permissions).toContain("deliveries.read");
      expect(clienteCreateCall![0].permissions).toContain("profile.read");
    });

    it("should be idempotent - running twice should not duplicate data", async () => {
      // First run - no roles exist
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((data) => data as RoleEntity);
      mockRoleRepository.save.mockImplementation(async (role) => role as RoleEntity);

      await seed.run();

      expect(mockRoleRepository.save).toHaveBeenCalledTimes(5);

      // Reset mocks
      jest.clearAllMocks();

      // Second run - all roles exist
      mockRoleRepository.findOne.mockResolvedValue({
        id: "existing",
        name: "existing",
      } as RoleEntity);

      await seed.run();

      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockRoleRepository.findOne.mockRejectedValue(new Error("Database error"));

      await expect(seed.run()).rejects.toThrow("Database error");
    });

    it("should create roles in correct order (ADMIN first)", async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((data) => data as RoleEntity);
      mockRoleRepository.save.mockImplementation(async (role) => role as RoleEntity);

      await seed.run();

      const createdRoles = mockRoleRepository.create.mock.calls.map((call) => call[0].name);

      expect(createdRoles[0]).toBe("ADMIN");
    });
  });

  describe("RoleType enum", () => {
    it("should have correct values", () => {
      expect(RoleType.SUPER_ADMIN).toBe("super_admin");
      expect(RoleType.ADMIN).toBe("admin");
      expect(RoleType.MANAGER).toBe("manager");
      expect(RoleType.OPERATOR).toBe("operator");
      expect(RoleType.DRIVER).toBe("driver");
      expect(RoleType.CUSTOMER).toBe("customer");
    });
  });
});
